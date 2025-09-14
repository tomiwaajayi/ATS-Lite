// Statistics and aggregation types

export interface SkillCount {
  skill: string;
  count: number;
  percentage?: number;
}

export interface LocationStat {
  location: string;
  count: number;
  avgSalary?: number;
  avgExperience?: number;
}

export interface SalaryStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  q25: number; // 25th percentile
  q75: number; // 75th percentile
}

export interface ExperienceStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  distribution: Record<string, number>; // experience ranges
}

export interface CandidateStats {
  count: number;
  avg_experience: number;
  top_skills: SkillCount[];
  avg_salary: number;
  locations: string[];
  languages: string[];
  timezones: string[];
  education_breakdown: Record<string, number>;
  work_preference_breakdown: Record<string, number>;
  visa_status_breakdown: Record<string, number>;

  // Extended stats
  salary_stats?: SalaryStats;
  experience_stats?: ExperienceStats;
  location_stats?: LocationStat[];
  top_languages?: Array<{ language: string; count: number }>;
  availability_stats?: {
    immediate: number; // 0-2 weeks
    soon: number; // 2-4 weeks
    flexible: number; // 4+ weeks
  };
}

// Aggregation configuration
export interface StatsConfig {
  includeExtendedStats: boolean;
  topSkillsLimit: number;
  topLanguagesLimit: number;
  includeSalaryStats: boolean;
  includeLocationStats: boolean;
}

// Time-based stats (for analytics)
export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface TimeSeriesStats {
  period: 'day' | 'week' | 'month' | 'year';
  data: TimeSeriesPoint[];
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

// Comparative statistics
export interface ComparisonStats {
  current: CandidateStats;
  previous?: CandidateStats;
  benchmark?: CandidateStats;
  changes?: {
    count: number;
    avg_experience: number;
    avg_salary: number;
  };
}
