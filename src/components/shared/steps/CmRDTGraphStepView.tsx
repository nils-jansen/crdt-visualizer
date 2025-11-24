import { motion } from 'framer-motion';
import type {
  CmRDTSyncStep,
  CmRDTDeliveryStep,
  CmRDTQueueStep,
  CmRDTConflictStep,
  CmRDTResultStep,
  PreparedOp,
  AddVertexPayload,
  RemoveVertexPayload,
  AddArcPayload,
  RemoveArcPayload,
} from '../../../types/crdt';

interface CmRDTGraphStepViewProps {
  step: CmRDTSyncStep;
}

export function CmRDTGraphStepView({ step }: CmRDTGraphStepViewProps) {
  switch (step.operation) {
    case 'show-queue':
      return <QueueStepView step={step as CmRDTQueueStep} />;
    case 'deliver-op':
      return <DeliveryStepView step={step as CmRDTDeliveryStep} />;
    case 'conflict-resolution':
      return <ConflictStepView step={step as CmRDTConflictStep} />;
    case 'cmrdt-result':
      return <ResultStepView step={step as CmRDTResultStep} />;
    default:
      return <div className="text-slate-500">Unknown step type</div>;
  }
}

// Helper to format operation descriptions
function formatOp(op: PreparedOp): { icon: string; label: string; detail: string; color: string } {
  switch (op.type) {
    case 'AddVertex': {
      const p = op.payload as AddVertexPayload;
      return {
        icon: '+V',
        label: `AddVertex("${p.name}")`,
        detail: `tag: ${p.tag.slice(0, 8)}`,
        color: 'text-green-400',
      };
    }
    case 'RemoveVertex': {
      const p = op.payload as RemoveVertexPayload;
      return {
        icon: '-V',
        label: `RemoveVertex("${p.name}")`,
        detail: `observed: ${p.observedTags.length} tag(s)`,
        color: 'text-red-400',
      };
    }
    case 'AddArc': {
      const p = op.payload as AddArcPayload;
      return {
        icon: '+E',
        label: `AddArc(${p.from} -> ${p.to})`,
        detail: `tag: ${p.tag.slice(0, 8)}`,
        color: 'text-blue-400',
      };
    }
    case 'RemoveArc': {
      const p = op.payload as RemoveArcPayload;
      return {
        icon: '-E',
        label: `RemoveArc(${p.from} -> ${p.to})`,
        detail: `observed: ${p.observedTags.length}`,
        color: 'text-orange-400',
      };
    }
    default:
      return { icon: '?', label: 'Unknown', detail: '', color: 'text-slate-400' };
  }
}

