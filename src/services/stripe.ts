import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { addCredits } from './credits';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
  typescript: true,
});

const TIERS = {
  STARTER: { price: 500, credits: 5, name: 'Starter Plan' },
  PROFESSIONAL: { price: 7900, credits: 100, name: 'Professional Plan' },
  ENTERPRISE: { price: 23900, credits: 500, name: 'Enterprise Plan' },
};

/**
 * Create a Stripe Checkout session for credit purchase.
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' = 'STARTER'
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const plan = TIERS[tier];

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `MicroManus ${plan.name}`,
            description: `${plan.credits} research credits for AI-powered deep research`,
            images: [],
          },
          unit_amount: plan.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      credits: plan.credits.toString(),
      tier,
    },
    success_url: `${appUrl}/paywall?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/paywall?canceled=true`,
    payment_method_types: ['card'],
  });

  // Store pending payment
  await prisma.payment.create({
    data: {
      userId,
      stripeSessionId: session.id,
      amount: plan.price / 100,
      currency: 'usd',
      status: 'PENDING',
    },
  });

  return session.url!;
}

/**
 * Handle successful Stripe checkout completion.
 */
export async function handleCheckoutComplete(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;
  const credits = parseInt(session.metadata?.credits || '5', 10);

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // Check if already processed
  const existingPayment = await prisma.payment.findFirst({
    where: {
      stripeSessionId: session.id,
      status: 'SUCCEEDED',
    },
  });

  if (existingPayment) {
    console.log('Payment already processed:', session.id);
    return;
  }

  // Update payment record
  await prisma.payment.updateMany({
    where: { stripeSessionId: session.id },
    data: {
      status: 'SUCCEEDED',
      stripePaymentIntentId: session.payment_intent as string,
      creditsAdded: credits,
    },
  });

  // Add credits to user
  await addCredits(
    userId,
    credits,
    'PURCHASE',
    `Purchased ${credits} credits via Stripe`
  );
}

/**
 * Verify a checkout session.
 */
export async function verifyCheckoutSession(
  sessionId: string
): Promise<{ success: boolean; credits: number }> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      success: session.payment_status === 'paid',
      credits: parseInt(session.metadata?.credits || '0', 10),
    };
  } catch {
    return { success: false, credits: 0 };
  }
}

/**
 * Get payment history for a user.
 */
export async function getPaymentHistory(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}
