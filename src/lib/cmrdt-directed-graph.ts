import { v4 as uuidv4 } from 'uuid';
import type {
  CmRDTGraph,
  CmRDTGraphSerialized,
  PreparedOp,
  AddVertexPayload,
  RemoveVertexPayload,
  AddArcPayload,
  RemoveArcPayload,
  CmRDTSyncStep,
} from '../types/crdt';

// =============================================================================
// Create & Clone
// =============================================================================

/**
 * Create a new empty CmRDT Directed Graph
 */
export function createCmRDTGraph(replicaId: string): CmRDTGraph {
  return {
    V: new Map<string, Set<string>>(),
    R: new Set<string>(),
    arcs: new Map<string, { from: string; to: string }>(),
    removedArcs: new Set<string>(),
    operationQueue: [],
    clock: 0,
    replicaId,
  };
}

/**
 * Clone a CmRDT graph (deep copy for immutability)
 */
export function clone(graph: CmRDTGraph): CmRDTGraph {
  const newV = new Map<string, Set<string>>();
  for (const [name, tags] of graph.V) {
    newV.set(name, new Set(tags));
  }

  return {
    V: newV,
    R: new Set(graph.R),
    arcs: new Map(graph.arcs),
    removedArcs: new Set(graph.removedArcs),
    operationQueue: [...graph.operationQueue],
    clock: graph.clock,
    replicaId: graph.replicaId,
  };
}

// =============================================================================
// Prepare Phase - Generate operations with payloads
// =============================================================================

/**
 * Prepare AddVertex operation
 * Generates a unique tag for the new vertex
 */
export function prepareAddVertex(graph: CmRDTGraph, name: string): PreparedOp {
  const tag = uuidv4();
  const newClock = graph.clock + 1;

  return {
    id: uuidv4(),
    type: 'AddVertex',
    originReplica: graph.replicaId,
    timestamp: newClock,
    payload: { name, tag } as AddVertexPayload,
  };
}

/**
 * Prepare RemoveVertex operation
 * Collects all observed tags for the vertex name
 */
export function prepareRemoveVertex(graph: CmRDTGraph, name: string): PreparedOp | null {
  const tags = graph.V.get(name);
  if (!tags || tags.size === 0) {
    return null; // No vertex with this name exists
  }

  // Collect only tags that are not already in R (visible tags)
  const observedTags = Array.from(tags).filter(tag => !graph.R.has(tag));
  if (observedTags.length === 0) {
    return null; // All tags already removed
  }

  const newClock = graph.clock + 1;

  return {
    id: uuidv4(),
    type: 'RemoveVertex',
    originReplica: graph.replicaId,
    timestamp: newClock,
    payload: { name, observedTags } as RemoveVertexPayload,
  };
}

/**
 * Prepare AddArc operation
 * Only prepares if source vertex exists locally
 */
export function prepareAddArc(graph: CmRDTGraph, from: string, to: string): PreparedOp | null {
  // Check if 'from' vertex exists locally (has visible tags)
  const fromTags = graph.V.get(from);
  const fromVisible = fromTags && Array.from(fromTags).some(tag => !graph.R.has(tag));

  if (!fromVisible) {
    return null; // Source vertex doesn't exist
  }

  // Also check destination exists
  const toTags = graph.V.get(to);
  const toVisible = toTags && Array.from(toTags).some(tag => !graph.R.has(tag));

  if (!toVisible) {
    return null; // Destination vertex doesn't exist
  }

  const tag = uuidv4();
  const newClock = graph.clock + 1;

  return {
    id: uuidv4(),
    type: 'AddArc',
    originReplica: graph.replicaId,
    timestamp: newClock,
    payload: { from, to, tag } as AddArcPayload,
  };
}

/**
 * Prepare RemoveArc operation
 * Collects all observed arc UUIDs for this edge
 */
