import useSWR from 'swr';
import type { ProjectMetadata } from '@pottery/core';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useProjects() {
  const { data, error, isLoading } = useSWR<{ projects: ProjectMetadata[] }>(
    '/api/projects',
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true
    }
  );

  return {
    projects: data?.projects ?? [],
    isLoading,
    error
  };
}
