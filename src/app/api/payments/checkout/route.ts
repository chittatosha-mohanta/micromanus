import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/services/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const tier = body.tier || 'STARTER';

    if (!['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const checkoutUrl = await createCheckoutSession(user.id, user.email!, tier as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE');

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
