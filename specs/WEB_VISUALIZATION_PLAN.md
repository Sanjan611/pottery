# Web Visualization Implementation Plan

**Product:** Pottery MVP
**Feature:** Web-based Graph Visualization
**Created:** 2025-11-11
**Status:** Planning

---

## Overview

This document outlines the implementation plan for Pottery's web visualization feature. The web interface will provide an interactive, read-only view of project graphs, allowing users to explore the product structure visually.

### Goals

- Enable visual exploration of Pottery project graphs
- Provide interactive navigation with zoom, pan, and search
- Display detailed information about nodes and their relationships
- Integrate seamlessly with existing CLI workflow via `pottery serve`

### Non-Goals (Deferred)

- ChangeRequest visualization (to be implemented later)
- Version history view (to be implemented later)
- Graph editing capabilities (read-only for MVP)
- Multi-user support or authentication
- Real-time collaboration

---

## Architecture Overview

### Technology Stack

**Frontend Framework:**
- **Next.js 14+** with App Router
  - Server-side rendering for initial load
  - API routes for data access
  - Built-in optimization and routing

**Graph Visualization:**
- **React Flow** - Interactive graph library
  - Performant with 100+ nodes
  - Custom node rendering
  - Built-in zoom, pan, minimap

**Layout Algorithm:**
- **Dagre** - Hierarchical graph layout
  - Automatic node positioning
  - Configurable spacing and direction

**Styling:**
- **Tailwind CSS** - Utility-first CSS framework
  - Custom theme for node colors
  - Responsive design utilities

**Data Fetching:**
- **SWR** - React Hooks for data fetching
  - Automatic caching and revalidation
  - Loading and error states

**State Management:**
- **Zustand** - Lightweight state management
  - Client-side UI state (selected nodes, filters)

### Package Structure

```
packages/web/                    # New package
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home (project list)
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       └── page.tsx     # Project graph view
│   │   └── api/                 # API routes
│   │       └── projects/
│   │           ├── route.ts     # GET /api/projects
│   │           └── [projectId]/
│   │               ├── route.ts # GET /api/projects/:id
│   │               └── graph/
│   │                   └── route.ts  # GET /api/projects/:id/graph
│   ├── components/
│   │   ├── graph/
│   │   │   ├── GraphView.tsx
│   │   │   ├── GraphControls.tsx
│   │   │   ├── NodeDetail.tsx
│   │   │   └── nodes/
│   │   │       ├── IntentNode.tsx
│   │   │       ├── SubIntentNode.tsx
│   │   │       ├── FeatureNode.tsx
│   │   │       ├── TaskNode.tsx
│   │   │       └── UXSpecNode.tsx
│   │   └── ui/
│   │       ├── Spinner.tsx
│   │       └── ErrorMessage.tsx
│   └── lib/
│       ├── graph-utils.ts       # Layout algorithms
│       ├── api-client.ts        # API wrapper
│       └── hooks/
│           ├── useGraph.ts      # Graph data fetching
│           └── useProjects.ts   # Project list fetching
├── public/
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## Implementation Steps

### Phase 1: Project Setup

**Objective:** Create the web package with all necessary configuration

**Tasks:**

1. **Create package directory and initialize**
   ```bash
   mkdir -p packages/web
   cd packages/web
   npm init -y
   ```

2. **Install dependencies**
   ```bash
   # Core Next.js
   npm install next@14 react@18 react-dom@18

   # Graph visualization
   npm install reactflow dagre
   npm install -D @types/dagre

   # Styling
   npm install tailwindcss postcss autoprefixer

   # Data fetching & state
   npm install swr zustand

   # Dev dependencies
   npm install -D typescript @types/react @types/node
   npm install -D eslint eslint-config-next
   ```

3. **Add reference to @pottery/core**
   ```json
   {
     "dependencies": {
       "@pottery/core": "workspace:*"
     }
   }
   ```

4. **Configure TypeScript**
   - Create `tsconfig.json` extending Next.js defaults
   - Set up path aliases for clean imports

5. **Configure Tailwind CSS**
   - Initialize Tailwind: `npx tailwindcss init -p`
   - Configure content paths
   - Set up custom theme colors matching entity types:
     - Purple: ProductIntent
     - Blue: SubIntent
     - Green: Feature
     - Orange: Task
     - Pink: UXSpec

6. **Configure Next.js**
   - Create `next.config.js`
   - Configure to work in monorepo
   - Set up transpilation for workspace packages

7. **Update root pnpm-workspace.yaml**
   - Add `packages/web` to workspace

**Deliverables:**
- Configured Next.js project
- All dependencies installed
- Tailwind CSS configured with custom theme
- TypeScript configured

---

### Phase 2: API Layer

**Objective:** Create API routes to serve project data from filesystem

**API Endpoints:**

#### 1. GET /api/projects
**Purpose:** List all projects
**Returns:**
```typescript
{
  projects: ProjectMetadata[]
}
```

**Implementation:**
```typescript
import { NextResponse } from 'next/server';
import { GlobalProjectStore } from '@pottery/core';

