'use client';

import { Layer } from '@pottery/core/types';

interface LayerSelectorProps {
  selectedLayer: Layer | 'all';
  onLayerChange: (layer: Layer | 'all') => void;
}

export function LayerSelector({ selectedLayer, onLayerChange }: LayerSelectorProps) {
  return (
    <div className="flex gap-2 bg-white p-2 rounded-lg shadow-md border border-gray-200">
      <button
        onClick={() => onLayerChange('all')}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
          selectedLayer === 'all'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All Layers
      </button>
      <button
        onClick={() => onLayerChange(Layer.Narrative)}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
          selectedLayer === Layer.Narrative
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        📖 Narrative
      </button>
      <button
        onClick={() => onLayerChange(Layer.Structure)}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
          selectedLayer === Layer.Structure
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        🔗 Structure
      </button>
      <button
        onClick={() => onLayerChange(Layer.Specification)}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
          selectedLayer === Layer.Specification
            ? 'bg-orange-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        ⚙️ Specification
      </button>
    </div>
  );
}

