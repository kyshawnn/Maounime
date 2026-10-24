'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Star, Eye, ChevronDown, Check, Loader2, Film, X } from 'lucide-react';
import { AnimeCard } from '@/lib/sokuja';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'rating'>('popular');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [expandedSynopses, setExpandedSynopses] = useState<Record<string, boolean>>({});

  const toggleSynopsis = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSynopses((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSearched(true);
      } catch (err) {
        console.warn('Search fetch error:', err);
      } finally {
        setLoading(false);
      }
    }, query.trim() ? 250 : 0);

    return () => clearTimeout(timer);
  }, [query]);

  // Sort results based on selected option
  const sortedResults = useMemo(() => {
    const list = [...results];
    if (sortBy === 'rating') {
      list.sort((a, b) => parseFloat(String(b.score || '0')) - parseFloat(String(a.score || '0')));
    } else if (sortBy === 'latest') {
      list.sort((a, b) => (b.episodeNumber || 1) - (a.episodeNumber || 1));
    }
    return list;
  }, [results, sortBy]);

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col antialiased">
      <main className="flex-1 max-w-3xl w-full mx-auto px-3.5 sm:px-4 py-4">
        {/* --- Top Search Bar (Matches User Screenshot) --- */}
        <div className="flex items-center gap-3 mb-5">
          {/* Back button (<-) */}
          <Link
            href="/"
            prefetch={true}
            className="p-2.5 rounded-full hover:bg-[#1a1b1e] active:scale-95 text-neutral-200 hover:text-white transition shrink-0"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Search Input with Search Icon & Clear */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Anime"
              autoFocus
              className="w-full bg-[#1c1d20] border border-transparent focus:border-neutral-700 text-sm sm:text-base text-white placeholder-neutral-500 pl-11 pr-11 py-3 rounded-full focus:outline-none transition shadow-sm"
            />
            {query ? (
              <button
                onClick={clearQuery}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-white transition"
                title="Hapus pencarian"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            ) : loading ? (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
              </div>
            ) : null}
          </div>
        </div>

        {/* --- Sub-header: Hasil Pencarian (Count) & Sort Dropdown --- */}
        {searched && (
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Hasil Pencarian ({sortedResults.length})
            </h2>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white transition py-1 px-2 rounded-lg hover:bg-[#18191c]"
              >
                <span>
                  {sortBy === 'popular' ? 'Popular' : sortBy === 'rating' ? 'Rating' : 'Terbaru'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {isSortOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 z-40 w-32 rounded-xl bg-[#16171a] border border-neutral-700 p-1.5 shadow-2xl text-xs space-y-0.5 animate-in fade-in"
                >
                  <button
                    onClick={() => {
                      setSortBy('popular');
                      setIsSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                      sortBy === 'popular'
                        ? 'bg-neutral-800 text-white font-bold'
                        : 'text-neutral-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <span>Popular</span>
                    {sortBy === 'popular' && <Check className="w-3 h-3 text-[#38bdf8]" />}
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('rating');
                      setIsSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                      sortBy === 'rating'
                        ? 'bg-neutral-800 text-white font-bold'
                        : 'text-neutral-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <span>Rating</span>
                    {sortBy === 'rating' && <Check className="w-3 h-3 text-[#38bdf8]" />}
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('latest');
                      setIsSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                      sortBy === 'latest'
                        ? 'bg-neutral-800 text-white font-bold'
                        : 'text-neutral-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <span>Terbaru</span>
                    {sortBy === 'latest' && <Check className="w-3 h-3 text-[#38bdf8]" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Results Section (Vertical List matching Screenshot) --- */}
        <section>
          {loading && sortedResults.length === 0 && (
            <div className="py-24 text-center">
              <Loader2 className="w-6 h-6 text-neutral-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-neutral-400">Mencari anime sesuai kata kunci...</p>
            </div>
          )}

          {!loading && searched && sortedResults.length === 0 && (
            <div className="py-24 text-center">
              <Film className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-200">Tidak ada hasil ditemukan</p>
              <p className="text-xs text-neutral-500 mt-1">Coba gunakan kata kunci lainnya</p>
            </div>
          )}

          {sortedResults.length > 0 && (
            <div className="flex flex-col space-y-3.5">
              {sortedResults.map((item, idx) => {
                const itemKey = `${item.slug}-${idx}`;
                const isExpanded = !!expandedSynopses[itemKey];
                const synopsisText = item.synopsis || 'Nonton dan streaming anime subtitle Indonesia terlengkap dan terupdate.';
                const isLong = synopsisText.length > 110;

                return (
                  <Link
                    key={itemKey}
                    href={`/detail/${item.animeSlug || item.slug}`}
                    prefetch={true}
                    className="group flex items-start gap-3.5 sm:gap-4 p-2.5 sm:p-3 rounded-2xl bg-[#141518] hover:bg-[#1a1b1f] border border-neutral-800/80 hover:border-neutral-700 transition active:scale-[0.99]"
                  >
                    {/* Left Column: Poster with Star Badge and Episode Badge (NO BLUR) */}
                    <div className="relative w-28 sm:w-32 aspect-[3/4] shrink-0 rounded-xl overflow-hidden bg-[#1c1d20]">
                      {item.cover ? (
                        <img
                          src={item.cover}
                          alt={item.title}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (item.title.toLowerCase().includes('one piece')) {
                              target.src = '/assets/sokuja-one-piece-indo.jpg';
                            }
                          }}
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

                      {/* Bottom-Left Episode Badge (Tanpa background) */}
                      <div className="absolute bottom-1.5 left-2 z-10 text-[10px] sm:text-xs font-bold text-white tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                        {item.episode || 'Eps 1'}
                      </div>
                    </div>

                    {/* Right Column: Title, Subtitle, Views, and Synopsis Snippet */}
                    <div className="flex-1 min-w-0 flex flex-col justify-start pt-0.5">
                      {/* Main Title (Dua Baris) */}
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#38bdf8] transition line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      {/* Subtitle / Alternate Title (if available and different) */}
                      {item.subTitle && item.subTitle !== item.title ? (
                        <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                          {item.subTitle}
                        </p>
                      ) : null}

                      {/* Views Count */}
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                        <Eye className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{item.views || '1.2M views'}</span>
                      </div>

                      {/* Synopsis Snippet with Baca Selengkapnya */}
                      <div className="mt-1.5">
                        <p className={`text-xs text-neutral-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-2 sm:line-clamp-3'}`}>
                          {synopsisText}
                        </p>
                        {isLong && (
                          <button
                            type="button"
                            onClick={(e) => toggleSynopsis(itemKey, e)}
                            className="inline-block mt-1 text-[11px] font-semibold text-[#38bdf8] hover:text-[#7dd3fc] hover:underline transition"
                          >
                            {isExpanded ? 'Lebih sedikit' : 'Baca selengkapnya'}
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
