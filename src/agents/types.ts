// ─── Agent Types ──────────────────────────────────────────────────────────────

export type AIProviderType = 'openai' | 'anthropic' | 'kimi' | 'custom';

export interface AgentConfig {
  provider: AIProviderType;
  model: string;
  apiKey: string;
  endpoint?: string;
  maxIterations?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  data: unknown;
  error?: string;
}

export interface ThinkingStep {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'reasoning' | 'final_answer';
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  timestamp: number;
}

export interface AgentState {
  messages: AgentMessage[];
  thinkingSteps: ThinkingStep[];
  iterations: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCachedTokens: number;
  citations: Citation[];
  isComplete: boolean;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Citation {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface StreamEvent {
  type: 'thinking' | 'tool_start' | 'tool_end' | 'content' | 'citation' | 'done' | 'error';
  data: string | ThinkingStep | Citation;
}

export interface LLMResponse {
  content: string | null;
  toolCalls: ToolCall[];
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  finishReason: string;
}

export interface LLMStreamChunk {
  type: 'content' | 'tool_call' | 'done';
  content?: string;
  toolCall?: Partial<ToolCall>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    cachedTokens: number;
  };
}
