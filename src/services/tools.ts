import { Candidate } from '@/types/candidate';
import { FilterPlan, RankingPlan } from '@/types/filtering';
import { applyCandidateFilters } from './candidate-filtering';
import { applyCandidateRanking } from './candidate-ranking';

// Global candidate storage for  tools
let candidatesGlobal: Candidate[] = [];

/**
 * Set the global candidates array for use by tools
 * This allows the tools to match the exact specification signatures
 */
export function setCandidatesGlobal(candidates: Candidate[]) {
  candidatesGlobal = candidates;
}

/**
 * Filters candidates based on the provided filter plan
 * Specification: filterCandidates(plan) → { include?, exclude? } → Candidate[]
 */
export function filterCandidates(plan: FilterPlan): Candidate[] {
  const result = applyCandidateFilters(candidatesGlobal, plan);
  return result.filtered;
}

/**
 * Ranks candidates by the specified criteria
 * Specification: rankCandidates(ids, plan) → { primary, tie_breakers? } → Candidate[]
 */
export function rankCandidates(ids: number[], plan: RankingPlan): Candidate[] {
  // Get candidates by IDs
  const candidates = ids
    .map(id => candidatesGlobal.find(c => c.id === id))
    .filter((c): c is Candidate => c !== undefined);

  if (!candidates.length) return [];

  const result = applyCandidateRanking(candidates, plan);
  return result.ranked;
}

/**
 * Aggregates statistics from candidate IDs
 * Specification: aggregateStats(ids) → ids[] → { count, avg_experience, top_skills[] }
 * Enhanced with additional stats for rich MCP workflow summaries
 */
export function aggregateStats(ids: number[]) {
  const filteredCandidates = ids
    .map(id => candidatesGlobal.find(c => c.id === id))
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

// === HELPER FUNCTIONS ===

function parseNumeric(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '');
    return parseInt(cleaned) || 0;
  }
  return 0;
}
