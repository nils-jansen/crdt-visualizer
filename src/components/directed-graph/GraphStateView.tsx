import { motion } from 'framer-motion';
import type { DirectedGraph } from '../../types/crdt';
import * as GraphOps from '../../lib/directed-graph';
import { InternalStateView } from '../shared/InternalStateView';

interface GraphStateViewProps {
  graph: DirectedGraph;
}

export function GraphStateView({ graph }: GraphStateViewProps) {
  const serialized = GraphOps.serialize(graph);

  return (
    <InternalStateView title="Internal State (with UUIDs)">
      {/* Vertices */}
      <div className="mb-3">
        <div className="text-slate-400 text-xs mb-1">
          Vertices (V): {serialized.vertices.length} total
        </div>
        <div className="max-h-24 overflow-y-auto space-y-1">
          {serialized.vertices.length === 0 ? (
            <span className="text-slate-500 italic text-xs">No vertices</span>
          ) : (
            serialized.vertices.map((v) => {
              const isRemoved = serialized.removedVertices.includes(v.uuid);
              return (
                <motion.div
                  key={v.uuid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-xs px-2 py-1 rounded ${
                    isRemoved
                      ? 'bg-red-900/30 text-red-400 line-through'
                      : 'bg-green-900/30 text-green-400'
                  }`}
                >
                  <span className="font-medium">{v.name}</span>
                  <span className="text-slate-500 ml-2">
                    [{v.uuid.slice(0, 8)}...]
                  </span>
                  {isRemoved && (
                    <span className="ml-2 text-red-500">(tombstoned)</span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Removed Vertices */}
      {serialized.removedVertices.length > 0 && (
        <div className="mb-3">
          <div className="text-red-400 text-xs mb-1">
            Removed UUIDs (R): {serialized.removedVertices.length}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {serialized.removedVertices.map(uuid => uuid.slice(0, 8)).join(', ')}...
          </div>
        </div>
      )}

      {/* Arcs */}
      <div>
        <div className="text-slate-400 text-xs mb-1">
          Arcs: {serialized.arcs.length} total
        </div>
        <div className="max-h-20 overflow-y-auto space-y-1">
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
                    [{arc.uuid.slice(0, 8)}...]
                  </span>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </InternalStateView>
  );
}
