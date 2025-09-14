// Filter candidates based on various criteria
import type { Candidate } from '@/types/candidate';
import type { FilterPlan, FilterResult } from '@/types/filtering';
import {
  matchesInSeparatedString,
  matchesInSingleString,
  containsAllTerms,
  isInRange,
  parseBoolean,
} from './filtering-utils';

// Returns true if we should exclude this candidate
function shouldExcludeCandidate(
  candidate: Candidate,
  excludeCriteria: FilterPlan['exclude']
): boolean {
  if (!excludeCriteria) return false;

  // String field exclusions
  if (excludeCriteria.title && matchesInSingleString(excludeCriteria.title, candidate.title))
    return true;
  if (
    excludeCriteria.location &&
    matchesInSingleString(excludeCriteria.location, candidate.location)
  )
    return true;
  if (
    excludeCriteria.full_name &&
    matchesInSingleString(excludeCriteria.full_name, candidate.full_name)
  )
    return true;

  // Array field exclusions
  if (excludeCriteria.skills && matchesInSeparatedString(excludeCriteria.skills, candidate.skills))
    return true;
  if (
    excludeCriteria.languages &&
    matchesInSeparatedString(excludeCriteria.languages, candidate.languages)
  )
    return true;
  if (
    excludeCriteria.citizenships &&
    matchesInSeparatedString(excludeCriteria.citizenships, candidate.citizenships)
  )
    return true;
  if (excludeCriteria.tags && matchesInSeparatedString(excludeCriteria.tags, candidate.tags))
    return true;

  // Enum field exclusions
  if (
    excludeCriteria.education_level &&
    matchesInSingleString(excludeCriteria.education_level, candidate.education_level)
  )
    return true;
  if (
    excludeCriteria.degree_major &&
    matchesInSingleString(excludeCriteria.degree_major, candidate.degree_major)
  )
    return true;
  if (
    excludeCriteria.work_preference &&
    matchesInSingleString(excludeCriteria.work_preference, candidate.work_preference)
  )
    return true;
  if (
    excludeCriteria.visa_status &&
    matchesInSingleString(excludeCriteria.visa_status, candidate.visa_status)
  )
    return true;

  return false;
}

// Returns true if candidate passes all our requirements
function meetsInclusionCriteria(
  candidate: Candidate,
  includeCriteria: FilterPlan['include']
): boolean {
  if (!includeCriteria) return true;

  // Check string fields
  if (includeCriteria.title && !matchesInSingleString(includeCriteria.title, candidate.title))
    return false;
  if (
    includeCriteria.location &&
    !matchesInSingleString(includeCriteria.location, candidate.location)
  )
    return false;
  if (
    includeCriteria.full_name &&
    !matchesInSingleString(includeCriteria.full_name, candidate.full_name)
  )
    return false;

  // Must have all required skills/languages/etc
  if (includeCriteria.skills) {
    const requiredSkills = Array.isArray(includeCriteria.skills)
      ? includeCriteria.skills
      : [includeCriteria.skills];
    if (!containsAllTerms(requiredSkills, candidate.skills)) return false;
  }

  if (includeCriteria.languages) {
    const requiredLanguages = Array.isArray(includeCriteria.languages)
      ? includeCriteria.languages
      : [includeCriteria.languages];
    if (!containsAllTerms(requiredLanguages, candidate.languages)) return false;
  }

  if (includeCriteria.citizenships) {
    const requiredCitizenships = Array.isArray(includeCriteria.citizenships)
      ? includeCriteria.citizenships
      : [includeCriteria.citizenships];
    if (!containsAllTerms(requiredCitizenships, candidate.citizenships)) return false;
  }

  if (includeCriteria.tags) {
    const requiredTags = Array.isArray(includeCriteria.tags)
      ? includeCriteria.tags
      : [includeCriteria.tags];
    if (!containsAllTerms(requiredTags, candidate.tags)) return false;
  }

  // Check enum fields
  if (
    includeCriteria.education_level &&
    !matchesInSingleString(includeCriteria.education_level, candidate.education_level)
  )
    return false;
  if (
    includeCriteria.degree_major &&
    !matchesInSingleString(includeCriteria.degree_major, candidate.degree_major)
  )
    return false;
  if (
    includeCriteria.work_preference &&
    !matchesInSingleString(includeCriteria.work_preference, candidate.work_preference)
  )
    return false;
  if (
    includeCriteria.visa_status &&
    !matchesInSingleString(includeCriteria.visa_status, candidate.visa_status)
  )
    return false;

  // Experience and salary ranges
  if (
    !isInRange(
      candidate.years_experience,
      includeCriteria.years_experience_min,
      includeCriteria.years_experience_max
    )
  )
    return false;
  if (
    !isInRange(
      candidate.desired_salary_usd,
      includeCriteria.desired_salary_min,
      includeCriteria.desired_salary_max
    )
  )
    return false;
  if (
    !isInRange(
      candidate.remote_experience_years,
      includeCriteria.remote_experience_years_min,
      includeCriteria.remote_experience_years_max
    )
  )
    return false;

  // Max availability and notice period
  if (
    includeCriteria.availability_weeks_max !== undefined &&
    candidate.availability_weeks > includeCriteria.availability_weeks_max
  )
    return false;
  if (
    includeCriteria.notice_period_weeks_max !== undefined &&
    candidate.notice_period_weeks > includeCriteria.notice_period_weeks_max
  )
    return false;

  // Yes/no questions
  if (includeCriteria.willing_to_relocate !== undefined) {
    const candidateValue = parseBoolean(candidate.willing_to_relocate);
    if (candidateValue !== includeCriteria.willing_to_relocate) return false;
  }

  if (includeCriteria.open_to_contract !== undefined) {
    const candidateValue = parseBoolean(candidate.open_to_contract);
    if (candidateValue !== includeCriteria.open_to_contract) return false;
  }

  return true;
}

