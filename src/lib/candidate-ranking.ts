// Advanced candidate ranking system
import type { Candidate, CandidateField } from '@/types/candidate';
import type { RankingPlan, RankingResult, SortDirection } from '@/types/filtering';
import { applyCandidateFilters } from './candidate-filtering';
import { parseBoolean, normalizeString } from './filtering-utils';

/**
 * Compare two values based on their type and sort direction
 */
function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  let comparison = 0;

  // Handle null/undefined values - push them to the end
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // String comparison
  if (typeof a === 'string' && typeof b === 'string') {
    comparison = normalizeString(a).localeCompare(normalizeString(b));
  }
  // Numeric comparison
  else if (typeof a === 'number' && typeof b === 'number') {
    comparison = a - b;
  }
  // Boolean comparison (convert strings like "Yes"/"No" to boolean first)
  else if (typeof a === 'string' && typeof b === 'string') {
    const boolA = parseBoolean(a);
    const boolB = parseBoolean(b);
    comparison = boolA === boolB ? 0 : boolA ? 1 : -1;
  }
  // Mixed types - convert to string and compare
  else {
    comparison = String(a).localeCompare(String(b));
  }

  // Apply sort direction
  return direction === 'desc' ? -comparison : comparison;
}

/**
 * Get the value of a specific field from a candidate
 */
function getCandidateFieldValue(candidate: Candidate, field: CandidateField): unknown {
  return candidate[field];
}

/**
 * Apply ranking criteria to a set of candidates
 */
export function applyCandidateRanking(
  candidates: Candidate[],
  rankingPlan: RankingPlan
): RankingResult<Candidate> {
  const startTime = performance.now();

  if (!rankingPlan || !rankingPlan.primary) {
    // No ranking plan provided, return candidates in original order
    return {
      ranked: candidates,
      rankedIds: candidates.map(c => c.id),
      criteria: rankingPlan,
    };
  }

  // Create a copy to avoid mutating the original array
  const candidatesToRank = [...candidates];

  // Sort based on ranking criteria
  candidatesToRank.sort((candidateA, candidateB) => {
    // Primary comparison
    const primaryFieldA = getCandidateFieldValue(candidateA, rankingPlan.primary.field);
    const primaryFieldB = getCandidateFieldValue(candidateB, rankingPlan.primary.field);

    const primaryComparison = compareValues(
      primaryFieldA,
      primaryFieldB,
      rankingPlan.primary.direction
    );

    // If primary comparison results in a clear winner, return that
    if (primaryComparison !== 0) {
      return primaryComparison;
    }

    // Apply tie-breakers in sequence
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

    // Final tie-breaker: sort by ID for consistent results
    return candidateA.id - candidateB.id;
  });

  const endTime = performance.now();

  // Optional: Log performance for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`Ranking took ${endTime - startTime}ms for ${candidates.length} candidates`);
  }

  return {
    ranked: candidatesToRank,
    rankedIds: candidatesToRank.map(c => c.id),
    criteria: rankingPlan,
  };
}

/**
 * Create a basic ranking plan for common scenarios
 */
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

/**
 * Pre-defined ranking plans for common use cases
 */
export const COMMON_RANKING_PLANS = {
  // Most experienced first
  BY_EXPERIENCE_DESC: createBasicRankingPlan('years_experience', 'desc', [
    { field: 'desired_salary_usd', direction: 'asc' }, // Prefer lower salary as tie-breaker
    { field: 'full_name', direction: 'asc' },
  ]),

  // Least experienced first (for junior roles)
  BY_EXPERIENCE_ASC: createBasicRankingPlan('years_experience', 'asc', [
    { field: 'desired_salary_usd', direction: 'asc' },
    { field: 'full_name', direction: 'asc' },
  ]),

  // Lowest salary expectation first
  BY_SALARY_ASC: createBasicRankingPlan('desired_salary_usd', 'asc', [
    { field: 'years_experience', direction: 'desc' },
    { field: 'full_name', direction: 'asc' },
  ]),

  // Highest salary expectation first
  BY_SALARY_DESC: createBasicRankingPlan('desired_salary_usd', 'desc', [
    { field: 'years_experience', direction: 'desc' },
    { field: 'full_name', direction: 'asc' },
  ]),

  // Alphabetical by name
  BY_NAME: createBasicRankingPlan('full_name', 'asc', [
    { field: 'years_experience', direction: 'desc' },
  ]),

  // By availability (soonest first)
  BY_AVAILABILITY: createBasicRankingPlan('availability_weeks', 'asc', [
    { field: 'notice_period_weeks', direction: 'asc' },
    { field: 'years_experience', direction: 'desc' },
  ]),

  // By location (alphabetical)
  BY_LOCATION: createBasicRankingPlan('location', 'asc', [
    { field: 'years_experience', direction: 'desc' },
    { field: 'full_name', direction: 'asc' },
  ]),
} as const;

/**
 * Validate that a ranking plan is well-formed
 */
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

  // Validate tie-breakers if present
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

/**
 * Combine filtering and ranking in a single operation
 */
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
  // Step 1: Apply filters
  const filterResult = filterPlan
    ? applyCandidateFilters(candidates, filterPlan)
    : { filtered: candidates, count: candidates.length, totalProcessed: candidates.length };

  // Step 2: Apply ranking
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
