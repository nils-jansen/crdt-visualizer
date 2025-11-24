import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { CmRDTGraph, Position, CmRDTSyncStep } from '../../types/crdt';
import * as CmRDTOps from '../../lib/cmrdt-directed-graph';
import { ReplicaCard } from '../shared/ReplicaCard';
import { SyncButton } from '../shared/SyncButton';
import { GraphCanvas } from './GraphCanvas';
import { GraphControls } from './GraphControls';
import { GraphStateView } from './GraphStateView';
import { OperationQueue } from './OperationQueue';
import { SyncModal } from '../shared/SyncModal';
import { CmRDTGraphStepView } from '../shared/steps';

const REPLICA_COLORS = ['blue', 'green', 'purple'] as const;
const REPLICA_NAMES = ['A', 'B', 'C'];

// Store positions for each vertex name (shared across replicas for consistency)
type PositionMap = Map<string, Position>;

export function DirectedGraphModule() {
  const [replicas, setReplicas] = useState<CmRDTGraph[]>(() =>
    REPLICA_NAMES.map(name => CmRDTOps.createCmRDTGraph(name))
  );
  const [positions, setPositions] = useState<PositionMap>(new Map());
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncSteps, setSyncSteps] = useState<CmRDTSyncStep[]>([]);

  // Count total pending operations across all replicas
  const totalPendingOps = replicas.reduce((sum, r) => sum + r.operationQueue.length, 0);

  const getOrCreatePosition = useCallback((name: string): Position => {
    if (positions.has(name)) {
      return positions.get(name)!;
    }
    // Generate a random position within bounds
    const newPos = {
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 150,
    };
    setPositions(prev => new Map(prev).set(name, newPos));
    return newPos;
  }, [positions]);

  const updatePosition = useCallback((name: string, pos: Position) => {
    setPositions(prev => new Map(prev).set(name, pos));
  }, []);

  const handleAddVertex = useCallback((replicaIndex: number, name: string) => {
    if (!name.trim()) return;
    const trimmedName = name.trim();

    // Create position for new vertex
    getOrCreatePosition(trimmedName);

    setReplicas(prev => {
      const newReplicas = [...prev];
      newReplicas[replicaIndex] = CmRDTOps.addVertex(prev[replicaIndex], trimmedName);
      return newReplicas;
    });
  }, [getOrCreatePosition]);

  const handleRemoveVertex = useCallback((replicaIndex: number, name: string) => {
    setReplicas(prev => {
      const newReplicas = [...prev];
      const result = CmRDTOps.removeVertex(prev[replicaIndex], name);
      if (result) {
        newReplicas[replicaIndex] = result;
      }
      return newReplicas;
    });
  }, []);

  const handleAddArc = useCallback((replicaIndex: number, from: string, to: string) => {
    setReplicas(prev => {
      const newReplicas = [...prev];
      const result = CmRDTOps.addArc(prev[replicaIndex], from, to);
      if (result) {
        newReplicas[replicaIndex] = result;
      }
      return newReplicas;
    });
  }, []);

  const handleRemoveArc = useCallback((replicaIndex: number, from: string, to: string) => {
    setReplicas(prev => {
      const newReplicas = [...prev];
      const result = CmRDTOps.removeArc(prev[replicaIndex], from, to);
      if (result) {
        newReplicas[replicaIndex] = result;
      }
      return newReplicas;
    });
  }, []);

  const handleSync = useCallback(() => {
    // Generate delivery steps for visualization
    const steps = CmRDTOps.generateDeliverySteps(replicas);
    setSyncSteps(steps);
    setShowSyncModal(true);
  }, [replicas]);

  const handleSyncComplete = useCallback(() => {
    setIsSyncing(true);

    setTimeout(() => {
      const { updatedReplicas } = CmRDTOps.syncAllReplicas(replicas);
      setReplicas(updatedReplicas);
      setIsSyncing(false);
    }, 300);
  }, [replicas]);

  const handleReset = useCallback(() => {
    setReplicas(REPLICA_NAMES.map(name => CmRDTOps.createCmRDTGraph(name)));
    setPositions(new Map());
  }, []);

  return (
    <div>
      <div className="mb-6 p-4 bg-slate-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Directed Graph (Op-Based)</h2>
          {totalPendingOps > 0 && (
            <span className="px-3 py-1 bg-amber-900/50 text-amber-400 text-sm rounded-full animate-pulse">
              {totalPendingOps} op{totalPendingOps !== 1 ? 's' : ''} pending
            </span>
          )}
        </div>
        <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
          <li>Operations have <span className="text-purple-400">prepare</span> (generate unique tag) and <span className="text-purple-400">effect</span> (apply to state) phases</li>
          <li><span className="text-green-400">AddVertex</span>: adds (name, tag) to V</li>
          <li><span className="text-red-400">RemoveVertex</span>: moves observed tags to R</li>
          <li>Queued ops delivered to other replicas on sync (add-wins semantics)</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {replicas.map((replica, index) => {
          const visibleVertices = CmRDTOps.getVisibleVertices(replica);
          const visibleArcs = CmRDTOps.getVisibleArcs(replica);

          return (
            <ReplicaCard
              key={index}
              name={REPLICA_NAMES[index]}
              color={REPLICA_COLORS[index]}
              isSyncing={isSyncing}
            >
              <GraphCanvas
                vertices={visibleVertices.map(name => ({ name, uuid: name }))}
                arcs={visibleArcs.map(a => ({ from: a.from, to: a.to, uuid: a.uuid }))}
                positions={positions}
                onPositionChange={updatePosition}
                onRemoveVertex={(name) => handleRemoveVertex(index, name)}
                onRemoveArc={(from, to) => handleRemoveArc(index, from, to)}
                getOrCreatePosition={getOrCreatePosition}
              />
              <GraphControls
                vertices={visibleVertices.map(name => ({ name, uuid: name }))}
                onAddVertex={(name) => handleAddVertex(index, name)}
                onAddArc={(from, to) => handleAddArc(index, from, to)}
              />
              <OperationQueue
                operations={replica.operationQueue}
              />
              <GraphStateView graph={replica} />
            </ReplicaCard>
          );
        })}
      </div>

      <SyncButton
        onSync={handleSync}
        onReset={handleReset}
        isSyncing={isSyncing}
        syncLabel={totalPendingOps > 0 ? `Deliver Operations (${totalPendingOps})` : 'Sync All Replicas'}
      />

      {/* Sync Modal */}
      <SyncModal
        isOpen={showSyncModal}
        steps={syncSteps}
        sourceLabel="All"
        targetLabel="All"
        onComplete={handleSyncComplete}
        onClose={() => setShowSyncModal(false)}
        title="Operation Delivery (CmRDT)"
        applyLabel="Complete Sync"
      >
        {(step) => (
          <CmRDTGraphStepView step={step as CmRDTSyncStep} />
        )}
      </SyncModal>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 bg-amber-900/30 border border-amber-600/50 rounded-lg"
      >
        <h3 className="text-amber-400 font-semibold mb-2">Try This Conflict Scenario:</h3>
        <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
          <li>Add vertex "X" on Replica A (notice it queues an AddVertex operation)</li>
          <li>Sync all replicas to deliver the operation</li>
          <li>On Replica A: Remove vertex "X" (queues RemoveVertex with observed tags)</li>
          <li>On Replica B (without syncing): Add vertex "X" again (generates a NEW tag)</li>
          <li>Sync all - observe that "X" survives because B's new tag wasn't in A's observed set!</li>
        </ol>
        <p className="text-slate-400 text-xs mt-2">
          This demonstrates the CmRDT add-wins semantic: RemoveVertex only removes UUIDs observed at prepare time.
        </p>
      </motion.div>
    </div>
  );
}
