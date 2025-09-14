import { Candidate } from '@/types/candidate';
import { RankingPlan } from '@/types/filtering';

// Helper functions for numeric comparisons
function parseNumeric(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '');
    return parseInt(cleaned) || 0;
  }
  return 0;
}

// Optimized comparison function
function compareValues(a: unknown, b: unknown): number {
  // Handle null/undefined
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  // Convert to comparable values
  const aValue = parseNumeric(a);
  const bValue = parseNumeric(b);

  // If both successfully parse to numbers, compare numerically
  if (!isNaN(aValue) && !isNaN(bValue)) {
    return aValue - bValue;
  }

  // Handle boolean values
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1;
  }

  // Default to string comparison
  return String(a).localeCompare(String(b));
}

/**
 * Ranks candidates by the specified criteria with optimized sorting algorithms
 * Supports primary sorting and tie-breakers with asc/desc directions
 *
 * @param candidateIds - Array of candidate IDs to rank (per specification)
 * @param plan - Ranking plan with primary field and optional tie-breakers
 * @param candidates - Complete candidates array for lookup
 * @returns Sorted array of candidates in ranked order
 */
export function rankCandidates(
  candidateIds: number[],
  plan: RankingPlan,
  candidates: Candidate[]
): Candidate[] {
  const rows = candidateIds
    .map(id => candidates.find(c => c.id === id))
    .filter((c): c is Candidate => c !== undefined);
  if (!rows.length || !plan?.primary?.field) return rows;

  return [...rows].sort((a, b) => {
    // Primary sort
    let comparison = compareValues(a[plan.primary.field], b[plan.primary.field]);

    if (plan.primary.direction === 'desc') {
      comparison = -comparison;
    }

    if (comparison !== 0) return comparison;

    // Apply tie breakers
    if (plan.tie_breakers) {
      for (const tieBreaker of plan.tie_breakers) {
        let tieComparison = compareValues(a[tieBreaker.field], b[tieBreaker.field]);

        if (tieBreaker.direction === 'desc') {
          tieComparison = -tieComparison;
        }

        if (tieComparison !== 0) return tieComparison;
      }
    }

    return 0;
  });
}

/**
 * Aggregates statistics from ranked candidates for rich summaries
 * Calculates averages, top skills, breakdowns, and other insights
 *
 * @param rankedIds - Array of ranked candidate IDs (per specification)
 * @param candidates - Complete candidates array for lookup
 * @returns Rich statistics object with counts, averages, and breakdowns
 */
export function aggregateStats(rankedIds: number[], candidates: Candidate[]) {
  const filteredCandidates = rankedIds
    .map(id => candidates.find(c => c.id === id))
    .filter((c): c is Candidate => c !== undefined);

  if (!filteredCandidates.length) {
    return {
      count: 0,
      avg_experience: 0,
      top_skills: [],
      avg_salary: 0,
      locations: [],
      languages: [],
      timezones: [],
      education_breakdown: {},
      work_preference_breakdown: {},
      visa_status_breakdown: {},
    };
  }

  // Calculate averages
  const experiences = filteredCandidates.map(c => parseNumeric(c.years_experience));
  const avg_experience = experiences.reduce((sum, exp) => sum + exp, 0) / experiences.length;

  const salaries = filteredCandidates
    .map(c => parseNumeric(c.desired_salary_usd))
    .filter(s => s > 0);
  const avg_salary =
    salaries.length > 0 ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length : 0;

  // Aggregate skills
  const skillCounts: Record<string, number> = {};
  filteredCandidates.forEach(c => {
    const skills =
      c.skills
        ?.split(';')
        .map((s: string) => s.trim())
        .filter(Boolean) || [];
    skills.forEach((skill: string) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  const top_skills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([skill, count]: [string, number]) => ({ skill, count }));

  // Extract unique values for various fields
  const getUniqueValues = (field: string, shouldSplit = false) => {
    const values = filteredCandidates.flatMap(c => {
      const value = String(c[field] || '');
      if (!value) return [];
      return shouldSplit
        ? value
            .split(';')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [value];
    });
    return [...new Set(values)];
  };

  // Generate breakdowns
  const createBreakdown = (field: string) => {
    const breakdown: Record<string, number> = {};
    filteredCandidates.forEach(c => {
      const value = String(c[field] || '');
      if (value) {
        breakdown[value] = (breakdown[value] || 0) + 1;
      }
    });
    return breakdown;
  };

  return {
    count: filteredCandidates.length,
    avg_experience: Math.round(avg_experience * 10) / 10,
    top_skills,
    avg_salary: Math.round(avg_salary),
    locations: getUniqueValues('location'),
    languages: getUniqueValues('languages', true),
    timezones: getUniqueValues('timezone'),
    education_breakdown: createBreakdown('education_level'),
    work_preference_breakdown: createBreakdown('work_preference'),
    visa_status_breakdown: createBreakdown('visa_status'),
  };
}
