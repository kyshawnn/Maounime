import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CachedImage {
  buffer: Uint8Array;
  contentType: string;
  expires: number;
}

// In-memory image cache (max 400 items, 24 hours TTL)
const imageCache = new Map<string, CachedImage>();
const MAX_CACHE_ITEMS = 400;

// Limit concurrency to avoid hitting Sokuja rate-limits
let activeImageFetches = 0;
const MAX_CONCURRENT_FETCHES = 14;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeImageFetches < MAX_CONCURRENT_FETCHES) {
    activeImageFetches++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waitQueue.push(() => {
      activeImageFetches++;
      resolve();
    });
  });
}

function releaseSlot() {
  activeImageFetches--;
  if (waitQueue.length > 0) {
    const next = waitQueue.shift();
    if (next) next();
  }
}

// Check local public assets directory for direct fallbacks (e.g. one piece cover)
function getLocalFallback(targetUrl: string): { buffer: Uint8Array; contentType: string } | null {
  try {
    const rawFilename = targetUrl.split('/').pop()?.split('?')[0] || '';
    const filename = decodeURIComponent(rawFilename).toLowerCase();
    
    if (filename) {
      let targetFile = filename;
      if (filename.includes('one-piece') || filename.includes('one_piece') || targetUrl.toLowerCase().includes('one-piece')) {
        if (filename.includes('fishman') || filename.includes('gyojin')) {
          targetFile = 'sokuja-one-piece-fishman-island-1.jpg';
        } else if (filename.includes('fan-letter') || filename.includes('fan_letter')) {
          targetFile = 'sokuja-one-piece-fan-letter.jpg';
        } else if (filename.includes('red')) {
          targetFile = 'one.piece_.red_.film_.jpg';
        } else {
          targetFile = 'sokuja-one-piece-indo.jpg';
        }
      }

      const localPath = path.join(process.cwd(), 'public', 'assets', targetFile);
      if (fs.existsSync(localPath)) {
        const fileBuf = fs.readFileSync(localPath);
        const ext = path.extname(targetFile).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        return { buffer: new Uint8Array(fileBuf), contentType };
      }
    }
  } catch {}
  return null;
}

function getNeutralBlankSvg(): NextResponse {
  // Plain dark slate rectangle - no AI, no text, no placeholder markings
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" fill="#141518"><rect width="400" height="600" fill="#141518"/></svg>`;
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  // 1. Check in-memory cache first
  const cached = imageCache.get(targetUrl);
  if (cached && Date.now() < cached.expires) {
    return new NextResponse(cached.buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
      },
    });
  }

  // 2. Check local pre-cached assets (guarantees One Piece & popular covers never fail)
  const localMatch = getLocalFallback(targetUrl);
  if (localMatch) {
    imageCache.set(targetUrl, {
      buffer: localMatch.buffer,
      contentType: localMatch.contentType,
      expires: Date.now() + 24 * 60 * 60 * 1000,
    });
    return new NextResponse(localMatch.buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': localMatch.contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
      },
    });
  }

  await acquireSlot();

  try {
    let fetchUrl = targetUrl;

    // Properly route sokuja.uk domains (x6.sokuja.uk, gbr.sokuja.uk) through translate.goog
    if (fetchUrl.includes('translate.goog')) {
      // Already routed through Google Translate proxy, do not double-wrap!
    } else if (fetchUrl.includes('sokuja.uk')) {
      try {
        const u = new URL(fetchUrl);
        const host = u.hostname;
        const sub = host.split('.')[0] || 'x6';
        const sep = u.search ? (u.search.includes('?') ? '&' : '?') : '?';
        const searchSuffix = '_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=zh-TW';
        fetchUrl = `https://${sub}-sokuja-uk.translate.goog${u.pathname}${u.search ? u.search + '&' : '?'}${searchSuffix}`;
      } catch {}
    }

    let res: Response | null = null;
    try {
      res = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://x6.sokuja.uk/',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch {}

    // Fallback: direct fetch if proxy failed
    if ((!res || !res.ok) && fetchUrl !== targetUrl) {
      try {
        res = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://x6.sokuja.uk/',
            'Accept': 'image/*,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(6000),
        });
      } catch {}
    }

    if (!res || !res.ok) {
      if (cached) {
        return new NextResponse(cached.buffer as unknown as BodyInit, {
          headers: {
            'Content-Type': cached.contentType,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
      return getNeutralBlankSvg();
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Save in cache
    if (imageCache.size >= MAX_CACHE_ITEMS) {
      const firstKey = imageCache.keys().next().value;
      if (firstKey) imageCache.delete(firstKey);
    }
    imageCache.set(targetUrl, {
      buffer,
      contentType,
      expires: Date.now() + 24 * 60 * 60 * 1000,
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    if (cached) {
      return new NextResponse(cached.buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
    return getNeutralBlankSvg();
  } finally {
    releaseSlot();
  }
}
