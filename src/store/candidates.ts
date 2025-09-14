import { create } from 'zustand';
import { applyCandidateFilters } from '@/services/candidate-filtering';
import { applyCandidateRanking } from '@/services/candidate-ranking';
import { Candidate } from '@/types/candidate';
import { FilterPlan, RankingPlan } from '@/types/filtering';

interface CandidatesState {
  // Main data
  candidates: Candidate[];
  filteredIds: number[];
  rankedIds: number[];
  selectedCandidateId: number | null;

  // Remember what filters/sorting we're using
  currentFilterPlan: FilterPlan | null;
  currentRankingPlan: RankingPlan | null;

  // UI states
  loading: boolean;
  hasSearched: boolean;

  // Actions
  setCandidates: (candidates: Candidate[]) => void;
  setFilteredIds: (ids: number[]) => void;
  setRankedIds: (ids: number[]) => void;
  setSelectedCandidateId: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
  setHasSearched: (hasSearched: boolean) => void;
  clearResults: () => void;

  // Enhanced filtering & ranking actions
  applyFiltersAndRanking: (filterPlan: FilterPlan, rankingPlan: RankingPlan) => void;
  applyFilters: (filterPlan: FilterPlan) => void;
  applyRanking: (rankingPlan: RankingPlan) => void;

  // Computed getters
  getFilteredCandidates: () => Candidate[];
  getRankedCandidates: () => Candidate[];
  getSelectedCandidate: () => Candidate | null;
}

export const useCandidatesStore = create<CandidatesState>((set, get) => ({
  // Default values
  candidates: [],
  filteredIds: [],
  rankedIds: [],
  selectedCandidateId: null,
  currentFilterPlan: null,
  currentRankingPlan: null,
  loading: false,
  hasSearched: false,

  // Actions
  setCandidates: candidates => set({ candidates }),

  setFilteredIds: filteredIds => set({ filteredIds }),

  setRankedIds: rankedIds => set({ rankedIds }),

  setSelectedCandidateId: selectedCandidateId => set({ selectedCandidateId }),

  setLoading: loading => set({ loading }),

  setHasSearched: hasSearched => set({ hasSearched }),

  clearResults: () =>
    set({
      filteredIds: [],
      rankedIds: [],
      selectedCandidateId: null,
      hasSearched: false,
      currentFilterPlan: null,
      currentRankingPlan: null,
    }),

  // Enhanced filtering & ranking actions
  applyFiltersAndRanking: (filterPlan, rankingPlan) => {
    const { candidates } = get();

    // Filter first
    const filterResult = applyCandidateFilters(candidates, filterPlan);

    // Then sort the filtered results
    const rankingResult = applyCandidateRanking(filterResult.filtered, rankingPlan);

    set({
      filteredIds: filterResult.filtered.map(c => c.id),
      rankedIds: rankingResult.rankedIds,
      currentFilterPlan: filterPlan,
      currentRankingPlan: rankingPlan,
      hasSearched: true,
    });
  },

  applyFilters: filterPlan => {
    const { candidates, currentRankingPlan } = get();

    // Do the filtering
    const filterResult = applyCandidateFilters(candidates, filterPlan);

    // Re-sort if we were sorting before
    let rankedIds = filterResult.filtered.map(c => c.id);
    if (currentRankingPlan) {
      const rankingResult = applyCandidateRanking(filterResult.filtered, currentRankingPlan);
      rankedIds = rankingResult.rankedIds;
    }

    set({
      filteredIds: filterResult.filtered.map(c => c.id),
      rankedIds,
      currentFilterPlan: filterPlan,
      hasSearched: true,
    });
  },

  applyRanking: rankingPlan => {
    const { filteredIds, candidates } = get();

    // Work with the filtered candidates
    const filteredCandidates =
      filteredIds.length > 0
        ? filteredIds
            .map(id => candidates.find(c => c.id === id))
            .filter((c): c is Candidate => c !== undefined)
        : candidates;

    // Do the ranking
    const rankingResult = applyCandidateRanking(filteredCandidates, rankingPlan);

    set({
      rankedIds: rankingResult.rankedIds,
      currentRankingPlan: rankingPlan,
    });
  },

  // Computed getters
  getFilteredCandidates: () => {
    const { candidates, filteredIds } = get();
    if (filteredIds.length === 0) return [];
    return filteredIds
      .map(id => candidates.find(c => c.id === id))
      .filter((c): c is Candidate => c !== undefined);
  },

  getRankedCandidates: () => {
    const { candidates, rankedIds, hasSearched } = get();
    // No search yet? Show nothing
    if (!hasSearched && rankedIds.length === 0) return [];
    // Search done but empty results
    if (hasSearched && rankedIds.length === 0) return [];
    // Show the ranked candidates
    return rankedIds
      .map(id => candidates.find(c => c.id === id))
      .filter((c): c is Candidate => c !== undefined);
  },

  getSelectedCandidate: () => {
    const { candidates, selectedCandidateId } = get();
    if (!selectedCandidateId) return null;
    return candidates.find(c => c.id === selectedCandidateId) || null;
  },
}));
