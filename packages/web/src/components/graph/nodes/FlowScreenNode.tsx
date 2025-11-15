import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { FlowScreen } from '@pottery/core/types';

interface FlowScreenNodeProps {
  data: FlowScreen;
  selected?: boolean;
}

export const FlowScreenNode = memo(({ data, selected }: FlowScreenNodeProps) => {
  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[230px]
      ${selected ? 'border-blue-700' : 'border-blue-500'}
      ${selected ? 'ring-2 ring-blue-300' : ''}
    `}>
      {/* Input handle (left) */}
      <Handle type="target" position={Position.Left} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono truncate">
          {data.id} • v{data.version}
        </div>
        <div className="font-bold text-sm text-blue-900">
          📱 {data.name}
        </div>
        <div className="text-xs text-gray-600 line-clamp-2">
          {data.description}
        </div>
        <div className="flex gap-2 text-xs text-gray-500">
          {data.actions.length > 0 && (
            <span>⚡ {data.actions.length} action{data.actions.length !== 1 ? 's' : ''}</span>
          )}
          {data.entryTransitions.length > 0 && (
            <span>↗ {data.entryTransitions.length} entry</span>
          )}
        </div>
      </div>

      {/* Output handle (right) */}
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});

FlowScreenNode.displayName = 'FlowScreenNode';

