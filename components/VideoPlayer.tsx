'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipForward,
  Sun,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Lock,
  Unlock,
  Check,
  ChevronDown,
  Expand,
  Shrink,
} from 'lucide-react';
import { VideoMirror, DownloadLink } from '@/lib/sokuja';

interface VideoPlayerProps {
  title: string;
  episodeNumber?: number;
  animeTitle: string;
  mirrors: VideoMirror[];
  downloads?: DownloadLink[];
  nextEpisodeSlug?: string | null;
  nextEpisodeNumber?: number;
  onNextEpisode?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export default function VideoPlayer({
  title,
  episodeNumber,
  animeTitle,
  mirrors,
  nextEpisodeSlug,
  nextEpisodeNumber,
  onNextEpisode,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mirrors & selection
  const [selectedMirrorIndex, setSelectedMirrorIndex] = useState(0);
  const [useProxy, setUseProxy] = useState(false);
  const [activeMirrorFallbackIdx, setActiveMirrorFallbackIdx] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [autoNext, setAutoNext] = useState(true);

  // Speed & Resolution/Server pickers
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isSpeedModalOpen, setIsSpeedModalOpen] = useState(false);

  // Brightness & Volume Gestures (as in Screenshot 1)
  const [brightness, setBrightness] = useState(100); // 0% to 150%
  const [volume, setVolume] = useState(100); // 0% to 100%
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Double tap feedback & tap tracker
  const [seekFeedback, setSeekFeedback] = useState<{ direction: 'left' | 'right' } | null>(null);
  const seekFeedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isDevicePortrait, setIsDevicePortrait] = useState(false);

  const showDoubleTapFeedback = (direction: 'left' | 'right') => {
    setSeekFeedback({ direction });
    if (seekFeedbackTimerRef.current) clearTimeout(seekFeedbackTimerRef.current);
    seekFeedbackTimerRef.current = setTimeout(() => {
      setSeekFeedback(null);
    }, 650);
  };

  // Touch gesture tracker
  const touchStartRef = useRef<{ x: number; y: number; type: 'brightness' | 'volume' | 'tap'; startVal: number } | null>(null);
  const sliderHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hover timestamp for scrubber
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<string>('00:00');

  // Active mirror object
  const activeMirror = mirrors[selectedMirrorIndex] || mirrors[0] || null;

  // Stream URL
  const currentStreamUrl = activeMirror
    ? useProxy
      ? `/api/stream?url=${encodeURIComponent(activeMirror.streamUrl)}`
      : activeMirror.streamUrl
    : '';

