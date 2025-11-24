import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { DirectedGraph, Position } from '../../types/crdt';
import * as GraphOps from '../../lib/directed-graph';
import { ReplicaCard } from '../shared/ReplicaCard';
import { SyncButton } from '../shared/SyncButton';
import { GraphCanvas } from './GraphCanvas';
import { GraphControls } from './GraphControls';
import { GraphStateView } from './GraphStateView';

const REPLICA_COLORS = ['blue', 'green', 'purple'] as const;
const REPLICA_NAMES = ['A', 'B', 'C'];
const NUM_REPLICAS = 3;

// Store positions for each vertex name (shared across replicas for consistency)
type PositionMap = Map<string, Position>;

export function DirectedGraphModule() {
  const [replicas, setReplicas] = useState<DirectedGraph[]>(() =>
    Array(NUM_REPLICAS).fill(null).map(() => GraphOps.createDirectedGraph())
  );
  const [positions, setPositions] = useState<PositionMap>(new Map());
  const [isSyncing, setIsSyncing] = useState(false);

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
      newReplicas[replicaIndex] = GraphOps.addVertex(prev[replicaIndex], trimmedName);
      return newReplicas;
    });
  }, [getOrCreatePosition]);

  const handleRemoveVertex = useCallback((replicaIndex: number, name: string) => {
    setReplicas(prev => {
      const newReplicas = [...prev];
      newReplicas[replicaIndex] = GraphOps.removeVertex(prev[replicaIndex], name);
      return newReplicas;
    });
  }, []);

  const handleAddArc = useCallback((replicaIndex: number, from: string, to: string) => {
    setReplicas(prev => {
      const newReplicas = [...prev];
      const result = GraphOps.addArc(prev[replicaIndex], from, to);
      if (result) {
        newReplicas[replicaIndex] = result;
      }
      return newReplicas;
    });
  }, []);

  const handleRemoveArc = useCallback((replicaIndex: number, from: string, to: string) => {
    setReplicas(prev => {
      const newReplicas = [...prev];
      newReplicas[replicaIndex] = GraphOps.removeArc(prev[replicaIndex], from, to);
      return newReplicas;
    });
  }, []);

  const handleSync = useCallback(() => {
    setIsSyncing(true);

    setTimeout(() => {
      const merged = GraphOps.mergeAll(replicas);
      setReplicas(Array(NUM_REPLICAS).fill(null).map(() => GraphOps.clone(merged)));
      setIsSyncing(false);
    }, 500);
  }, [replicas]);

  const handleReset = useCallback(() => {
    setReplicas(Array(NUM_REPLICAS).fill(null).map(() => GraphOps.createDirectedGraph()));
    setPositions(new Map());
  }, []);

  return (
    <div>
      <div className="mb-6 p-4 bg-slate-800 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-2">Directed Graph (Add-Wins Semantics)</h2>
        <p className="text-slate-400 text-sm">
          Vertices and arcs are stored with unique UUIDs. When removing, only the <em>observed</em> UUIDs are tombstoned.
          If Replica A removes "X" while Replica B concurrently adds "X", the merge results in "X" being visible
          (because B's addition created a new UUID not in A's removal set).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {replicas.map((replica, index) => {
          const visibleVertices = GraphOps.getVisibleVertices(replica);
          const visibleArcs = GraphOps.getVisibleArcs(replica);

          return (
            <ReplicaCard
              key={index}
              name={REPLICA_NAMES[index]}
              color={REPLICA_COLORS[index]}
              isSyncing={isSyncing}
            >
              <GraphCanvas
                vertices={visibleVertices}
                arcs={visibleArcs}
                positions={positions}
                onPositionChange={updatePosition}
                onRemoveVertex={(name) => handleRemoveVertex(index, name)}
                onRemoveArc={(from, to) => handleRemoveArc(index, from, to)}
                getOrCreatePosition={getOrCreatePosition}
              />
              <GraphControls
                vertices={visibleVertices}
                onAddVertex={(name) => handleAddVertex(index, name)}
                onAddArc={(from, to) => handleAddArc(index, from, to)}
              />
              <GraphStateView graph={replica} />
            </ReplicaCard>
          );
        })}
      </div>

      <SyncButton onSync={handleSync} onReset={handleReset} isSyncing={isSyncing} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 bg-amber-900/30 border border-amber-600/50 rounded-lg"
      >
        <h3 className="text-amber-400 font-semibold mb-2">Try This Conflict Scenario:</h3>
        <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
          <li>Add vertex "X" on Replica A</li>
          <li>Sync all replicas (so all have "X")</li>
          <li>On Replica A: Remove vertex "X"</li>
          <li>On Replica B (without syncing): Add vertex "X" again</li>
          <li>Sync all replicas - observe that "X" remains visible!</li>
        </ol>
        <p className="text-slate-400 text-xs mt-2">
          This demonstrates add-wins: B's concurrent addition created a new UUID that wasn't in A's removal set.
        </p>
      </motion.div>
    </div>
  );
}
