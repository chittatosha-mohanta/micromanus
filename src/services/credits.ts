import prisma from '@/lib/prisma';
import { CreditType } from '@prisma/client';

export interface CreditBalance {
  balance: number;
  hasCredits: boolean;
}

/**
 * Get user's current credit balance.
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  const balance = user?.credits ?? 0;
  return {
    balance,
    hasCredits: balance > 0,
  };
}

/**
 * Add credits to a user's account and log the transaction.
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: CreditType,
  description?: string
): Promise<number> {
  const result = await prisma.$transaction(async (tx) => {
    // Create credit log entry
    await tx.credit.create({
      data: {
        userId,
        amount,
        type,
        description: description || `Added ${amount} credits via ${type}`,
      },
    });

    // Update user balance
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        credits: { increment: amount },
      },
    });

    return user.credits;
  });

  return result;
}

/**
 * Deduct credits from a user's account.
 * Returns the new balance or throws if insufficient.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description?: string
): Promise<number> {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits < amount) {
      throw new Error('Insufficient credits');
    }

    await tx.credit.create({
      data: {
        userId,
        amount: -amount,
        type: 'USAGE',
        description: description || `Deducted ${amount.toFixed(6)} credits`,
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: amount },
      },
    });

    return updatedUser.credits;
  });

  return result;
}

/**
 * Get credit transaction history for a user.
 */
export async function getCreditHistory(
  userId: string,
  limit: number = 50
) {
  return prisma.credit.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
