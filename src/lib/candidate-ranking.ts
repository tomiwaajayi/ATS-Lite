// Sort candidates by experience, salary, etc
import type { Candidate, CandidateField } from '@/types/candidate';
import type { RankingPlan, RankingResult, SortDirection } from '@/types/filtering';
import { applyCandidateFilters } from './candidate-filtering';
import { parseBoolean, normalizeString } from './filtering-utils';

// Compare two values for sorting
function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  let comparison = 0;

  // Handle empty values
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // Compare strings
  if (typeof a === 'string' && typeof b === 'string') {
    comparison = normalizeString(a).localeCompare(normalizeString(b));
  }
  // Compare numbers
  else if (typeof a === 'number' && typeof b === 'number') {
    comparison = a - b;
  }
  // Handle Yes/No values
  else if (typeof a === 'string' && typeof b === 'string') {
    const boolA = parseBoolean(a);
    const boolB = parseBoolean(b);
    comparison = boolA === boolB ? 0 : boolA ? 1 : -1;
  }
  // Fallback to string comparison
  else {
    comparison = String(a).localeCompare(String(b));
  }

  // Reverse for descending
  return direction === 'desc' ? -comparison : comparison;
}

// Extract field value from candidate object
function getCandidateFieldValue(candidate: Candidate, field: CandidateField): unknown {
  return candidate[field];
}

// Sort candidates according to ranking plan
export function applyCandidateRanking(
  candidates: Candidate[],
  rankingPlan: RankingPlan
): RankingResult<Candidate> {
  const startTime = performance.now();

  if (!rankingPlan || !rankingPlan.primary) {
    // No sorting needed
    return {
      ranked: candidates,
      rankedIds: candidates.map(c => c.id),
      criteria: rankingPlan,
    };
  }

  // Don't modify the original array
  const candidatesToRank = [...candidates];

  // Do the actual sorting
  candidatesToRank.sort((candidateA, candidateB) => {
    // Main sorting field
    const primaryFieldA = getCandidateFieldValue(candidateA, rankingPlan.primary.field);
    const primaryFieldB = getCandidateFieldValue(candidateB, rankingPlan.primary.field);

    const primaryComparison = compareValues(
      primaryFieldA,
      primaryFieldB,
      rankingPlan.primary.direction
    );

    // Done if primary field gives us a winner
    if (primaryComparison !== 0) {
      return primaryComparison;
    }

    // Handle ties with secondary fields
    if (rankingPlan.tie_breakers && rankingPlan.tie_breakers.length > 0) {
      for (const tieBreaker of rankingPlan.tie_breakers) {
        const tieBreakerFieldA = getCandidateFieldValue(candidateA, tieBreaker.field);
        const tieBreakerFieldB = getCandidateFieldValue(candidateB, tieBreaker.field);

        const tieBreakerComparison = compareValues(
          tieBreakerFieldA,
          tieBreakerFieldB,
          tieBreaker.direction
        );

        if (tieBreakerComparison !== 0) {
          return tieBreakerComparison;
        }
      }
    }

    // Last resort: sort by ID
    return candidateA.id - candidateB.id;
  });

  const endTime = performance.now();

  // Log performance in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`Ranking took ${endTime - startTime}ms for ${candidates.length} candidates`);
  }

  return {
    ranked: candidatesToRank,
    rankedIds: candidatesToRank.map(c => c.id),
    criteria: rankingPlan,
  };
}

// Helper to build ranking plans quickly
export function createBasicRankingPlan(
  primaryField: CandidateField,
  primaryDirection: SortDirection = 'desc',
  tieBreakers?: Array<{ field: CandidateField; direction: SortDirection }>
): RankingPlan {
  return {
    primary: {
      field: primaryField,
      direction: primaryDirection,
    },
    tie_breakers: tieBreakers,
  };
}

// Common ranking setups ready to use
export const COMMON_RANKING_PLANS = {
  // Most experienced first
  BY_EXPERIENCE_DESC: createBasicRankingPlan('years_experience', 'desc', [
    { field: 'desired_salary_usd', direction: 'asc' }, // Prefer lower salary
    { field: 'full_name', direction: 'asc' },
  ]),

  // For junior positions
  BY_EXPERIENCE_ASC: createBasicRankingPlan('years_experience', 'asc', [
    { field: 'desired_salary_usd', direction: 'asc' },
    { field: 'full_name', direction: 'asc' },
  ]),

  // Budget-friendly first
  BY_SALARY_ASC: createBasicRankingPlan('desired_salary_usd', 'asc', [
    { field: 'years_experience', direction: 'desc' },
    { field: 'full_name', direction: 'asc' },
  ]),

  // Premium candidates first
  BY_SALARY_DESC: createBasicRankingPlan('desired_salary_usd', 'desc', [
    { field: 'years_experience', direction: 'desc' },
    { field: 'full_name', direction: 'asc' },
  ]),

  // A-Z by name
  BY_NAME: createBasicRankingPlan('full_name', 'asc', [
    { field: 'years_experience', direction: 'desc' },
  ]),

  // Available ASAP first
  BY_AVAILABILITY: createBasicRankingPlan('availability_weeks', 'asc', [
    { field: 'notice_period_weeks', direction: 'asc' },
    { field: 'years_experience', direction: 'desc' },
  ]),

  // Location A-Z
  BY_LOCATION: createBasicRankingPlan('location', 'asc', [
    { field: 'years_experience', direction: 'desc' },
    { field: 'full_name', direction: 'asc' },
  ]),
} as const;

// Check if ranking plan is valid
export function validateRankingPlan(rankingPlan: RankingPlan): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!rankingPlan) {
    errors.push('Ranking plan cannot be null or undefined');
    return { isValid: false, errors };
  }

  if (!rankingPlan.primary) {
    errors.push('Ranking plan must have a primary ranking criteria');
    return { isValid: false, errors };
  }

  if (!rankingPlan.primary.field) {
    errors.push('Primary ranking criteria must specify a field');
  }

  if (!['asc', 'desc'].includes(rankingPlan.primary.direction)) {
    errors.push('Primary ranking criteria direction must be "asc" or "desc"');
  }

  // Check tie-breakers too
  if (rankingPlan.tie_breakers) {
    rankingPlan.tie_breakers.forEach((tieBreaker, index) => {
      if (!tieBreaker.field) {
        errors.push(`Tie-breaker ${index + 1} must specify a field`);
      }
      if (!['asc', 'desc'].includes(tieBreaker.direction)) {
        errors.push(`Tie-breaker ${index + 1} direction must be "asc" or "desc"`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}

// Filter then rank - one-stop function
export function filterAndRankCandidates(
  candidates: Candidate[],
  filterPlan?: Parameters<typeof import('./candidate-filtering').applyCandidateFilters>[1],
  rankingPlan?: RankingPlan
): {
  filtered: Candidate[];
  ranked: Candidate[];
  rankedIds: number[];
  filterCount: number;
  totalProcessed: number;
} {
  // Filter first
  const filterResult = filterPlan
    ? applyCandidateFilters(candidates, filterPlan)
    : { filtered: candidates, count: candidates.length, totalProcessed: candidates.length };

  // Then rank
  const rankingResult = rankingPlan
    ? applyCandidateRanking(filterResult.filtered, rankingPlan)
    : {
        ranked: filterResult.filtered,
        rankedIds: filterResult.filtered.map((c: any) => c.id),
        criteria: null,
      };

  return {
    filtered: filterResult.filtered,
    ranked: rankingResult.ranked,
    rankedIds: rankingResult.rankedIds,
    filterCount: filterResult.count,
    totalProcessed: filterResult.totalProcessed,
  };
}