// Main function - filter candidates based on the plan
export function applyCandidateFilters(
  candidates: Candidate[],
  filterPlan: FilterPlan
): FilterResult<Candidate> {
  const startTime = performance.now();

  // No filters? Return everyone
  if (!filterPlan || (!filterPlan.include && !filterPlan.exclude)) {
    return {
      filtered: candidates,
      count: candidates.length,
      totalProcessed: candidates.length,
    };
  }

  const filteredCandidates = candidates.filter(candidate => {
    // Check excludes first - fast rejection
    if (shouldExcludeCandidate(candidate, filterPlan.exclude)) {
      return false;
    }

    // Then check if they meet our requirements
    return meetsInclusionCriteria(candidate, filterPlan.include);
  });

  const endTime = performance.now();

  // Log performance in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`Filtering took ${endTime - startTime}ms for ${candidates.length} candidates`);
  }

  return {
    filtered: filteredCandidates,
    count: filteredCandidates.length,
    totalProcessed: candidates.length,
  };
}

// Quick way to create common filter setups
export function createBasicFilterPlan(
  includeSkills?: string[],
  includeLocation?: string[],
  excludeLocation?: string[],
  minExperience?: number,
  maxSalary?: number
): FilterPlan {
  return {
    include: {
      ...(includeSkills && { skills: includeSkills }),
      ...(includeLocation && { location: includeLocation }),
      ...(minExperience && { years_experience_min: minExperience }),
      ...(maxSalary && { desired_salary_max: maxSalary }),
    },
    exclude: {
      ...(excludeLocation && { location: excludeLocation }),
    },
  };
}

// Make sure the filter plan makes sense
export function validateFilterPlan(filterPlan: FilterPlan): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!filterPlan) {
    errors.push('Filter plan cannot be null or undefined');
    return { isValid: false, errors };
  }

  if (!filterPlan.include && !filterPlan.exclude) {
    errors.push('Filter plan must have at least include or exclude criteria');
    return { isValid: false, errors };
  }

  // Check that min/max ranges are logical
  if (filterPlan.include) {
    const { include } = filterPlan;

    if (include.years_experience_min !== undefined && include.years_experience_max !== undefined) {
      if (include.years_experience_min > include.years_experience_max) {
        errors.push('Minimum experience cannot be greater than maximum experience');
      }
    }

    if (include.desired_salary_min !== undefined && include.desired_salary_max !== undefined) {
      if (include.desired_salary_min > include.desired_salary_max) {
        errors.push('Minimum salary cannot be greater than maximum salary');
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}
