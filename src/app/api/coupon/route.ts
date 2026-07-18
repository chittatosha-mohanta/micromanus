import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { addCredits } from '@/services/credits';
import { z } from 'zod';

const VALID_COUPONS: Record<string, number> = {
  SID_DRDROID: 5,
};

const couponSchema = z.object({
  code: z.string().min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = couponSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    const { code } = parsed.data;
    const normalizedCode = code.toUpperCase().trim();

    // Check if coupon is valid
    const creditsToAdd = VALID_COUPONS[normalizedCode];
    if (!creditsToAdd) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    // Check if already redeemed by this user
    const existing = await prisma.couponRedemption.findUnique({
      where: {
        userId_couponCode: {
          userId: user.id,
          couponCode: normalizedCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already redeemed this coupon' },
        { status: 409 }
      );
    }

    // Redeem coupon
    await prisma.couponRedemption.create({
      data: {
        userId: user.id,
        couponCode: normalizedCode,
        creditsAdded: creditsToAdd,
      },
    });

    // Add credits
    const newBalance = await addCredits(
      user.id,
      creditsToAdd,
      'COUPON',
      `Coupon ${normalizedCode}: +${creditsToAdd} credits`
    );

    return NextResponse.json({
      success: true,
      creditsAdded: creditsToAdd,
      newBalance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Coupon redemption failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