export function prepareRemoveArc(graph: CmRDTGraph, from: string, to: string): PreparedOp | null {
  const observedTags: string[] = [];

  for (const [uuid, arc] of graph.arcs) {
    if (arc.from === from && arc.to === to && !graph.removedArcs.has(uuid)) {
      observedTags.push(uuid);
    }
  }

  if (observedTags.length === 0) {
    return null; // No visible arc to remove
  }

  const newClock = graph.clock + 1;

  return {
    id: uuidv4(),
    type: 'RemoveArc',
    originReplica: graph.replicaId,
    timestamp: newClock,
    payload: { from, to, observedTags } as RemoveArcPayload,
  };
}

// =============================================================================
// Effect Phase - Apply operations to graph state
// =============================================================================

/**
 * Apply AddVertex effect
 */
export function effectAddVertex(graph: CmRDTGraph, payload: AddVertexPayload): CmRDTGraph {
  const newGraph = clone(graph);
  const { name, tag } = payload;

  if (!newGraph.V.has(name)) {
    newGraph.V.set(name, new Set());
  }
  newGraph.V.get(name)!.add(tag);

  return newGraph;
}

/**
 * Apply RemoveVertex effect
 * Only removes the specific observed tags
 */
export function effectRemoveVertex(graph: CmRDTGraph, payload: RemoveVertexPayload): CmRDTGraph {
  const newGraph = clone(graph);
  const { observedTags } = payload;

  // Add observed tags to removal set
  for (const tag of observedTags) {
    newGraph.R.add(tag);
  }

  // Also remove arcs connected to this vertex if all its tags are now removed
  const { name } = payload;
  const remainingTags = newGraph.V.get(name);
  const stillVisible = remainingTags && Array.from(remainingTags).some(t => !newGraph.R.has(t));

  if (!stillVisible) {
    // Remove all arcs connected to this vertex
    for (const [uuid, arc] of newGraph.arcs) {
      if ((arc.from === name || arc.to === name) && !newGraph.removedArcs.has(uuid)) {
        newGraph.removedArcs.add(uuid);
      }
    }
  }

  return newGraph;
}

/**
 * Apply AddArc effect
 */
export function effectAddArc(graph: CmRDTGraph, payload: AddArcPayload): CmRDTGraph {
  const newGraph = clone(graph);
  const { from, to, tag } = payload;

  // Check if both endpoints are visible
  const fromTags = newGraph.V.get(from);
  const fromVisible = fromTags && Array.from(fromTags).some(t => !newGraph.R.has(t));

  const toTags = newGraph.V.get(to);
  const toVisible = toTags && Array.from(toTags).some(t => !newGraph.R.has(t));

  if (fromVisible && toVisible) {
    newGraph.arcs.set(tag, { from, to });
  }

  return newGraph;
}

/**
 * Apply RemoveArc effect
 */
export function effectRemoveArc(graph: CmRDTGraph, payload: RemoveArcPayload): CmRDTGraph {
  const newGraph = clone(graph);
  const { observedTags } = payload;

  for (const tag of observedTags) {
    newGraph.removedArcs.add(tag);
  }

  return newGraph;
}

/**
 * Apply any operation effect based on type
 */
export function applyEffect(graph: CmRDTGraph, op: PreparedOp): CmRDTGraph {
  let newGraph: CmRDTGraph;

  switch (op.type) {
    case 'AddVertex':
      newGraph = effectAddVertex(graph, op.payload as AddVertexPayload);
      break;
    case 'RemoveVertex':
      newGraph = effectRemoveVertex(graph, op.payload as RemoveVertexPayload);
      break;
    case 'AddArc':
      newGraph = effectAddArc(graph, op.payload as AddArcPayload);
      break;
    case 'RemoveArc':
      newGraph = effectRemoveArc(graph, op.payload as RemoveArcPayload);
      break;
    default:
      return graph;
  }

  // Update clock to be at least as high as the operation's timestamp
  newGraph.clock = Math.max(newGraph.clock, op.timestamp);

  return newGraph;
}

// =============================================================================
// Local Operations (prepare + immediate local effect + queue for delivery)
// =============================================================================

/**
 * Add a vertex locally and queue operation for delivery
 */
export function addVertex(graph: CmRDTGraph, name: string): CmRDTGraph {
  const op = prepareAddVertex(graph, name);
  let newGraph = clone(graph);
  newGraph.clock = op.timestamp;

  // Apply effect locally
  newGraph = effectAddVertex(newGraph, op.payload as AddVertexPayload);

  // Queue for delivery to other replicas
  newGraph.operationQueue = [...newGraph.operationQueue, op];

  return newGraph;
}

