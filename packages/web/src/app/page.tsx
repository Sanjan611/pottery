'use client';

import Link from 'next/link';
import { useProjects } from '@/lib/hooks/useProjects';

export default function HomePage() {
  const { projects, isLoading, error } = useProjects();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🎨 Pottery Projects</h1>

      {projects.length === 0 ? (
        <div className="text-gray-500">
          <p className="mb-2">No projects yet. Create one using:</p>
          <code className="block p-3 bg-gray-100 rounded font-mono text-sm">
            pottery create --intent &quot;your idea&quot;
          </code>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <Link
              key={project.project_id}
              href={`/projects/${project.project_id}`}
              className="block p-4 border rounded-lg hover:shadow-lg transition bg-white"
            >
              <h2 className="text-xl font-semibold">{project.name || 'Untitled Project'}</h2>
              <div className="text-sm text-gray-500 mt-1 font-mono">
                {project.project_id} • v{project.current_version}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
