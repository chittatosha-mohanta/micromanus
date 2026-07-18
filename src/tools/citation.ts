import { BaseTool } from './base';
import { ToolResult } from '@/agents/types';

/**
 * Citation Collector Tool — collects and formats research citations.
 */
export class CitationTool extends BaseTool {
  name = 'citation_collector';
  description = 'Collect and format a citation for a research source.';

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const title = args.title as string;
    const url = args.url as string;
    const snippet = (args.snippet as string) || '';
    const source = (args.source as string) || new URL(url).hostname;

    if (!title || !url) {
      return {
        tool: this.name,
        success: false,
        data: null,
        error: 'Title and URL are required',
      };
    }

    const citation = {
      title,
      url,
      snippet,
      source,
      accessedAt: new Date().toISOString(),
    };

    return {
      tool: this.name,
      success: true,
      data: citation,
    };
  }

  getParameterSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Source title' },
        url: { type: 'string', description: 'Source URL' },
        snippet: { type: 'string', description: 'Relevant snippet' },
        source: { type: 'string', description: 'Publisher/source name' },
      },
      required: ['title', 'url'],
    };
  }
}
