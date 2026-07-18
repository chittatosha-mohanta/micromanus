import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { encrypt, decrypt } from '@/services/encryption';
import { z } from 'zod';

const apiKeySchema = z.object({
  provider: z.enum(['OPENAI', 'ANTHROPIC', 'KIMI', 'CUSTOM']),
  apiKey: z.string().min(1),
  label: z.string().optional(),
  endpoint: z.string().url().optional().or(z.literal('')),
  model: z.string().optional(),
});

// GET — list API keys (masked)
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Mask keys — never expose full key to frontend
    const maskedKeys = apiKeys.map((key) => {
      const decrypted = decrypt(key.encryptedKey);
      const masked = decrypted.substring(0, 8) + '...' + decrypted.substring(decrypted.length - 4);
      return {
        id: key.id,
        provider: key.provider,
        maskedKey: masked,
        label: key.label,
        endpoint: key.endpoint,
        model: key.model,
        isActive: key.isActive,
        createdAt: key.createdAt,
      };
    });

    return NextResponse.json(maskedKeys);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST — add API key
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = apiKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { provider, apiKey, label, endpoint, model } = parsed.data;

    // Encrypt the API key
    const encryptedKey = encrypt(apiKey);

    // Deactivate existing keys for the same provider
    await prisma.apiKey.updateMany({
      where: { userId: user.id, provider },
      data: { isActive: false },
    });

    const key = await prisma.apiKey.create({
      data: {
        userId: user.id,
        provider,
        encryptedKey,
        label: label || `${provider} Key`,
        endpoint: endpoint || null,
        model: model || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: key.id,
      provider: key.provider,
      label: key.label,
      isActive: key.isActive,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add API key' },
      { status: 500 }
    );
  }
}

// DELETE — remove API key
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID required' }, { status: 400 });
    }

    await prisma.apiKey.deleteMany({
      where: { id: keyId, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
