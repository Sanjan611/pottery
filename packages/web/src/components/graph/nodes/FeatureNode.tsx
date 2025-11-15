import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Feature } from '@pottery/core/types';

interface FeatureNodeProps {
  data: Feature;
  selected?: boolean;
}

export const FeatureNode = memo(({ data, selected }: FeatureNodeProps) => {
  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[200px]
      ${selected ? 'border-green-700' : 'border-green-500'}
      ${selected ? 'ring-2 ring-green-300' : ''}
    `}>
      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500 font-mono truncate">
            {data.id} • v{data.version}
          </div>
          {data.ux_spec && (
            <div className="w-2 h-2 rounded-full bg-pink-500" title="Has UX Spec" />
          )}
        </div>
        <div className="font-bold text-sm text-green-900">
          {data.name}
        </div>
        <div className="text-xs text-gray-600">
          {data.linked_tasks.length} task{data.linked_tasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

FeatureNode.displayName = 'FeatureNode';
