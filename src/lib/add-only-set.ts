import type { AddOnlySet, AddOnlySetSerialized, AddOnlySetSyncStep } from '../types/crdt';

/**
 * Create a new empty Add-Only Set (G-Set)
 */
export function createAddOnlySet<T = string>(): AddOnlySet<T> {
  return {
    elements: new Set<T>(),
  };
}

/**
 * Add an element to the set
 */
export function add<T>(set: AddOnlySet<T>, element: T): AddOnlySet<T> {
  const newElements = new Set(set.elements);
  newElements.add(element);
  return {
    elements: newElements,
  };
}

/**
 * Look up all elements in the set
 */
export function lookup<T>(set: AddOnlySet<T>): Set<T> {
  return new Set(set.elements);
}

/**
 * Look up as array (for easier rendering)
 */
export function lookupArray<T>(set: AddOnlySet<T>): T[] {
  return Array.from(set.elements);
}

/**
 * Check if an element is in the set
 */
export function contains<T>(set: AddOnlySet<T>, element: T): boolean {
  return set.elements.has(element);
}

/**
 * Get the number of elements in the set
 */
export function size<T>(set: AddOnlySet<T>): number {
  return set.elements.size;
}

/**
 * Merge two Add-Only Sets using union
 */
export function merge<T>(setA: AddOnlySet<T>, setB: AddOnlySet<T>): AddOnlySet<T> {
  const newElements = new Set<T>();

  // Union of both sets
  for (const element of setA.elements) newElements.add(element);
  for (const element of setB.elements) newElements.add(element);

  return {
    elements: newElements,
  };
}

/**
 * Merge multiple Add-Only Sets
 */
export function mergeAll<T>(sets: AddOnlySet<T>[]): AddOnlySet<T> {
  if (sets.length === 0) {
    return createAddOnlySet<T>();
  }
  return sets.reduce((acc, set) => merge(acc, set));
}

/**
 * Clone an Add-Only Set (for immutability)
 */
export function clone<T>(set: AddOnlySet<T>): AddOnlySet<T> {
  return {
    elements: new Set(set.elements),
  };
}

/**
 * Convert to serializable format (for display)
 */
export function serialize<T>(set: AddOnlySet<T>): AddOnlySetSerialized<T> {
  return {
    elements: Array.from(set.elements),
  };
}

/**
 * Check if two sets are equal
 */
export function equals<T>(setA: AddOnlySet<T>, setB: AddOnlySet<T>): boolean {
  if (setA.elements.size !== setB.elements.size) return false;

  for (const element of setA.elements) {
    if (!setB.elements.has(element)) return false;
  }

  return true;
}

/**
 * Generate step-by-step merge visualization data
 */
export function generateMergeSteps(
  source: AddOnlySet<string>,
  target: AddOnlySet<string>
): AddOnlySetSyncStep[] {
  const totalSteps = 2;

  // Compute set differences
  const sourceElements = Array.from(source.elements);
  const targetElements = Array.from(target.elements);
  const onlyInSource = sourceElements.filter(e => !target.elements.has(e));
  const onlyInTarget = targetElements.filter(e => !source.elements.has(e));
  const inBoth = sourceElements.filter(e => target.elements.has(e));
  const resultElements = [...new Set([...sourceElements, ...targetElements])];

  // Find new elements that will appear after merge
  const newElements = [...onlyInSource, ...onlyInTarget];

  return [
    {
      id: 'add-only-set-step-1',
      stepNumber: 1,
      totalSteps,
      title: 'Union of Element Sets',
      description: 'Combine all elements from both replicas. The union operation (∪) includes every element that appears in either set.',
      type: 'add-only-set',
      operation: 'union',
      sourceSet: sourceElements,
      targetSet: targetElements,
      resultSet: resultElements,
      onlyInSource,
      onlyInTarget,
      inBoth,
    },
    {
      id: 'add-only-set-step-2',
      stepNumber: 2,
      totalSteps,
      title: 'Converged State',
      description: 'Both replicas now contain the same elements. The Add-Only Set grows monotonically - elements are never removed.',
      type: 'add-only-set',
      operation: 'result',
      mergedSet: resultElements,
      sourceElements,
      targetElements,
      resultElements,
      newElements,
    },
  ];
}
