import { v4 as uuidv4 } from 'uuid';
import type { DirectedGraph, Vertex, Arc, DirectedGraphSerialized } from '../types/crdt';

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
