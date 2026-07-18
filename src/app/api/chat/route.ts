import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { AgentExecutor } from '@/agents/executor';
import { createToolRegistry } from '@/tools';
import { decrypt } from '@/services/encryption';
import { getCreditBalance, deductCredits } from '@/services/credits';
import { calculateCost } from '@/services/pricing';
import { generatePromptHash, getCachedResponse, setCachedResponse } from '@/services/cache';
import { checkRateLimit } from '@/services/cache';
import { AgentConfig, AgentMessage, StreamEvent, ThinkingStep, Citation } from '@/agents/types';
import { z } from 'zod';

const chatRequestSchema = z.object({
  chatId: z.string().uuid(),
  message: z.string().min(1).max(10000),
  model: z.string().optional(),
  provider: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate Limit ───────────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(user.id, 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // ── Parse & Validate ─────────────────────────────────────────────────────
    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { chatId, message, model: requestModel, provider: requestProvider } = parsed.data;

    // ── Credits Check ────────────────────────────────────────────────────────
    const credits = await getCreditBalance(user.id);
    if (!credits.hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits.' },
        { status: 402 }
      );
    }

    // ── Get API Key ──────────────────────────────────────────────────────────
    const provider = requestProvider || 'openai';
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        userId: user.id,
        provider: provider.toUpperCase() as 'OPENAI' | 'ANTHROPIC' | 'KIMI' | 'CUSTOM',
        isActive: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key found for ${provider}. Please add one in Settings.` },
        { status: 400 }
      );
    }

    const decryptedKey = decrypt(apiKey.encryptedKey);
    const model = requestModel || apiKey.model || 'gpt-4o';

    // ── Check Cache ──────────────────────────────────────────────────────────
    const promptHash = generatePromptHash(message, model);
    const cached = await getCachedResponse(promptHash);

    if (cached) {
      // Save cached message to database
      await prisma.message.create({
        data: {
          chatId,
          role: 'USER',
          content: message,
        },
      });

      await prisma.message.create({
        data: {
          chatId,
          role: 'ASSISTANT',
          content: cached.response,
          promptTokens: cached.inputTokens,
          completionTokens: cached.outputTokens,
          cachedTokens: cached.cacheTokens,
          cost: 0, // Cached responses are free
        },
      });

      return NextResponse.json({
        response: cached.response,
        cached: true,
        tokens: {
          prompt: cached.inputTokens,
          completion: cached.outputTokens,
          cached: cached.cacheTokens,
        },
      });
    }

    // ── Save User Message ────────────────────────────────────────────────────
    await prisma.message.create({
      data: {
        chatId,
        role: 'USER',
        content: message,
      },
    });

    // ── Load Conversation History ────────────────────────────────────────────
    const previousMessages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 50, // Last 50 messages for context
    });

    const conversationHistory: AgentMessage[] = previousMessages
      .filter((m) => m.role !== 'TOOL' && m.role !== 'SYSTEM')
      .slice(0, -1) // Exclude the message we just saved
      .map((m) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
      }));

    // ── Setup Streaming ──────────────────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const tools = createToolRegistry(user.id, chatId);

        const agentConfig: AgentConfig = {
          provider: provider as 'openai' | 'anthropic' | 'kimi' | 'custom',
          model,
          apiKey: decryptedKey,
          endpoint: apiKey.endpoint || undefined,
          maxIterations: 10,
          temperature: 0.3,
          maxTokens: 4096,
        };

        const onEvent = (event: StreamEvent) => {
          const sseData = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        };

        const agent = new AgentExecutor(agentConfig, tools, onEvent);

        try {
          const result = await agent.execute(message, conversationHistory);

          // ── Save Assistant Message ───────────────────────────────────────
          const pricing = await calculateCost(
            provider,
            model,
            result.promptTokens,
            result.completionTokens,
            result.cachedTokens
          );

          await prisma.message.create({
            data: {
              chatId,
              role: 'ASSISTANT',
              content: result.response,
              thinkingSteps: result.thinkingSteps as any,
              citations: result.citations as any,
              promptTokens: result.promptTokens,
              completionTokens: result.completionTokens,
              cachedTokens: result.cachedTokens,
              cost: pricing.totalCost,
            },
          });

          // ── Update Chat Stats ──────────────────────────────────────────
          await prisma.chat.update({
            where: { id: chatId },
            data: {
              model,
              provider,
              totalTokens: {
                increment: result.promptTokens + result.completionTokens,
              },
              totalCost: { increment: pricing.totalCost },
            },
          });

          // ── Log Usage ──────────────────────────────────────────────────
          await prisma.usageLog.create({
            data: {
              userId: user.id,
              chatId,
              model,
              provider,
              promptTokens: result.promptTokens,
              completionTokens: result.completionTokens,
              cachedTokens: result.cachedTokens,
              cost: pricing.totalCost,
            },
          });

          // ── Deduct Credits ─────────────────────────────────────────────
          if (pricing.creditsUsed > 0) {
            await deductCredits(
              user.id,
              pricing.creditsUsed,
              `Chat ${chatId}: ${model} - ${result.promptTokens + result.completionTokens} tokens`
            );
          }

          // ── Cache Response ─────────────────────────────────────────────
          await setCachedResponse(promptHash, {
            response: result.response,
            inputTokens: result.promptTokens,
            outputTokens: result.completionTokens,
            cacheTokens: result.cachedTokens,
            model,
            timestamp: Date.now(),
          });

          // Auto-title the chat if it's the first message
          if (previousMessages.length <= 1) {
            const title = message.substring(0, 80) + (message.length > 80 ? '...' : '');
            await prisma.chat.update({
              where: { id: chatId },
              data: { title },
            });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Agent execution failed';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', data: errorMsg })}\n\n`)
          );
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
