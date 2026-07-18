import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert user in our database
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
          avatarUrl: data.user.user_metadata?.avatar_url || null,
        },
        create: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
          avatarUrl: data.user.user_metadata?.avatar_url || null,
          credits: 0,
        },
      });

      // Create default settings
      await prisma.settings.upsert({
        where: { userId: data.user.id },
        update: {},
        create: {
          userId: data.user.id,
          theme: 'dark',
        },
      });

      // Check if user has credits
      const user = await prisma.user.findUnique({
        where: { id: data.user.id },
        select: { credits: true },
      });

      if (!user || user.credits <= 0) {
        return NextResponse.redirect(new URL('/paywall', requestUrl.origin));
      }

      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }
  }

  // Auth error — redirect to auth page
  return NextResponse.redirect(new URL('/auth?error=auth_failed', requestUrl.origin));
}
