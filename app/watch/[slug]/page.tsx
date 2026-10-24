import { notFound } from 'next/navigation';
import WatchView from '@/components/WatchView';
import { getEpisodeStream } from '@/lib/sokuja';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 120;

export default async function WatchPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getEpisodeStream(slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col antialiased">
      <main className="flex-1 w-full">
        <WatchView data={data} />
      </main>
    </div>
  );
}
