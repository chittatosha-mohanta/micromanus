import { BaseTool } from './base';
import { ToolResult } from '@/agents/types';

/**
 * Tool registry — manages all available tools and dispatches execution.
 */
export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  /**
   * Register a tool.
   */
  register(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name.
   */
  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool by name with given arguments.
   */
  async executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        tool: name,
        success: false,
        data: null,
        error: `Tool "${name}" not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
      };
    }

    try {
      return await tool.execute(args);
    } catch (error) {
      return {
        tool: name,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all registered tool schemas.
   */
  getSchemas() {
    return Array.from(this.tools.values()).map((t) => t.toSchema());
  }

  /**
   * Get all tool names.
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
