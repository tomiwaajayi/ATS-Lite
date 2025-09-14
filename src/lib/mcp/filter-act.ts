import { applyCandidateFilters } from '@/lib/candidate-filtering';
import { Candidate } from '@/types/candidate';
import { FilterPlan } from '@/types/filtering';

export function performFilterPhase(
  candidates: Candidate[],
  filterPlan: FilterPlan
): { filtered: Candidate[]; count: number } {
  const result = applyCandidateFilters(candidates, filterPlan);

  return {
    filtered: result.filtered,
    count: result.count,
  };
}
