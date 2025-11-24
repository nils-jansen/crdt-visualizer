# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

An interactive web application for visualizing Conflict-free Replicated Data Types (CRDTs). This project specifically implements **CvRDTs** (Convergent/State-based CRDTs) with visual demonstrations of how merge functions achieve consistency across replicas.

## Development Commands

```bash
# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint the codebase
npm run lint

# Preview production build
npm run preview
```

## Tech Stack

- **React 19** with TypeScript
- **Vite** for development and building
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **Framer Motion** for animations
- **UUID** for unique identifier generation in CRDTs

## Architecture

### Core CRDT Implementations

Each CRDT type is implemented as a pure TypeScript module in `src/lib/`:

- **`pn-counter.ts`**: PN-Counter (increment/decrement with element-wise max merge)
- **`two-p-set.ts`**: 2P-Set (add-remove with union merge, tombstones)
- **`add-only-set.ts`**: Grow-only set (union merge only)
- **`directed-graph.ts`**: CvRDT directed graph with UUID-tagged vertices/arcs (add-wins semantics)
- **`cmrdt-directed-graph.ts`**: CmRDT (operation-based) directed graph with causal delivery

Each module exports:
- `create*()`: Initialize empty CRDT state
- Operation functions (e.g., `increment()`, `addVertex()`)
- `merge()` or `mergeAll()`: Merge function for convergence
- `generateMergeSteps()`: Step-by-step visualization data for the sync modal
- Utility functions (`getValue()`, `clone()`, `equals()`, etc.)

### Type System

All CRDT types and interfaces are centralized in `src/types/crdt.ts`:

- Base CRDT state types (e.g., `PNCounter`, `DirectedGraph`, `CmRDTGraph`)
- Serializable versions for display (e.g., `DirectedGraphSerialized` - converts Maps/Sets to arrays)
- `Replica<T>` wrapper type with `id`, `name`, and `state`
- Sync step types for modal visualization (`PNCounterSyncStep`, `DirectedGraphSyncStep`, etc.)
- Position/visual types for graph rendering

### Component Structure

```
src/components/
├── layout/
│   ├── AppShell.tsx        # Top-level shell with title and module tabs
│   └── ModuleTabs.tsx      # Tab navigation between CRDT modules
├── shared/
│   ├── ReplicaCard.tsx     # Card wrapper for each replica (A, B, C)
│   ├── SyncButton.tsx      # Sync/Reset buttons
│   ├── SyncModal.tsx       # Step-by-step merge visualization modal
│   ├── InternalStateView.tsx  # Component for displaying internal CRDT state
│   └── steps/              # Step visualizers for each CRDT type
│       ├── PNCounterStepView.tsx
│       ├── TwoPSetStepView.tsx
│       ├── DirectedGraphStepView.tsx
│       ├── AddOnlySetStepView.tsx
│       └── CmRDTGraphStepView.tsx
└── [crdt-name]/
    └── [CRDTName]Module.tsx  # Main module component (e.g., PNCounterModule.tsx)
```

Each module component (`*Module.tsx`):
- Manages local state for 3 replicas (A, B, C)
- Implements operation handlers (increment, add, remove, etc.)
- Handles sync logic: generate merge steps → show modal → apply merge
- Uses `ReplicaCard` for consistent layout across modules

### Module Routing

`App.tsx` uses a simple state-based routing system:
- `currentModule` state controls which CRDT module is displayed
- `CRDTModule` type: `'pn-counter' | 'two-p-set' | 'directed-graph' | 'add-only-set'`
- ModuleTabs component switches between modules

### Sync Visualization Pattern

All modules follow this pattern for demonstrating CRDT convergence:

1. User clicks "Sync All Replicas"
2. `generateMergeSteps()` creates a step-by-step breakdown of the merge algorithm
3. `SyncModal` opens and walks through each step with visual highlights
4. On modal completion, all replicas are updated to the merged state
5. Framer Motion animations highlight changes

### Graph Visualization

The `DirectedGraphModule` includes:
- **SVG-based graph canvas** (`GraphCanvas.tsx`): Renders vertices as circles, arcs as arrows
- **Visual vertex type** (`VisualVertex`): Extends `Vertex` with `position: {x, y}`
- **Draggable vertices**: Uses mouse events to update positions
- **Operation queue visualization** (`OperationQueue.tsx`): For CmRDT operation-based graph

### Key CRDT Semantics

- **PN-Counter**: Element-wise max merge ensures monotonic convergence
- **2P-Set**: Remove-wins (once in tombstones, always removed)
- **Add-Only Set**: Simple union merge, no removals
- **Directed Graph (CvRDT)**: Add-wins semantics via UUID tagging. Concurrent add + remove → add survives because new UUID is not in removal set
- **CmRDT Graph**: Operation-based with causal delivery and operation queues

## Adding a New CRDT Module

1. Create CRDT logic module in `src/lib/[crdt-name].ts` with merge and step generation
2. Add types to `src/types/crdt.ts` (state type, sync step types)
3. Create module component in `src/components/[crdt-name]/[CRDTName]Module.tsx`
4. Create step visualizer in `src/components/shared/steps/[CRDTName]StepView.tsx`
5. Add module to `CRDTModule` union type in `src/types/crdt.ts`
6. Update `App.tsx` to include the new module in routing
7. Update `ModuleTabs.tsx` to add tab for the new module

## Important Patterns

- **Immutability**: All CRDT operations return new state objects (never mutate)
- **Pure functions**: CRDT logic modules are side-effect free
- **Type safety**: TypeScript is used throughout with strict types
- **Animation timing**: Sync animations use 300ms delay for visual smoothness
- **Step-by-step visualization**: Every merge operation can be decomposed into steps for educational purposes
