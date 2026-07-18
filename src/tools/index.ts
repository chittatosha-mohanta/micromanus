import { ToolRegistry } from './registry';
import { InternetSearchTool } from './internet-search';
import { PageFetchTool } from './page-fetch';
import { SummarizerTool } from './summarizer';
import { CitationTool } from './citation';
import { CalculatorTool } from './calculator';
import { PDFGeneratorTool } from './pdf-generator';

/**
 * Create a fully configured tool registry for a given user and chat.
 */
export function createToolRegistry(userId: string, chatId: string): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register(new InternetSearchTool());
  registry.register(new PageFetchTool());
  registry.register(new SummarizerTool());
  registry.register(new CitationTool());
  registry.register(new CalculatorTool());
  registry.register(new PDFGeneratorTool(userId, chatId));

  return registry;
}
