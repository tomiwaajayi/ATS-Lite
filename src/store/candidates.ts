import { create } from 'zustand';
import { applyCandidateFilters } from '@/lib/candidate-filtering';
import { applyCandidateRanking } from '@/lib/candidate-ranking';
import { Candidate } from '@/types/candidate';
import { FilterPlan, RankingPlan } from '@/types/filtering';

interface CandidatesState {
  // Data
  candidates: Candidate[];
  filteredIds: number[];
  rankedIds: number[];
  selectedCandidateId: number | null;

  // Plans for tracking current filters/ranking
  currentFilterPlan: FilterPlan | null;
  currentRankingPlan: RankingPlan | null;

  // Loading states
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
  // Initial state
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

    // Apply filtering first
    const filterResult = applyCandidateFilters(candidates, filterPlan);

    // Then apply ranking to filtered results
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

    // Apply filtering
    const filterResult = applyCandidateFilters(candidates, filterPlan);

    // Re-apply current ranking if we have one
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

    // Get currently filtered candidates
    const filteredCandidates =
      filteredIds.length > 0
        ? filteredIds
            .map(id => candidates.find(c => c.id === id))
            .filter((c): c is Candidate => c !== undefined)
        : candidates;

    // Apply ranking
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
    // If no search has been performed yet, show initial "no results found" state
    if (!hasSearched && rankedIds.length === 0) return [];
    // If search was performed but no results, show empty (which triggers "no results" message)
    if (hasSearched && rankedIds.length === 0) return [];
    // If we have rankedIds, show those candidates
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
