import { ThinkAPIResponse } from '@/types/api';
import { FilterPlan, RankingPlan } from '@/types/filtering';

// THINK Phase: LLM processes user query and CSV headers to create plans
export async function thinkLLM(
  userMessage: string,
  csvHeaders: string[]
): Promise<ThinkAPIResponse> {
  try {
    const response = await fetch('/api/think', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userMessage, csvHeaders }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('API error:', error);
  }

  // Fallback to mock implementation
  return getMockThinkResponse(userMessage);
}

// SPEAK Phase: LLM generates recruiter-friendly summary from top candidates
export async function speakLLM(
  originalQuery: string,
  topCandidates: Record<string, unknown>[],
  stats: {
    count: number;
    avg_experience: string;
    top_skills: Array<{ skill: string; count: number }>;
  }
): Promise<string> {
  try {
    const response = await fetch('/api/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ originalQuery, topCandidates, stats }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.summary;
    }
  } catch (error) {
    console.error('API error:', error);
  }

  // Fallback to mock implementation
  return getMockSpeakResponse(originalQuery, topCandidates, stats);
}

// Simplified mock implementation
function getMockThinkResponse(userMessage: string): ThinkAPIResponse {
  const message = userMessage.toLowerCase();
  const filter: FilterPlan = { include: {} };
  const rank: RankingPlan = { primary: { field: 'years_experience', direction: 'desc' } };

  // Title filtering - prioritize specific qualifiers over general terms
  if (message.includes('backend')) {
    // Backend developers/engineers
    filter.include!.title = '/Backend/';
  } else if (message.includes('frontend')) {
    // Frontend developers/engineers
    filter.include!.title = '/Frontend/';
  } else if (
    message.includes('fullstack') ||
    message.includes('full-stack') ||
    message.includes('full stack')
  ) {
    // Full-stack developers
    filter.include!.title = '/Full.*Stack/';
  } else if (message.includes('devops')) {
    filter.include!.title = '/DevOps/';
  } else if (message.includes('mobile')) {
    filter.include!.title = '/Mobile/';
  } else if (message.includes('data scientist')) {
    filter.include!.title = '/Data Scientist/';
  } else if (message.includes('machine learning') || message.includes('ml engineer')) {
    filter.include!.title = '/Machine Learning/';
  } else if (message.includes('cloud')) {
    filter.include!.title = '/Cloud/';
  } else if (message.includes('product engineer')) {
    filter.include!.title = '/Product Engineer/';
  } else if (message.includes('qa') || message.includes('quality assurance')) {
    filter.include!.title = '/QA/';
  } else if (message.includes('react')) {
    filter.include!.skills = 'React'; // Use skills for React since it's in skills field
  } else if (message.includes('developer') || message.includes('dev ')) {
    // Only use broad matching if no specific qualifier was found
    filter.include!.title = ['/Developer/', '/Engineer/'];
  } else if (message.includes('engineer')) {
    filter.include!.title = '/Engineer/';
  }

  // Location filtering - handle various country name formats
  if (message.includes('cyprus')) {
    filter.include = { ...filter.include, location: 'Cyprus' };
  } else if (message.includes('germany')) {
    filter.include = { ...filter.include, location: 'Germany' };
  } else if (
    message.includes('usa') ||
    message.includes(' us ') ||
    message.includes('the us') ||
    message.includes('united states') ||
    message.includes('america')
  ) {
    filter.include = { ...filter.include, location: 'USA' };
  } else if (
    message.includes('uk') ||
    message.includes('united kingdom') ||
    message.includes('britain')
  ) {
    filter.include = { ...filter.include, location: 'UK' };
  } else if (message.includes('south africa')) {
    filter.include = { ...filter.include, location: 'South Africa' };
  } else if (message.includes('new york')) {
    filter.include = { ...filter.include, location: 'New York' };
  } else if (message.includes('san francisco')) {
    filter.include = { ...filter.include, location: 'San Francisco' };
  }

  // Ranking direction
  const direction = message.includes('least') || message.includes('last') ? 'asc' : 'desc';

  if (message.includes('salary')) {
    rank.primary = { field: 'desired_salary_usd', direction: 'desc' };
  } else {
    rank.primary = { field: 'years_experience', direction };
  }

  // Ensure meaningful criteria
  if (!filter.include || Object.keys(filter.include).length === 0) {
    filter.include = { title: '__NO_MATCH__' };
  }

  return { filter, rank };
}

function getMockSpeakResponse(
  originalQuery: string,
  topCandidates: Record<string, unknown>[],
  stats: {
    count: number;
    avg_experience: string;
    top_skills: Array<{ skill: string; count: number }>;
  }
): string {
  if (stats.count === 0) {
    return 'No candidates match your criteria. Try adjusting your search terms or expanding your requirements.';
  }

  const top5 = topCandidates.slice(0, 5);
  const topNames = top5.map(c => String(c.full_name || 'Unknown')).slice(0, 3);

  let summary = `I found ${stats.count} matches (avg ${stats.avg_experience} yrs experience).`;

  if (topNames.length > 0) {
    summary += ` Here are the top ${Math.min(3, topNames.length)}: ${topNames.join(', ')}.`;
  }

  if (stats.top_skills.length > 0) {
    const topSkill = stats.top_skills[0];
    summary += ` Most common skill: ${topSkill.skill} (${topSkill.count} candidates).`;
  }

  // Add contextual insights based on the query
  const query = originalQuery.toLowerCase();
  if (query.includes('cyprus') && stats.count > 0) {
    const cyprusCount = topCandidates.filter(c =>
      String(c.location || '').includes('Cyprus')
    ).length;
    if (cyprusCount > 0) {
      summary += ` ${cyprusCount} are based in Cyprus.`;
    }
  }

  if (query.includes('react') && stats.count > 0) {
    const reactCount = topCandidates.filter(c => String(c.title || '').includes('React')).length;
    if (reactCount > 0) {
      summary += ` ${reactCount} are React specialists.`;
    }
  }

  return summary;
}

// Legacy function for backward compatibility
export async function callLLM(
  userMessage: string,
  csvHeaders: string[]
): Promise<ThinkAPIResponse> {
  return thinkLLM(userMessage, csvHeaders);
}

export function generateSummary(
  candidates: Record<string, unknown>[],
  filteredCount: number,
  topCandidates: Record<string, unknown>[],
  stats: { count: number; avg_experience: string }
): string {
  if (filteredCount === 0) {
    return 'No candidates match your criteria. Try adjusting your search.';
  }

  const top3 = topCandidates.slice(0, 3);
  const names = top3.map(c => String(c.full_name || 'Unknown')).join(', ');

  return `I found ${stats.count} matches (avg ${stats.avg_experience} yrs). Here are the top three: ${names}.`;
}
