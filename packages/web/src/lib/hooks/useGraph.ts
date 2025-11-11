import useSWR from 'swr';
import type { GraphNode, Dependency } from '@pottery/core';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface GraphData {
  version: string;
  nodes: GraphNode[];
  edges: Dependency[];
  metadata: {
    created_at: string;
    last_modified: string;
  };
}

export function useGraph(projectId: string) {
  const { data, error, isLoading } = useSWR<GraphData>(
    projectId ? `/api/projects/${projectId}/graph` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true
    }
  );

  return {
    graph: data,
    isLoading,
    error
  };
}
