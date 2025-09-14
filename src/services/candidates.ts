import Papa from 'papaparse';
import { Candidate } from '@/types';

// Unified data parsing function
function parseCandidateData(csvText: string): Candidate[] {
  const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (errors.length > 0) {
    console.warn('CSV parsing warnings:', errors);
  }

  return (data as any[]).map(row => ({
    ...row,
    id: parseInt(row.id) || 0,
    years_experience: parseInt(row.years_experience) || 0,
    availability_weeks: parseInt(row.availability_weeks) || 0,
    notice_period_weeks: parseInt(row.notice_period_weeks) || 0,
    desired_salary_usd: parseInt(row.desired_salary_usd) || 0,
    remote_experience_years: parseInt(row.remote_experience_years) || 0,
  }));
}

// Client-side function for loading candidates via fetch
export async function loadCandidates(filePath: string): Promise<Candidate[]> {
  try {
    const res = await fetch(filePath);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${res.statusText}`);
    }
    const text = await res.text();
    return parseCandidateData(text);
  } catch (error) {
    console.error('Error loading candidates:', error);
    throw new Error(
      `Failed to load candidates: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Export the parser for server-side use
export { parseCandidateData };
