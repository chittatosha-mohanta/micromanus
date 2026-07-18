import { BaseTool } from './base';
import { ToolResult } from '@/agents/types';
import { parse } from 'node-html-parser';

/**
 * Page Fetch Tool — extracts main content from web pages.
 */
export class PageFetchTool extends BaseTool {
  name = 'page_fetch';
  description = 'Fetch and extract the main text content of a web page.';

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const url = args.url as string;

    if (!url) {
      return { tool: this.name, success: false, data: null, error: 'URL is required' };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; MicroManus/1.0; +https://micromanus.ai)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const content = this.extractContent(html, url);

      return {
        tool: this.name,
        success: true,
        data: {
          url,
          title: content.title,
          content: content.text,
          wordCount: content.text.split(/\s+/).length,
        },
      };
    } catch (error) {
      return {
        tool: this.name,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch page',
      };
    }
  }

  private extractContent(html: string, url: string): { title: string; text: string } {
    const root = parse(html);

    // Remove unwanted elements
    const removeSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      'iframe', 'noscript', '.sidebar', '.nav', '.menu',
      '.advertisement', '.ad', '.popup', '.modal', '.cookie',
      '#comments', '.comments', '.social-share',
    ];

    for (const selector of removeSelectors) {
      root.querySelectorAll(selector).forEach((el) => el.remove());
    }

    // Get title
    const titleEl = root.querySelector('title');
    const h1El = root.querySelector('h1');
    const title = h1El?.textContent?.trim() || titleEl?.textContent?.trim() || url;

    // Try to find main content
    const contentSelectors = [
      'article', 'main', '[role="main"]',
      '.post-content', '.article-content', '.entry-content',
      '.content', '#content', '.page-content',
    ];

    let mainContent = '';

    for (const selector of contentSelectors) {
      const el = root.querySelector(selector);
      if (el) {
        mainContent = this.cleanText(el.textContent);
        break;
      }
    }

    // Fallback to body
    if (!mainContent) {
      const body = root.querySelector('body');
      mainContent = body ? this.cleanText(body.textContent) : this.cleanText(root.textContent);
    }

    // Limit to ~6000 words to prevent context overflow
    const words = mainContent.split(/\s+/);
    if (words.length > 6000) {
      mainContent = words.slice(0, 6000).join(' ') + '\n\n[Content truncated]';
    }

    return { title, text: mainContent };
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\t/g, ' ')
      .trim();
  }

  getParameterSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' },
      },
      required: ['url'],
    };
  }
}
