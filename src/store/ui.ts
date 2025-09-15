import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Theme setting
  isDarkMode: boolean;

  // Timeline sidebar
  isTimelineSidebarVisible: boolean;

  // Chat panel
  isChatExpanded: boolean;

  // Candidate details
  isCandidateDetailsVisible: boolean;

  // Fields filter
  visibleFields: string[];

  toggleTimelineSidebar: () => void;
  setTimelineSidebarVisible: (visible: boolean) => void;

  setChatExpanded: (expanded: boolean) => void;

  setCandidateDetailsVisible: (visible: boolean) => void;

  setVisibleFields: (fields: string[]) => void;
  toggleFieldVisibility: (field: string) => void;

  setIsDarkMode: (isDarkMode: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    set => ({
      isDarkMode: false,
      isTimelineSidebarVisible: true,
      isChatExpanded: true, // Start with chat open
      isCandidateDetailsVisible: false,
      visibleFields: [
        'id',
        'full_name',
        'title',
        'location',
        'years_experience',
        'skills',
        'desired_salary_usd',
      ],

      toggleTimelineSidebar: () =>
        set(state => ({
          isTimelineSidebarVisible: !state.isTimelineSidebarVisible,
        })),

      setTimelineSidebarVisible: isTimelineSidebarVisible => set({ isTimelineSidebarVisible }),

      setChatExpanded: isChatExpanded => set({ isChatExpanded }),

      setCandidateDetailsVisible: isCandidateDetailsVisible => set({ isCandidateDetailsVisible }),

      setVisibleFields: visibleFields => set({ visibleFields }),

      toggleFieldVisibility: field => {
        const requiredFields = ['id', 'full_name'];
        set(state => ({
          visibleFields: state.visibleFields.includes(field)
            ? requiredFields.includes(field)
              ? state.visibleFields // Don't remove required fields
              : state.visibleFields.filter(f => f !== field)
            : [...state.visibleFields, field],
        }));
      },

      setIsDarkMode: isDarkMode => set({ isDarkMode }),
    }),
    {
      name: 'ats-lite-ui-storage',
      partialize: state => ({
        isDarkMode: state.isDarkMode,
        isTimelineSidebarVisible: state.isTimelineSidebarVisible,
      }),
    }
  )
);
