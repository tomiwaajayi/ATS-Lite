// Streaming and real-time communication types

import { MCPPhaseType } from './mcp';

export type StreamChunkType = 'phase' | 'content' | 'complete' | 'error' | 'progress';

export interface BaseStreamChunk {
  type: StreamChunkType;
  timestamp: Date;
  sessionId?: string;
}

export interface PhaseStreamChunk extends BaseStreamChunk {
  type: 'phase';
  phase: MCPPhaseType;
  title: string;
  description: string;
  data?: Record<string, unknown>;
}

export interface ContentStreamChunk extends BaseStreamChunk {
  type: 'content';
  content: string;
  isPartial?: boolean;
  contentType?: 'text' | 'markdown' | 'json';
}

export interface ProgressStreamChunk extends BaseStreamChunk {
  type: 'progress';
  phase: MCPPhaseType;
  progress: number; // 0-100
  message?: string;
}

export interface CompleteStreamChunk extends BaseStreamChunk {
  type: 'complete';
  data: {
    totalCandidates: number;
    filteredCount: number;
    finalResults: number[];
    duration?: number;
  };
}

export interface ErrorStreamChunk extends BaseStreamChunk {
  type: 'error';
  error: string;
  code?: string;
  recoverable?: boolean;
}

export type StreamChunk =
  | PhaseStreamChunk
  | ContentStreamChunk
  | ProgressStreamChunk
  | CompleteStreamChunk
  | ErrorStreamChunk;

// Stream writer interface
export interface StreamWriter {
  write(chunk: StreamChunk): Promise<void>;
  close(): Promise<void>;
  isActive(): boolean;
}

// Stream reader interface
export interface StreamReader {
  read(): Promise<StreamChunk | null>;
  onChunk(callback: (chunk: StreamChunk) => void): void;
  onError(callback: (error: Error) => void): void;
  onComplete(callback: () => void): void;
  close(): void;
}

// Stream configuration
export interface StreamConfig {
  bufferSize?: number;
  maxChunkSize?: number;
  timeout?: number;
  retryAttempts?: number;
  heartbeatInterval?: number;
}

// Stream state
export type StreamState = 'idle' | 'active' | 'paused' | 'completed' | 'error';

export interface StreamStatus {
  state: StreamState;
  chunksProcessed: number;
  bytesTransferred: number;
  startTime: Date;
  lastActivity: Date;
  error?: string;
}
