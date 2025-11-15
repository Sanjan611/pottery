import { NextResponse } from 'next/server';
import { ProjectStore, Layer } from '@pottery/core';

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
    const url = new URL(request.url);
    const layerParam = url.searchParams.get('layer');
    const graphParam = url.searchParams.get('graph'); // 'feature' | 'flow' | null

    if (isLayered) {
      const layeredGraph = await store.loadLayeredGraph();
      const layerFilter = layerParam as Layer | null;

      // If layer filter specified, return only that layer
      if (layerFilter) {
        let nodes: any[] = [];
        let edges: any[] = [];

        switch (layerFilter) {
          case Layer.Narrative:
            nodes = Array.from(layeredGraph.narrativeLayer.nodes.values());
            edges = Array.from(layeredGraph.narrativeLayer.edges.values());
            break;
          case Layer.Structure:
            // Structure layer has dual graphs
            if (graphParam === 'feature') {
              // Only feature graph
              nodes = Array.from(layeredGraph.structureLayer.featureGraph.nodes.values());
              edges = Array.from(layeredGraph.structureLayer.featureGraph.edges.values());
            } else if (graphParam === 'flow') {
              // Only flow graph
              nodes = Array.from(layeredGraph.structureLayer.flowGraph.nodes.values());
              edges = Array.from(layeredGraph.structureLayer.flowGraph.edges.values());
            } else {
              // Both graphs
              nodes = [
                ...Array.from(layeredGraph.structureLayer.featureGraph.nodes.values()),
                ...Array.from(layeredGraph.structureLayer.flowGraph.nodes.values())
              ];
              edges = [
                ...Array.from(layeredGraph.structureLayer.featureGraph.edges.values()),
                ...Array.from(layeredGraph.structureLayer.flowGraph.edges.values())
              ];
            }
            break;
          case Layer.Specification:
            nodes = Array.from(layeredGraph.specificationLayer.nodes.values());
            edges = Array.from(layeredGraph.specificationLayer.edges.values());
            break;
        }

        return NextResponse.json({
          version: layeredGraph.version,
          nodes,
          edges,
          metadata: layeredGraph.metadata,
          isLayered: true,
          layer: layerFilter,
          graph: graphParam || undefined
        });
      }

      // Return all layers combined
      const allNodes = [
        ...Array.from(layeredGraph.narrativeLayer.nodes.values()),
        ...Array.from(layeredGraph.structureLayer.featureGraph.nodes.values()),
        ...Array.from(layeredGraph.structureLayer.flowGraph.nodes.values()),
        ...Array.from(layeredGraph.specificationLayer.nodes.values())
      ];
      const allEdges = [
        ...Array.from(layeredGraph.narrativeLayer.edges.values()),
        ...Array.from(layeredGraph.structureLayer.featureGraph.edges.values()),
        ...Array.from(layeredGraph.structureLayer.flowGraph.edges.values()),
        ...Array.from(layeredGraph.specificationLayer.edges.values())
      ];

      return NextResponse.json({
        version: layeredGraph.version,
        nodes: allNodes,
        edges: allEdges,
        metadata: layeredGraph.metadata,
        isLayered: true,
        crossLayerDependencies: Array.from(layeredGraph.crossLayerDependencies.values())
      });
    } else {
      // Legacy graph
      const graph = await store.loadGraph();

      return NextResponse.json({
        version: graph.version,
        nodes: Array.from(graph.nodes.values()),
        edges: Array.from(graph.edges.values()),
        metadata: graph.metadata,
        isLayered: false
      });
    }
  } catch (error) {
    console.error('Error loading graph:', error);
    return NextResponse.json(
      { error: 'Failed to load graph' },
      { status: 500 }
    );
  }
}