export async function GET() {
  const store = new GlobalProjectStore();
  const projects = await store.listProjects();
  return NextResponse.json({ projects });
}
```

#### 2. GET /api/projects/[projectId]
**Purpose:** Get project metadata
**Returns:**
```typescript
{
  project: ProjectMetadata
}
```

**Implementation:**
```typescript
import { ProjectStore } from '@pottery/core';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const store = new ProjectStore(params.projectId);
  const metadata = await store.loadMetadata();
  return NextResponse.json({ project: metadata });
}
```

#### 3. GET /api/projects/[projectId]/graph
**Purpose:** Get full graph data
**Returns:**
```typescript
{
  version: string;
  nodes: GraphNode[];  // Array of all nodes
  edges: Dependency[]; // Array of all dependencies
  metadata: {
    created_at: string;
    last_modified: string;
  }
}
```

**Implementation:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const store = new ProjectStore(params.projectId);
  const graph = await store.loadGraph();

  // Convert Maps to arrays for JSON serialization
  return NextResponse.json({
    version: graph.version,
    nodes: Array.from(graph.nodes.values()),
    edges: Array.from(graph.edges.values()),
    metadata: graph.metadata
  });
}
```

**Error Handling:**
- 404 for non-existent projects
- 500 for filesystem errors
- Proper error messages in JSON format

**Deliverables:**
- 3 working API endpoints
- Error handling for all routes
- Type-safe responses

---

### Phase 3: Data Hooks

**Objective:** Create React hooks for data fetching with SWR

#### useProjects Hook
```typescript
// lib/hooks/useProjects.ts
import useSWR from 'swr';
import { ProjectMetadata } from '@pottery/core';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useProjects() {
  const { data, error, isLoading } = useSWR<{ projects: ProjectMetadata[] }>(
    '/api/projects',
    fetcher
  );

  return {
    projects: data?.projects ?? [],
    isLoading,
    error
  };
}
```

#### useGraph Hook
```typescript
// lib/hooks/useGraph.ts
import useSWR from 'swr';
import { GraphNode, Dependency } from '@pottery/core';

interface GraphData {
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
    `/api/projects/${projectId}/graph`,
    fetcher
  );

  return {
    graph: data,
    isLoading,
    error
  };
}
```

**Deliverables:**
- `useProjects` hook
- `useGraph` hook
- Loading and error states handled

---

### Phase 4: Graph Layout Utilities

**Objective:** Implement automatic graph layout using Dagre

