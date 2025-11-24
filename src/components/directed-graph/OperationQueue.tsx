import { motion, AnimatePresence } from 'framer-motion';
import type { PreparedOp, AddVertexPayload, RemoveVertexPayload, AddArcPayload, RemoveArcPayload } from '../../types/crdt';

interface OperationQueueProps {
  operations: PreparedOp[];
}

function getOpIcon(type: PreparedOp['type']): string {
  switch (type) {
    case 'AddVertex':
      return '+V';
    case 'RemoveVertex':
      return '-V';
    case 'AddArc':
      return '+E';
    case 'RemoveArc':
      return '-E';
    default:
      return '?';
  }
}

function getOpColor(type: PreparedOp['type']): string {
  switch (type) {
    case 'AddVertex':
    case 'AddArc':
      return 'bg-green-900/50 text-green-400 border-green-700';
    case 'RemoveVertex':
    case 'RemoveArc':
      return 'bg-red-900/50 text-red-400 border-red-700';
    default:
      return 'bg-slate-700 text-slate-400';
  }
}

function formatPayload(op: PreparedOp): string {
  switch (op.type) {
    case 'AddVertex': {
      const p = op.payload as AddVertexPayload;
      return `"${p.name}" [${p.tag.slice(0, 6)}]`;
    }
    case 'RemoveVertex': {
      const p = op.payload as RemoveVertexPayload;
      return `"${p.name}" (${p.observedTags.length} tag${p.observedTags.length !== 1 ? 's' : ''})`;
    }
    case 'AddArc': {
      const p = op.payload as AddArcPayload;
      return `${p.from} → ${p.to}`;
    }
    case 'RemoveArc': {
      const p = op.payload as RemoveArcPayload;
      return `${p.from} → ${p.to} (${p.observedTags.length})`;
    }
    default:
      return '';
  }
}

export function OperationQueue({ operations }: OperationQueueProps) {
  return (
    <motion.div
      className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Operation Queue
        </h4>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          operations.length > 0
            ? 'bg-amber-900/50 text-amber-400'
            : 'bg-slate-700 text-slate-500'
        }`}>
          {operations.length} pending
        </span>
      </div>

      <div className="max-h-32 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {operations.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-slate-500 text-xs italic py-2 text-center"
            >
              No operations to deliver
            </motion.div>
          ) : (
            <div className="space-y-1.5">
              {operations.map((op, index) => (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-2 p-2 rounded border ${getOpColor(op.type)}`}
                >
                  <span className="text-xs font-mono font-bold w-6 text-center">
                    {getOpIcon(op.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {formatPayload(op)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      t={op.timestamp} • {op.id.slice(0, 6)}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    #{index + 1}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {operations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-500">
          Click "Sync" to deliver these operations to other replicas
        </div>
      )}
    </motion.div>
  );
}
