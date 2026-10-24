'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { FeaturedAnime } from '@/lib/sokuja';

interface HomeHeroCarouselProps {
  items: FeaturedAnime[];
}

export default function HomeHeroCarousel({ items }: HomeHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] overflow-hidden select-none bg-black">
      {/* Background Images with Smooth Crossfade */}
      {items.map((item, idx) => (
        <div
          key={`${item.slug}-${idx}`}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {item.backdrop ? (
            <img
              src={item.backdrop}
              alt={item.title}
              onError={(e) => {
                const target = e.currentTarget;
                if (item.title.toLowerCase().includes('one piece')) {
                  target.src = '/assets/sokuja-one-piece-indo.jpg';
                }
              }}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-[#121316]" />
          )}
        </div>
      ))}

      {/* Dark Vignette & Gradient Overlays (flush with screen) */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-black/25 pointer-events-none" />

      {/* Centered Details at the Bottom of Hero (Matches User Screenshot) */}
      <div className="absolute inset-x-0 bottom-4 z-30 flex flex-col items-center justify-end px-4 text-center">
        {/* Title */}
        <Link
          href={`/detail/${current.slug}`}
          prefetch={true}
          className="group block mb-2.5 max-w-lg"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg group-hover:text-neutral-200 transition">
            {current.title}
          </h1>
        </Link>

        {/* Metadata Badges Row: ★ 7.2 • TV • J.C.Staff • Eps 3 (NO BLUR) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3.5 text-xs">
          {/* Rating */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 font-bold text-white shadow">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{current.rating || '8.0'}</span>
          </span>

          <span className="text-neutral-500">•</span>

          {/* Type */}
          <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 font-semibold text-neutral-300 shadow">
            {current.type || 'TV'}
          </span>

          <span className="text-neutral-500">•</span>

          {/* Studio */}
          <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 font-semibold text-neutral-300 shadow">
            {current.studio || 'Studio Animasi'}
          </span>

          <span className="text-neutral-500">•</span>

          {/* Episode */}
          <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 font-bold text-[#38bdf8] shadow">
            {current.episode || 'Eps 1'}
          </span>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? 'w-6 h-1.5 bg-[#38bdf8]'
                  : 'w-1.5 h-1.5 bg-neutral-600 hover:bg-neutral-400'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
