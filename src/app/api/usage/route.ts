import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const days = parseInt(period, 10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get usage logs for period
    const usageLogs = await prisma.usageLog.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate data
    const totalCost = usageLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalPromptTokens = usageLogs.reduce((sum, log) => sum + log.promptTokens, 0);
    const totalCompletionTokens = usageLogs.reduce((sum, log) => sum + log.completionTokens, 0);
    const totalCachedTokens = usageLogs.reduce((sum, log) => sum + log.cachedTokens, 0);
    const totalRequests = usageLogs.length;

    // Daily usage breakdown
    const dailyUsage = new Map<string, { cost: number; tokens: number; requests: number }>();
    for (const log of usageLogs) {
      const day = log.createdAt.toISOString().split('T')[0];
      const existing = dailyUsage.get(day) || { cost: 0, tokens: 0, requests: 0 };
      existing.cost += log.cost;
      existing.tokens += log.promptTokens + log.completionTokens;
      existing.requests += 1;
      dailyUsage.set(day, existing);
    }

    // Model usage breakdown
    const modelUsage = new Map<string, { cost: number; tokens: number; requests: number }>();
    for (const log of usageLogs) {
      const key = `${log.provider}:${log.model}`;
      const existing = modelUsage.get(key) || { cost: 0, tokens: 0, requests: 0 };
      existing.cost += log.cost;
      existing.tokens += log.promptTokens + log.completionTokens;
      existing.requests += 1;
      modelUsage.set(key, existing);
    }

    // Chat cost breakdown
    const chatCosts = await prisma.chat.findMany({
      where: {
        userId: user.id,
        totalCost: { gt: 0 },
      },
      orderBy: { totalCost: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        model: true,
        totalTokens: true,
        totalCost: true,
      },
    });

    // User credit info
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    return NextResponse.json({
      summary: {
        totalCost,
        totalPromptTokens,
        totalCompletionTokens,
        totalCachedTokens,
        totalRequests,
        creditsRemaining: userData?.credits || 0,
      },
      dailyUsage: Array.from(dailyUsage.entries()).map(([date, data]) => ({
        date,
        ...data,
      })),
      modelUsage: Array.from(modelUsage.entries()).map(([model, data]) => ({
        model,
        ...data,
      })),
      topChats: chatCosts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
