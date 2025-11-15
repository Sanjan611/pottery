import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { FlowAction } from '@pottery/core/types';

interface FlowActionNodeProps {
  data: FlowAction;
  selected?: boolean;
}

export const FlowActionNode = memo(({ data, selected }: FlowActionNodeProps) => {
  const triggerIcon = data.triggerType === 'user' ? '👆' : '⚙️';
  const triggerColor = data.triggerType === 'user' ? 'text-purple-600' : 'text-gray-600';

  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[230px]
      ${selected ? 'border-purple-700' : 'border-purple-500'}
      ${selected ? 'ring-2 ring-purple-300' : ''}
    `}>
      {/* Input handle (left) */}
      <Handle type="target" position={Position.Left} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono truncate">
          {data.id} • v{data.version}
        </div>
        <div className="font-bold text-sm text-purple-900">
          {triggerIcon} {data.name}
        </div>
        <div className="text-xs text-gray-600 line-clamp-2">
          {data.description}
        </div>
        <div className="flex gap-2 text-xs">
          <span className={`font-medium ${triggerColor}`}>
            {data.triggerType === 'user' ? 'User' : 'System'}
          </span>
          {data.nextScreen && (
            <span className="text-gray-500">→ {data.nextScreen.substring(0, 15)}...</span>
          )}
          {data.linkedCapabilities.length > 0 && (
            <span className="text-green-600">🔗 {data.linkedCapabilities.length} cap{data.linkedCapabilities.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Output handle (right) */}
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});

FlowActionNode.displayName = 'FlowActionNode';

