import { NextResponse } from 'next/server';
import { getAvailableModels } from '@/services/pricing';

export async function GET() {
  try {
    const models = await getAvailableModels();
    return NextResponse.json(models);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
