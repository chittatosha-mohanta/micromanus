import { BaseTool } from './base';
import { ToolResult } from '@/agents/types';

/**
 * Summarizer Tool — summarizes long text into key points.
 * Uses a simple extractive approach server-side (no LLM call needed for basic summarization).
 */
export class SummarizerTool extends BaseTool {
  name = 'summarizer';
  description = 'Summarize a long text into key points and main ideas.';

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const text = args.text as string;
    const focus = args.focus as string | undefined;

    if (!text) {
      return { tool: this.name, success: false, data: null, error: 'Text is required' };
    }

    try {
      const summary = this.extractiveSummary(text, focus);

      return {
        tool: this.name,
        success: true,
        data: {
          summary,
          originalLength: text.length,
          summaryLength: summary.length,
          compressionRatio: Math.round((1 - summary.length / text.length) * 100),
        },
      };
    } catch (error) {
      return {
        tool: this.name,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Summarization failed',
      };
    }
  }

  /**
   * Extractive summarization — ranks sentences by importance and returns top ones.
   */
  private extractiveSummary(text: string, focus?: string): string {
    // Split into sentences
    const sentences = text
      .replace(/\n+/g, '. ')
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 20)
      .map((s) => s.trim());

    if (sentences.length <= 5) {
      return sentences.join(' ');
    }

    // Score sentences
    const wordFreq = new Map<string, number>();
    const allWords = text.toLowerCase().split(/\W+/).filter((w) => w.length > 3);

    // Common words to ignore
    const stopWords = new Set([
      'this', 'that', 'with', 'from', 'have', 'been', 'were', 'will',
      'would', 'could', 'should', 'their', 'there', 'they', 'which',
      'about', 'also', 'into', 'more', 'than', 'then', 'some', 'very',
      'when', 'what', 'your', 'just', 'like', 'other', 'only',
    ]);

    for (const word of allWords) {
      if (!stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    // Score each sentence
    const scored = sentences.map((sentence, index) => {
      const words = sentence.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      let score = 0;

      for (const word of words) {
        score += wordFreq.get(word) || 0;
      }

      // Normalize by sentence length
      score = words.length > 0 ? score / words.length : 0;

      // Boost first and early sentences (position bias)
      if (index < 3) score *= 1.5;
      if (index < 10) score *= 1.2;

      // Boost sentences matching focus topic
      if (focus) {
        const focusWords = focus.toLowerCase().split(/\W+/);
        for (const fw of focusWords) {
          if (sentence.toLowerCase().includes(fw)) {
            score *= 1.5;
          }
        }
      }

      return { sentence, score, index };
    });

    // Sort by score and take top sentences
    const topCount = Math.min(Math.ceil(sentences.length * 0.2), 15);
    const topSentences = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topCount)
      .sort((a, b) => a.index - b.index) // Restore original order
      .map((s) => s.sentence);

    return topSentences.join(' ');
  }

  getParameterSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to summarize' },
        focus: { type: 'string', description: 'Focus topic for the summary' },
      },
      required: ['text'],
    };
  }
}