function QueueStepView({ step }: { step: CmRDTQueueStep }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-lg p-4 border border-amber-500/50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-amber-400 font-semibold flex items-center gap-2">
            <span className="text-xl">📋</span>
            Pending Operations in Replica {step.replicaId}
          </h4>
          <span className="px-2 py-1 bg-amber-900/50 text-amber-300 text-sm rounded">
            {step.queue.length} operation{step.queue.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {step.queue.map((op, idx) => {
            const formatted = formatOp(op);
            return (
              <motion.div
                key={op.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 p-3 bg-slate-800 rounded border border-slate-700"
              >
                <span className="text-xs font-mono font-bold bg-slate-700 px-2 py-1 rounded">
                  #{idx + 1}
                </span>
                <span className={`font-mono font-bold ${formatted.color}`}>
                  {formatted.icon}
                </span>
                <div className="flex-1">
                  <div className={`font-medium ${formatted.color}`}>
                    {formatted.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatted.detail} | t={op.timestamp}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-700">
          These operations will be delivered to other replicas during sync.
          Each operation's effect will be applied to maintain eventual consistency.
        </p>
      </div>
    </div>
  );
}

function DeliveryStepView({ step }: { step: CmRDTDeliveryStep }) {
  const formatted = formatOp(step.op);

  return (
    <div className="space-y-4">
      {/* Operation being delivered */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/50">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">
            📨
          </span>
          <div>
            <div className="text-purple-300 font-semibold">
              Delivering Operation from Replica {step.sourceReplica}
            </div>
            <div className="text-slate-400 text-sm">
              Target: Replica {step.targetReplica}
            </div>
          </div>
        </div>

        <div className={`p-3 bg-slate-800 rounded border-l-4 ${
          step.op.type.startsWith('Add') ? 'border-green-500' : 'border-red-500'
        }`}>
          <div className={`font-mono font-bold ${formatted.color}`}>
            {formatted.label}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {formatted.detail}
          </div>
        </div>
      </div>

      {/* Before/After comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Before */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <h4 className="text-slate-400 text-sm mb-3 flex items-center gap-2">
            <span className="text-lg">⬅️</span>
            Before Effect
          </h4>
          <StateView state={step.beforeState} />
        </div>

        {/* After */}
        <motion.div
          initial={{ opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 rounded-lg p-4 border-2 border-green-500/50"
        >
          <h4 className="text-green-400 text-sm mb-3 flex items-center gap-2">
            <span className="text-lg">➡️</span>
            After Effect
          </h4>
          <StateView state={step.afterState} highlight />
        </motion.div>
      </div>

      <p className="text-sm text-slate-400 text-center">
        {step.effectDescription}
      </p>
    </div>
  );
}

function StateView({ state, highlight }: {
  state: { V: { name: string; tags: string[] }[]; R: string[] };
  highlight?: boolean;
}) {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <span className="text-slate-500">V = </span>
        <span className={highlight ? 'text-green-300' : 'text-slate-300'}>
          {'{'}
          {state.V.length === 0 ? (
            <span className="text-slate-500 italic">empty</span>
          ) : (
            state.V.map((v, i) => (
              <span key={v.name}>
                {i > 0 && ', '}
                "{v.name}": [{v.tags.map(t => t.slice(0, 4)).join(', ')}]
              </span>
            ))
          )}
          {'}'}
        </span>
      </div>
      <div>
        <span className="text-slate-500">R = </span>
        <span className={highlight ? 'text-red-300' : 'text-slate-300'}>
          {'{'}
          {state.R.length === 0 ? (
            <span className="text-slate-500 italic">empty</span>
          ) : (
            state.R.map(t => t.slice(0, 4)).join(', ')
          )}
          {'}'}
        </span>
      </div>
    </div>
  );
}

function ConflictStepView({ step }: { step: CmRDTConflictStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-amber-900/30 rounded-lg p-6 border-2 border-amber-500/50"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">⚔️</span>
        <div>
          <h4 className="text-amber-400 font-bold text-lg">
            Conflict Resolved: "{step.vertexName}"
          </h4>
          <p className="text-slate-400 text-sm">Add-Wins Semantics Applied</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-red-900/30 rounded p-3 border border-red-500/30">
          <div className="text-red-400 text-sm mb-2">Removed Tags</div>
          <div className="flex flex-wrap gap-1">
            {step.removedTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-red-900/50 text-red-300 text-xs rounded line-through">
                {tag.slice(0, 8)}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-green-900/30 rounded p-3 border border-green-500/30">
          <div className="text-green-400 text-sm mb-2">Surviving Tags</div>
          <div className="flex flex-wrap gap-1">
            {step.survivingTags.map(tag => (
              <motion.span
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs rounded"
              >
                {tag.slice(0, 8)}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-300">{step.explanation}</p>
    </motion.div>
  );
}

function ResultStepView({ step }: { step: CmRDTResultStep }) {
  return (
    <div className="space-y-6">
      {/* All replica states */}
      <div className="grid grid-cols-3 gap-4">
        {step.replicaStates.map((replica, idx) => (
          <motion.div
            key={replica.replicaId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-900 rounded-lg p-4 border-2 border-green-500/50"
          >
            <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">✓</span>
              Replica {replica.replicaId}
            </h4>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Visible Vertices</div>
                <div className="flex flex-wrap gap-1">
                  {replica.visibleVertices.length === 0 ? (
                    <span className="text-slate-500 italic text-xs">(none)</span>
                  ) : (
                    replica.visibleVertices.map(name => (
                      <span key={name} className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs rounded-full">
                        {name}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-1">Visible Arcs</div>
                <div className="flex flex-wrap gap-1">
                  {replica.visibleArcs.length === 0 ? (
                    <span className="text-slate-500 italic text-xs">(none)</span>
                  ) : (
                    replica.visibleArcs.map((arc, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded">
                        {arc.from}→{arc.to}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Conflicts detected */}
      {step.conflicts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-amber-900/30 rounded-lg p-4 border border-amber-500/50"
        >
          <h4 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Add-Wins Conflicts Resolved
          </h4>
          <div className="space-y-2">
            {step.conflicts.map((conflict, idx) => (
              <motion.div
                key={conflict.vertexName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-start gap-2 text-sm"
              >
                <span className="text-amber-400 font-bold">"{conflict.vertexName}"</span>
                <span className="text-slate-400">—</span>
                <span className="text-slate-300">{conflict.explanation}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/30"
      >
        <div className="text-2xl mb-2">🎉</div>
        <div className="text-green-400 font-semibold">All Operations Delivered!</div>
        <div className="text-slate-400 text-sm">
          Replicas have achieved eventual consistency via causal delivery.
        </div>
      </motion.div>
    </div>
  );
}
