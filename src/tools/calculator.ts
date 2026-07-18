import { BaseTool } from './base';
import { ToolResult } from '@/agents/types';
import { evaluate } from 'mathjs';

/**
 * Calculator Tool — safely evaluates mathematical expressions.
 */
export class CalculatorTool extends BaseTool {
  name = 'calculator';
  description = 'Perform mathematical calculations safely.';

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const expression = args.expression as string;

    if (!expression) {
      return {
        tool: this.name,
        success: false,
        data: null,
        error: 'Expression is required',
      };
    }

    try {
      // Handle percentage expressions (e.g., "15% of 200")
      let normalizedExpr = expression
        .replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/gi, '($1 / 100) * $2')
        .replace(/(\d+(?:\.\d+)?)\s*%/g, '($1 / 100)');

      const result = evaluate(normalizedExpr);

      return {
        tool: this.name,
        success: true,
        data: {
          expression,
          result: typeof result === 'object' ? result.toString() : result,
        },
      };
    } catch (error) {
      return {
        tool: this.name,
        success: false,
        data: null,
        error: `Calculation error: ${error instanceof Error ? error.message : 'Invalid expression'}`,
      };
    }
  }

  getParameterSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate',
        },
      },
      required: ['expression'],
    };
  }
}
