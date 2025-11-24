# CRDT Visualizer

An interactive web application for visualizing Conflict-free Replicated Data Types (CRDTs). Built with React, TypeScript, and Tailwind CSS.

## What are CRDTs?

CRDTs are data structures that can be replicated across multiple nodes, updated independently and concurrently without coordination, and merged to produce a consistent state. This project implements **CvRDTs** (Convergent/State-based CRDTs), which achieve consistency through merge functions that combine full state.

## Features

- **Split-view visualization** of 2-3 independent replicas (A, B, C)
- **Local operations** on each replica (Add, Remove, Increment, Decrement)
- **Sync/Merge button** that demonstrates convergence across all replicas
- **Step-by-step sync modal** showing exactly how the merge algorithm works
- **Dual view** for each replica: User View (computed value) and Internal State (raw data structures)
- **Animated transitions** highlighting changes during synchronization

## Implemented CRDTs

### 1. PN-Counter (Positive-Negative Counter)

A counter that supports both increment and decrement operations.

- **Internal State:** Two vectors `P` (increments) and `N` (decrements), one entry per replica
- **Value:** `Sum(P) - Sum(N)`
- **Merge:** Element-wise maximum of both vectors

### 2. 2P-Set (Two-Phase Set)

A set that supports add and remove, with remove-wins semantics.

- **Internal State:** Two sets - `Added` and `Removed` (tombstones)
- **Visible Elements:** Elements in `Added` but not in `Removed`
- **Merge:** Union of `Added` sets, union of `Removed` sets
- **Limitation:** Once removed, an element cannot be re-added

### 3. Directed Graph (Add-Wins / OR-Set Variant)

A graph structure using UUID tagging for add-wins conflict resolution.

- **Internal State:** Vertices and arcs stored with unique UUIDs, plus tombstone sets
- **Merge:** Union of all UUIDs and tombstone sets
- **Add-Wins:** Concurrent additions create new UUIDs not in the removal set, so they survive

#### Try the Add-Wins Scenario:
1. Add vertex "X" on Replica A
2. Sync all replicas
3. Remove "X" on Replica A
4. Add "X" on Replica B (without syncing)
5. Sync - observe "X" remains visible!

## Tech Stack

- **React 19** with TypeScript
- **Vite** for development and building
- **Tailwind CSS v4** for styling
- **Framer Motion** for animations
- **UUID** for unique identifier generation

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## Project Structure

```
src/
├── types/
│   └── crdt.ts              # TypeScript interfaces for all CRDTs
├── lib/
│   ├── pn-counter.ts        # PN-Counter logic + merge steps
│   ├── two-p-set.ts         # 2P-Set logic + merge steps
│   └── directed-graph.ts    # Directed Graph logic + merge steps
├── components/
│   ├── layout/              # AppShell, ModuleTabs
│   ├── shared/              # ReplicaCard, SyncButton, SyncModal
│   │   └── steps/           # Step visualizers for sync modal
│   ├── pn-counter/          # PN-Counter module UI
│   ├── two-p-set/           # 2P-Set module UI
│   └── directed-graph/      # Graph module UI with SVG canvas
└── App.tsx                  # Main app with module routing
```

## References

- [A comprehensive study of CRDTs](https://hal.inria.fr/inria-00555588/document) - Shapiro et al.
- [CRDTs: Consistency without concurrency control](https://arxiv.org/abs/0907.0929)
- [Wikipedia: CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
