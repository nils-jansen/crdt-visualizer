// PN-Counter Types
export interface PNCounter {
  P: number[]; // Positive increments per replica
  N: number[]; // Negative decrements per replica
}

// 2P-Set Types
export interface TwoPSet<T = string> {
  added: Set<T>;
  removed: Set<T>; // Tombstones
}

// Serializable version for display
export interface TwoPSetSerialized<T = string> {
  added: T[];
  removed: T[];
}

// Directed Graph Types
export interface Vertex {
  name: string;
  uuid: string;
}

export interface Arc {
  from: string; // Vertex name
  to: string;   // Vertex name
  uuid: string;
}

export interface DirectedGraph {
  vertices: Map<string, Vertex>; // uuid -> Vertex
  removedVertices: Set<string>;  // Set of removed UUIDs
  arcs: Map<string, Arc>;        // uuid -> Arc
  removedArcs: Set<string>;      // Set of removed arc UUIDs
}

// Serializable version for display
export interface DirectedGraphSerialized {
  vertices: Vertex[];
  removedVertices: string[];
  arcs: Arc[];
  removedArcs: string[];
}

// Replica wrapper type
export interface Replica<T> {
  id: string;
  name: string;
  state: T;
}

// Module type for navigation
export type CRDTModule = 'pn-counter' | 'two-p-set' | 'directed-graph';

// Position for graph visualization
export interface Position {
  x: number;
  y: number;
}

// Node with position for graph rendering
export interface VisualVertex extends Vertex {
  position: Position;
}
