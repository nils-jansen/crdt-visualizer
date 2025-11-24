import { v4 as uuidv4 } from 'uuid';
import type { DirectedGraph, Vertex, Arc, DirectedGraphSerialized, DirectedGraphSyncStep } from '../types/crdt';

/**
 * Create a new empty Directed Graph
 */
export function createDirectedGraph(): DirectedGraph {
  return {
    vertices: new Map<string, Vertex>(),
    removedVertices: new Set<string>(),
    arcs: new Map<string, Arc>(),
    removedArcs: new Set<string>(),
  };
}

/**
 * Add a vertex with a new unique ID
 * This enables add-wins semantics - concurrent adds create new UUIDs
 */
export function addVertex(graph: DirectedGraph, name: string): DirectedGraph {
  const uuid = uuidv4();
  const vertex: Vertex = { name, uuid };

  const newVertices = new Map(graph.vertices);
  newVertices.set(uuid, vertex);

  return {
    vertices: newVertices,
    removedVertices: new Set(graph.removedVertices),
    arcs: new Map(graph.arcs),
    removedArcs: new Set(graph.removedArcs),
  };
}

/**
 * Remove a vertex by name
 * Finds all currently visible instances and marks their UUIDs as removed
 */
export function removeVertex(graph: DirectedGraph, name: string): DirectedGraph {
  const newRemovedVertices = new Set(graph.removedVertices);
  const newRemovedArcs = new Set(graph.removedArcs);

  // Find all visible vertices with this name and mark them as removed
  for (const [uuid, vertex] of graph.vertices) {
    if (vertex.name === name && !graph.removedVertices.has(uuid)) {
      newRemovedVertices.add(uuid);

      // Also remove all arcs connected to this vertex
      for (const [arcUuid, arc] of graph.arcs) {
        if ((arc.from === name || arc.to === name) && !graph.removedArcs.has(arcUuid)) {
          newRemovedArcs.add(arcUuid);
        }
      }
    }
  }

  return {
    vertices: new Map(graph.vertices),
    removedVertices: newRemovedVertices,
    arcs: new Map(graph.arcs),
    removedArcs: newRemovedArcs,
  };
}

/**
 * Add an arc between two vertices
 * Only succeeds if the source vertex exists locally
 */
export function addArc(graph: DirectedGraph, from: string, to: string): DirectedGraph | null {
  // Check if both vertices exist locally
  const fromExists = getVisibleVertices(graph).some(v => v.name === from);
  const toExists = getVisibleVertices(graph).some(v => v.name === to);

  if (!fromExists || !toExists) {
    return null; // Cannot add arc if vertices don't exist
  }

  const uuid = uuidv4();
  const arc: Arc = { from, to, uuid };

  const newArcs = new Map(graph.arcs);
  newArcs.set(uuid, arc);

  return {
    vertices: new Map(graph.vertices),
    removedVertices: new Set(graph.removedVertices),
    arcs: newArcs,
    removedArcs: new Set(graph.removedArcs),
  };
}

/**
 * Remove an arc between two vertices
 */
export function removeArc(graph: DirectedGraph, from: string, to: string): DirectedGraph {
  const newRemovedArcs = new Set(graph.removedArcs);

  // Find all visible arcs matching from->to and mark them as removed
  for (const [uuid, arc] of graph.arcs) {
    if (arc.from === from && arc.to === to && !graph.removedArcs.has(uuid)) {
      newRemovedArcs.add(uuid);
    }
  }

  return {
    vertices: new Map(graph.vertices),
    removedVertices: new Set(graph.removedVertices),
    arcs: new Map(graph.arcs),
    removedArcs: newRemovedArcs,
  };
}

/**
 * Get all visible vertices (not in removed set)
 */
export function getVisibleVertices(graph: DirectedGraph): Vertex[] {
  const visible: Vertex[] = [];
  const seenNames = new Set<string>();

  for (const [uuid, vertex] of graph.vertices) {
    if (!graph.removedVertices.has(uuid) && !seenNames.has(vertex.name)) {
      visible.push(vertex);
      seenNames.add(vertex.name);
    }
  }

  return visible;
}

