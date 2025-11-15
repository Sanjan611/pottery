import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { SubIntent } from '@pottery/core/types';

interface SubIntentNodeProps {
  data: SubIntent;
  selected?: boolean;
}

export const SubIntentNode = memo(({ data, selected }: SubIntentNodeProps) => {
  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[220px]
      ${selected ? 'border-blue-700' : 'border-blue-500'}
      ${selected ? 'ring-2 ring-blue-300' : ''}
    `}>
      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono">
          {data.id} • v{data.version}
        </div>
        <div className="font-bold text-sm text-blue-900">
          {data.name}
        </div>
        <div className="text-xs text-gray-600">
          {data.linked_features.length} feature{data.linked_features.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

SubIntentNode.displayName = 'SubIntentNode';
