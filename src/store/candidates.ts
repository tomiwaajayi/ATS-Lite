import { create } from 'zustand';
import { Candidate } from '@/types/candidate';

interface CandidatesState {
  candidates: Candidate[];
  rankedIds: number[];
  selectedCandidateId: number | null;

  loading: boolean;
  hasSearched: boolean;

  // Actions
  setCandidates: (candidates: Candidate[]) => void;
  setRankedIds: (ids: number[]) => void;
  setSelectedCandidateId: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
  setHasSearched: (hasSearched: boolean) => void;

  // Computed getters
  getRankedCandidates: () => Candidate[];
  getSelectedCandidate: () => Candidate | null;
}

export const useCandidatesStore = create<CandidatesState>((set, get) => ({
  // Default values
  candidates: [],
  rankedIds: [],
  selectedCandidateId: null,
  loading: false,
  hasSearched: false,

  // Actions
  setCandidates: candidates => set({ candidates }),

  setRankedIds: rankedIds => set({ rankedIds }),

  setSelectedCandidateId: selectedCandidateId => set({ selectedCandidateId }),

  setLoading: loading => set({ loading }),

  setHasSearched: hasSearched => set({ hasSearched }),

  // Computed getters
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
