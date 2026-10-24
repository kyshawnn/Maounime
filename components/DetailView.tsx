'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Heart, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { AnimeDetail } from '@/lib/sokuja';

interface DetailViewProps {
  anime: AnimeDetail;
}

export default function DetailView({ anime }: DetailViewProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [searchEp, setSearchEp] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // false = descending (e.g. Ep 12 -> Ep 1), true = ascending
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    showToast(!isFavorite ? 'Ditambahkan ke Favorit' : 'Dihapus dari Favorit');
  };

  const filteredEpisodes = useMemo(() => {
    let list = [...anime.episodes];
    if (searchEp.trim()) {
      const q = searchEp.trim().toLowerCase();
      list = list.filter(
        (ep) =>
          ep.title.toLowerCase().includes(q) ||
          String(ep.number).includes(q)
      );
    }
    list.sort((a, b) => (sortAsc ? a.number - b.number : b.number - a.number));
    return list;
  }, [anime.episodes, searchEp, sortAsc]);

  const firstEpisode = anime.episodes.length > 0 ? anime.episodes[anime.episodes.length - 1] : null;
  const watchSlug = firstEpisode?.slug || anime.episodes[0]?.slug || `${anime.slug}-episode-1-subtitle-indonesia`;

  return (
    <div className="w-full max-w-4xl mx-auto pb-16 antialiased">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1e2024] border border-neutral-700 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* --- Top Hero Section (Screenshot 5) --- */}
      <section className="relative w-full h-80 sm:h-96 md:h-[420px] overflow-hidden bg-[#141517]">
        {anime.backdrop ? (
          <img
            src={anime.backdrop}
            alt={anime.title}
            onError={(e) => {
              const target = e.currentTarget;
              if (anime.title.toLowerCase().includes('one piece') && !target.src.includes('one-piece-cover.jpg')) {
                target.src = '/assets/one-piece-cover.jpg';
              }
            }}
            className="w-full h-full object-cover object-top opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-[#141517]" />
        )}
        {/* Dark gradient fade down to #0a0a0a */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent" />

        {/* Back Button on top-left (<) */}
        <div className="absolute top-4 left-4 z-20">
          <Link
            href="/"
            prefetch={true}
            className="p-2.5 rounded-full bg-black/80 hover:bg-black text-white transition active:scale-95 inline-flex items-center justify-center border border-white/10"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* Bottom Hero Overlay: Judul & skor* rilis* type* studio* */}
        <div className="absolute inset-x-0 bottom-4 px-4 sm:px-6 z-10 flex flex-col">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 drop-shadow-md">
            {anime.title}
          </h1>

          {/* Metadata line: skor* rilis* type* studio* */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-300 font-medium">
            <span>{anime.rating || '8.4'}</span>
            <span>•</span>
            <span>{anime.year || '2026'}</span>
            <span>•</span>
            <span>{anime.type || 'TV'}</span>
            <span>•</span>
            <span>{anime.studio || 'Studio Animasi'}</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="px-4 sm:px-6 mt-5 space-y-6">
        {/* --- Action Buttons (Screenshot 5) --- */}
        <div className="flex items-center gap-3">
          {/* Tonton Sekarang Button (Cyan/Light Blue Pill) */}
          <Link
            href={`/watch/${watchSlug}`}
            prefetch={true}
            className="flex-1 py-3 px-6 rounded-full bg-[#38bdf8] hover:bg-[#0ea5e9] active:scale-98 text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-lg"
          >
            <Play className="w-4 h-4 fill-black text-black" />
            <span>Tonton Sekarang</span>
          </Link>

          {/* Favorite Button (Dark Grey Pill) */}
          <button
            onClick={toggleFavorite}
            className={`flex-1 py-3 px-6 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-98 ${
              isFavorite
                ? 'bg-[#2f1b20] text-[#f43f5e] border border-[#f43f5e]/40'
                : 'bg-[#242528] hover:bg-[#2c2d30] text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#f43f5e]' : ''}`} />
            <span>Favorite</span>
          </button>
        </div>

        {/* --- Synopsis Section (Screenshot 5) --- */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white tracking-wide">
            Synopsis:
          </h2>
          <div>
            <p className={`text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line ${isSynopsisExpanded ? '' : 'line-clamp-3'}`}>
              {anime.synopsis || 'Tidak ada deskripsi sinopsis.'}
            </p>
            {anime.synopsis && anime.synopsis.length > 180 && (
              <button
                type="button"
                onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                className="mt-1.5 text-xs font-semibold text-[#38bdf8] hover:text-[#7dd3fc] transition inline-block hover:underline"
              >
                {isSynopsisExpanded ? 'Lebih sedikit' : 'Baca selengkapnya'}
              </button>
            )}
          </div>
        </section>

        {/* --- Episode List Section (Screenshot 5) --- */}
        <section className="space-y-4 pt-2">
          {/* Episode Search Bar & Sort Chevron */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchEp}
                onChange={(e) => setSearchEp(e.target.value)}
                placeholder="Cari episode.."
                className="w-full bg-[#1c1d20] border-none text-xs sm:text-sm text-white placeholder-neutral-500 px-5 py-3.5 rounded-full focus:outline-none focus:ring-1 focus:ring-neutral-600 transition"
              />
            </div>

            {/* Sort Toggle Button (v / ^ chevron) */}
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="w-12 h-12 rounded-full bg-[#1c1d20] hover:bg-[#25262a] active:scale-95 flex items-center justify-center text-neutral-300 hover:text-white transition shrink-0"
              title={sortAsc ? 'Urutan: Terlama' : 'Urutan: Terbaru'}
            >
              {sortAsc ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {/* Episode Items Stack (Rounded Pills) */}
          <div className="space-y-2.5">
            {filteredEpisodes.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                Episode tidak ditemukan.
              </div>
            ) : (
              filteredEpisodes.map((ep) => (
                <Link
                  key={ep.slug}
                  href={`/watch/${ep.slug}`}
                  prefetch={true}
                  className="w-full py-3.5 px-6 rounded-full bg-[#1c1d20] hover:bg-[#27282d] active:scale-99 flex items-center justify-between text-white transition group"
                >
                  <span className="text-xs sm:text-sm font-semibold text-neutral-200 group-hover:text-white">
                    {ep.title}
                  </span>
                  <span className="text-[11px] sm:text-xs text-neutral-400 group-hover:text-neutral-300">
                    {ep.date || '24 Okt 2026'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
