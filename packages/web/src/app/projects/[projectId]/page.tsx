'use client';

import { GraphView } from '@/components/graph/GraphView';
import Link from 'next/link';

export default function ProjectPage({
  params
}: {
  params: { projectId: string }
}) {
  const { projectId } = params;

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Projects
        </Link>
        <div className="border-l h-6"></div>
        <h1 className="text-xl font-semibold">
          Project: <span className="font-mono">{projectId}</span>
        </h1>
      </header>
      <main className="flex-1">
        <GraphView projectId={projectId} />
      </main>
    </div>
  );
}
