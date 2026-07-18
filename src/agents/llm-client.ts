import {
  AgentConfig,
  LLMResponse,
  AgentMessage,
  ToolCall,
} from './types';
import { TOOL_DESCRIPTIONS } from './prompts';

/**
 * Unified LLM client supporting OpenAI, Anthropic, Kimi, and custom OpenAI-compatible endpoints.
 */
export class LLMClient {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Call the LLM with messages and tools, returning a structured response.
   */
  async chat(messages: AgentMessage[]): Promise<LLMResponse> {
    switch (this.config.provider) {
      case 'anthropic':
        return this.callAnthropic(messages);
      case 'openai':
      case 'kimi':
      case 'custom':
      default:
        return this.callOpenAICompatible(messages);
    }
  }

  /**
   * Call OpenAI-compatible API (works for OpenAI, Kimi, and custom endpoints).
   */
  private async callOpenAICompatible(messages: AgentMessage[]): Promise<LLMResponse> {
    const endpoint = this.getEndpoint();

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: messages.map((m) => this.formatOpenAIMessage(m)),
      tools: TOOL_DESCRIPTIONS,
      tool_choice: 'auto',
      temperature: this.config.temperature ?? 0.3,
      max_tokens: this.config.maxTokens ?? 4096,
    };

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    const message = choice.message;

    return {
      content: message.content,
      toolCalls: (message.tool_calls || []).map((tc: Record<string, unknown>) => ({
        id: tc.id as string,
        type: 'function' as const,
        function: tc.function as { name: string; arguments: string },
      })),
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      cachedTokens: data.usage?.prompt_tokens_details?.cached_tokens || 0,
      finishReason: choice.finish_reason,
    };
  }

  /**
   * Call Anthropic Claude API.
   */
  private async callAnthropic(messages: AgentMessage[]): Promise<LLMResponse> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const anthropicMessages = nonSystemMessages.map((m) =>
      this.formatAnthropicMessage(m)
    );

    const tools = TOOL_DESCRIPTIONS.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));

    const body: Record<string, unknown> = {
      model: this.config.model,
      max_tokens: this.config.maxTokens ?? 4096,
      temperature: this.config.temperature ?? 0.3,
      system: systemMessage?.content || '',
      messages: anthropicMessages,
      tools,
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${error}`);
    }

    const data = await response.json();

    // Parse Anthropic response format
    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const block of data.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }

    return {
      content: content || null,
      toolCalls,
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      cachedTokens: data.usage?.cache_read_input_tokens || 0,
      finishReason: data.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
    };
  }

  private formatOpenAIMessage(message: AgentMessage): Record<string, unknown> {
    const formatted: Record<string, unknown> = {
      role: message.role,
      content: message.content,
    };

    if (message.name) {
      formatted.name = message.name;
    }
    if (message.tool_call_id) {
      formatted.tool_call_id = message.tool_call_id;
    }
    if (message.tool_calls) {
      formatted.tool_calls = message.tool_calls;
    }

    return formatted;
  }

  private formatAnthropicMessage(message: AgentMessage): Record<string, unknown> {
    if (message.role === 'tool') {
      return {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: message.tool_call_id,
            content: message.content,
          },
        ],
      };
    }

    if (message.role === 'assistant' && message.tool_calls?.length) {
      const content: Array<Record<string, unknown>> = [];
      if (message.content) {
        content.push({ type: 'text', text: message.content });
      }
      for (const tc of message.tool_calls) {
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        });
      }
      return { role: 'assistant', content };
    }

    return {
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content,
    };
  }

  private getEndpoint(): string {
    if (this.config.endpoint) {
      return this.config.endpoint.replace(/\/+$/, '');
    }

    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'kimi':
        return 'https://api.moonshot.cn/v1';
      case 'custom':
        throw new Error('Custom provider requires an endpoint');
      default:
        return 'https://api.openai.com/v1';
    }
  }
}
