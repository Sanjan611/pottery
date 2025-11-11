import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Task } from '@pottery/core';

interface TaskNodeProps {
  data: Task;
  selected?: boolean;
}

const taskTypeBadgeColors: Record<string, string> = {
  'backend': 'bg-blue-100 text-blue-800',
  'frontend': 'bg-purple-100 text-purple-800',
  'test': 'bg-yellow-100 text-yellow-800',
  'infra': 'bg-gray-100 text-gray-800',
};

const taskTypeLabels: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'test': 'Test',
  'infra': 'Infra',
};

export const TaskNode = memo(({ data, selected }: TaskNodeProps) => {
  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[180px]
      ${selected ? 'border-orange-700' : 'border-orange-500'}
      ${selected ? 'ring-2 ring-orange-300' : ''}
    `}>
      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono">
          {data.id} • v{data.version}
        </div>
        <div className="font-bold text-sm text-orange-900 line-clamp-2">
          {data.description}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${taskTypeBadgeColors[data.type] || 'bg-gray-100 text-gray-800'}`}>
          {taskTypeLabels[data.type] || data.type}
        </span>
      </div>

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