```typescript
// lib/graph-utils.ts
import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { GraphNode, Dependency } from '@pottery/core';

/**
 * Calculate hierarchical layout for graph nodes
 */
export function layoutGraph(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure layout: top-to-bottom, spacing between nodes
  dagreGraph.setGraph({
    rankdir: 'TB',  // Top to bottom
    ranksep: 100,   // Vertical spacing
    nodesep: 80     // Horizontal spacing
  });

  // Add all nodes with their dimensions
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, {
      width: getNodeWidth(node.type),
      height: getNodeHeight(node.type)
    });
  });

  // Add all edges
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map(node => {
    const { x, y } = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: x - getNodeWidth(node.type) / 2,
        y: y - getNodeHeight(node.type) / 2
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}

function getNodeWidth(type?: string): number {
  switch (type) {
    case 'intent': return 250;
    case 'subintent': return 220;
    case 'feature': return 200;
    case 'task': return 180;
    case 'uxspec': return 180;
    default: return 200;
  }
}

function getNodeHeight(type?: string): number {
  return 80;
}

/**
 * Convert graph data to React Flow format
 */
export function convertToReactFlow(
  nodes: GraphNode[],
  edges: Dependency[]
): { nodes: Node[]; edges: Edge[] } {
  const flowNodes: Node[] = nodes.map(node => ({
    id: node.id,
    type: getNodeType(node),
    data: node,
    position: { x: 0, y: 0 } // Will be set by layoutGraph
  }));

  const flowEdges: Edge[] = edges.map(edge => ({
    id: edge.id,
    source: edge.from_id,
    target: edge.to_id,
    type: getEdgeType(edge.type),
    label: edge.type,
    animated: edge.type === 'impacts'
  }));

  return layoutGraph(flowNodes, flowEdges);
}

function getNodeType(node: GraphNode): string {
  if (node.id.startsWith('intent-')) return 'intent';
  if (node.id.startsWith('subintent-')) return 'subintent';
  if (node.id.startsWith('feature-')) return 'feature';
  if (node.id.startsWith('task-')) return 'task';
  if (node.id.startsWith('uxspec-')) return 'uxspec';
  return 'default';
}

function getEdgeType(depType: string): string {
  switch (depType) {
    case 'requires': return 'default';
    case 'blocks': return 'step';
    case 'impacts': return 'smoothstep';
    case 'supersedes': return 'straight';
    default: return 'default';
  }
}
```

**Deliverables:**
- Graph layout algorithm
- Conversion utilities
- Node/edge type mapping

---

### Phase 5: Custom Node Components

**Objective:** Create custom React Flow node components for each entity type

#### Base Node Style
All nodes share:
- Rounded borders
- Shadow
- Colored border (2px, type-specific)
- White background
- Node ID and version display
- Click to select

#### IntentNode Component
```typescript
// components/graph/nodes/IntentNode.tsx
import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ProductIntent } from '@pottery/core';

interface IntentNodeProps {
  data: ProductIntent;
  selected?: boolean;
}

export const IntentNode = memo(({ data, selected }: IntentNodeProps) => {
  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[250px]
      ${selected ? 'border-purple-700' : 'border-purple-500'}
      ${selected ? 'ring-2 ring-purple-300' : ''}
    `}>
      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono">
          {data.id} • v{data.version}
        </div>
        <div className="font-bold text-sm text-purple-900">
          {data.name}
        </div>
        <div className="text-xs text-gray-600">
          {data.linked_sub_intents.length} sub-intents
        </div>
      </div>

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

IntentNode.displayName = 'IntentNode';
```

#### SubIntentNode Component
```typescript
// components/graph/nodes/SubIntentNode.tsx
// Similar structure, blue theme (border-blue-500, text-blue-900)
// Shows: linked_features.length
```

#### FeatureNode Component
```typescript
// components/graph/nodes/FeatureNode.tsx
// Green theme (border-green-500, text-green-900)
// Shows: linked_tasks.length, ux_spec indicator (pink dot if present)
```

#### TaskNode Component
```typescript
// components/graph/nodes/TaskNode.tsx
// Orange theme (border-orange-500, text-orange-900)
// Shows: task.type badge (Backend/Frontend/Test/Infra)
```

#### UXSpecNode Component
```typescript
// components/graph/nodes/UXSpecNode.tsx
// Pink theme (border-pink-500, text-pink-900)
// Shows: experience_goal (truncated)
```

**Color Palette:**
```typescript
// Tailwind config
module.exports = {
  theme: {
    extend: {
      colors: {
        'node-intent': '#9333ea',      // purple-600
        'node-subintent': '#2563eb',   // blue-600
        'node-feature': '#16a34a',     // green-600
        'node-task': '#ea580c',        // orange-600
        'node-uxspec': '#db2777',      // pink-600
      }
    }
  }
}
```

**Deliverables:**
- 5 custom node components
- Consistent styling with type-specific colors
- Handles for connections

---

### Phase 6: Graph Controls

**Objective:** Create control panel for graph interactions

```typescript
// components/graph/GraphControls.tsx
'use client';

import { useState } from 'react';
import { useReactFlow } from 'reactflow';

interface GraphControlsProps {
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: NodeTypeFilter) => void;
}

interface NodeTypeFilter {
  intent: boolean;
  subintent: boolean;
  feature: boolean;
  task: boolean;
  uxspec: boolean;
}