  // Auto-hide controls timer
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying && !isLocked) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setIsServerModalOpen(false);
        setIsSpeedModalOpen(false);
      }, 3500);
    }
  }, [isPlaying, isLocked]);

  useEffect(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying && !isLocked) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setIsServerModalOpen(false);
        setIsSpeedModalOpen(false);
      }, 3500);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, isLocked]);

  // Handle source switch
  useEffect(() => {
    if (videoRef.current) {
      const prevTime = videoRef.current.currentTime;
      videoRef.current.load();
      if (prevTime > 0) {
        videoRef.current.currentTime = prevTime;
      }
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [selectedMirrorIndex, useProxy, isPlaying]);

  // Play / Pause only via explicit function
  const togglePlay = () => {
    if (isLocked || !videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    resetHideTimer();
  };

  // Seek relative +/- 10s
  const seekRelative = (delta: number) => {
    if (isLocked || !videoRef.current) return;
    const target = Math.min(Math.max(0, videoRef.current.currentTime + delta), duration || 99999);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    resetHideTimer();
  };

  // Next episode handler
  const handleNextEp = () => {
    if (isLocked) return;
    if (onNextEpisode) {
      onNextEpisode();
    } else if (nextEpisodeSlug) {
      window.location.href = `/watch/${nextEpisodeSlug}`;
    }
  };

  // Fullscreen + FORCE LANDSCAPE ORIENTATION (user requirement)
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        // Force Landscape Orientation
        try {
          if (screen.orientation && 'lock' in screen.orientation) {
            await (screen.orientation as any).lock('landscape');
          }
        } catch (e) {
          console.warn('Orientation lock not supported or user denied:', e);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
        try {
          if (screen.orientation && 'unlock' in screen.orientation) {
            (screen.orientation as any).unlock();
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
    resetHideTimer();
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        try {
          if (screen.orientation && 'unlock' in screen.orientation) {
            (screen.orientation as any).unlock();
          }
        } catch (e) {}
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Update Brightness & Volume via gesture
  const triggerSliderTimer = () => {
    if (sliderHideTimerRef.current) clearTimeout(sliderHideTimerRef.current);
    sliderHideTimerRef.current = setTimeout(() => {
      setShowBrightnessSlider(false);
      setShowVolumeSlider(false);
    }, 1500);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relX = touch.clientX - rect.left;
    const isLeftSide = relX < rect.width * 0.45;
    const isRightSide = relX > rect.width * 0.55;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      type: isLeftSide ? 'brightness' : isRightSide ? 'volume' : 'tap',
      startVal: isLeftSide ? brightness : volume,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked || !touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaY = touchStartRef.current.y - touch.clientY; // upward = positive

    // Minimum movement threshold
    if (Math.abs(deltaY) < 6) return;

    const step = (deltaY / 150) * 100;

    if (touchStartRef.current.type === 'brightness') {
      const nextBrightness = Math.max(10, Math.min(150, Math.round(touchStartRef.current.startVal + step)));
      setBrightness(nextBrightness);
      setShowBrightnessSlider(true);
      triggerSliderTimer();
    } else if (touchStartRef.current.type === 'volume') {
      const nextVol = Math.max(0, Math.min(100, Math.round(touchStartRef.current.startVal + step)));
      setVolume(nextVol);
      if (videoRef.current) {
        videoRef.current.volume = nextVol / 100;
      }
      setShowVolumeSlider(true);
      triggerSliderTimer();
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    triggerSliderTimer();
  };

  // Single tap on empty player screen: immediately closes controls if open, or opens them if closed
  const handlePlayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, [role="button"], a, select')) {
      return;
    }
    if (isLocked) {
      // While locked, any tap wakes and refreshes controls without toggling off on double tap
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
      return;
    }
    if (showControls) {
      setShowControls(false);
      setIsServerModalOpen(false);
      setIsSpeedModalOpen(false);
    } else {
      setShowControls(true);
      resetHideTimer();
    }
  };

  // Video time & buffer
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    const b = videoRef.current.buffered;
    if (b.length > 0 && videoRef.current.duration > 0) {
      const bufferedSec = b.end(b.length - 1);
      setBufferedEnd((bufferedSec / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (autoNext && nextEpisodeSlug) {
      handleNextEp();
    }
  };

  // Scrubber click & drag
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked || !videoRef.current || duration <= 0) return;
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * duration;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    resetHideTimer();
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(formatTime(pos * duration));
  };

  const handleProgressMouseLeave = () => {
    setHoverPosition(null);
  };

  // Speed selection
  const selectSpeed = (spd: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
      setPlaybackSpeed(spd);
    }
    setIsSpeedModalOpen(false);
    resetHideTimer();
  };

  // Server selection: only displays existing available servers!
  const selectServer = (idx: number) => {
    if (idx >= 0 && idx < mirrors.length) {
      setSelectedMirrorIndex(idx);
    }
    setIsServerModalOpen(false);
    resetHideTimer();
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentQualityLabel = activeMirror?.quality || '720p';

  return (
    <div className="w-full flex flex-col select-none">
      {/* Player Frame (16:9 or Fullscreen) */}
      <div
        ref={containerRef}
        onClick={handlePlayerClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseMove={resetHideTimer}
        className={`relative w-full aspect-video bg-black overflow-hidden shadow-2xl transition-all ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
            : 'rounded-2xl border border-neutral-800'
        }`}
      >
        {/* Video Element with CSS Brightness applied directly */}
        <video
          ref={videoRef}
          src={currentStreamUrl || undefined}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleVideoEnded}
          onError={() => {
            // Auto fallback to proxy or alternative mirror if direct fails
            if (!useProxy) {
              setUseProxy(true);
            } else if (mirrors.length > 1 && activeMirrorFallbackIdx < mirrors.length - 1) {
              const nextIdx = (activeMirrorFallbackIdx + 1) % mirrors.length;
              setActiveMirrorFallbackIdx(nextIdx);
              setSelectedMirrorIndex(nextIdx);
            }
          }}
          style={{
            filter: `brightness(${brightness}%)`,
          }}
          className={`w-full h-full bg-black cursor-pointer transition-[filter] duration-75 ${
            fitMode === 'cover' ? 'object-cover' : 'object-contain'
          }`}
        />

        {/* --- Left Brightness Slider (Gesture / Touch Up-Down on left) --- */}
        <div
          className={`absolute left-5 sm:left-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 transition-opacity duration-200 pointer-events-none ${
            showBrightnessSlider ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-[11px] sm:text-xs font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
            {brightness}%
          </span>
          <div className="w-1.5 sm:w-2 h-28 sm:h-36 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end">
            <div
              style={{ height: `${Math.min(100, (brightness / 150) * 100)}%` }}
              className="w-full bg-[#f59e0b] rounded-full transition-all duration-75"
            />
          </div>
          <Sun className="w-4 h-4 text-white drop-shadow" />
        </div>

        {/* --- Right Volume Slider (Gesture / Touch Up-Down on right) --- */}
        <div
          className={`absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 transition-opacity duration-200 pointer-events-none ${
            showVolumeSlider ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-[11px] sm:text-xs font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
            {volume}%
          </span>
          <div className="w-1.5 sm:w-2 h-28 sm:h-36 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end">
            <div
              style={{ height: `${volume}%` }}
              className="w-full bg-white rounded-full transition-all duration-75"
            />
          </div>
          {volume === 0 ? (
            <VolumeX className="w-4 h-4 text-white drop-shadow" />
          ) : (
            <Volume2 className="w-4 h-4 text-white drop-shadow" />
          )}
        </div>

        {/* --- Dedicated Unlock Button When Screen is Locked (Never gets lost on double tap) --- */}
        {isLocked && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLocked(false);
                setShowControls(true);
                setBrightness(100);
                resetHideTimer();
              }}
              className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-black/90 hover:bg-black border border-red-500/80 text-white shadow-2xl transition duration-200 active:scale-95 ${
                showControls ? 'opacity-100 scale-100' : 'opacity-70 hover:opacity-100 scale-95'
              }`}
              title="Buka Kunci Layar"
            >
              <Lock className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs font-bold text-white tracking-wide">Buka Kunci</span>
            </button>
          </div>
        )}

        {/* --- Controls Overlay (Matches Screenshot 1) --- */}
        <div
          className={`absolute inset-0 z-30 flex flex-col justify-between transition-opacity duration-300 bg-black/40 ${
            showControls && !isLocked ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Bar: Title & Lock Button */}
          <div className="flex items-start justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            {/* Top Left: Anime Title + Episode */}
            <div className="flex flex-col">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight drop-shadow">
                {animeTitle || title}
              </h2>
              <span className="text-xs text-neutral-300 font-medium drop-shadow mt-0.5">
                {title.includes('Episode') ? title : `Episode ${episodeNumber || 1}`}
              </span>
            </div>

            {/* Top Right: Lock Button (Locks screen) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLocked(true);
                setShowControls(true);
                setBrightness(100);
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                hideTimerRef.current = setTimeout(() => {
                  setShowControls(false);
                }, 4000);
              }}
              className="p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-white transition drop-shadow"
              title="Kunci Layar"
            >
              <Unlock className="w-4 h-4" />
            </button>
          </div>

          {/* Center Controls: Rewind, Play/Pause Circle, Forward (No '10' text, Pause in the middle) */}
          {!isLocked && (
            <div className="flex items-center justify-center gap-8 sm:gap-14 my-auto">
              {/* Rewind 10s button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  seekRelative(-10);
                }}
                className="flex items-center justify-center p-3 rounded-full hover:bg-white/10 text-white transition active:scale-90"
                title="Mundur 10 Detik"
              >
                <RotateCcw className="w-7 h-7 sm:w-9 sm:h-9" />
              </button>

              {/* Large White Play / Pause Circle in center */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition"
                title={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-black text-black" />
                ) : (
                  <Play className="w-7 h-7 fill-black text-black ml-1" />
                )}
              </button>

              {/* Forward 10s button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  seekRelative(10);
                }}
                className="flex items-center justify-center p-3 rounded-full hover:bg-white/10 text-white transition active:scale-90"
                title="Maju 10 Detik"
              >
                <RotateCw className="w-7 h-7 sm:w-9 sm:h-9" />
              </button>
            </div>
          )}

          {/* Bottom Bar: Time, Autonext, Resolution/Server, Speed, Fullscreen & Red Scrubber */}
          {!isLocked && (
            <div className="flex flex-col bg-gradient-to-t from-black via-black/70 to-transparent pt-6 pb-2 px-3 sm:px-5">
              {/* Controls row */}
              <div className="flex items-center justify-between text-white text-xs sm:text-sm mb-2">
                {/* Current Time / Duration */}
                <div className="font-mono text-xs sm:text-sm text-neutral-200">
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1 text-neutral-400">/</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Right controls: Autonext, Resolution, Speed, Fit, Fullscreen */}
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Autonext toggle button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAutoNext(!autoNext);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition ${
                      autoNext ? 'text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Autonext</span>
                  </button>

                  {/* Resolution / Server picker (displays available servers only!) */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsServerModalOpen(!isServerModalOpen);
                        setIsSpeedModalOpen(false);
                      }}
                      className="px-2 py-1 rounded bg-black/60 border border-white/20 hover:border-white/50 text-xs font-bold text-white transition"
                    >
                      {currentQualityLabel}
                    </button>

                    {/* Server Dropdown */}
                    {isServerModalOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-9 right-0 z-50 w-44 rounded-xl bg-[#141416] border border-neutral-700 p-1.5 shadow-2xl text-xs space-y-1 animate-in fade-in"
                      >
                        <div className="px-2 py-1 text-[11px] font-bold text-neutral-400 border-b border-neutral-800 uppercase tracking-wider">
                          Pilihan Server
                        </div>
                        {mirrors.map((m, idx) => (
                          <button
                            key={`${m.quality}-${idx}`}
                            onClick={() => selectServer(idx)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition ${
                              idx === selectedMirrorIndex
                                ? 'bg-white text-black font-semibold'
                                : 'text-neutral-300 hover:bg-neutral-800'
                            }`}
                          >
                            <span>{m.serverName}</span>
                            {idx === selectedMirrorIndex && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Speed selector */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSpeedModalOpen(!isSpeedModalOpen);
                        setIsServerModalOpen(false);
                      }}
                      className="px-2 py-1 text-xs font-bold text-neutral-200 hover:text-white transition"
                    >
                      {playbackSpeed === 1 ? '1x' : `${playbackSpeed}x`}
                    </button>

                    {/* Speed Dropdown */}
                    {isSpeedModalOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-9 right-0 z-50 w-28 rounded-xl bg-[#141416] border border-neutral-700 p-1 shadow-2xl text-xs space-y-0.5 animate-in fade-in"
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => selectSpeed(spd)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                              spd === playbackSpeed
                                ? 'bg-white text-black font-semibold'
                                : 'text-neutral-300 hover:bg-neutral-800'
                            }`}
                          >
                            <span>{spd === 1 ? '1x Normal' : `${spd}x`}</span>
                            {spd === playbackSpeed && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fit mode toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFitMode(fitMode === 'contain' ? 'cover' : 'contain');
                    }}
                    className="p-1 text-neutral-300 hover:text-white transition"
                    title={fitMode === 'contain' ? 'Penuhi Layar' : 'Rasio Asli'}
                  >
                    {fitMode === 'contain' ? <Expand className="w-4 h-4" /> : <Shrink className="w-4 h-4" />}
                  </button>

                  {/* Fullscreen button (Requests fullscreen & locks landscape!) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="p-1 text-neutral-300 hover:text-white transition"
                    title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Lanskap)'}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* YouTube Style Red Scrubber / Progress Bar at bottom */}
              <div
                ref={progressBarRef}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProgressClick(e);
                }}
                onMouseMove={handleProgressMouseMove}
                onMouseLeave={handleProgressMouseLeave}
                className="relative w-full h-3 flex items-center cursor-pointer group/bar mt-1"
              >
                {/* Hover timestamp tooltip */}
                {hoverPosition !== null && (
                  <div
                    style={{ left: `${hoverPosition}%` }}
                    className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-neutral-700 text-[10px] font-mono font-bold text-white pointer-events-none shadow"
                  >
                    {hoverTime}
                  </div>
                )}

                {/* Progress track */}
                <div className="w-full h-1 group-hover/bar:h-1.5 transition-all bg-white/20 rounded-full overflow-hidden relative">
                  {/* Buffer bar */}
                  <div
                    style={{ width: `${bufferedEnd}%` }}
                    className="absolute inset-y-0 left-0 bg-white/30"
                  />
                  {/* Red playback progress bar */}
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className="absolute inset-y-0 left-0 bg-[#ff0000]"
                  />
                </div>

                {/* Red scrubber circle thumb */}
                <div
                  style={{ left: `${progressPercent}%` }}
                  className="absolute -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#ff0000] scale-0 group-hover/bar:scale-100 transition-transform shadow"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
