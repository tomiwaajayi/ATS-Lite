// Candidate data types

export type EducationLevel = 'PhD' | "Master's" | "Bachelor's" | 'Bootcamp';
export type WorkPreference = 'Remote' | 'Hybrid' | 'Onsite';
export type VisaStatus = 'Citizen' | 'Work Visa' | 'Needs Sponsorship' | 'Permanent Resident';
export type BooleanString = 'Yes' | 'No';

// Main candidate data structure
export interface Candidate {
  id: number;
  full_name: string;
  title: string;
  location: string;
  timezone: string;
  years_experience: number;
  skills: string; // semicolon-separated
  languages: string; // semicolon-separated
  education_level: EducationLevel;
  degree_major: string;
  availability_weeks: number;
  willing_to_relocate: BooleanString;
  work_preference: WorkPreference;
  notice_period_weeks: number;
  desired_salary_usd: number;
  open_to_contract: BooleanString;
  remote_experience_years: number;
  visa_status: VisaStatus;
  citizenships: string; // semicolon-separated
  summary: string;
  tags: string; // semicolon-separated
  last_active: string; // ISO date string
  linkedin_url: string;
  // For dynamic field access
  [key: string]: unknown;
}

// Candidate with parsed arrays instead of strings
export interface ParsedCandidate
  extends Omit<
    Candidate,
    'skills' | 'languages' | 'citizenships' | 'tags' | 'willing_to_relocate' | 'open_to_contract'
  > {
  skills: string[];
  languages: string[];
  citizenships: string[];
  tags: string[];
  willing_to_relocate: boolean;
  open_to_contract: boolean;
  last_active: Date;
}

// All possible candidate fields
export type CandidateField = keyof Candidate;

export type NumericCandidateField =
  | 'id'
  | 'years_experience'
  | 'availability_weeks'
  | 'notice_period_weeks'
  | 'desired_salary_usd'
  | 'remote_experience_years';

export type StringCandidateField =
  | 'full_name'
  | 'title'
  | 'location'
  | 'timezone'
  | 'skills'
  | 'languages'
  | 'education_level'
  | 'degree_major'
  | 'work_preference'
  | 'visa_status'
  | 'citizenships'
  | 'summary'
  | 'tags'
  | 'last_active'
  | 'linkedin_url';

export type BooleanCandidateField = 'willing_to_relocate' | 'open_to_contract';
