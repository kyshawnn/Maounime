'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, Share2, Flag, Send, ArrowLeft, Server } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import { EpisodeStreamData } from '@/lib/sokuja';

interface CommentItem {
  id: string;
  user: string;
  text: string;
  time: string;
}

interface WatchViewProps {
  data: EpisodeStreamData;
}

export default function WatchView({ data }: WatchViewProps) {
  const [likes, setLikes] = useState(0);
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLike = () => {
    if (userRating === 'like') {
      setUserRating(null);
      setLikes((prev) => prev - 1);
    } else {
      if (userRating === 'dislike') {
        setUserRating('like');
        setLikes((prev) => prev + 1);
      } else {
        setUserRating('like');
        setLikes((prev) => prev + 1);
      }
      showToast('Terima kasih atas penilaian Anda!');
    }
  };

  const handleDislike = () => {
    if (userRating === 'dislike') {
      setUserRating(null);
    } else {
      if (userRating === 'like') {
        setLikes((prev) => prev - 1);
      }
      setUserRating('dislike');
      showToast('Penilaian disimpan');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: data.title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Tautan berhasil disalin ke papan klip!');
      }
    } catch {
      showToast('Tautan berhasil disalin!');
    }
  };

  const handleReport = () => {
    showToast('Laporan video telah diterima. Terima kasih!');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInput.trim();
    if (!text) return;
    const newComment: CommentItem = {
      id: String(Date.now()),
      user: 'Pengguna',
      text,
      time: 'Baru saja',
    };
    setComments([newComment, ...comments]);
    setCommentInput('');
    showToast('Komentar berhasil ditambahkan!');
  };

  const nextEpNum = data.episodeNumber ? data.episodeNumber + 1 : 2;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6 flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1e2024] border border-neutral-700 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Floating Back Navigation to Detail */}
      <div className="mb-2.5">
        <Link
          href={`/detail/${data.animeSlug}`}
          prefetch={true}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition px-2.5 py-1 rounded-lg hover:bg-neutral-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke detail</span>
        </Link>
      </div>

      {/* Video Player (Screenshot 1) */}
      <VideoPlayer
        title={data.title}
        episodeNumber={data.episodeNumber}
        animeTitle={data.animeTitle}
        mirrors={data.mirrors}
        downloads={data.downloads}
        nextEpisodeSlug={data.nextEpisodeSlug}
        nextEpisodeNumber={nextEpNum}
      />

      {/* --- Action Buttons (Screenshot 3) --- */}
      <div className="mt-4 space-y-3">
        {/* Row 1: Server, Share, [ 👎 | 👍 ], Riport */}
        <div className="flex items-center justify-between gap-2">
          {/* Server Button */}
          <button
            onClick={() => setIsServerModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#242528] hover:bg-[#2e3034] active:scale-95 text-xs font-semibold text-white transition"
          >
            <Server className="w-3.5 h-3.5 text-neutral-400" />
            <span>Server</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#242528] hover:bg-[#2e3034] active:scale-95 text-xs font-semibold text-white transition"
          >
            <Share2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>Share</span>
          </button>

          {/* [ 👎 | 👍 ] Split Pill Button */}
          <div className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-full bg-[#242528] px-2 py-1.5 text-xs font-semibold text-white">
            <button
              onClick={handleDislike}
              className={`p-1.5 rounded-full transition hover:bg-white/10 ${
                userRating === 'dislike' ? 'text-[#ff4444]' : 'text-neutral-400'
              }`}
              title="Tidak Suka"
            >
              <ThumbsDown className="w-3.5 h-3.5 fill-current" />
            </button>
            <div className="w-px h-3.5 bg-neutral-700 mx-1.5" />
            <button
              onClick={handleLike}
              className={`p-1.5 rounded-full transition hover:bg-white/10 ${
                userRating === 'like' ? 'text-[#38bdf8]' : 'text-neutral-200'
              }`}
              title="Suka"
            >
              <ThumbsUp className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          {/* Riport Button */}
          <button
            onClick={handleReport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#242528] hover:bg-[#2e3034] active:scale-95 text-xs font-semibold text-white transition"
          >
            <Flag className="w-3.5 h-3.5 text-neutral-400" />
            <span>Riport</span>
          </button>
        </div>

        {/* Row 2: < Ep sebelumnya & Ep selanjutnya > */}
        <div className="flex items-center gap-3">
          {data.prevEpisodeSlug ? (
            <Link
              href={`/watch/${data.prevEpisodeSlug}`}
              prefetch={true}
              className="flex-1 py-3 px-4 rounded-full bg-[#242528] hover:bg-[#2e3034] active:scale-98 text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition text-center"
            >
              &lt; Ep sebelumnya
            </Link>
          ) : (
            <div className="flex-1 py-3 px-4 rounded-full bg-[#1b1c1e] opacity-40 pointer-events-none text-xs sm:text-sm font-semibold text-neutral-500 text-center">
              &lt; Ep sebelumnya
            </div>
          )}

          {data.nextEpisodeSlug ? (
            <Link
              href={`/watch/${data.nextEpisodeSlug}`}
              prefetch={true}
              className="flex-1 py-3 px-4 rounded-full bg-[#242528] hover:bg-[#2e3034] active:scale-98 text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition text-center"
            >
              Ep selanjutnya &gt;
            </Link>
          ) : (
            <div className="flex-1 py-3 px-4 rounded-full bg-[#1b1c1e] opacity-40 pointer-events-none text-xs sm:text-sm font-semibold text-neutral-500 text-center">
              Ep selanjutnya &gt;
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-neutral-800/80 my-5" />

      {/* --- Komentar Section (Screenshot 3) --- */}
      <section className="flex flex-col">
        <h3 className="text-sm sm:text-base font-bold text-white mb-3">
          Komentar
        </h3>

        {/* Input box: Tambahkan komentar + blue paper plane send icon */}
        <form onSubmit={handleAddComment} className="relative w-full mb-6">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Tambahkan komentar"
            className="w-full bg-[#1c1d20] border-none text-xs sm:text-sm text-white placeholder-neutral-500 px-5 py-3.5 pr-12 rounded-full focus:outline-none focus:ring-1 focus:ring-neutral-600 transition"
          />
          <button
            type="submit"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#38bdf8] hover:scale-110 active:scale-95 transition"
            title="Kirim Komentar"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </form>

        {/* Comments List or Empty state */}
        {comments.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-xs sm:text-sm text-neutral-500 font-normal">
              Tidak ada komentar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-[#161719] border border-neutral-800/80 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{c.user}</span>
                  <span className="text-[11px] text-neutral-500">{c.time}</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-300">{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Server Selection Modal (NO BLUR) */}
      {isServerModalOpen && (
        <div
          onClick={() => setIsServerModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#18191c] border border-neutral-700 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Daftar Server ({data.mirrors.length})
              </h4>
              <button
                onClick={() => setIsServerModalOpen(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Tutup
              </button>
            </div>
            <div className="space-y-2">
              {data.mirrors.map((m, idx) => (
                <button
                  key={`${m.quality}-${idx}`}
                  onClick={() => {
                    setIsServerModalOpen(false);
                    showToast(`Beralih ke ${m.serverName}`);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#212226] hover:bg-[#2c2d33] text-left transition text-xs text-white"
                >
                  <span className="font-semibold">{m.serverName}</span>
                  <span className="px-2 py-0.5 rounded bg-black/40 text-[11px] text-neutral-400">
                    {m.quality}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
