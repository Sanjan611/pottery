'use client';

import { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export interface NodeTypeFilter {
  intent: boolean;
  subintent: boolean;
  feature: boolean;
  task: boolean;
  uxspec: boolean;
  epic: boolean;
  userstory: boolean;
  capability: boolean;
  flowscreen: boolean;
  flowaction: boolean;
  technicalrequirement: boolean;
}

interface GraphControlsProps {
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: NodeTypeFilter) => void;
}

export function GraphControls({ onSearchChange, onFilterChange }: GraphControlsProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<NodeTypeFilter>({
    intent: true,
    subintent: true,
    feature: true,
    task: true,
    uxspec: true,
    epic: true,
    userstory: true,
    capability: true,
    flowscreen: true,
    flowaction: true,
    technicalrequirement: true
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const handleFilterToggle = (type: keyof NodeTypeFilter) => {
    const newFilters = { ...filters, [type]: !filters[type] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-64">
      {/* Search */}
      <input
        type="text"
        placeholder="Search nodes..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full px-3 py-2 border rounded-md mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Filters */}
      <div className="space-y-2 mb-3">
        <div className="text-xs font-semibold text-gray-600 uppercase">
          Node Types
        </div>
        {Object.entries(filters).map(([type, enabled]) => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => handleFilterToggle(type as keyof NodeTypeFilter)}
              className="rounded cursor-pointer"
            />
            <span className="text-sm capitalize">
              {type.replace('intent', ' intent')
                   .replace('userstory', 'user story')
                   .replace('flowscreen', 'flow screen')
                   .replace('flowaction', 'flow action')
                   .replace('technicalrequirement', 'technical requirement')}
            </span>
          </label>
        ))}
      </div>

      {/* View Controls */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
          View Controls
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => zoomIn()}
            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm transition"
          >
            <ZoomIn size={14} />
            <span>Zoom In</span>
          </button>
          <button
            onClick={() => zoomOut()}
            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm transition"
          >
            <ZoomOut size={14} />
            <span>Zoom Out</span>
          </button>
        </div>
        <button
          onClick={() => fitView()}
          className="flex items-center justify-center gap-1 w-full px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm transition"
        >
          <Maximize2 size={14} />
          <span>Fit View</span>
        </button>
      </div>
    </div>
  );
}