export function GraphControls({ onSearchChange, onFilterChange }: GraphControlsProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<NodeTypeFilter>({
    intent: true,
    subintent: true,
    feature: true,
    task: true,
    uxspec: true
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const handleFilterToggle = (type: keyof NodeTypeFilter) => {
    const newFilters = { ...filters, [type]: !filters[type] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 w-64">
      {/* Search */}
      <input
        type="text"
        placeholder="Search nodes..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full px-3 py-2 border rounded-md mb-3"
      />

      {/* Filters */}
      <div className="space-y-2 mb-3">
        <div className="text-xs font-semibold text-gray-600 uppercase">
          Node Types
        </div>
        {Object.entries(filters).map(([type, enabled]) => (
          <label key={type} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => handleFilterToggle(type as keyof NodeTypeFilter)}
              className="rounded"
            />
            <span className="text-sm capitalize">{type}</span>
          </label>
        ))}
      </div>

      {/* View Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => zoomIn()}
          className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          Zoom In
        </button>
        <button
          onClick={() => zoomOut()}
          className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          Zoom Out
        </button>
      </div>
      <button
        onClick={() => fitView()}
        className="w-full mt-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
      >
        Fit View
      </button>
    </div>
  );
}
```

**Deliverables:**
- Search functionality
- Type filters (checkboxes)
- Zoom controls
- Fit to view button

---

### Phase 7: Node Detail Panel

**Objective:** Create side panel showing full node information

```typescript
// components/graph/NodeDetail.tsx
'use client';

import { GraphNode, Dependency } from '@pottery/core';
import { X } from 'lucide-react'; // Icon library

interface NodeDetailProps {
  nodeId: string;
  nodes: GraphNode[];
  edges: Dependency[];
  onClose: () => void;
}

export function NodeDetail({ nodeId, nodes, edges, onClose }: NodeDetailProps) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  // Find dependencies
  const incomingDeps = edges.filter(e => e.to_id === nodeId);
  const outgoingDeps = edges.filter(e => e.from_id === nodeId);

  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-white border-l shadow-xl overflow-y-auto z-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
        <h2 className="font-bold text-lg">{node.name || node.id}</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <Section title="Basic Information">
          <InfoRow label="ID" value={node.id} />
          <InfoRow label="Version" value={node.version} />
          <InfoRow label="Type" value={getNodeTypeName(node)} />
        </Section>

        {/* Description */}
        {node.description && (
          <Section title="Description">
            <p className="text-sm text-gray-700">{node.description}</p>
          </Section>
        )}

        {/* Type-specific content */}
        {renderTypeSpecificContent(node, nodes)}

        {/* Dependencies */}
        {incomingDeps.length > 0 && (
          <Section title="Required By">
            <DependencyList dependencies={incomingDeps} nodes={nodes} />
          </Section>
        )}

        {outgoingDeps.length > 0 && (
          <Section title="Depends On">
            <DependencyList dependencies={outgoingDeps} nodes={nodes} />
          </Section>
        )}

        {/* Timestamps */}
        <Section title="Metadata">
          <InfoRow label="Created" value={formatDate(node.created_at)} />
          {node.updated_at && (
            <InfoRow label="Updated" value={formatDate(node.updated_at)} />
          )}
        </Section>
      </div>
    </div>
  );
}

// Helper components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}:</span>
      <span className="font-mono text-gray-900">{value}</span>
    </div>
  );
}
```

**Content by Node Type:**

- **ProductIntent:** List of sub-intents, features
- **SubIntent:** Parent intent, linked features
- **Feature:** Linked intent, tasks, UX spec (if exists)
- **Task:** Parent feature, type, dependencies
- **UXSpec:** Linked feature, experience goal, design refs

**Deliverables:**
- Sliding side panel
- Type-specific content rendering
- Dependency visualization
- Close button

---

### Phase 8: Main Graph View

**Objective:** Assemble all components into interactive graph

```typescript
// components/graph/GraphView.tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { IntentNode } from './nodes/IntentNode';
import { SubIntentNode } from './nodes/SubIntentNode';
import { FeatureNode } from './nodes/FeatureNode';
import { TaskNode } from './nodes/TaskNode';
import { UXSpecNode } from './nodes/UXSpecNode';
import { GraphControls } from './GraphControls';
import { NodeDetail } from './NodeDetail';
import { useGraph } from '@/lib/hooks/useGraph';
import { convertToReactFlow } from '@/lib/graph-utils';

