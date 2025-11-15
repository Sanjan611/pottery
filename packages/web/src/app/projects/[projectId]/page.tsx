'use client';

import { useState } from 'react';
import { GraphView } from '@/components/graph/GraphView';
import { MappingView } from '@/components/graph/MappingView';
import Link from 'next/link';

type ViewType = 'graph' | 'mappings';

export default function ProjectPage({
  params
}: {
  params: { projectId: string }
}) {
  const { projectId } = params;
  const [activeView, setActiveView] = useState<ViewType>('graph');

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
        <div className="flex-1"></div>
        <nav className="flex gap-2">
          <button
            onClick={() => setActiveView('graph')}
            className={`px-4 py-2 rounded transition ${
              activeView === 'graph'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Graph
          </button>
          <button
            onClick={() => setActiveView('mappings')}
            className={`px-4 py-2 rounded transition ${
              activeView === 'mappings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mappings
          </button>
        </nav>
      </header>
      <main className="flex-1">
        {activeView === 'graph' ? (
          <GraphView projectId={projectId} />
        ) : (
          <MappingView projectId={projectId} />
        )}
      </main>
    </div>
  );
}
