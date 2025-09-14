import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Dark mode
  isDarkMode: boolean;

  // Timeline sidebar
  isTimelineSidebarVisible: boolean;

  // Chat panel
  isChatExpanded: boolean;

  // Candidate details
  isCandidateDetailsVisible: boolean;

  // Fields filter
  isFieldsFilterOpen: boolean;
  visibleFields: string[];

  // Loading and animations
  showIntroAnimation: boolean;
  componentsLoaded: boolean;

  // Actions
  toggleTimelineSidebar: () => void;
  setTimelineSidebarVisible: (visible: boolean) => void;

  setChatExpanded: (expanded: boolean) => void;

  setCandidateDetailsVisible: (visible: boolean) => void;

  setFieldsFilterOpen: (open: boolean) => void;
  setVisibleFields: (fields: string[]) => void;
  toggleFieldVisibility: (field: string) => void;

  setIsDarkMode: (isDarkMode: boolean) => void;

  setShowIntroAnimation: (show: boolean) => void;
  setComponentsLoaded: (loaded: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    set => ({
      // Initial state
      isDarkMode: false,
      isTimelineSidebarVisible: true,
      isChatExpanded: true, // Chat starts open on page load
      isCandidateDetailsVisible: false,
      isFieldsFilterOpen: false,
      visibleFields: [
        'id',
        'full_name',
        'title',
        'location',
        'years_experience',
        'skills',
        'desired_salary_usd',
      ],
      showIntroAnimation: false,
      componentsLoaded: true,

      // Timeline sidebar actions
      toggleTimelineSidebar: () =>
        set(state => ({
          isTimelineSidebarVisible: !state.isTimelineSidebarVisible,
        })),

      setTimelineSidebarVisible: isTimelineSidebarVisible => set({ isTimelineSidebarVisible }),

      // Chat panel actions
      setChatExpanded: isChatExpanded => set({ isChatExpanded }),

      // Candidate details actions
      setCandidateDetailsVisible: isCandidateDetailsVisible => set({ isCandidateDetailsVisible }),

      // Fields filter actions
      setFieldsFilterOpen: isFieldsFilterOpen => set({ isFieldsFilterOpen }),

      setVisibleFields: visibleFields => set({ visibleFields }),

      toggleFieldVisibility: field => {
        const compulsoryFields = ['id', 'full_name'];
        set(state => ({
          visibleFields: state.visibleFields.includes(field)
            ? compulsoryFields.includes(field)
              ? state.visibleFields // Don't remove compulsory fields
              : state.visibleFields.filter(f => f !== field)
            : [...state.visibleFields, field],
        }));
      },

      // Dark mode actions
      setIsDarkMode: isDarkMode => set({ isDarkMode }),

      // Animation actions
      setShowIntroAnimation: showIntroAnimation => set({ showIntroAnimation }),

      setComponentsLoaded: componentsLoaded => set({ componentsLoaded }),
    }),
    {
      name: 'ats-lite-ui-storage', // localStorage key
      partialize: state => ({
        isDarkMode: state.isDarkMode,
        isTimelineSidebarVisible: state.isTimelineSidebarVisible,
      }),
    }
  )
);
