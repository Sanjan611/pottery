'use client';

export type GraphType = 'feature' | 'flow' | 'both';

interface GraphSelectorProps {
  selectedGraph: GraphType;
  onGraphChange: (graph: GraphType) => void;
}

export function GraphSelector({ selectedGraph, onGraphChange }: GraphSelectorProps) {
  return (
    <div className="flex gap-2 bg-white p-2 rounded-lg shadow-md border border-gray-200">
      <button
        onClick={() => onGraphChange('feature')}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
          selectedGraph === 'feature'
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        🔧 Feature
      </button>
      <button
        onClick={() => onGraphChange('flow')}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
          selectedGraph === 'flow'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        🔄 Flow
      </button>
      <button
        onClick={() => onGraphChange('both')}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
          selectedGraph === 'both'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        🌐 Both
      </button>
    </div>
  );
}

