// Enhanced filtering and ranking types for MCP-style candidate processing

import { CandidateField } from './candidate';

export type SortDirection = 'asc' | 'desc';

/**
 * Include criteria with comprehensive filtering options
 * Supports both single values and arrays for flexible matching
 */
export interface IncludeFilterCriteria {
  // Basic string fields - supports partial matching
  title?: string | string[];
  location?: string | string[];
  full_name?: string | string[];
  degree_major?: string | string[];

  // Semicolon-separated fields - supports multi-value matching
  skills?: string | string[];
  languages?: string | string[];
  citizenships?: string | string[];
  tags?: string | string[];

  // Enumerated fields - exact matches
  education_level?: string | string[];
  work_preference?: string | string[];
  visa_status?: string | string[];

  // Numeric range filters with min/max boundaries
  years_experience_min?: number;
  years_experience_max?: number;
  desired_salary_min?: number;
  desired_salary_max?: number;
  remote_experience_years_min?: number;
  remote_experience_years_max?: number;

  // Maximum threshold filters (useful for availability constraints)
  availability_weeks_max?: number;
  notice_period_weeks_max?: number;

  // Boolean preference filters
  willing_to_relocate?: boolean;
  open_to_contract?: boolean;

  // Extensibility for future filter criteria
  [key: string]: unknown;
}

/**
 * Exclude criteria - simpler than include (no ranges, just exact matches)
 * Any match with exclude criteria removes the candidate from results
 */
export interface ExcludeFilterCriteria {
  // Basic string fields
  title?: string | string[];
  location?: string | string[];
  full_name?: string | string[];
  degree_major?: string | string[];

  // Semicolon-separated fields
  skills?: string | string[];
  languages?: string | string[];
  citizenships?: string | string[];
  tags?: string | string[];

  // Enumerated fields
  education_level?: string | string[];
  work_preference?: string | string[];
  visa_status?: string | string[];

  // Extensibility for future exclusion criteria
  [key: string]: unknown;
}

/**
 * Main filter plan combining include and exclude criteria
 * Process: first apply exclusions (early exit), then apply inclusions (all must match)
 */
export interface FilterPlan {
  include?: IncludeFilterCriteria;
  exclude?: ExcludeFilterCriteria;
}

/**
 * Individual ranking criteria specification
 */
export interface RankingCriteria {
  field: CandidateField;
  direction: SortDirection;
}

/**
 * Complete ranking plan with primary sort and optional tie-breakers
 * Tie-breakers are applied in order when primary comparison results in equality
 */
export interface RankingPlan {
  primary: RankingCriteria;
  tie_breakers?: RankingCriteria[];
}

/**
 * Combined MCP processing plans for filter + rank operations
 * This matches the MCP workflow structure described in xyz.md
 */
export interface MCPPlans {
  filter: FilterPlan;
  rank: RankingPlan;
}

/**
 * Result of filter operation with metrics
 */
export interface FilterResult<T> {
  filtered: T[];
  count: number;
  totalProcessed: number;
}

/**
 * Result of ranking operation with ordered data
 */
export interface RankingResult<T> {
  ranked: T[];
  rankedIds: number[];
  criteria: RankingPlan | null;
}

/**
 * Union type for all possible filter values
 */
export type FilterValue = string | string[] | number | boolean | undefined;

/**
 * Processing pipeline result combining filter and rank operations
 */
export interface ProcessingResult<T> {
  filtered: T[];
  ranked: T[];
  rankedIds: number[];
  filterCount: number;
  totalProcessed: number;
  appliedFilters: FilterPlan;
  appliedRanking: RankingPlan;
}
