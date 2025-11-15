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

    // Check if this is a layered project
    const isLayered = await store.isLayered();
    if (!isLayered) {
      return NextResponse.json(
        { error: 'Mappings are only available for layered projects' },
        { status: 400 }
      );
    }

    const layeredGraph = await store.loadLayeredGraph();
    const mappings = Array.from(layeredGraph.structureLayer.mappings.values());

    // Also return flow actions and capabilities for reference
    const flowActions = Array.from(layeredGraph.structureLayer.flowGraph.nodes.values())
      .filter(node => node.id.startsWith('action-'));
    const capabilities = Array.from(layeredGraph.structureLayer.featureGraph.nodes.values());

    return NextResponse.json({
      mappings,
      flowActions,
      capabilities
    });
  } catch (error) {
    console.error('Error loading mappings:', error);
    return NextResponse.json(
      { error: 'Failed to load mappings' },
      { status: 500 }
    );
  }
}
