import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AddOnlySet, AddOnlySetSyncStep } from '../../types/crdt';
import * as AddOnlySetOps from '../../lib/add-only-set';
import { ReplicaCard } from '../shared/ReplicaCard';
import { SyncButton } from '../shared/SyncButton';
import { InternalStateView, SetDisplay } from '../shared/InternalStateView';
import { SyncModal } from '../shared/SyncModal';
import { AddOnlySetStepView } from '../shared/steps';

const REPLICA_COLORS = ['amber', 'green', 'purple'] as const;
const REPLICA_NAMES = ['A', 'B', 'C'];
const NUM_REPLICAS = 3;

export function AddOnlySetModule() {
  const [replicas, setReplicas] = useState<AddOnlySet<string>[]>(() =>
    Array(NUM_REPLICAS).fill(null).map(() => AddOnlySetOps.createAddOnlySet<string>())
  );
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncSteps, setSyncSteps] = useState<AddOnlySetSyncStep[]>([]);

  const handleAdd = useCallback((replicaIndex: number, element: string) => {
    if (!element.trim()) return;
    setReplicas(prev => {
      const newReplicas = [...prev];
      newReplicas[replicaIndex] = AddOnlySetOps.add(prev[replicaIndex], element.trim());
      return newReplicas;
    });
  }, []);

  const handleSync = useCallback(() => {
    // Generate merge steps for visualization (comparing first two replicas)
    const steps = AddOnlySetOps.generateMergeSteps(replicas[0], replicas[1]);
    setSyncSteps(steps);
    setShowSyncModal(true);
  }, [replicas]);

  const handleSyncComplete = useCallback(() => {
    setIsSyncing(true);

    setTimeout(() => {
      const merged = AddOnlySetOps.mergeAll(replicas);
      setReplicas(Array(NUM_REPLICAS).fill(null).map(() => AddOnlySetOps.clone(merged)));
      setIsSyncing(false);
    }, 300);
  }, [replicas]);

  const handleReset = useCallback(() => {
    setReplicas(Array(NUM_REPLICAS).fill(null).map(() => AddOnlySetOps.createAddOnlySet<string>()));
  }, []);

  return (
    <div>
      <div className="mb-6 p-4 bg-slate-800 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-2">Add-Only Set (G-Set)</h2>
        <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
          <li>Single set of elements - no removal supported</li>
          <li>Merge: union of both sets (A ∪ B)</li>
          <li>Properties: commutative, associative, idempotent</li>
          <li>Use case: append-only logs, tags, labels</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {replicas.map((replica, index) => {
          const visibleElements = AddOnlySetOps.lookupArray(replica);
          const serialized = AddOnlySetOps.serialize(replica);

          return (
            <ReplicaCard
              key={index}
              name={REPLICA_NAMES[index]}
              color={REPLICA_COLORS[index]}
              isSyncing={isSyncing}
            >
              <SetVisualizer elements={visibleElements} />
              <AddElementForm onAdd={(element) => handleAdd(index, element)} />
              <InternalStateView title="Internal State" isHighlighted={isSyncing}>
                <SetDisplay
                  label="Elements"
                  values={serialized.elements}
                  colorClass="text-cyan-400"
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
          <AddOnlySetStepView
            step={step as AddOnlySetSyncStep}
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
}

function SetVisualizer({ elements }: SetVisualizerProps) {
  return (
    <div className="min-h-[100px] p-3 bg-slate-800 rounded-lg mb-4">
      <div className="text-xs text-slate-400 mb-2">Elements ({elements.length})</div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {elements.length === 0 ? (
            <span className="text-slate-500 italic text-sm">Set is empty</span>
          ) : (
            elements.map((element) => (
              <motion.span
                key={element}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="px-3 py-1 bg-cyan-600 text-white rounded-full text-sm font-medium"
                title={element}
              >
                {element}
              </motion.span>
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
        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
      />
      <motion.button
        type="submit"
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Add
      </motion.button>
    </form>
  );
}
