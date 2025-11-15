import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Capability } from '@pottery/core/types';

interface CapabilityNodeProps {
  data: Capability;
  selected?: boolean;
}

export const CapabilityNode = memo(({ data, selected }: CapabilityNodeProps) => {
  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[230px]
      ${selected ? 'border-green-700' : 'border-green-500'}
      ${selected ? 'ring-2 ring-green-300' : ''}
    `}>
      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono truncate">
          {data.id} • v{data.version}
        </div>
        <div className="font-bold text-sm text-green-900">
          {data.name}
        </div>
        <div className="text-xs text-gray-600 line-clamp-2">
          {data.description}
        </div>
        <div className="flex gap-2 text-xs text-gray-500">
          {data.linkedUserStories.length > 0 && (
            <span>← {data.linkedUserStories.length} story{data.linkedUserStories.length !== 1 ? 'ies' : ''}</span>
          )}
          {data.linkedTechnicalReqs.length > 0 && (
            <span>→ {data.linkedTechnicalReqs.length} req{data.linkedTechnicalReqs.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

CapabilityNode.displayName = 'CapabilityNode';

