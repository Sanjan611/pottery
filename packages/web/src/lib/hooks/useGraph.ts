import useSWR from 'swr';
import type { GraphNode, Dependency, Layer } from '@pottery/core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface GraphData {
  version: string;
  nodes: GraphNode[];
  edges: Dependency[];
  metadata: {
    created_at: string;
    last_modified: string;
  };
  isLayered?: boolean;
  layer?: Layer;
  crossLayerDependencies?: any[];
}

export function useGraph(projectId: string, layer?: Layer | 'all', graph?: 'feature' | 'flow' | 'both') {
  const url = projectId 
    ? (() => {
        const baseUrl = `/api/projects/${projectId}/graph`;
        const params = new URLSearchParams();
        if (layer && layer !== 'all') {
          params.set('layer', layer);
        }
        if (graph && graph !== 'both') {
          params.set('graph', graph);
        }
        const queryString = params.toString();
        return queryString ? `${baseUrl}?${queryString}` : baseUrl;
      })()
    : null;

  const { data, error, isLoading } = useSWR<GraphData>(
    url,
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
