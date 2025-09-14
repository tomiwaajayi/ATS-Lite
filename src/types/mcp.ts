// MCP (Model-Control-Plan) workflow types

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

// MCP Workflow execution context
export interface MCPWorkflowContext {
  sessionId: string;
  userQuery: string;
  totalCandidates: number;
  startTime: number;
  phases: MCPPhase[];
}

// MCP Phase execution result
export interface MCPPhaseResult {
  success: boolean;
  phase: MCPPhaseType;
  duration: number;
  data?: Record<string, unknown>;
  error?: string;
}

// MCP Workflow execution result
export interface MCPWorkflowResult {
  sessionId: string;
  success: boolean;
  totalDuration: number;
  phases: MCPPhaseResult[];
  finalResults?: number[]; // candidate IDs
  totalCandidates: number;
  filteredCount: number;
  error?: string;
}
