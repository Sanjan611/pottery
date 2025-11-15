import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { UserStory } from '@pottery/core/types';

interface UserStoryNodeProps {
  data: UserStory;
  selected?: boolean;
}

export const UserStoryNode = memo(({ data, selected }: UserStoryNodeProps) => {
  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[220px]
      ${selected ? 'border-purple-700' : 'border-purple-400'}
      ${selected ? 'ring-2 ring-purple-300' : ''}
    `}>
      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono truncate">
          {data.id} • v{data.version}
        </div>
        <div className="font-semibold text-sm text-purple-800 line-clamp-3">
          {data.narrative}
        </div>
        <div className="text-xs text-gray-500">
          {data.acceptanceCriteria.length} acceptance criteria
        </div>
        {data.linkedCapabilities.length > 0 && (
          <div className="text-xs text-gray-500">
            → {data.linkedCapabilities.length} capability{data.linkedCapabilities.length !== 1 ? 'ies' : ''}
          </div>
        )}
      </div>

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

UserStoryNode.displayName = 'UserStoryNode';

