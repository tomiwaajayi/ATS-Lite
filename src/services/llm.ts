import { ThinkAPIResponse } from '@/types/api';

// THINK Phase: LLM processes user query and CSV headers to create plans
export async function thinkLLM(
  userMessage: string,
  csvHeaders: string[]
): Promise<ThinkAPIResponse> {
  const response = await fetch('/api/think', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userMessage, csvHeaders }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Think API failed: ${response.status} ${errorText}`);
  }

  return await response.json();
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
  const response = await fetch('/api/speak', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ originalQuery, topCandidates, stats }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Speak API failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.summary;
}

// Legacy function for backward compatibility
export async function callLLM(
  userMessage: string,
  csvHeaders: string[]
): Promise<ThinkAPIResponse> {
  return thinkLLM(userMessage, csvHeaders);
}
