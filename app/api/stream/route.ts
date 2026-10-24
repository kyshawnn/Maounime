import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing video URL', { status: 400 });
  }

  try {
    // If storages.sokuja.uk was passed, resolve to storages.sokuja.id
    const finalUrl = targetUrl.replace('storages.sokuja.uk', 'storages.sokuja.id');

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      'Referer': 'https://x6.sokuja.uk/',
    };

    // Forward range header if present for smooth seeking
    const range = req.headers.get('range');
    if (range) {
      headers['Range'] = range;
    }

    const upstreamRes = await fetch(finalUrl, {
      headers,
    });

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', upstreamRes.headers.get('content-type') || 'video/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    if (upstreamRes.headers.get('content-length')) {
      responseHeaders.set('Content-Length', upstreamRes.headers.get('content-length')!);
    }
    if (upstreamRes.headers.get('content-range')) {
      responseHeaders.set('Content-Range', upstreamRes.headers.get('content-range')!);
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Stream proxy error:', error);
    return new NextResponse('Error streaming video', { status: 500 });
  }
}
