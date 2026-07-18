import { LLMClient } from './llm-client';
import { RESEARCH_AGENT_SYSTEM_PROMPT } from './prompts';
import {
  AgentConfig,
  AgentState,
  AgentMessage,
  ThinkingStep,
  Citation,
  StreamEvent,
  ToolCall,
} from './types';
import { ToolRegistry } from '@/tools/registry';

const MAX_ITERATIONS = 10;

/**
 * AgentExecutor — the autonomous research agent loop.
 *
 * Implements: Think → Decide → Act → Observe → Repeat
 *
 * The agent continues iterating until it reaches a final answer
 * or hits the maximum iteration limit.
 */
export class AgentExecutor {
  private llm: LLMClient;
  private tools: ToolRegistry;
  private config: AgentConfig;
  private state: AgentState;
  private onEvent?: (event: StreamEvent) => void;

  constructor(
    config: AgentConfig,
    tools: ToolRegistry,
    onEvent?: (event: StreamEvent) => void
  ) {
    this.config = config;
    this.llm = new LLMClient(config);
    this.tools = tools;
    this.onEvent = onEvent;
    this.state = {
      messages: [],
      thinkingSteps: [],
      iterations: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalCachedTokens: 0,
      citations: [],
      isComplete: false,
    };
  }

  /**
   * Execute the agent loop for a given user query.
   */
  async execute(
    userMessage: string,
    conversationHistory: AgentMessage[] = []
  ): Promise<{
    response: string;
    thinkingSteps: ThinkingStep[];
    citations: Citation[];
    promptTokens: number;
    completionTokens: number;
    cachedTokens: number;
  }> {
    // Initialize with system prompt and conversation history
    this.state.messages = [
      { role: 'system', content: RESEARCH_AGENT_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    this.emit({
      type: 'thinking',
      data: { type: 'thinking', content: 'Analyzing your question...', timestamp: Date.now() },
    });

    // ── Agent Loop ────────────────────────────────────────────────────────────
    while (!this.state.isComplete && this.state.iterations < (this.config.maxIterations || MAX_ITERATIONS)) {
      this.state.iterations++;

      try {
        // ── THINK: Call LLM with current context ──────────────────────────────
        const response = await this.llm.chat(this.state.messages);

        // Track token usage
        this.state.totalPromptTokens += response.promptTokens;
        this.state.totalCompletionTokens += response.completionTokens;
        this.state.totalCachedTokens += response.cachedTokens;

        // ── DECIDE: Does the LLM want to use tools? ──────────────────────────
        if (response.toolCalls.length > 0) {
          // Add assistant message with tool calls to context
          this.state.messages.push({
            role: 'assistant',
            content: response.content || '',
            tool_calls: response.toolCalls,
          });

          if (response.content) {
            this.addThinkingStep('reasoning', response.content);
            this.emit({
              type: 'thinking',
              data: {
                type: 'reasoning',
                content: response.content,
                timestamp: Date.now(),
              },
            });
          }

          // ── ACT: Execute each tool call ───────────────────────────────────
          for (const toolCall of response.toolCalls) {
            await this.executeTool(toolCall);
          }
        } else {
          // ── FINAL ANSWER: No tool calls — we have our answer ────────────
          const finalAnswer = response.content || 'I was unable to generate a response.';

          this.state.messages.push({
            role: 'assistant',
            content: finalAnswer,
          });

          this.addThinkingStep('final_answer', finalAnswer);
          this.emit({ type: 'content', data: finalAnswer });
          this.emit({
            type: 'done',
            data: JSON.stringify({
              iterations: this.state.iterations,
              citations: this.state.citations,
            }),
          });

          this.state.isComplete = true;

          return {
            response: finalAnswer,
            thinkingSteps: this.state.thinkingSteps,
            citations: this.state.citations,
            promptTokens: this.state.totalPromptTokens,
            completionTokens: this.state.totalCompletionTokens,
            cachedTokens: this.state.totalCachedTokens,
          };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';

        this.emit({
          type: 'error',
          data: errorMessage,
        });

        this.addThinkingStep('reasoning', `Error: ${errorMessage}`);

        // Try to recover by adding error context and continuing
        this.state.messages.push({
          role: 'user',
          content: `An error occurred: ${errorMessage}. Please try a different approach or provide your best answer with the information gathered so far.`,
        });
      }
    }

    // ── Max iterations reached — force final answer ───────────────────────────
    if (!this.state.isComplete) {
      this.state.messages.push({
        role: 'user',
        content:
          'You have reached the maximum number of research steps. Please provide your final comprehensive answer now, synthesizing all the information you have gathered.',
      });

      const finalResponse = await this.llm.chat(this.state.messages);
      this.state.totalPromptTokens += finalResponse.promptTokens;
      this.state.totalCompletionTokens += finalResponse.completionTokens;

      const answer = finalResponse.content || 'Research completed but could not generate final summary.';

      this.emit({ type: 'content', data: answer });
      this.emit({ type: 'done', data: 'Max iterations reached' });

      return {
        response: answer,
        thinkingSteps: this.state.thinkingSteps,
        citations: this.state.citations,
        promptTokens: this.state.totalPromptTokens,
        completionTokens: this.state.totalCompletionTokens,
        cachedTokens: this.state.totalCachedTokens,
      };
    }

    return {
      response: 'Unexpected agent termination.',
      thinkingSteps: this.state.thinkingSteps,
      citations: this.state.citations,
      promptTokens: this.state.totalPromptTokens,
      completionTokens: this.state.totalCompletionTokens,
      cachedTokens: this.state.totalCachedTokens,
    };
  }

  /**
   * Execute a single tool call and add the result to context.
   */
  private async executeTool(toolCall: ToolCall): Promise<void> {
    const { name, arguments: argsString } = toolCall.function;

    this.addThinkingStep('tool_call', `Calling tool: ${name}`, name);
    this.emit({
      type: 'tool_start',
      data: {
        type: 'tool_call',
        content: `Using ${name}...`,
        toolName: name,
        toolInput: JSON.parse(argsString),
        timestamp: Date.now(),
      },
    });

    try {
      const args = JSON.parse(argsString);
      const result = await this.tools.executeTool(name, args);

      const resultString =
        typeof result.data === 'string'
          ? result.data
          : JSON.stringify(result.data, null, 2);

      // Truncate very long results to prevent context overflow
      const truncatedResult =
        resultString.length > 8000
          ? resultString.substring(0, 8000) + '\n\n[Content truncated for brevity]'
          : resultString;

      this.state.messages.push({
        role: 'tool',
        content: truncatedResult,
        tool_call_id: toolCall.id,
        name: name,
      });

      // Handle citation collection
      if (name === 'citation_collector' && result.success) {
        const citation = result.data as Citation;
        this.state.citations.push(citation);
        this.emit({ type: 'citation', data: citation });
      }

      this.addThinkingStep(
        'tool_result',
        `${name} completed: ${truncatedResult.substring(0, 200)}...`,
        name
      );

      this.emit({
        type: 'tool_end',
        data: {
          type: 'tool_result',
          content: truncatedResult.substring(0, 500),
          toolName: name,
          toolOutput: result.data,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Tool execution failed';

      this.state.messages.push({
        role: 'tool',
        content: `Error: ${errorMsg}`,
        tool_call_id: toolCall.id,
        name: name,
      });

      this.addThinkingStep('tool_result', `${name} failed: ${errorMsg}`, name);

      this.emit({
        type: 'tool_end',
        data: {
          type: 'tool_result',
          content: `Error: ${errorMsg}`,
          toolName: name,
          timestamp: Date.now(),
        },
      });
    }
  }

  private addThinkingStep(
    type: ThinkingStep['type'],
    content: string,
    toolName?: string
  ): void {
    this.state.thinkingSteps.push({
      type,
      content,
      toolName,
      timestamp: Date.now(),
    });
  }

  private emit(event: StreamEvent): void {
    this.onEvent?.(event);
  }
}
