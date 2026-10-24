export default function WatchLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col antialiased">
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6 flex flex-col">
        {/* Back Link Skeleton */}
        <div className="w-28 h-5 rounded bg-[#1b1c1e] animate-pulse mb-3" />

        {/* Video Player Skeleton (16:9) */}
        <div className="w-full aspect-video rounded-2xl bg-[#141517] animate-pulse" />

        {/* Action Buttons Row Skeleton */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 rounded-full bg-[#1b1c1e] animate-pulse" />
            <div className="flex-1 h-10 rounded-full bg-[#1b1c1e] animate-pulse" />
            <div className="flex-1 h-10 rounded-full bg-[#1b1c1e] animate-pulse" />
            <div className="flex-1 h-10 rounded-full bg-[#1b1c1e] animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-11 rounded-full bg-[#1b1c1e] animate-pulse" />
            <div className="flex-1 h-11 rounded-full bg-[#1b1c1e] animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
