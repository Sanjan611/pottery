import useSWR from 'swr';
import type { FlowToCapabilityMapping, FlowAction, Capability } from '@pottery/core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface MappingsData {
  mappings: FlowToCapabilityMapping[];
  flowActions: FlowAction[];
  capabilities: Capability[];
}

export function useMappings(projectId: string) {
  const url = projectId 
    ? `/api/projects/${projectId}/mappings`
    : null;

  const { data, error, isLoading } = useSWR<MappingsData>(
    url,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true
    }
  );

  return {
    mappings: data?.mappings || [],
    flowActions: data?.flowActions || [],
    capabilities: data?.capabilities || [],
    isLoading,
    error
  };
}
