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

// Add-Only Set Types
export interface AddOnlySet<T = string> {
  elements: Set<T>;
}

// Serializable version for display
export interface AddOnlySetSerialized<T = string> {
  elements: T[];
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
export type CRDTModule = 'pn-counter' | 'two-p-set' | 'directed-graph' | 'add-only-set';

// Position for graph visualization
export interface Position {
  x: number;
  y: number;
}

// Node with position for graph rendering
export interface VisualVertex extends Vertex {
  position: Position;
}

// Sync Step Types for Modal Visualization
export type SyncStepType = 'pn-counter' | 'two-p-set' | 'directed-graph' | 'add-only-set';

export interface SyncStepHighlight {
  indices?: number[];        // For vector comparisons
  elements?: string[];       // For set elements
  uuids?: string[];          // For graph UUIDs
  status: 'added' | 'removed' | 'winner' | 'unchanged' | 'comparing';
}

export interface BaseSyncStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  type: SyncStepType;
}

// PN-Counter Sync Steps
export interface PNCounterVectorCompareStep extends BaseSyncStep {
  type: 'pn-counter';
  operation: 'compare-p' | 'compare-n';
  sourceVector: number[];
  targetVector: number[];
  resultVector: number[];
  winnerIndices: number[];  // Which indices had different values (source won or target won)
}

export interface PNCounterResultStep extends BaseSyncStep {
  type: 'pn-counter';
  operation: 'result';
  mergedP: number[];
  mergedN: number[];
  sourceValue: number;
  targetValue: number;
  resultValue: number;
}

export type PNCounterSyncStep = PNCounterVectorCompareStep | PNCounterResultStep;

// 2P-Set Sync Steps
export interface TwoPSetUnionStep extends BaseSyncStep {
  type: 'two-p-set';
  operation: 'union-added' | 'union-removed';
  sourceSet: string[];
  targetSet: string[];
  resultSet: string[];
  onlyInSource: string[];
  onlyInTarget: string[];
  inBoth: string[];
}

export interface TwoPSetResultStep extends BaseSyncStep {
  type: 'two-p-set';
  operation: 'result';
  mergedAdded: string[];
  mergedRemoved: string[];
  sourceVisible: string[];
  targetVisible: string[];
  resultVisible: string[];
  newlyVisible: string[];
  newlyHidden: string[];
}

export type TwoPSetSyncStep = TwoPSetUnionStep | TwoPSetResultStep;

// Add-Only Set Sync Steps
export interface AddOnlySetUnionStep extends BaseSyncStep {
  type: 'add-only-set';
  operation: 'union';
  sourceSet: string[];
  targetSet: string[];
  resultSet: string[];
  onlyInSource: string[];
  onlyInTarget: string[];
  inBoth: string[];
}

export interface AddOnlySetResultStep extends BaseSyncStep {
  type: 'add-only-set';
  operation: 'result';
  mergedSet: string[];
  sourceElements: string[];
  targetElements: string[];
  resultElements: string[];
  newElements: string[];
}

export type AddOnlySetSyncStep = AddOnlySetUnionStep | AddOnlySetResultStep;

// Directed Graph Sync Steps
export interface GraphUnionStep extends BaseSyncStep {
  type: 'directed-graph';
  operation: 'union-vertices' | 'union-vertex-tombstones' | 'union-arcs' | 'union-arc-tombstones';
  sourceItems: { id: string; label: string }[];
  targetItems: { id: string; label: string }[];
  resultItems: { id: string; label: string }[];
  onlyInSource: string[];
  onlyInTarget: string[];
}

export interface GraphResultStep extends BaseSyncStep {
  type: 'directed-graph';
  operation: 'result';
  sourceVisibleVertices: string[];
  targetVisibleVertices: string[];
  resultVisibleVertices: string[];
  addWinsExamples: { name: string; reason: string }[];  // Vertices that survived due to add-wins
}

export type DirectedGraphSyncStep = GraphUnionStep | GraphResultStep;

// Union type for all sync steps
export type SyncStep = PNCounterSyncStep | TwoPSetSyncStep | DirectedGraphSyncStep | AddOnlySetSyncStep;

// =============================================================================
// CmRDT (Operation-Based) Directed Graph Types
// =============================================================================

// Operation types for the CmRDT graph
export type CmRDTOpType = 'AddVertex' | 'RemoveVertex' | 'AddArc' | 'RemoveArc';

// Payload types for different operations
export interface AddVertexPayload {
  name: string;
  tag: string; // Unique UUID generated during prepare phase
}

export interface RemoveVertexPayload {
  name: string;
  observedTags: string[]; // Tags observed at prepare time
}

export interface AddArcPayload {
  from: string;
  to: string;
  tag: string; // Unique UUID for the arc
}

export interface RemoveArcPayload {
  from: string;
  to: string;
  observedTags: string[]; // Arc UUIDs observed at prepare time
}

export type CmRDTOpPayload = AddVertexPayload | RemoveVertexPayload | AddArcPayload | RemoveArcPayload;

// A prepared operation ready for delivery
export interface PreparedOp {
  id: string;              // Unique operation ID
  type: CmRDTOpType;
  originReplica: string;   // Which replica generated this operation
  timestamp: number;       // Logical clock for causal ordering
  payload: CmRDTOpPayload;
}

// CmRDT Graph state
export interface CmRDTGraph {
  V: Map<string, Set<string>>;    // vertex_name -> Set<uuid tags>
  R: Set<string>;                 // Removal set of observed vertex UUIDs
  arcs: Map<string, { from: string; to: string }>; // arc_uuid -> {from, to}
  removedArcs: Set<string>;       // Removal set for arc UUIDs
  operationQueue: PreparedOp[];   // Pending operations to deliver to other replicas
  clock: number;                  // Logical clock for this replica
  replicaId: string;              // Identifier for this replica
}

// Serializable version for display
export interface CmRDTGraphSerialized {
  V: { name: string; tags: string[] }[];
  R: string[];
  arcs: { uuid: string; from: string; to: string }[];
  removedArcs: string[];
  operationQueue: PreparedOp[];
  clock: number;
}

// CmRDT Sync Steps for operation delivery visualization
export interface CmRDTDeliveryStep extends BaseSyncStep {
  type: 'directed-graph';
  operation: 'deliver-op';
  op: PreparedOp;
  sourceReplica: string;
  targetReplica: string;
  beforeState: {
    V: { name: string; tags: string[] }[];
    R: string[];
  };
  afterState: {
    V: { name: string; tags: string[] }[];
    R: string[];
  };
  effectDescription: string;
}

export interface CmRDTQueueStep extends BaseSyncStep {
  type: 'directed-graph';
  operation: 'show-queue';
  replicaId: string;
  queue: PreparedOp[];
}

export interface CmRDTConflictStep extends BaseSyncStep {
  type: 'directed-graph';
  operation: 'conflict-resolution';
  vertexName: string;
  removedTags: string[];
  survivingTags: string[];
  explanation: string;
}

export interface CmRDTResultStep extends BaseSyncStep {
  type: 'directed-graph';
  operation: 'cmrdt-result';
  replicaStates: {
    replicaId: string;
    visibleVertices: string[];
    visibleArcs: { from: string; to: string }[];
  }[];
  conflicts: { vertexName: string; explanation: string }[];
}

export type CmRDTSyncStep = CmRDTDeliveryStep | CmRDTQueueStep | CmRDTConflictStep | CmRDTResultStep;
