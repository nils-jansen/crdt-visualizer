import { motion } from 'framer-motion';
import type { CmRDTGraph } from '../../types/crdt';
import * as CmRDTOps from '../../lib/cmrdt-directed-graph';
import { InternalStateView } from '../shared/InternalStateView';

interface GraphStateViewProps {
  graph: CmRDTGraph;
}

export function GraphStateView({ graph }: GraphStateViewProps) {
  const serialized = CmRDTOps.serialize(graph);

  return (
    <InternalStateView title="Internal State (CmRDT)">
      {/* Vertices V: name -> Set<tag> */}
      <div className="mb-3">
        <div className="text-slate-400 text-xs mb-1">
          V (Vertices): {serialized.V.length} name{serialized.V.length !== 1 ? 's' : ''}
        </div>
        <div className="max-h-28 overflow-y-auto space-y-1">
          {serialized.V.length === 0 ? (
            <span className="text-slate-500 italic text-xs">No vertices</span>
          ) : (
            serialized.V.map((entry) => {
              const visibleTags = entry.tags.filter(t => !serialized.R.includes(t));
              const isFullyRemoved = visibleTags.length === 0;

              return (
                <motion.div
                  key={entry.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-xs px-2 py-1.5 rounded ${
                    isFullyRemoved
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-green-900/30 text-green-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isFullyRemoved ? 'line-through' : ''}`}>
                      "{entry.name}"
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {visibleTags.length} visible / {entry.tags.length} total
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 space-x-1">
                    {entry.tags.map(tag => {
                      const isRemoved = serialized.R.includes(tag);
                      return (
                        <span
                          key={tag}
                          className={`inline-block px-1 rounded ${
                            isRemoved
                              ? 'bg-red-900/50 text-red-500 line-through'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {tag.slice(0, 6)}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Removal Set R */}
      <div className="mb-3">
        <div className="text-red-400 text-xs mb-1">
          R (Removal Set): {serialized.R.length} tag{serialized.R.length !== 1 ? 's' : ''}
        </div>
        <div className="max-h-16 overflow-y-auto">
          {serialized.R.length === 0 ? (
            <span className="text-slate-500 italic text-xs">No removed tags</span>
          ) : (
            <div className="text-[10px] text-red-500 flex flex-wrap gap-1">
              {serialized.R.map(uuid => (
                <span key={uuid} className="px-1 bg-red-900/30 rounded">
                  {uuid.slice(0, 6)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Arcs */}
      <div className="mb-3">
        <div className="text-slate-400 text-xs mb-1">
          Arcs: {serialized.arcs.length} total
        </div>
        <div className="max-h-16 overflow-y-auto space-y-1">
          {serialized.arcs.length === 0 ? (
            <span className="text-slate-500 italic text-xs">No arcs</span>
          ) : (
            serialized.arcs.map((arc) => {
              const isRemoved = serialized.removedArcs.includes(arc.uuid);
              return (
                <motion.div
                  key={arc.uuid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-xs px-2 py-1 rounded ${
                    isRemoved
                      ? 'bg-red-900/30 text-red-400 line-through'
                      : 'bg-blue-900/30 text-blue-400'
                  }`}
                >
                  <span className="font-medium">{arc.from} → {arc.to}</span>
                  <span className="text-slate-500 ml-2">
                    [{arc.uuid.slice(0, 6)}]
                  </span>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Clock */}
      <div className="pt-2 border-t border-slate-700">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Logical Clock:</span>
          <span className="text-amber-400 font-mono">{serialized.clock}</span>
        </div>
      </div>
    </InternalStateView>
  );
}
