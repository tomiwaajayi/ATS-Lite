import { applyCandidateRanking } from '@/services/candidate-ranking';
import { Candidate } from '@/types/candidate';
import { RankingPlan } from '@/types/filtering';

export function performRankPhase(
  candidates: Candidate[],
  rankingPlan: RankingPlan
): { ranked: Candidate[]; rankedIds: number[] } {
  const result = applyCandidateRanking(candidates, rankingPlan);

  return {
    ranked: result.ranked,
    rankedIds: result.rankedIds,
  };
}