/**
 * Remove a vertex locally and queue operation for delivery
 */
export function removeVertex(graph: CmRDTGraph, name: string): CmRDTGraph | null {
  const op = prepareRemoveVertex(graph, name);
  if (!op) return null;

  let newGraph = clone(graph);
  newGraph.clock = op.timestamp;

  // Apply effect locally
  newGraph = effectRemoveVertex(newGraph, op.payload as RemoveVertexPayload);

  // Queue for delivery
  newGraph.operationQueue = [...newGraph.operationQueue, op];

  return newGraph;
}

/**
 * Add an arc locally and queue operation for delivery
 */
export function addArc(graph: CmRDTGraph, from: string, to: string): CmRDTGraph | null {
  const op = prepareAddArc(graph, from, to);
  if (!op) return null;

  let newGraph = clone(graph);
  newGraph.clock = op.timestamp;

  // Apply effect locally
  newGraph = effectAddArc(newGraph, op.payload as AddArcPayload);

  // Queue for delivery
  newGraph.operationQueue = [...newGraph.operationQueue, op];

  return newGraph;
}

/**
 * Remove an arc locally and queue operation for delivery
 */
export function removeArc(graph: CmRDTGraph, from: string, to: string): CmRDTGraph | null {
  const op = prepareRemoveArc(graph, from, to);
  if (!op) return null;

  let newGraph = clone(graph);
  newGraph.clock = op.timestamp;

  // Apply effect locally
  newGraph = effectRemoveArc(newGraph, op.payload as RemoveArcPayload);

  // Queue for delivery
  newGraph.operationQueue = [...newGraph.operationQueue, op];

  return newGraph;
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Get all visible vertex names (those with at least one tag not in R)
 */
export function getVisibleVertices(graph: CmRDTGraph): string[] {
  const visible: string[] = [];

  for (const [name, tags] of graph.V) {
    const hasVisibleTag = Array.from(tags).some(tag => !graph.R.has(tag));
    if (hasVisibleTag) {
      visible.push(name);
    }
  }

  return visible.sort();
}

/**
 * Get all visible arcs
 */
export function getVisibleArcs(graph: CmRDTGraph): { from: string; to: string; uuid: string }[] {
  const visibleVertices = new Set(getVisibleVertices(graph));
  const visible: { from: string; to: string; uuid: string }[] = [];
  const seenArcs = new Set<string>();

  for (const [uuid, arc] of graph.arcs) {
    const arcKey = `${arc.from}->${arc.to}`;
    if (
      !graph.removedArcs.has(uuid) &&
      visibleVertices.has(arc.from) &&
      visibleVertices.has(arc.to) &&
      !seenArcs.has(arcKey)
    ) {
      visible.push({ ...arc, uuid });
      seenArcs.add(arcKey);
    }
  }

  return visible;
}

/**
 * Check if a vertex exists and is visible
 */
export function hasVertex(graph: CmRDTGraph, name: string): boolean {
  return getVisibleVertices(graph).includes(name);
}

/**
 * Check if an arc exists and is visible
 */
export function hasArc(graph: CmRDTGraph, from: string, to: string): boolean {
  return getVisibleArcs(graph).some(a => a.from === from && a.to === to);
}

// =============================================================================
// Sync / Delivery Functions
// =============================================================================

/**
 * Deliver operations from one replica to another
 * Returns the updated target graph after applying all operations
 */
export function deliverOperations(
  source: CmRDTGraph,
  target: CmRDTGraph
): { updatedTarget: CmRDTGraph; deliveredOps: PreparedOp[] } {
  const deliveredOps = [...source.operationQueue];
  let updatedTarget = clone(target);

  // Sort operations by timestamp for causal delivery
  const sortedOps = [...deliveredOps].sort((a, b) => a.timestamp - b.timestamp);

  for (const op of sortedOps) {
    updatedTarget = applyEffect(updatedTarget, op);
  }

  return { updatedTarget, deliveredOps };
}

/**
 * Clear the operation queue after delivery
 */
export function clearOperationQueue(graph: CmRDTGraph): CmRDTGraph {
  return {
    ...clone(graph),
    operationQueue: [],
  };
}

/**
 * Perform full sync: deliver all queued operations to all other replicas
 * Returns updated replicas array
 */
export function syncAllReplicas(replicas: CmRDTGraph[]): {
  updatedReplicas: CmRDTGraph[];
  allDeliveredOps: { from: string; to: string; ops: PreparedOp[] }[];
} {
  const allDeliveredOps: { from: string; to: string; ops: PreparedOp[] }[] = [];
  let updatedReplicas = replicas.map(clone);

  // Collect all operations from all replicas
  const allOps: { op: PreparedOp; sourceIndex: number }[] = [];
  for (let i = 0; i < updatedReplicas.length; i++) {
    for (const op of updatedReplicas[i].operationQueue) {
      allOps.push({ op, sourceIndex: i });
    }
  }

  // Sort by timestamp for causal delivery
  allOps.sort((a, b) => a.op.timestamp - b.op.timestamp);

  // Deliver each operation to all other replicas
  for (const { op, sourceIndex } of allOps) {
    for (let targetIndex = 0; targetIndex < updatedReplicas.length; targetIndex++) {
      if (targetIndex !== sourceIndex) {
        updatedReplicas[targetIndex] = applyEffect(updatedReplicas[targetIndex], op);

        allDeliveredOps.push({
          from: updatedReplicas[sourceIndex].replicaId,
          to: updatedReplicas[targetIndex].replicaId,
          ops: [op],
        });
      }
    }
  }

  // Clear all operation queues
  updatedReplicas = updatedReplicas.map(clearOperationQueue);

  return { updatedReplicas, allDeliveredOps };
}

// =============================================================================
// Serialization
// =============================================================================

/**
 * Convert to serializable format for display
 */
export function serialize(graph: CmRDTGraph): CmRDTGraphSerialized {
  const V: { name: string; tags: string[] }[] = [];
  for (const [name, tags] of graph.V) {
    V.push({ name, tags: Array.from(tags) });
  }

  const arcs: { uuid: string; from: string; to: string }[] = [];
  for (const [uuid, arc] of graph.arcs) {
    arcs.push({ uuid, from: arc.from, to: arc.to });
  }

  return {
    V,
    R: Array.from(graph.R),
    arcs,
    removedArcs: Array.from(graph.removedArcs),
    operationQueue: graph.operationQueue,
    clock: graph.clock,
  };
}

// =============================================================================
// Sync Step Generation for Visualization
// =============================================================================

/**
 * Generate step-by-step operation delivery visualization
 */
export function generateDeliverySteps(replicas: CmRDTGraph[]): CmRDTSyncStep[] {
  const steps: CmRDTSyncStep[] = [];
  let stepNumber = 1;

  // Collect all operations
  const allOps: { op: PreparedOp; sourceIndex: number }[] = [];
  for (let i = 0; i < replicas.length; i++) {
    for (const op of replicas[i].operationQueue) {
      allOps.push({ op, sourceIndex: i });
    }
  }

  if (allOps.length === 0) {
    // No operations to deliver
    steps.push({
      id: 'no-ops',
      stepNumber: 1,
      totalSteps: 1,
      title: 'No Pending Operations',
      description: 'All replicas are already synchronized. No operations in any queue.',
      type: 'directed-graph',
      operation: 'cmrdt-result',
      replicaStates: replicas.map(r => ({
        replicaId: r.replicaId,
        visibleVertices: getVisibleVertices(r),
        visibleArcs: getVisibleArcs(r),
      })),
      conflicts: [],
    });
    return steps;
  }

  // Sort by timestamp
  allOps.sort((a, b) => a.op.timestamp - b.op.timestamp);

  const totalSteps = allOps.length * (replicas.length - 1) + 2; // ops delivered + queue show + result

  // First show all queues
  for (const replica of replicas) {
    if (replica.operationQueue.length > 0) {
      steps.push({
        id: `queue-${replica.replicaId}`,
        stepNumber: stepNumber++,
        totalSteps,
        title: `Operation Queue: Replica ${replica.replicaId}`,
        description: `${replica.operationQueue.length} operation(s) pending delivery`,
        type: 'directed-graph',
        operation: 'show-queue',
        replicaId: replica.replicaId,
        queue: replica.operationQueue,
      });
    }
  }

  // Simulate delivery and show each step
  const simulatedReplicas = replicas.map(clone);

  for (const { op, sourceIndex } of allOps) {
    for (let targetIndex = 0; targetIndex < simulatedReplicas.length; targetIndex++) {
      if (targetIndex === sourceIndex) continue;

      const targetReplica = simulatedReplicas[targetIndex];
      const beforeV: { name: string; tags: string[] }[] = [];
      for (const [name, tags] of targetReplica.V) {
        beforeV.push({ name, tags: Array.from(tags) });
      }
      const beforeR = Array.from(targetReplica.R);

      // Apply the effect
      simulatedReplicas[targetIndex] = applyEffect(targetReplica, op);

      const afterV: { name: string; tags: string[] }[] = [];
      for (const [name, tags] of simulatedReplicas[targetIndex].V) {
        afterV.push({ name, tags: Array.from(tags) });
      }
      const afterR = Array.from(simulatedReplicas[targetIndex].R);

      const effectDescription = describeEffect(op);

      steps.push({
        id: `deliver-${op.id}-to-${targetReplica.replicaId}`,
        stepNumber: stepNumber++,
        totalSteps,
        title: `Deliver ${op.type} to Replica ${targetReplica.replicaId}`,
        description: effectDescription,
        type: 'directed-graph',
        operation: 'deliver-op',
        op,
        sourceReplica: replicas[sourceIndex].replicaId,
        targetReplica: targetReplica.replicaId,
        beforeState: { V: beforeV, R: beforeR },
        afterState: { V: afterV, R: afterR },
        effectDescription,
      });
    }
  }

  // Detect conflicts (add-wins scenarios)
  const conflicts: { vertexName: string; explanation: string }[] = [];
  for (const replica of simulatedReplicas) {
    for (const [name, tags] of replica.V) {
      const visibleTags = Array.from(tags).filter(t => !replica.R.has(t));
      const removedTags = Array.from(tags).filter(t => replica.R.has(t));

      if (visibleTags.length > 0 && removedTags.length > 0) {
        if (!conflicts.some(c => c.vertexName === name)) {
          conflicts.push({
            vertexName: name,
            explanation: `Vertex "${name}" has ${removedTags.length} removed tag(s) but survives with ${visibleTags.length} new tag(s) from concurrent add`,
          });
        }
      }
    }
  }

  // Final result step
  steps.push({
    id: 'result',
    stepNumber: stepNumber,
    totalSteps,
    title: 'Sync Complete',
    description: conflicts.length > 0
      ? `All operations delivered. ${conflicts.length} add-wins conflict(s) resolved.`
      : 'All operations delivered. Replicas are now synchronized.',
    type: 'directed-graph',
    operation: 'cmrdt-result',
    replicaStates: simulatedReplicas.map(r => ({
      replicaId: r.replicaId,
      visibleVertices: getVisibleVertices(r),
      visibleArcs: getVisibleArcs(r),
    })),
    conflicts,
  });

  return steps;
}

/**
 * Generate human-readable description of an operation effect
 */
function describeEffect(op: PreparedOp): string {
  switch (op.type) {
    case 'AddVertex': {
      const payload = op.payload as AddVertexPayload;
      return `Add vertex "${payload.name}" with tag [${payload.tag.slice(0, 6)}...]`;
    }
    case 'RemoveVertex': {
      const payload = op.payload as RemoveVertexPayload;
      return `Remove vertex "${payload.name}" (${payload.observedTags.length} observed tag(s))`;
    }
    case 'AddArc': {
      const payload = op.payload as AddArcPayload;
      return `Add arc ${payload.from} → ${payload.to}`;
    }
    case 'RemoveArc': {
      const payload = op.payload as RemoveArcPayload;
      return `Remove arc ${payload.from} → ${payload.to} (${payload.observedTags.length} observed)`;
    }
    default:
      return 'Unknown operation';
  }
}
