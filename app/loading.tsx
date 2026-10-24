export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col antialiased">
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-4 pb-16">
        {/* Hero Banner Skeleton */}
        <div className="w-full h-80 sm:h-96 md:h-[420px] rounded-3xl bg-[#141517] animate-pulse mt-3 sm:mt-4" />

        {/* Search Bar Skeleton */}
        <div className="w-full h-12 rounded-full bg-[#1b1c1e] animate-pulse mt-4 mb-6" />

        {/* Section Title Skeleton */}
        <div className="w-28 h-6 rounded bg-[#1b1c1e] animate-pulse mb-3.5" />

        {/* 3-Column Grid Skeleton */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="flex flex-col rounded-2xl overflow-hidden">
              <div className="aspect-[3/4] w-full rounded-2xl bg-[#16171a] animate-pulse" />
              <div className="h-3.5 w-3/4 rounded bg-[#1b1c1e] animate-pulse mt-2" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
