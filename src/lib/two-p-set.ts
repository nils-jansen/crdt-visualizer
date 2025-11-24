import type { TwoPSet, TwoPSetSerialized } from '../types/crdt';

/**
 * Create a new empty 2P-Set
 */
export function createTwoPSet<T = string>(): TwoPSet<T> {
  return {
    added: new Set<T>(),
    removed: new Set<T>(),
  };
}

/**
 * Add an element to the set
 */
export function add<T>(set: TwoPSet<T>, element: T): TwoPSet<T> {
  const newAdded = new Set(set.added);
  newAdded.add(element);
  return {
    added: newAdded,
    removed: new Set(set.removed),
  };
}

/**
 * Remove an element from the set (add to tombstone set)
 * Note: Once removed, an element cannot be re-added in a 2P-Set
 */
export function remove<T>(set: TwoPSet<T>, element: T): TwoPSet<T> {
  const newRemoved = new Set(set.removed);
  newRemoved.add(element);
  return {
    added: new Set(set.added),
    removed: newRemoved,
  };
}

/**
 * Look up the current visible elements (in added but not in removed)
 */
export function lookup<T>(set: TwoPSet<T>): Set<T> {
  const result = new Set<T>();
  for (const element of set.added) {
    if (!set.removed.has(element)) {
      result.add(element);
    }
  }
  return result;
}

/**
 * Look up as array (for easier rendering)
 */
export function lookupArray<T>(set: TwoPSet<T>): T[] {
  return Array.from(lookup(set));
}

/**
 * Check if an element is in the visible set
 */
export function contains<T>(set: TwoPSet<T>, element: T): boolean {
  return set.added.has(element) && !set.removed.has(element);
}

/**
 * Merge two 2P-Sets using union of both sets
 */
export function merge<T>(setA: TwoPSet<T>, setB: TwoPSet<T>): TwoPSet<T> {
  const newAdded = new Set<T>();
  const newRemoved = new Set<T>();

  // Union of added sets
  for (const element of setA.added) newAdded.add(element);
  for (const element of setB.added) newAdded.add(element);

  // Union of removed sets
  for (const element of setA.removed) newRemoved.add(element);
  for (const element of setB.removed) newRemoved.add(element);

  return {
    added: newAdded,
    removed: newRemoved,
  };
}

/**
 * Merge multiple 2P-Sets
 */
export function mergeAll<T>(sets: TwoPSet<T>[]): TwoPSet<T> {
  if (sets.length === 0) {
    return createTwoPSet<T>();
  }
  return sets.reduce((acc, set) => merge(acc, set));
}

/**
 * Clone a 2P-Set (for immutability)
 */
export function clone<T>(set: TwoPSet<T>): TwoPSet<T> {
  return {
    added: new Set(set.added),
    removed: new Set(set.removed),
  };
}

/**
 * Convert to serializable format (for display)
 */
export function serialize<T>(set: TwoPSet<T>): TwoPSetSerialized<T> {
  return {
    added: Array.from(set.added),
    removed: Array.from(set.removed),
  };
}

/**
 * Check if two sets are equal
 */
export function equals<T>(setA: TwoPSet<T>, setB: TwoPSet<T>): boolean {
  if (setA.added.size !== setB.added.size) return false;
  if (setA.removed.size !== setB.removed.size) return false;

  for (const element of setA.added) {
    if (!setB.added.has(element)) return false;
  }
  for (const element of setA.removed) {
    if (!setB.removed.has(element)) return false;
  }

  return true;
}
