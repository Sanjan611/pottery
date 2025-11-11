import { NextResponse } from 'next/server';
import { ProjectStore } from '@pottery/core';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const store = new ProjectStore(projectId);

    // Check if project exists
    const exists = await store.exists();
    if (!exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const graph = await store.loadGraph();

    // Convert Maps to arrays for JSON serialization
    return NextResponse.json({
      version: graph.version,
      nodes: Array.from(graph.nodes.values()),
      edges: Array.from(graph.edges.values()),
      metadata: graph.metadata
    });
  } catch (error) {
    console.error('Error loading graph:', error);
    return NextResponse.json(
      { error: 'Failed to load graph' },
      { status: 500 }
    );
  }
}
