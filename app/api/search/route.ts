import { NextRequest, NextResponse } from 'next/server';
import { searchAnime } from '@/lib/sokuja';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchAnime(q);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('API search error:', error);
    return NextResponse.json({ results: [], error: 'Gagal mencari anime' }, { status: 500 });
  }
}
