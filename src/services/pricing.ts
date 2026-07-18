import prisma from '@/lib/prisma';

// Default pricing per million tokens (in USD)
const DEFAULT_PRICING: Record<string, {
  inputPrice: number;
  outputPrice: number;
  cachePrice: number;
  displayName: string;
}> = {
  'openai:gpt-4o': {
    inputPrice: 2.50,
    outputPrice: 10.00,
    cachePrice: 1.25,
    displayName: 'GPT-4o',
  },
  'openai:gpt-4o-mini': {
    inputPrice: 0.15,
    outputPrice: 0.60,
    cachePrice: 0.075,
    displayName: 'GPT-4o Mini',
  },
  'openai:gpt-4.1': {
    inputPrice: 2.00,
    outputPrice: 8.00,
    cachePrice: 0.50,
    displayName: 'GPT-4.1',
  },
  'openai:gpt-4.1-mini': {
    inputPrice: 0.40,
    outputPrice: 1.60,
    cachePrice: 0.10,
    displayName: 'GPT-4.1 Mini',
  },
  'openai:gpt-4.1-nano': {
    inputPrice: 0.10,
    outputPrice: 0.40,
    cachePrice: 0.025,
    displayName: 'GPT-4.1 Nano',
  },
  'openai:o3': {
    inputPrice: 2.00,
    outputPrice: 8.00,
    cachePrice: 0.50,
    displayName: 'o3',
  },
  'openai:o3-mini': {
    inputPrice: 1.10,
    outputPrice: 4.40,
    cachePrice: 0.275,
    displayName: 'o3 Mini',
  },
  'openai:o4-mini': {
    inputPrice: 1.10,
    outputPrice: 4.40,
    cachePrice: 0.275,
    displayName: 'o4 Mini',
  },
  'anthropic:claude-sonnet-4-20250514': {
    inputPrice: 3.00,
    outputPrice: 15.00,
    cachePrice: 0.30,
    displayName: 'Claude Sonnet 4',
  },
  'anthropic:claude-opus-4-20250514': {
    inputPrice: 15.00,
    outputPrice: 75.00,
    cachePrice: 1.50,
    displayName: 'Claude Opus 4',
  },
  'anthropic:claude-3-5-haiku-20241022': {
    inputPrice: 0.80,
    outputPrice: 4.00,
    cachePrice: 0.08,
    displayName: 'Claude 3.5 Haiku',
  },
  'kimi:kimi-k2': {
    inputPrice: 0.60,
    outputPrice: 2.00,
    cachePrice: 0.15,
    displayName: 'Kimi K2',
  },
};

export interface PricingResult {
  inputCost: number;
  outputCost: number;
  cacheCost: number;
  totalCost: number;
  creditsUsed: number;
}

/**
 * Calculate the cost of a request based on token usage.
 * Prices are per million tokens. We convert to per-token cost.
 * 1 credit = $1 USD equivalent
 */
export async function calculateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  cachedTokens: number = 0
): Promise<PricingResult> {
  const key = `${provider}:${model}`;

  // Try database first
  let pricing = await prisma.modelPricing.findFirst({
    where: { provider, model, isActive: true },
  });

  // Fall back to defaults
  const defaultPricing = DEFAULT_PRICING[key];

  const inputPricePerToken = pricing
    ? pricing.inputPricePerToken
    : defaultPricing
    ? defaultPricing.inputPrice / 1_000_000
    : 0.001 / 1000; // Fallback: $0.001 per 1K tokens

  const outputPricePerToken = pricing
    ? pricing.outputPricePerToken
    : defaultPricing
    ? defaultPricing.outputPrice / 1_000_000
    : 0.002 / 1000;

  const cachePricePerToken = pricing
    ? pricing.cachePricePerToken
    : defaultPricing
    ? defaultPricing.cachePrice / 1_000_000
    : 0;

  const inputCost = promptTokens * inputPricePerToken;
  const outputCost = completionTokens * outputPricePerToken;
  const cacheCost = cachedTokens * cachePricePerToken;
  const totalCost = inputCost + outputCost + cacheCost;

  // 1 credit = $1 USD
  const creditsUsed = totalCost;

  return {
    inputCost,
    outputCost,
    cacheCost,
    totalCost,
    creditsUsed,
  };
}

/**
 * Get all available models with their pricing.
 */
export async function getAvailableModels() {
  const dbModels = await prisma.modelPricing.findMany({
    where: { isActive: true },
    orderBy: { provider: 'asc' },
  });

  if (dbModels.length > 0) {
    return dbModels.map((m) => ({
      provider: m.provider,
      model: m.model,
      displayName: m.displayName,
      inputPrice: m.inputPricePerToken * 1_000_000,
      outputPrice: m.outputPricePerToken * 1_000_000,
      cachePrice: m.cachePricePerToken * 1_000_000,
    }));
  }

  // Return defaults
  return Object.entries(DEFAULT_PRICING).map(([key, value]) => {
    const [provider, model] = key.split(':');
    return {
      provider,
      model,
      displayName: value.displayName,
      inputPrice: value.inputPrice,
      outputPrice: value.outputPrice,
      cachePrice: value.cachePrice,
    };
  });
}

/**
 * Seed default pricing into the database.
 */
export async function seedDefaultPricing() {
  for (const [key, value] of Object.entries(DEFAULT_PRICING)) {
    const [provider, model] = key.split(':');
    await prisma.modelPricing.upsert({
      where: { provider_model: { provider, model } },
      update: {
        displayName: value.displayName,
        inputPricePerToken: value.inputPrice / 1_000_000,
        outputPricePerToken: value.outputPrice / 1_000_000,
        cachePricePerToken: value.cachePrice / 1_000_000,
      },
      create: {
        provider,
        model,
        displayName: value.displayName,
        inputPricePerToken: value.inputPrice / 1_000_000,
        outputPricePerToken: value.outputPrice / 1_000_000,
        cachePricePerToken: value.cachePrice / 1_000_000,
      },
    });
  }
}
