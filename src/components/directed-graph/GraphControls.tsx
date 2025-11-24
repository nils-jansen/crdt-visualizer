import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Vertex } from '../../types/crdt';

interface GraphControlsProps {
  vertices: Vertex[];
  onAddVertex: (name: string) => void;
  onAddArc: (from: string, to: string) => void;
}

export function GraphControls({ vertices, onAddVertex, onAddArc }: GraphControlsProps) {
  const [vertexName, setVertexName] = useState('');
  const [arcFrom, setArcFrom] = useState('');
  const [arcTo, setArcTo] = useState('');

  const handleAddVertex = (e: React.FormEvent) => {
    e.preventDefault();
    if (vertexName.trim()) {
      onAddVertex(vertexName.trim());
      setVertexName('');
    }
  };

  const handleAddArc = (e: React.FormEvent) => {
    e.preventDefault();
    if (arcFrom && arcTo && arcFrom !== arcTo) {
      onAddArc(arcFrom, arcTo);
      // Don't reset - user might want to add more arcs
    }
  };

  const vertexNames = vertices.map(v => v.name);

  return (
    <div className="space-y-3">
      {/* Add Vertex */}
      <form onSubmit={handleAddVertex} className="flex gap-2">
        <input
          type="text"
          value={vertexName}
          onChange={(e) => setVertexName(e.target.value)}
          placeholder="Vertex name..."
          className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          maxLength={10}
        />
        <motion.button
          type="submit"
          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Add Vertex
        </motion.button>
      </form>

      {/* Add Arc */}
      <form onSubmit={handleAddArc} className="space-y-2">
        <div className="flex gap-2 items-center">
          <select
            value={arcFrom}
            onChange={(e) => setArcFrom(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            disabled={vertexNames.length === 0}
          >
            <option value="">From...</option>
            {vertexNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <span className="text-slate-500">→</span>
          <select
            value={arcTo}
            onChange={(e) => setArcTo(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            disabled={vertexNames.length === 0}
          >
            <option value="">To...</option>
            {vertexNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <motion.button
            type="submit"
            disabled={!arcFrom || !arcTo || arcFrom === arcTo}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium rounded"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add Arc
          </motion.button>
        </div>
      </form>
    </div>
  );
}
