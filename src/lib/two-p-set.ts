import type { TwoPSet, TwoPSetSerialized, TwoPSetSyncStep } from '../types/crdt';

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

/**
 * Generate step-by-step merge visualization data
 */
export function generateMergeSteps(
  source: TwoPSet<string>,
  target: TwoPSet<string>
): TwoPSetSyncStep[] {
  const totalSteps = 3;

  // Compute set differences for Added
  const sourceAdded = Array.from(source.added);
  const targetAdded = Array.from(target.added);
  const onlyInSourceAdded = sourceAdded.filter(e => !target.added.has(e));
  const onlyInTargetAdded = targetAdded.filter(e => !source.added.has(e));
  const inBothAdded = sourceAdded.filter(e => target.added.has(e));
  const resultAdded = [...new Set([...sourceAdded, ...targetAdded])];

  // Compute set differences for Removed
  const sourceRemoved = Array.from(source.removed);
  const targetRemoved = Array.from(target.removed);
  const onlyInSourceRemoved = sourceRemoved.filter(e => !target.removed.has(e));
  const onlyInTargetRemoved = targetRemoved.filter(e => !source.removed.has(e));
  const inBothRemoved = sourceRemoved.filter(e => target.removed.has(e));
  const resultRemoved = [...new Set([...sourceRemoved, ...targetRemoved])];

  // Compute visible sets
  const sourceVisible = lookupArray(source);
  const targetVisible = lookupArray(target);
  const resultVisible = resultAdded.filter(e => !resultRemoved.includes(e));

  // Find changes
  const newlyVisible = resultVisible.filter(
    e => !sourceVisible.includes(e) || !targetVisible.includes(e)
  );
  const newlyHidden = [...sourceVisible, ...targetVisible].filter(
    e => !resultVisible.includes(e)
  );

  return [
    {
      id: '2p-step-1',
      stepNumber: 1,
      totalSteps,
      title: 'Union of Added Sets',
      description: 'Combine all elements that have ever been added on either replica. Elements unique to each replica are highlighted.',
      type: 'two-p-set',
      operation: 'union-added',
      sourceSet: sourceAdded,
      targetSet: targetAdded,
      resultSet: resultAdded,
      onlyInSource: onlyInSourceAdded,
      onlyInTarget: onlyInTargetAdded,
      inBoth: inBothAdded,
    },
    {
      id: '2p-step-2',
      stepNumber: 2,
      totalSteps,
      title: 'Union of Removed Sets (Tombstones)',
      description: 'Combine all tombstones from both replicas. Once an element is removed on any replica, it stays removed forever.',
      type: 'two-p-set',
      operation: 'union-removed',
      sourceSet: sourceRemoved,
      targetSet: targetRemoved,
      resultSet: resultRemoved,
      onlyInSource: onlyInSourceRemoved,
      onlyInTarget: onlyInTargetRemoved,
      inBoth: inBothRemoved,
    },
    {
      id: '2p-step-3',
      stepNumber: 3,
      totalSteps,
      title: 'Compute Visible Set',
      description: 'The visible set is Added \\ Removed (elements in Added but not in Removed). Both replicas now show the same elements.',
      type: 'two-p-set',
      operation: 'result',
      mergedAdded: resultAdded,
      mergedRemoved: resultRemoved,
      sourceVisible,
      targetVisible,
      resultVisible,
      newlyVisible,
      newlyHidden: [...new Set(newlyHidden)],
    },
  ];
}
