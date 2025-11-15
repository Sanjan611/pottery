import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { TechnicalRequirement } from '@pottery/core/types';

interface TechnicalRequirementNodeProps {
  data: TechnicalRequirement;
  selected?: boolean;
}

const reqTypeBadgeColors: Record<string, string> = {
  'performance': 'bg-blue-100 text-blue-800',
  'security': 'bg-red-100 text-red-800',
  'scalability': 'bg-green-100 text-green-800',
  'reliability': 'bg-yellow-100 text-yellow-800',
  'other': 'bg-gray-100 text-gray-800',
};

export const TechnicalRequirementNode = memo(({ data, selected }: TechnicalRequirementNodeProps) => {
  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[210px]
      ${selected ? 'border-orange-700' : 'border-orange-500'}
      ${selected ? 'ring-2 ring-orange-300' : ''}
    `}>
      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono truncate">
          {data.id} • v{data.version}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${reqTypeBadgeColors[data.type] || 'bg-gray-100 text-gray-800'}`}>
          {data.type}
        </span>
        <div className="font-semibold text-sm text-orange-900 line-clamp-2">
          {data.specification}
        </div>
        <div className="flex gap-2 text-xs text-gray-500">
          {data.linkedCapabilities.length > 0 && (
            <span>← {data.linkedCapabilities.length} capability{data.linkedCapabilities.length !== 1 ? 'ies' : ''}</span>
          )}
          {data.linkedTasks.length > 0 && (
            <span>→ {data.linkedTasks.length} task{data.linkedTasks.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

TechnicalRequirementNode.displayName = 'TechnicalRequirementNode';

