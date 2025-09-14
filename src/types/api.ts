// API request/response types

import { FilterPlan, RankingPlan } from './filtering';
import { CandidateStats } from './stats';

// Think API types
export interface ThinkAPIRequest {
  userMessage: string;
  csvHeaders: string[];
}

export interface ThinkAPIResponse {
  filter?: FilterPlan;
  rank?: RankingPlan;
}

// Speak API types
export interface SpeakAPIRequest {
  originalQuery: string;
  topCandidates: Record<string, unknown>[];
  stats: {
    count: number;
    avg_experience: string;
    top_skills: Array<{ skill: string; count: number }>;
  };
}

export interface SpeakAPIResponse {
  summary: string;
}

// Chat API types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatAPIRequest {
  messages: ChatMessage[];
  sessionId?: string;
}

// Test API types
export interface TestAPIRequest {
  query: string;
  expectedResults?: number[];
}

export interface TestAPIResponse {
  success: boolean;
  results: number[];
  stats: CandidateStats;
  duration: number;
  error?: string;
}

// Common API response wrapper
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  duration?: number;
}

// API Error types
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// HTTP status codes
export type HTTPStatusCode = 200 | 400 | 401 | 403 | 404 | 422 | 500 | 503;

export interface HTTPError extends APIError {
  status: HTTPStatusCode;
  path?: string;
  method?: string;
}
