import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PNCounter, PNCounterSyncStep } from '../../types/crdt';
import * as PNCounterOps from '../../lib/pn-counter';
import { ReplicaCard } from '../shared/ReplicaCard';
import { SyncButton } from '../shared/SyncButton';
import { InternalStateView, VectorDisplay } from '../shared/InternalStateView';
import { SyncModal } from '../shared/SyncModal';
import { PNCounterStepView } from '../shared/steps';

const REPLICA_COLORS = ['blue', 'green', 'purple'] as const;
const REPLICA_NAMES = ['A', 'B', 'C'];
const NUM_REPLICAS = 3;

export function PNCounterModule() {
  const [replicas, setReplicas] = useState<PNCounter[]>(() =>
    Array(NUM_REPLICAS).fill(null).map(() => PNCounterOps.createPNCounter(NUM_REPLICAS))
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedValues, setLastSyncedValues] = useState<number[]>([]);

  // Modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncSteps, setSyncSteps] = useState<PNCounterSyncStep[]>([]);

  const handleIncrement = useCallback((replicaIndex: number) => {
    setReplicas(prev => {
      const newReplicas = [...prev];
      newReplicas[replicaIndex] = PNCounterOps.increment(prev[replicaIndex], replicaIndex);
      return newReplicas;
    });
  }, []);

  const handleDecrement = useCallback((replicaIndex: number) => {
    setReplicas(prev => {
      const newReplicas = [...prev];
      newReplicas[replicaIndex] = PNCounterOps.decrement(prev[replicaIndex], replicaIndex);
      return newReplicas;
    });
  }, []);

  const handleSync = useCallback(() => {
    // Generate merge steps for visualization (comparing first two replicas)
    const steps = PNCounterOps.generateMergeSteps(replicas[0], replicas[1]);
    setSyncSteps(steps);
    setShowSyncModal(true);
  }, [replicas]);

  const handleSyncComplete = useCallback(() => {
    setIsSyncing(true);
    setLastSyncedValues(replicas.map(r => PNCounterOps.getValue(r)));

    setTimeout(() => {
      const merged = PNCounterOps.mergeAll(replicas);
      setReplicas(Array(NUM_REPLICAS).fill(null).map(() => PNCounterOps.clone(merged)));
      setIsSyncing(false);
    }, 300);
  }, [replicas]);

  const handleReset = useCallback(() => {
    setReplicas(Array(NUM_REPLICAS).fill(null).map(() => PNCounterOps.createPNCounter(NUM_REPLICAS)));
    setLastSyncedValues([]);
  }, []);

  return (
    <div>
      <div className="mb-6 p-4 bg-slate-800 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">PN-Counter (Positive-Negative Counter)</h2>
            <span className="inline-block px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded-full mb-2">
              CvRDT - State-based Counter
            </span>
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          Each replica maintains two vectors: <span className="text-green-400">P</span> (increments) and{' '}
          <span className="text-red-400">N</span> (decrements). The value is calculated as{' '}
          <code className="bg-slate-700 px-1 rounded">Sum(P) - Sum(N)</code>.
          The <span className="text-blue-400">merge function</span> uses element-wise maximum, guaranteeing convergence
          regardless of message ordering.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {replicas.map((replica, index) => (
          <ReplicaCard
            key={index}
            name={REPLICA_NAMES[index]}
            color={REPLICA_COLORS[index]}
            isSyncing={isSyncing}
          >
            <CounterDisplay
              value={PNCounterOps.getValue(replica)}
              previousValue={lastSyncedValues[index]}
              isSyncing={isSyncing}
            />
            <CounterControls
              onIncrement={() => handleIncrement(index)}
              onDecrement={() => handleDecrement(index)}
            />
            <InternalStateView title="Internal State" isHighlighted={isSyncing}>
              <VectorDisplay
                label="P (increments)"
                values={replica.P}
                highlightIndex={index}
              />
              <VectorDisplay
                label="N (decrements)"
                values={replica.N}
                highlightIndex={index}
              />
              <div className="mt-2 pt-2 border-t border-slate-700 text-slate-400">
                Sum(P) = {replica.P.reduce((a, b) => a + b, 0)}, Sum(N) = {replica.N.reduce((a, b) => a + b, 0)}
              </div>
            </InternalStateView>
          </ReplicaCard>
        ))}
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
          <PNCounterStepView
            step={step as PNCounterSyncStep}
            sourceLabel="A"
            targetLabel="B"
          />
        )}
      </SyncModal>
    </div>
  );
}

interface CounterDisplayProps {
  value: number;
  previousValue?: number;
  isSyncing?: boolean;
}

function CounterDisplay({ value, previousValue, isSyncing }: CounterDisplayProps) {
  const hasChanged = previousValue !== undefined && previousValue !== value;

  return (
    <div className="text-center py-4">
      <div className="text-sm text-slate-400 mb-1">Value</div>
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={hasChanged && isSyncing ? { scale: 0.5, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold text-white"
        >
          {value}
        </motion.div>
      </AnimatePresence>
      {hasChanged && isSyncing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-yellow-400 mt-1"
        >
          was {previousValue}
        </motion.div>
      )}
    </div>
  );
}

interface CounterControlsProps {
  onIncrement: () => void;
  onDecrement: () => void;
}

function CounterControls({ onIncrement, onDecrement }: CounterControlsProps) {
  return (
    <div className="flex gap-2 justify-center">
      <motion.button
        onClick={onDecrement}
        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        - Decrement
      </motion.button>
      <motion.button
        onClick={onIncrement}
        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        + Increment
      </motion.button>
    </div>
  );
}
