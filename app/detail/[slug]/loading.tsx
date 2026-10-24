export default function DetailLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col antialiased">
      <main className="flex-1 w-full max-w-4xl mx-auto pb-16">
        {/* Top Hero Skeleton */}
        <div className="w-full h-80 sm:h-96 md:h-[420px] bg-[#141517] animate-pulse" />

        {/* Buttons & Content Skeleton */}
        <div className="px-4 sm:px-6 mt-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-12 rounded-full bg-[#1b1c1e] animate-pulse" />
            <div className="flex-1 h-12 rounded-full bg-[#1b1c1e] animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="h-5 w-24 rounded bg-[#1b1c1e] animate-pulse" />
            <div className="h-4 w-full rounded bg-[#1b1c1e] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-[#1b1c1e] animate-pulse" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="h-12 w-full rounded-full bg-[#1b1c1e] animate-pulse" />
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 w-full rounded-full bg-[#1c1d20] animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
