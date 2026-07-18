import { ToolResult } from '@/agents/types';

export interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Abstract base class for all tools.
 * Each tool must implement execute() and provide a schema.
 */
export abstract class BaseTool {
  abstract name: string;
  abstract description: string;

  /**
   * Execute the tool with given arguments.
   */
  abstract execute(args: Record<string, unknown>): Promise<ToolResult>;

  /**
   * Get the JSON schema for this tool's parameters.
   */
  abstract getParameterSchema(): Record<string, unknown>;

  /**
   * Convert tool to OpenAI function format.
   */
  toSchema(): ToolSchema {
    return {
      name: this.name,
      description: this.description,
      parameters: this.getParameterSchema(),
    };
  }
}
