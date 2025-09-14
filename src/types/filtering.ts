// Types for filtering and sorting candidates

import { CandidateField } from './candidate';

export type SortDirection = 'asc' | 'desc';

// What we want to include in results
// Can use single values or arrays
export interface IncludeFilterCriteria {
  // Text fields (partial matching)
  title?: string | string[];
  location?: string | string[];
  full_name?: string | string[];
  degree_major?: string | string[];

  // Skills, languages, etc
  skills?: string | string[];
  languages?: string | string[];
  citizenships?: string | string[];
  tags?: string | string[];

  // Dropdown-style fields
  education_level?: string | string[];
  work_preference?: string | string[];
  visa_status?: string | string[];

  // Number ranges
  years_experience_min?: number;
  years_experience_max?: number;
  desired_salary_min?: number;
  desired_salary_max?: number;
  remote_experience_years_min?: number;
  remote_experience_years_max?: number;

  // Maximum values only
  availability_weeks_max?: number;
  notice_period_weeks_max?: number;

  // Yes/no questions
  willing_to_relocate?: boolean;
  open_to_contract?: boolean;

  // Room for future fields
  [key: string]: unknown;
}

// What we want to exclude from results
// Simpler than include - just exact matches
export interface ExcludeFilterCriteria {
  // Text fields
  title?: string | string[];
  location?: string | string[];
  full_name?: string | string[];
  degree_major?: string | string[];

  // Skills, languages, etc
  skills?: string | string[];
  languages?: string | string[];
  citizenships?: string | string[];
  tags?: string | string[];

  // Dropdown-style fields
  education_level?: string | string[];
  work_preference?: string | string[];
  visa_status?: string | string[];

  // Room for future fields
  [key: string]: unknown;
}

// Complete filter plan
// Process: exclude first, then include
export interface FilterPlan {
  include?: IncludeFilterCriteria;
  exclude?: ExcludeFilterCriteria;
}

// How to sort by one field
export interface RankingCriteria {
  field: CandidateField;
  direction: SortDirection;
}

// Complete sorting plan
// Primary sort + tie-breakers
export interface RankingPlan {
  primary: RankingCriteria;
  tie_breakers?: RankingCriteria[];
}

// Filter and rank plans together
export interface MCPPlans {
  filter: FilterPlan;
  rank: RankingPlan;
}

// Results after filtering
export interface FilterResult<T> {
  filtered: T[];
  count: number;
  totalProcessed: number;
}

// Results after sorting
export interface RankingResult<T> {
  ranked: T[];
  rankedIds: number[];
  criteria: RankingPlan | null;
}

// Any type of filter value
export type FilterValue = string | string[] | number | boolean | undefined;

// Complete processing results
export interface ProcessingResult<T> {
  filtered: T[];
  ranked: T[];
  rankedIds: number[];
  filterCount: number;
  totalProcessed: number;
  appliedFilters: FilterPlan;
  appliedRanking: RankingPlan;
}
