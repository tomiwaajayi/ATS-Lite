// Workflow phase and session types

export type MCPPhaseType = 'think' | 'filter' | 'rank' | 'speak' | 'complete' | 'error';

export interface MCPPhase {
  id: string;
  phase: MCPPhaseType;
  timestamp: Date;
  title: string;
  description: string;
  data?: Record<string, unknown>;
}

export interface QuerySession {
  id: string;
  query: string;
  timestamp: Date;
  phases: MCPPhase[];
  isActive: boolean;
  completed: boolean;
  error?: string;
}
