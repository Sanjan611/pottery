import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Epic } from '@pottery/core/types';

interface EpicNodeProps {
  data: Epic;
  selected?: boolean;
}

export const EpicNode = memo(({ data, selected }: EpicNodeProps) => {
  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[250px]
      ${selected ? 'border-purple-700' : 'border-purple-500'}
      ${selected ? 'ring-2 ring-purple-300' : ''}
    `}>
      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono truncate">
          {data.id} • v{data.version}
        </div>
        <div className="font-bold text-sm text-purple-900">
          {data.name}
        </div>
        <div className="text-xs text-gray-600 line-clamp-2">
          {data.description}
        </div>
        <div className="text-xs text-gray-500">
          {data.userStories.length} user story{data.userStories.length !== 1 ? 'ies' : ''}
        </div>
      </div>

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

EpicNode.displayName = 'EpicNode';

