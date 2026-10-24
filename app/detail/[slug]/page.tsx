import { notFound } from 'next/navigation';
import DetailView from '@/components/DetailView';
import { getAnimeDetail } from '@/lib/sokuja';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 120;

export default async function AnimeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const anime = await getAnimeDetail(slug);

  if (!anime) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col antialiased">
      <main className="flex-1 w-full">
        <DetailView anime={anime} />
      </main>
    </div>
  );
}
