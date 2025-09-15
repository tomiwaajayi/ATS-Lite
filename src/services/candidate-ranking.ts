// Sort candidates by experience, salary, etc
import type { Candidate, CandidateField } from '@/types/candidate';
import type { RankingPlan, RankingResult, SortDirection } from '@/types/filtering';
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