/**
 * Get all visible arcs (not in removed set, and both endpoints visible)
 */
export function getVisibleArcs(graph: DirectedGraph): Arc[] {
  const visibleVertexNames = new Set(getVisibleVertices(graph).map(v => v.name));
  const visible: Arc[] = [];
  const seenArcs = new Set<string>();

  for (const [uuid, arc] of graph.arcs) {
    const arcKey = `${arc.from}->${arc.to}`;
    if (
      !graph.removedArcs.has(uuid) &&
      visibleVertexNames.has(arc.from) &&
      visibleVertexNames.has(arc.to) &&
      !seenArcs.has(arcKey)
    ) {
      visible.push(arc);
      seenArcs.add(arcKey);
    }
  }

  return visible;
}

/**
 * Merge two directed graphs using add-wins semantics
 * - Union of all vertices
 * - Union of all removed sets
 * - A vertex is visible if ANY of its UUIDs are not in the removed set
 */
export function merge(graphA: DirectedGraph, graphB: DirectedGraph): DirectedGraph {
  // Union of vertices
  const newVertices = new Map<string, Vertex>();
  for (const [uuid, vertex] of graphA.vertices) {
    newVertices.set(uuid, vertex);
  }
  for (const [uuid, vertex] of graphB.vertices) {
    newVertices.set(uuid, vertex);
  }

  // Union of removed vertices
  const newRemovedVertices = new Set<string>();
  for (const uuid of graphA.removedVertices) newRemovedVertices.add(uuid);
  for (const uuid of graphB.removedVertices) newRemovedVertices.add(uuid);

  // Union of arcs
  const newArcs = new Map<string, Arc>();
  for (const [uuid, arc] of graphA.arcs) {
    newArcs.set(uuid, arc);
  }
  for (const [uuid, arc] of graphB.arcs) {
    newArcs.set(uuid, arc);
  }

  // Union of removed arcs
  const newRemovedArcs = new Set<string>();
  for (const uuid of graphA.removedArcs) newRemovedArcs.add(uuid);
  for (const uuid of graphB.removedArcs) newRemovedArcs.add(uuid);

  return {
    vertices: newVertices,
    removedVertices: newRemovedVertices,
    arcs: newArcs,
    removedArcs: newRemovedArcs,
  };
}

/**
 * Merge multiple directed graphs
 */
export function mergeAll(graphs: DirectedGraph[]): DirectedGraph {
  if (graphs.length === 0) {
    return createDirectedGraph();
  }
  return graphs.reduce((acc, graph) => merge(acc, graph));
}

/**
 * Clone a directed graph (for immutability)
 */
export function clone(graph: DirectedGraph): DirectedGraph {
  return {
    vertices: new Map(graph.vertices),
    removedVertices: new Set(graph.removedVertices),
    arcs: new Map(graph.arcs),
    removedArcs: new Set(graph.removedArcs),
  };
}

/**
 * Convert to serializable format (for display)
 */
export function serialize(graph: DirectedGraph): DirectedGraphSerialized {
  return {
    vertices: Array.from(graph.vertices.values()),
    removedVertices: Array.from(graph.removedVertices),
    arcs: Array.from(graph.arcs.values()),
    removedArcs: Array.from(graph.removedArcs),
  };
}

/**
 * Check if a vertex name exists in the visible graph
 */
export function hasVertex(graph: DirectedGraph, name: string): boolean {
  return getVisibleVertices(graph).some(v => v.name === name);
}

/**
 * Check if an arc exists in the visible graph
 */
export function hasArc(graph: DirectedGraph, from: string, to: string): boolean {
  return getVisibleArcs(graph).some(a => a.from === from && a.to === to);
}

/**
 * Generate step-by-step merge visualization data
 */
