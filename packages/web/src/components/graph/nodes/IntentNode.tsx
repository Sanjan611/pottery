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
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono">
          {data.id} • v{data.version}
        </div>
        <div className="font-bold text-sm text-purple-900">
          {data.name}
        </div>
        <div className="text-xs text-gray-600">
          {data.linked_sub_intents.length} sub-intent{data.linked_sub_intents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

IntentNode.displayName = 'IntentNode';
