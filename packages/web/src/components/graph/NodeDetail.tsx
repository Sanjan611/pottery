'use client';

import type { GraphNode, Dependency, ProductIntent, SubIntent, Feature, Task, UXSpec, TaskType } from '@pottery/core';
import { X } from 'lucide-react';

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
        <h2 className="font-bold text-lg">
          {'name' in node ? node.name : node.id}
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <Section title="Basic Information">
          <InfoRow label="ID" value={node.id} />
          <InfoRow label="Version" value={'version' in node ? node.version : 'N/A'} />
          <InfoRow label="Type" value={getNodeTypeName(node)} />
        </Section>

        {/* Description */}
        {'description' in node && node.description && (
          <Section title="Description">
            <p className="text-sm text-gray-700">{node.description}</p>
          </Section>
        )}

        {/* Type-specific content */}
        {renderTypeSpecificContent(node, nodes)}

        {/* Dependencies */}
        {incomingDeps.length > 0 && (
          <Section title="Depends On">
            <DependencyList dependencies={incomingDeps} nodes={nodes} direction="from" />
          </Section>
        )}

        {outgoingDeps.length > 0 && (
          <Section title="Required By">
            <DependencyList dependencies={outgoingDeps} nodes={nodes} direction="to" />
          </Section>
        )}

        {/* Timestamps */}
        <Section title="Metadata">
          <InfoRow label="Created" value={formatDate(node.created_at)} />
          {'updated_at' in node && (
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
      <span className="font-mono text-gray-900 text-right ml-2">{value}</span>
    </div>
  );
}

function DependencyList({
  dependencies,
  nodes,
  direction
}: {
  dependencies: Dependency[];
  nodes: GraphNode[];
  direction: 'from' | 'to';
}) {
  return (
    <div className="space-y-2">
      {dependencies.map(dep => {
        const targetId = direction === 'from' ? dep.from_id : dep.to_id;
        const targetNode = nodes.find(n => n.id === targetId);
        const nodeName = targetNode && 'name' in targetNode ? targetNode.name : targetId;

        return (
          <div key={dep.id} className="text-sm bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-900">{nodeName}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {dep.type} • {targetId}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getNodeTypeName(node: GraphNode): string {
  if (node.id.startsWith('intent-')) return 'Product Intent';
  if (node.id.startsWith('subintent-')) return 'Sub Intent';
  if (node.id.startsWith('feature-')) return 'Feature';
  if (node.id.startsWith('task-')) return 'Task';
  if (node.id.startsWith('uxspec-')) return 'UX Spec';
  return 'Unknown';
}

function renderTypeSpecificContent(node: GraphNode, nodes: GraphNode[]) {
  if (node.id.startsWith('intent-')) {
    const intent = node as ProductIntent;
    return (
      <Section title="Sub Intents">
        <div className="text-sm text-gray-700">
          {intent.linked_sub_intents.length} linked sub-intent{intent.linked_sub_intents.length !== 1 ? 's' : ''}
        </div>
      </Section>
    );
  }

  if (node.id.startsWith('subintent-')) {
    const subIntent = node as SubIntent;
    const parentIntent = nodes.find(n => n.id === subIntent.parent_intent) as ProductIntent | undefined;
    return (
      <>
        <Section title="Parent Intent">
          <div className="text-sm text-gray-700">
            {parentIntent && 'name' in parentIntent ? parentIntent.name : subIntent.parent_intent}
          </div>
        </Section>
        <Section title="Features">
          <div className="text-sm text-gray-700">
            {subIntent.linked_features.length} linked feature{subIntent.linked_features.length !== 1 ? 's' : ''}
          </div>
        </Section>
      </>
    );
  }

  if (node.id.startsWith('feature-')) {
    const feature = node as Feature;
    const linkedIntent = nodes.find(n => n.id === feature.linked_intent) as SubIntent | undefined;
    const uxSpec = feature.ux_spec ? nodes.find(n => n.id === feature.ux_spec) as UXSpec | undefined : undefined;

    return (
      <>
        <Section title="Linked Intent">
          <div className="text-sm text-gray-700">
            {linkedIntent && 'name' in linkedIntent ? linkedIntent.name : feature.linked_intent}
          </div>
        </Section>
        {uxSpec && (
          <Section title="UX Spec">
            <div className="text-sm text-gray-700">
              <div className="font-medium">{uxSpec.id}</div>
              <div className="text-xs text-gray-600 mt-1">{uxSpec.experience_goal}</div>
            </div>
          </Section>
        )}
        <Section title="Tasks">
          <div className="text-sm text-gray-700">
            {feature.linked_tasks.length} linked task{feature.linked_tasks.length !== 1 ? 's' : ''}
          </div>
        </Section>
      </>
    );
  }

  if (node.id.startsWith('task-')) {
    const task = node as Task;
    const parentFeature = nodes.find(n => n.id === task.parent_feature) as Feature | undefined;

    const taskTypeLabels: Record<string, string> = {
      'backend': 'Backend',
      'frontend': 'Frontend',
      'test': 'Test',
      'infra': 'Infrastructure',
    };

    return (
      <>
        <Section title="Task Type">
          <div className="text-sm text-gray-700">{taskTypeLabels[task.type] || task.type}</div>
        </Section>
        <Section title="Parent Feature">
          <div className="text-sm text-gray-700">
            {parentFeature && 'name' in parentFeature ? parentFeature.name : task.parent_feature}
          </div>
        </Section>
        {task.dependencies.length > 0 && (
          <Section title="Task Dependencies">
            <div className="text-sm text-gray-700">
              {task.dependencies.length} dependenc{task.dependencies.length !== 1 ? 'ies' : 'y'}
            </div>
          </Section>
        )}
      </>
    );
  }

  if (node.id.startsWith('uxspec-')) {
    const uxspec = node as UXSpec;
    const linkedFeature = nodes.find(n => n.id === uxspec.linked_feature) as Feature | undefined;

    return (
      <>
        <Section title="Linked Feature">
          <div className="text-sm text-gray-700">
            {linkedFeature && 'name' in linkedFeature ? linkedFeature.name : uxspec.linked_feature}
          </div>
        </Section>
        {uxspec.design_refs.length > 0 && (
          <Section title="Design References">
            <div className="space-y-1">
              {uxspec.design_refs.map((ref, i) => (
                <div key={i} className="text-sm text-blue-600 break-all">{ref}</div>
              ))}
            </div>
          </Section>
        )}
      </>
    );
  }

  return null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}