export function generateMergeSteps(
  source: DirectedGraph,
  target: DirectedGraph
): DirectedGraphSyncStep[] {
  const totalSteps = 5;

  // Helper to convert to items with labels
  const vertexToItem = (v: Vertex) => ({ id: v.uuid, label: `${v.name} [${v.uuid.slice(0, 6)}]` });
  const arcToItem = (a: Arc) => ({ id: a.uuid, label: `${a.from}→${a.to} [${a.uuid.slice(0, 6)}]` });

  // Step 1: Union of vertices
  const sourceVertices = Array.from(source.vertices.values());
  const targetVertices = Array.from(target.vertices.values());
  const sourceVertexUuids = new Set(sourceVertices.map(v => v.uuid));
  const targetVertexUuids = new Set(targetVertices.map(v => v.uuid));
  const onlyInSourceVertices = sourceVertices.filter(v => !targetVertexUuids.has(v.uuid)).map(v => v.uuid);
  const onlyInTargetVertices = targetVertices.filter(v => !sourceVertexUuids.has(v.uuid)).map(v => v.uuid);
  const allVertices = [...sourceVertices];
  for (const v of targetVertices) {
    if (!sourceVertexUuids.has(v.uuid)) {
      allVertices.push(v);
    }
  }

  // Step 2: Union of vertex tombstones
  const sourceRemovedVertices = Array.from(source.removedVertices);
  const targetRemovedVertices = Array.from(target.removedVertices);
  const onlyInSourceRemoved = sourceRemovedVertices.filter(id => !target.removedVertices.has(id));
  const onlyInTargetRemoved = targetRemovedVertices.filter(id => !source.removedVertices.has(id));
  const allRemovedVertices = [...new Set([...sourceRemovedVertices, ...targetRemovedVertices])];

  // Step 3: Union of arcs
  const sourceArcs = Array.from(source.arcs.values());
  const targetArcs = Array.from(target.arcs.values());
  const sourceArcUuids = new Set(sourceArcs.map(a => a.uuid));
  const targetArcUuids = new Set(targetArcs.map(a => a.uuid));
  const onlyInSourceArcs = sourceArcs.filter(a => !targetArcUuids.has(a.uuid)).map(a => a.uuid);
  const onlyInTargetArcs = targetArcs.filter(a => !sourceArcUuids.has(a.uuid)).map(a => a.uuid);
  const allArcs = [...sourceArcs];
  for (const a of targetArcs) {
    if (!sourceArcUuids.has(a.uuid)) {
      allArcs.push(a);
    }
  }

  // Step 4: Union of arc tombstones
  const sourceRemovedArcs = Array.from(source.removedArcs);
  const targetRemovedArcs = Array.from(target.removedArcs);
  const onlyInSourceRemovedArcs = sourceRemovedArcs.filter(id => !target.removedArcs.has(id));
  const onlyInTargetRemovedArcs = targetRemovedArcs.filter(id => !source.removedArcs.has(id));
  const allRemovedArcs = [...new Set([...sourceRemovedArcs, ...targetRemovedArcs])];

  // Step 5: Compute visible graph and find add-wins cases
  const sourceVisible = getVisibleVertices(source).map(v => v.name);
  const targetVisible = getVisibleVertices(target).map(v => v.name);

  // Build merged graph to get result
  const merged = merge(source, target);
  const resultVisible = getVisibleVertices(merged).map(v => v.name);

  // Find add-wins examples: vertices visible in result that were removed on one side
  const addWinsExamples: { name: string; reason: string }[] = [];
  const removedSet = new Set(allRemovedVertices);

  for (const vertex of allVertices) {
    if (removedSet.has(vertex.uuid)) continue; // This UUID was removed

    // Check if this vertex name was "removed" by one replica but survives due to new UUID
    const nameRemovedOnSource = !sourceVisible.includes(vertex.name) && source.vertices.size > 0;
    const nameRemovedOnTarget = !targetVisible.includes(vertex.name) && target.vertices.size > 0;
    const survivesInResult = resultVisible.includes(vertex.name);

    if ((nameRemovedOnSource || nameRemovedOnTarget) && survivesInResult) {
      // Check if this is actually an add-wins case
      const verticesWithName = allVertices.filter(v => v.name === vertex.name);
      const hasRemovedUuid = verticesWithName.some(v => removedSet.has(v.uuid));
      const hasLiveUuid = verticesWithName.some(v => !removedSet.has(v.uuid));

      if (hasRemovedUuid && hasLiveUuid) {
        const reason = nameRemovedOnSource
          ? 'Removed on source, but target added with new UUID'
          : 'Removed on target, but source added with new UUID';
        if (!addWinsExamples.some(e => e.name === vertex.name)) {
          addWinsExamples.push({ name: vertex.name, reason });
        }
      }
    }
  }

  return [
    {
      id: 'graph-step-1',
      stepNumber: 1,
      totalSteps,
      title: 'Union of All Vertices',
      description: 'Combine all vertex UUIDs from both replicas. Each vertex addition creates a unique UUID, enabling add-wins semantics.',
      type: 'directed-graph',
      operation: 'union-vertices',
      sourceItems: sourceVertices.map(vertexToItem),
      targetItems: targetVertices.map(vertexToItem),
      resultItems: allVertices.map(vertexToItem),
      onlyInSource: onlyInSourceVertices,
      onlyInTarget: onlyInTargetVertices,
    },
    {
      id: 'graph-step-2',
      stepNumber: 2,
      totalSteps,
      title: 'Union of Vertex Tombstones',
      description: 'Combine all removed vertex UUIDs. A removal only affects the specific UUID that was observed at removal time.',
      type: 'directed-graph',
      operation: 'union-vertex-tombstones',
      sourceItems: sourceRemovedVertices.map(id => ({ id, label: id.slice(0, 8) })),
      targetItems: targetRemovedVertices.map(id => ({ id, label: id.slice(0, 8) })),
      resultItems: allRemovedVertices.map(id => ({ id, label: id.slice(0, 8) })),
      onlyInSource: onlyInSourceRemoved,
      onlyInTarget: onlyInTargetRemoved,
    },
    {
      id: 'graph-step-3',
      stepNumber: 3,
      totalSteps,
      title: 'Union of All Arcs',
      description: 'Combine all arc UUIDs from both replicas.',
      type: 'directed-graph',
      operation: 'union-arcs',
      sourceItems: sourceArcs.map(arcToItem),
      targetItems: targetArcs.map(arcToItem),
      resultItems: allArcs.map(arcToItem),
      onlyInSource: onlyInSourceArcs,
      onlyInTarget: onlyInTargetArcs,
    },
    {
      id: 'graph-step-4',
      stepNumber: 4,
      totalSteps,
      title: 'Union of Arc Tombstones',
      description: 'Combine all removed arc UUIDs from both replicas.',
      type: 'directed-graph',
      operation: 'union-arc-tombstones',
      sourceItems: sourceRemovedArcs.map(id => ({ id, label: id.slice(0, 8) })),
      targetItems: targetRemovedArcs.map(id => ({ id, label: id.slice(0, 8) })),
      resultItems: allRemovedArcs.map(id => ({ id, label: id.slice(0, 8) })),
      onlyInSource: onlyInSourceRemovedArcs,
      onlyInTarget: onlyInTargetRemovedArcs,
    },
    {
      id: 'graph-step-5',
      stepNumber: 5,
      totalSteps,
      title: 'Resolve Visible Graph',
      description: addWinsExamples.length > 0
        ? `Vertices are visible if any UUID is not tombstoned. Add-wins detected: ${addWinsExamples.map(e => e.name).join(', ')}`
        : 'Vertices are visible if any of their UUIDs is not in the tombstone set.',
      type: 'directed-graph',
      operation: 'result',
      sourceVisibleVertices: sourceVisible,
      targetVisibleVertices: targetVisible,
      resultVisibleVertices: resultVisible,
      addWinsExamples,
    },
  ];
}
