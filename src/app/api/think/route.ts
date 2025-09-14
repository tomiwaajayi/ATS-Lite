import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ThinkAPIRequest, ThinkAPIResponse } from '@/types/api';
import { FilterPlan, RankingPlan } from '@/types/filtering';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  let userMessage = '';

  try {
    const requestData: ThinkAPIRequest = await request.json();
    userMessage = requestData.userMessage;
    const csvHeaders = requestData.csvHeaders;

    if (!process.env.OPENAI_API_KEY) {
      // Return mock response if no API key
      return NextResponse.json(getMockThinkResponse(userMessage));
    }

    const prompt = `You are an ATS assistant. Generate filter and ranking plans from natural language queries.

Available fields: ${csvHeaders.join(', ')}

User Query: "${userMessage}"

Respond with ONLY valid JSON:
{
  "filter": {
    "include": { "field": "value" },
    "exclude": { "field": "value" }
  },
  "rank": {
    "primary": { "field": "field_name", "direction": "desc" },
    "tie_breakers": [{ "field": "field_name", "direction": "desc" }]
  }
}

Field Examples:
- title: job titles ("Backend Engineer", "Frontend Engineer", "DevOps Engineer", "Cloud Architect")
- location: city/country ("Berlin, Germany", "New York, USA")
- skills: semicolon-separated ("JavaScript;React;Node.js", "AWS;GCP;Azure")
- tags: roles/specialties ("cloud", "frontend", "backend", "devops", "mobile")
- years_experience: numeric (filter with _min/_max suffixes)
- desired_salary_usd: numeric (filter with _min/_max suffixes)
- work_preference: "Remote", "Hybrid", "Onsite"
- visa_status: "Citizen", "Work Visa", "Needs Sponsorship", "Permanent Resident"

Cloud Search Mapping Rules:
- "cloud specialist", "cloud experience", "cloud expert" → title: "/Cloud.*Architect/i"
- "AWS/GCP/Azure specialist" → skills: "AWS|GCP|Azure" AND tags: "cloud"
- "DevOps with cloud experience" → title: "/DevOps/i" AND tags: "cloud"

Rules:
1. Use exact field names from CSV headers
2. For partial matching, use regex: "/React/" matches "React Developer"
3. For cloud queries, map to Cloud Architect titles and cloud-related skills/tags
4. Default to "desc" for experience/salary (most first)
5. Use "asc" only when explicitly requested ("least experience first")
6. Always include specific filter criteria - never match everyone
7. If query is too vague, use title: ["__NO_MATCH__"] to return 0 results`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful ATS assistant that responds with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (responseText) {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed);
    }

    // Fallback to mock if parsing fails
    return NextResponse.json(getMockThinkResponse(userMessage));
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fall back to mock implementation
    return NextResponse.json(getMockThinkResponse(userMessage));
  }
}

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
  if (message.includes('germany')) {
    filter.include!.location = 'Germany';
  } else if (message.includes('cyprus')) {
    filter.include!.location = 'Cyprus';
  } else if (
    message.includes('usa') ||
    message.includes(' us ') ||
    message.includes('the us') ||
    message.includes('united states') ||
    message.includes('america')
  ) {
    filter.include!.location = 'USA';
  } else if (
    message.includes('uk') ||
    message.includes('united kingdom') ||
    message.includes('britain')
  ) {
    filter.include!.location = 'UK';
  } else if (message.includes('south africa')) {
    filter.include!.location = 'South Africa';
  } else if (message.includes('new york')) {
    filter.include!.location = 'New York';
  } else if (message.includes('san francisco')) {
    filter.include!.location = 'San Francisco';
  } else if (message.includes('berlin')) {
    filter.include!.location = 'Berlin';
  }

  // Skills filtering
  if (message.includes('react') && !message.includes('title')) {
    filter.include!.skills = 'React';
  } else if (message.includes('python')) {
    filter.include!.skills = 'Python';
  } else if (message.includes('javascript')) {
    filter.include!.skills = 'JavaScript';
  }

  // Experience filtering
  if (message.includes('senior') || message.includes('10+') || message.includes('experienced')) {
    filter.include!.years_experience_min = 5;
  } else if (message.includes('junior')) {
    filter.include!.years_experience_max = 3;
  }

  // Ranking logic
  let direction: 'asc' | 'desc' = 'desc';
  if (message.includes('least') || message.includes('last') || message.includes('ascending')) {
    direction = 'asc';
  }

  if (message.includes('salary') || message.includes('paid')) {
    rank!.primary = { field: 'desired_salary_usd', direction: 'desc' };
  } else if (message.includes('available')) {
    rank!.primary = { field: 'availability_weeks', direction: 'asc' };
  } else {
    rank!.primary = { field: 'years_experience', direction };
  }

  // Ensure we have meaningful filter criteria
  if (Object.keys(filter.include!).length === 0) {
    filter.include!.title = '__NO_MATCH__';
  }

  return { filter, rank };
}
