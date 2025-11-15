import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { UXSpec } from '@pottery/core/types';

interface UXSpecNodeProps {
  data: UXSpec;
  selected?: boolean;
}

export const UXSpecNode = memo(({ data, selected }: UXSpecNodeProps) => {
  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[180px]
      ${selected ? 'border-pink-700' : 'border-pink-500'}
      ${selected ? 'ring-2 ring-pink-300' : ''}
    `}>
      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex flex-col gap-1">
        <div className="text-xs text-gray-500 font-mono">
          {data.id}
        </div>
        <div className="font-bold text-sm text-pink-900">
          UX Spec
        </div>
        <div className="text-xs text-gray-600 line-clamp-2">
          {data.experience_goal}
        </div>
      </div>

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

UXSpecNode.displayName = 'UXSpecNode';
