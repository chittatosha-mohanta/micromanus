import { BaseTool } from './base';
import { ToolResult } from '@/agents/types';

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

/**
 * Internet Search Tool — uses Brave Search API to find current information.
 */
export class InternetSearchTool extends BaseTool {
  name = 'internet_search';
  description = 'Search the internet for current information using Brave Search API.';

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const query = args.query as string;
    const count = Math.min((args.count as number) || 5, 10);

    if (!query) {
      return {
        tool: this.name,
        success: false,
        data: null,
        error: 'Search query is required',
      };
    }

    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
      return {
        tool: this.name,
        success: false,
        data: null,
        error: 'Brave Search API key is not configured',
      };
    }

    try {
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('count', count.toString());
      url.searchParams.set('text_decorations', 'false');
      url.searchParams.set('search_lang', 'en');

      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status}`);
      }

      const data = await response.json();
      const results: BraveSearchResult[] = [];

      // Process web results
      if (data.web?.results) {
        for (const result of data.web.results as BraveWebResult[]) {
          results.push({
            title: result.title,
            url: result.url,
            description: result.description,
            age: result.age,
          });
        }
      }

      // Deduplicate by URL
      const seen = new Set<string>();
      const uniqueResults = results.filter((r) => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      });

      return {
        tool: this.name,
        success: true,
        data: {
          query,
          resultCount: uniqueResults.length,
          results: uniqueResults,
        },
      };
    } catch (error) {
      return {
        tool: this.name,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  getParameterSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        count: { type: 'number', description: 'Number of results (max 10)' },
      },
      required: ['query'],
    };
  }
}
