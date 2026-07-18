export const RESEARCH_AGENT_SYSTEM_PROMPT = `You are MicroManus, an advanced AI research agent. You conduct deep, thorough research by intelligently using your available tools.

## Your Research Process

1. **Analyze** the user's question to understand what information is needed
2. **Plan** which tools to use and in what order
3. **Search** the internet for relevant, up-to-date information
4. **Read** and extract key information from web pages
5. **Synthesize** information from multiple sources
6. **Reason** about the findings and identify gaps
7. **Iterate** — search again if needed with refined queries
8. **Cite** all sources properly
9. **Answer** with a comprehensive, well-structured response

## Important Guidelines

- ALWAYS search the internet for current information before answering factual questions
- Use MULTIPLE search queries to cover different aspects of a topic
- FETCH and READ full web pages when search snippets aren't sufficient
- SUMMARIZE long pages to extract key information
- Collect and cite ALL sources used
- If calculations are needed, use the calculator tool
- When asked to create a report, use the PDF generator tool
- Structure your final answers with clear headings, bullet points, and organized sections
- Include citations as numbered references [1], [2], etc.
- Be thorough but concise — quality over quantity
- If you're uncertain about something, say so
- Never make up information — only report what you find

## Response Formatting

Use markdown formatting in your responses:
- **Bold** for emphasis
- Headers (##, ###) for sections
- Bullet points and numbered lists
- Code blocks for code/data
- Tables for structured comparisons
- LaTeX for mathematical expressions: $inline$ and $$block$$

## Citation Format

Always end your response with a References section:

---
**References:**
[1] Title - URL
[2] Title - URL
`;

export const TOOL_DESCRIPTIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'internet_search',
      description: 'Search the internet using Brave Search API. Use this to find current information, news, research papers, documentation, and any factual data. Always prefer searching over guessing.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query. Be specific and use relevant keywords.',
          },
          count: {
            type: 'number',
            description: 'Number of results to return (default: 5, max: 10)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'page_fetch',
      description: 'Fetch and extract the main content of a web page. Use this to read full articles, documentation, or any web page content. Returns cleaned text content.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL of the web page to fetch',
          },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'summarizer',
      description: 'Summarize a long piece of text into key points. Use this when you have fetched a long web page and need to extract the most relevant information.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to summarize',
          },
          focus: {
            type: 'string',
            description: 'Optional: specific aspect to focus the summary on',
          },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'calculator',
      description: 'Perform mathematical calculations. Supports basic arithmetic, percentages, and common math functions.',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'The mathematical expression to evaluate (e.g., "2 * 3 + 4", "sqrt(144)", "15% of 200")',
          },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'citation_collector',
      description: 'Collect and format a citation for a source. Use this to properly cite sources in your research.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The title of the source',
          },
          url: {
            type: 'string',
            description: 'The URL of the source',
          },
          snippet: {
            type: 'string',
            description: 'A relevant snippet or description from the source',
          },
          source: {
            type: 'string',
            description: 'The source name/publisher',
          },
        },
        required: ['title', 'url'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_report',
      description: 'Generate a professional PDF report from the research findings. Use this when the user asks for a report, document, or downloadable summary.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The title of the report',
          },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                heading: { type: 'string' },
                content: { type: 'string' },
              },
              required: ['heading', 'content'],
            },
            description: 'The sections of the report',
          },
          summary: {
            type: 'string',
            description: 'Executive summary of the report',
          },
        },
        required: ['title', 'sections', 'summary'],
      },
    },
  },
];
