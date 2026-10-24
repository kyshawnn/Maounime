import Link from 'next/link';
import { Search, Star } from 'lucide-react';
import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import { getHomeData, AnimeCard } from '@/lib/sokuja';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { featuredList, latest } = await getHomeData();

  // Deduplicate strictly by anime identity to guarantee no duplicates in Home TERBARU
  const seenAnime = new Set<string>();
  const uniqueLatest: AnimeCard[] = [];
  for (const item of latest) {
    const k = (item.animeSlug || item.title).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenAnime.has(k)) {
      seenAnime.add(k);
      uniqueLatest.push(item);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col antialiased">
      {/* --- Top Edge-to-Edge Hero Banner (Flush with Top, Left & Right screen edges) --- */}
      <section className="w-full">
        <HomeHeroCarousel items={featuredList} />
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-4 pb-16">
        {/* --- Search Pill Bar directly below Hero Carousel --- */}
        <section className="mt-4 mb-6">
          <Link
            href="/search"
            prefetch={true}
            className="w-full flex items-center gap-3.5 rounded-full bg-[#151619] hover:bg-[#1f2024] active:scale-99 border border-neutral-800/80 px-5 py-3.5 text-neutral-400 hover:text-white transition shadow-sm group"
          >
            <Search className="w-4 h-4 text-neutral-400 group-hover:text-white transition shrink-0" />
            <span className="text-xs sm:text-sm font-normal text-neutral-400 group-hover:text-neutral-200 transition">
              Cari anime..
            </span>
          </Link>
        </section>

        {/* --- Section Ongoing (Strictly from Sokuja Ongoing Series) --- */}
        <section>
          <div className="mb-3.5">
            <h2 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase">
              Ongoing
            </h2>
          </div>

          {/* 3-Column Grid without any blur effects (solid dark cards) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            {uniqueLatest.map((item, idx) => (
              <Link
                key={`${item.slug}-${idx}`}
                href={`/detail/${item.animeSlug || item.slug}`}
                prefetch={true}
                className="group flex flex-col rounded-2xl overflow-hidden active:scale-97 transition duration-150"
              >
                {/* Card Cover (NO BLUR - solid clean dark background) */}
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#141518] border border-neutral-800/80 shadow-md">
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#18191c]" />
                  )}

                  {/* Top-Right Star Badge (Flush nempel di pojok kanan atas) */}
                  <div className="absolute top-0 right-0 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-bl-lg bg-black/90 border-l border-b border-neutral-700/60 text-[10px] sm:text-[11px] font-bold text-white shadow">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{item.score || '8.0'}</span>
                  </div>

                  {/* Bottom-Left Eps Badge (Tanpa background) */}
                  <div className="absolute bottom-1.5 left-2 z-10 text-[10px] sm:text-xs font-bold text-white tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                    {item.episode || 'Eps 1'}
                  </div>
                </div>

                {/* Judul below cover (Strictly 2 lines max with ellipsis, no 3rd line visible) */}
                <div className="pt-2 px-1 max-h-[2.6rem] overflow-hidden">
                  <h3 className="text-xs sm:text-sm font-semibold text-neutral-200 group-hover:text-white transition line-clamp-2 leading-[1.3] overflow-hidden text-ellipsis">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
