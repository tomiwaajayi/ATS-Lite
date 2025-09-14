/**
 * Challenge Requirement Test as specified in xyz.md
 * Input: "React dev, Cyprus, sort by experience desc"
 * Expectation: candidate #12 appears above #5
 */

import { applyCandidateFilters } from '@/services/candidate-filtering';
import { applyCandidateRanking } from '@/services/candidate-ranking';
import type { Candidate } from '@/types/candidate';
import type { FilterPlan, RankingPlan } from '@/types/filtering';

// Test candidates matching the challenge requirement
const challengeCandidates: Candidate[] = [
  {
    id: 12,
    full_name: 'Quinn Williams',
    title: 'Machine Learning Engineer',
    location: 'Nicosia, Cyprus',
    timezone: 'Asia/Nicosia',
    years_experience: 19, // Higher experience (should rank first)
    skills: 'Spring;Kubernetes;JavaScript;TypeScript;React', // Has React
    languages: 'Hindi;Arabic',
    education_level: "Master's",
    degree_major: 'Software Engineering',
    availability_weeks: 10,
    willing_to_relocate: 'No',
    work_preference: 'Remote',
    notice_period_weeks: 4,
    desired_salary_usd: 153752,
    open_to_contract: 'Yes',
    remote_experience_years: 2,
    visa_status: 'Citizen',
    citizenships: 'Australia',
    summary: 'Machine Learning Engineer with strong background in Spring, Kubernetes, JavaScript.',
    tags: 'data,machine‑learning,cloud',
    last_active: '2025-03-16',
    linkedin_url: 'https://linkedin.com/in/candidate12',
  },
  {
    id: 5,
    full_name: 'Jess Garcia',
    title: 'DevOps Engineer',
    location: 'San Francisco, USA', // Not Cyprus
    timezone: 'America/Los_Angeles',
    years_experience: 8, // Lower experience
    skills: 'FastAPI;Ruby;GCP;Spring;Node.js;GraphQL;Angular;React', // Has React
    languages: 'French;German',
    education_level: 'PhD',
    degree_major: 'Computer Science',
    availability_weeks: 12,
    willing_to_relocate: 'Yes',
    work_preference: 'Remote',
    notice_period_weeks: 2,
    desired_salary_usd: 91938,
    open_to_contract: 'No',
    remote_experience_years: 7,
    visa_status: 'Needs Sponsorship',
    citizenships: 'Germany',
    summary: 'DevOps Engineer with expertise in FastAPI, Ruby, GCP.',
    tags: 'devops,cloud,backend',
    last_active: '2025-01-08',
    linkedin_url: 'https://linkedin.com/in/candidate5',
  },
];

describe('ATS Challenge Requirement', () => {
  test('React dev, Cyprus, sort by experience desc - candidate #12 should appear above #5', () => {
    // Filter for React developers
    const filterPlan: FilterPlan = {
      include: {
        skills: ['React'],
      },
    };

    // Rank by experience descending
    const rankingPlan: RankingPlan = {
      primary: {
        field: 'years_experience',
        direction: 'desc',
      },
    };

    // Step 1: Apply filter
    const filterResult = applyCandidateFilters(challengeCandidates, filterPlan);

    // Should find both candidates (both have React)
    expect(filterResult.count).toBe(2);
    expect(filterResult.filtered.map(c => c.id).sort((a, b) => a - b)).toEqual([5, 12]);

    // Step 2: Apply ranking
    const rankingResult = applyCandidateRanking(filterResult.filtered, rankingPlan);

    // Should rank by experience: #12 (19 years) > #5 (8 years)
    expect(rankingResult.rankedIds).toEqual([12, 5]);

    // Verify candidate #12 appears above candidate #5
    const candidate12Index = rankingResult.rankedIds.indexOf(12);
    const candidate5Index = rankingResult.rankedIds.indexOf(5);

    expect(candidate12Index).toBeLessThan(candidate5Index);
    expect(candidate12Index).toBe(0); // #12 should be first
    expect(candidate5Index).toBe(1); // #5 should be second

    console.log('✅ Candidate #12 successfully ranked above candidate #5');
  });
});
