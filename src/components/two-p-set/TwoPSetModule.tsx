import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TwoPSet, TwoPSetSyncStep } from '../../types/crdt';
import * as TwoPSetOps from '../../lib/two-p-set';
import { ReplicaCard } from '../shared/ReplicaCard';
import { SyncButton } from '../shared/SyncButton';
import { InternalStateView, SetDisplay } from '../shared/InternalStateView';
import { SyncModal } from '../shared/SyncModal';
import { TwoPSetStepView } from '../shared/steps';

const REPLICA_COLORS = ['blue', 'green', 'purple'] as const;
const REPLICA_NAMES = ['A', 'B', 'C'];
const NUM_REPLICAS = 3;

export function TwoPSetModule() {
  const [replicas, setReplicas] = useState<TwoPSet<string>[]>(() =>
    Array(NUM_REPLICAS).fill(null).map(() => TwoPSetOps.createTwoPSet<string>())
  );
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncSteps, setSyncSteps] = useState<TwoPSetSyncStep[]>([]);

  const handleAdd = useCallback((replicaIndex: number, element: string) => {
    if (!element.trim()) return;
    setReplicas(prev => {
      const newReplicas = [...prev];
      newReplicas[replicaIndex] = TwoPSetOps.add(prev[replicaIndex], element.trim());
      return newReplicas;
    });
  }, []);

  const handleRemove = useCallback((replicaIndex: number, element: string) => {
    setReplicas(prev => {
      const newReplicas = [...prev];
      newReplicas[replicaIndex] = TwoPSetOps.remove(prev[replicaIndex], element);
      return newReplicas;
    });
  }, []);

  const handleSync = useCallback(() => {
    // Generate merge steps for visualization (comparing first two replicas)
    const steps = TwoPSetOps.generateMergeSteps(replicas[0], replicas[1]);
    setSyncSteps(steps);
    setShowSyncModal(true);
  }, [replicas]);

  const handleSyncComplete = useCallback(() => {
    setIsSyncing(true);

    setTimeout(() => {
      const merged = TwoPSetOps.mergeAll(replicas);
      setReplicas(Array(NUM_REPLICAS).fill(null).map(() => TwoPSetOps.clone(merged)));
      setIsSyncing(false);
    }, 300);
  }, [replicas]);

  const handleReset = useCallback(() => {
    setReplicas(Array(NUM_REPLICAS).fill(null).map(() => TwoPSetOps.createTwoPSet<string>()));
  }, []);

  return (
    <div>
      <div className="mb-6 p-4 bg-slate-800 rounded-lg border-l-4 border-green-500">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">2P-Set (Two-Phase Set)</h2>
            <span className="inline-block px-2 py-0.5 bg-green-900/50 text-green-300 text-xs rounded-full mb-2">
              CvRDT - State-based Set with Tombstones
            </span>
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          Maintains two sets: <span className="text-green-400">Added</span> and{' '}
          <span className="text-red-400">Removed</span> (tombstones). Visible elements are those in Added but not in Removed.
          The <span className="text-green-400">merge function</span> computes union of both sets, ensuring
          remove-wins semantics. Once tombstoned, an element cannot be re-added (limitation addressed by OR-Sets).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {replicas.map((replica, index) => {
          const visibleElements = TwoPSetOps.lookupArray(replica);
          const serialized = TwoPSetOps.serialize(replica);

          return (
            <ReplicaCard
              key={index}
              name={REPLICA_NAMES[index]}
              color={REPLICA_COLORS[index]}
              isSyncing={isSyncing}
            >
              <SetVisualizer
                elements={visibleElements}
                onRemove={(element) => handleRemove(index, element)}
              />
              <AddElementForm onAdd={(element) => handleAdd(index, element)} />
              <InternalStateView title="Internal State" isHighlighted={isSyncing}>
                <SetDisplay
                  label="Added"
                  values={serialized.added}
                  colorClass="text-green-400"
                />
                <SetDisplay
                  label="Removed (tombstones)"
                  values={serialized.removed}
                  colorClass="text-red-400"
                />
              </InternalStateView>
            </ReplicaCard>
          );
        })}
      </div>

      <SyncButton onSync={handleSync} onReset={handleReset} isSyncing={isSyncing} />

      {/* Sync Modal */}
      <SyncModal
        isOpen={showSyncModal}
        steps={syncSteps}
        sourceLabel="A"
        targetLabel="B"
        onComplete={handleSyncComplete}
        onClose={() => setShowSyncModal(false)}
      >
        {(step) => (
          <TwoPSetStepView
            step={step as TwoPSetSyncStep}
            sourceLabel="A"
            targetLabel="B"
          />
        )}
      </SyncModal>
    </div>
  );
}

interface SetVisualizerProps {
  elements: string[];
  onRemove: (element: string) => void;
}

function SetVisualizer({ elements, onRemove }: SetVisualizerProps) {
  return (
    <div className="min-h-[100px] p-3 bg-slate-800 rounded-lg mb-4">
      <div className="text-xs text-slate-400 mb-2">Visible Elements ({elements.length})</div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {elements.length === 0 ? (
            <span className="text-slate-500 italic text-sm">Set is empty</span>
          ) : (
            elements.map((element) => (
              <motion.button
                key={element}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => onRemove(element)}
                className="px-3 py-1 bg-blue-600 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors group"
                title="Click to remove"
              >
                {element}
                <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">x</span>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface AddElementFormProps {
  onAdd: (element: string) => void;
}

function AddElementForm({ onAdd }: AddElementFormProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value);
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter element..."
        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
      />
      <motion.button
        type="submit"
        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Add
      </motion.button>
    </form>
  );
}
