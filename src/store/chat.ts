import { create } from 'zustand';
import { QuerySession, MCPPhase } from '@/types';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

interface ChatState {
  messages: Message[];
  input: string;
  isLoading: boolean;

  querySessions: QuerySession[];
  currentSessionId: string | null;

  setInput: (input: string) => void;
  setLoading: (loading: boolean) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;

  startNewSession: (query: string) => string;
  addPhaseToSession: (sessionId: string, phase: Omit<MCPPhase, 'id'>) => void;
  updatePhaseInSession: (sessionId: string, phaseId: string, updates: Partial<MCPPhase>) => void;
  completeSession: (sessionId: string) => void;
  clearSessions: () => void;

  getCurrentSession: () => QuerySession | null;
  getSessionPhases: (sessionId: string) => MCPPhase[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  input: '',
  isLoading: false,
  querySessions: [],
  currentSessionId: null,

  setInput: input => set({ input }),

  setLoading: isLoading => set({ isLoading }),

  addMessage: message => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    set(state => ({ messages: [...state.messages, newMessage] }));
    return newMessage.id;
  },

  updateMessage: (id, updates) =>
    set(state => ({
      messages: state.messages.map(msg => (msg.id === id ? { ...msg, ...updates } : msg)),
    })),

  clearMessages: () => set({ messages: [] }),

  startNewSession: query => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: QuerySession = {
      id: sessionId,
      query,
      timestamp: new Date(),
      phases: [],
      isActive: true,
      completed: false,
    };

    set(state => ({
      querySessions: state.querySessions
        .map(s => ({
          ...s,
          isActive: false,
          completed: true,
        }))
        .concat(newSession),
      currentSessionId: sessionId,
    }));

    return sessionId;
  },

  addPhaseToSession: (sessionId, phase) => {
    const newPhase: MCPPhase = {
      ...phase,
      id: `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    set(state => ({
      querySessions: state.querySessions.map(session =>
        session.id === sessionId ? { ...session, phases: [...session.phases, newPhase] } : session
      ),
    }));
  },

  updatePhaseInSession: (sessionId, phaseId, updates) => {
    set(state => ({
      querySessions: state.querySessions.map(session =>
        session.id === sessionId
          ? {
              ...session,
              phases: session.phases.map(phase =>
                phase.id === phaseId ? { ...phase, ...updates } : phase
              ),
            }
          : session
      ),
    }));
  },

  completeSession: sessionId => {
    set(state => ({
      querySessions: state.querySessions.map(session =>
        session.id === sessionId ? { ...session, isActive: false, completed: true } : session
      ),
      currentSessionId: null,
    }));
  },

  clearSessions: () =>
    set({
      querySessions: [],
      currentSessionId: null,
    }),

  getCurrentSession: () => {
    const { querySessions, currentSessionId } = get();
    return querySessions.find(s => s.id === currentSessionId) || null;
  },

  getSessionPhases: sessionId => {
    const { querySessions } = get();
    const session = querySessions.find(s => s.id === sessionId);
    return session?.phases || [];
  },
}));
