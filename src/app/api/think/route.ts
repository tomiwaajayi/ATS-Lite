import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ThinkAPIRequest } from '@/types/api';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const requestData: ThinkAPIRequest = await request.json();
    const userMessage = requestData.userMessage;
    const csvHeaders = requestData.csvHeaders;

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 });
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
    if (!responseText) {
      return new Response('No response from OpenAI', { status: 500 });
    }

    const parsed = JSON.parse(responseText);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return new Response(
      `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}