interface GraphViewProps {
  projectId: string;
}

export function GraphView({ projectId }: GraphViewProps) {
  const { graph, isLoading, error } = useGraph(projectId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    intent: true,
    subintent: true,
    feature: true,
    task: true,
    uxspec: true
  });

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      intent: IntentNode,
      subintent: SubIntentNode,
      feature: FeatureNode,
      task: TaskNode,
      uxspec: UXSpecNode,
    }),
    []
  );

  // Convert graph data to React Flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return convertToReactFlow(graph.nodes, graph.edges);
  }, [graph]);

  // Apply filters and search
  const filteredNodes = useMemo(() => {
    return initialNodes.filter(node => {
      // Type filter
      if (!filters[node.type as keyof typeof filters]) return false;

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nodeName = node.data.name?.toLowerCase() || '';
        const nodeId = node.id.toLowerCase();
        return nodeName.includes(searchLower) || nodeId.includes(searchLower);
      }

      return true;
    });
  }, [initialNodes, filters, searchQuery]);

  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when filters change
  useMemo(() => {
    setNodes(filteredNodes);
  }, [filteredNodes, setNodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error loading graph: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <Background />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'intent': return '#9333ea';
              case 'subintent': return '#2563eb';
              case 'feature': return '#16a34a';
              case 'task': return '#ea580c';
              case 'uxspec': return '#db2777';
              default: return '#6b7280';
            }
          }}
        />

        <Panel position="top-left">
          <GraphControls
            onSearchChange={setSearchQuery}
            onFilterChange={setFilters}
          />
        </Panel>
      </ReactFlow>

      {selectedNodeId && graph && (
        <NodeDetail
          nodeId={selectedNodeId}
          nodes={graph.nodes}
          edges={graph.edges}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}
```

**Deliverables:**
- Fully integrated interactive graph
- All custom nodes rendering
- Controls overlay
- Minimap
- Node detail panel

---

### Phase 9: Pages

**Objective:** Create Next.js pages for routing

#### Home Page (Project List)
```typescript
// app/page.tsx
import Link from 'next/link';
import { useProjects } from '@/lib/hooks/useProjects';

export default function HomePage() {
  const { projects, isLoading, error } = useProjects();

  if (isLoading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pottery Projects</h1>

      {projects.length === 0 ? (
        <div className="text-gray-500">
          No projects yet. Create one using:
          <code className="block mt-2 p-2 bg-gray-100 rounded">
            pottery create --intent "your idea"
          </code>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <Link
              key={project.project_id}
              href={`/projects/${project.project_id}`}
              className="block p-4 border rounded-lg hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <div className="text-sm text-gray-500 mt-1">
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
```

#### Project View Page
```typescript
// app/projects/[projectId]/page.tsx
'use client';

import { use } from 'react';
import { GraphView } from '@/components/graph/GraphView';

export default function ProjectPage({
  params
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params);

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b px-4 py-3">
        <h1 className="text-xl font-semibold">Project: {projectId}</h1>
      </header>
      <main className="flex-1">
        <GraphView projectId={projectId} />
      </main>
    </div>
  );
}
```

#### Root Layout
```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pottery - Project Visualization',
  description: 'Interactive visualization of Pottery project graphs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

**Deliverables:**
- Home page with project list
- Project detail page with graph
- Root layout

---

### Phase 10: CLI Integration

**Objective:** Update `pottery serve` command to start Next.js server

```typescript
// packages/cli/src/commands/serve/index.ts
import { Command } from 'commander';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import open from 'open';

const execAsync = promisify(exec);

const SERVER_PID_FILE = path.join(
  process.env.HOME || '~',
  '.pottery',
  'servers.json'
);

interface ServerInfo {
  port: number;
  projectId: string;
  pid: number;
  startedAt: string;
}

export const serveCommand = new Command('serve')
  .description('Manage web UI server')
  .option('--project-id <id>', 'Project ID to serve')
  .option('--port <port>', 'Port number', '3000')
  .action(async (options) => {
    if (!options.projectId) {
      console.error(chalk.red('Error: --project-id is required'));
      process.exit(1);
    }

    await startServer(options.projectId, parseInt(options.port));
  });

serveCommand
  .command('stop')
  .option('--port <port>', 'Port to stop (if not specified, stops all)')
  .action(async (options) => {
    await stopServer(options.port ? parseInt(options.port) : undefined);
  });

serveCommand
  .command('list')
  .action(async () => {
    await listServers();
  });

async function startServer(projectId: string, port: number) {
  // Verify project exists
  const { ProjectStore } = await import('@pottery/core');
  const store = new ProjectStore(projectId);

  try {
    await store.loadMetadata();
  } catch (error) {
    console.error(chalk.red(`Error: Project ${projectId} not found`));
    process.exit(1);
  }

  // Check if port is already in use
  const servers = await loadServers();
  if (servers.find(s => s.port === port)) {
    console.error(chalk.red(`Error: Port ${port} is already in use`));
    process.exit(1);
  }

  console.log(chalk.blue('🌐 Starting Pottery server...'));

  // Start Next.js server
  const webPackagePath = path.resolve(__dirname, '../../../../web');

  const serverProcess = spawn(
    'pnpm',
    ['--filter', '@pottery/web', 'dev', '--port', port.toString()],
    {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        POTTERY_PROJECT_ID: projectId
      }
    }
  );

  serverProcess.unref();

  // Save server info
  servers.push({
    port,
    projectId,
    pid: serverProcess.pid!,
    startedAt: new Date().toISOString()
  });
  await saveServers(servers);

  console.log(chalk.green('✓') + ' Server running at ' + chalk.cyan(`http://localhost:${port}`));
  console.log(`  Project: ${projectId}`);
  console.log(`  PID: ${serverProcess.pid}`);
  console.log();
  console.log(chalk.dim('💡 View server status: pottery serve list'));
  console.log(chalk.dim('   Stop server: pottery serve stop --port ' + port));

  // Wait a moment for server to start, then open browser
  setTimeout(async () => {
    console.log('\nOpening browser...');
    await open(`http://localhost:${port}/projects/${projectId}`);
  }, 3000);
}

async function stopServer(port?: number) {
  const servers = await loadServers();

  if (port) {
    // Stop specific server
    const server = servers.find(s => s.port === port);
    if (!server) {
      console.error(chalk.red(`No server running on port ${port}`));
      return;
    }

    try {
      process.kill(server.pid);
      console.log(chalk.green('✓') + ` Stopped server on port ${port}`);
    } catch (error) {
      console.error(chalk.red(`Failed to stop server: ${error.message}`));
    }

    await saveServers(servers.filter(s => s.port !== port));
  } else {
    // Stop all servers
    if (servers.length === 0) {
      console.log('No servers running');
      return;
    }

    for (const server of servers) {
      try {
        process.kill(server.pid);
        console.log(chalk.green('✓') + ` Stopped server on port ${server.port}`);
      } catch (error) {
        console.error(chalk.red(`Failed to stop server on port ${server.port}`));
      }
    }

    await saveServers([]);
  }
}

async function listServers() {
  const servers = await loadServers();

  if (servers.length === 0) {
    console.log('No servers running');
    return;
  }

  console.log(chalk.bold(`Running servers (${servers.length}):\n`));

  for (const server of servers) {
    console.log(`  Port ${chalk.cyan(server.port)}  ${server.projectId}  PID: ${server.pid}`);
  }

  console.log();
  console.log('Stop a server: pottery serve stop --port <port>');
  console.log('Stop all: pottery serve stop');
}

async function loadServers(): Promise<ServerInfo[]> {
  try {
    return await fs.readJSON(SERVER_PID_FILE);
  } catch {
    return [];
  }
}

async function saveServers(servers: ServerInfo[]) {
  await fs.ensureDir(path.dirname(SERVER_PID_FILE));
  await fs.writeJSON(SERVER_PID_FILE, servers, { spaces: 2 });
}
```

**Updates to package.json:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

**Deliverables:**
- Working `pottery serve --project-id <id>` command
- Background process management
- `pottery serve stop` and `pottery serve list`
- Auto-open browser

---

## Testing Plan

### Unit Tests
- Graph layout algorithm
- Data conversion utilities
- Node type detection
- Filter/search logic

### Integration Tests
1. **API Routes**
   - Test all endpoints with real project data
   - Verify error handling
   - Check response formats

2. **Data Flow**
   - Create project via CLI
   - Start server
   - Verify graph loads correctly

### Manual Testing

**Test Scenarios:**

1. **Empty State**
   - No projects exist
   - Verify home page shows helpful message

2. **Single Project**
   - Create simple project (5-10 nodes)
   - Verify all nodes render
   - Test zoom, pan, search
   - Click nodes to see details

3. **Complex Project**
   - Create project with 50+ nodes
   - Test performance
   - Verify layout is readable
   - Test filtering by type

4. **All Node Types**
   - Verify ProductIntent, SubIntent, Feature, Task, UXSpec all render correctly
   - Check colors match specification
   - Verify dependency edges display

5. **Server Management**
   - Start multiple servers on different ports
   - List running servers
   - Stop individual server
   - Stop all servers

**Performance Targets:**
- Graph with 100 nodes loads in < 2 seconds
- Smooth 60fps interaction (zoom, pan)
- Search/filter updates < 100ms

---

## Expected Deliverables

### 1. New Package: `@pottery/web`
Complete Next.js application with all components and pages

### 2. Working Commands
- `pottery serve --project-id <id>` - Start server
- `pottery serve stop` - Stop all servers
- `pottery serve stop --port <port>` - Stop specific server
- `pottery serve list` - List running servers

### 3. Interactive Features
- ✅ Zoom/pan graph
- ✅ Search nodes by name or ID
- ✅ Filter by node type
- ✅ Click to view node details
- ✅ Minimap for navigation
- ✅ Automatic layout
- ✅ Colored nodes by type
- ✅ Dependency visualization

### 4. Views
- ✅ Home page (project list)
- ✅ Project graph view
- ⏸️ Change request view (deferred)
- ⏸️ Version history view (deferred)

---

## Dependencies on Existing Code

### From @pottery/core
- All model types (ProductIntent, SubIntent, Feature, Task, UXSpec, Dependency)
- ProjectStore (for API routes)
- GlobalProjectStore (for project list)
- Graph type and utilities

### From @pottery/cli
- Update serve command only
- No changes to other commands needed

---

## Risks & Mitigation

### Risk: Performance with Large Graphs
**Mitigation:**
- Use React Flow's built-in virtualization
- Test with 500+ node graphs
- Implement pagination/chunking if needed

### Risk: Complex Layout Calculation
**Mitigation:**
- Dagre is battle-tested
- Fallback to simple grid layout if needed
- Allow manual node repositioning in future

### Risk: Server Process Management
**Mitigation:**
- Track PIDs reliably
- Handle orphaned processes
- Provide clear error messages

---

## Future Enhancements (Not in This Phase)

1. **Change Request Visualization**
   - Show pending CRs
   - Highlight affected nodes
   - Display impact analysis

2. **Version History**
   - Timeline view
   - Diff between versions
   - Restore to previous version

3. **Graph Editing**
   - Drag to reposition nodes
   - Add/remove nodes via UI
   - Edit node properties

4. **Export**
   - Export graph as PNG/SVG
   - Export data as JSON
   - Generate documentation

5. **Collaboration**
   - Multi-user viewing
   - Real-time updates
   - Comments on nodes

---

## Success Criteria

✅ User can run `pottery serve --project-id <id>` and see their project graph
✅ All 5 node types render correctly with distinct colors
✅ Graph is interactive (zoom, pan, search, filter)
✅ Clicking a node shows detailed information
✅ Dependency edges are visible and styled correctly
✅ Server can be stopped and restarted
✅ Multiple projects can be served on different ports
✅ Performance is smooth with 100+ node graphs

---

## Timeline Estimate

- **Phase 1-2 (Setup + API):** 1 day
- **Phase 3-4 (Hooks + Layout):** 1 day
- **Phase 5-6 (Nodes + Controls):** 2 days
- **Phase 7-8 (Detail Panel + Graph View):** 2 days
- **Phase 9-10 (Pages + CLI):** 1 day
- **Testing + Polish:** 1 day

**Total: 8 days**

---

## Conclusion

This plan provides a complete roadmap for implementing web visualization in Pottery. The implementation follows the original specification closely while focusing on the core graph visualization features. Change request and version history visualization are explicitly deferred to keep scope manageable.

The architecture leverages industry-standard tools (Next.js, React Flow, Dagre, Tailwind) that are well-documented and maintainable. The read-only nature of the MVP keeps the implementation straightforward while providing significant value to users.
