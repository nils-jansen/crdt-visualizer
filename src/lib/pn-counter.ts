import type { PNCounter } from '../types/crdt';

/**
 * Create a new PN-Counter with the specified number of replicas
 */
export function createPNCounter(numReplicas: number): PNCounter {
  return {
    P: Array(numReplicas).fill(0),
    N: Array(numReplicas).fill(0),
  };
}

/**
 * Increment the counter at the specified replica index
 */
export function increment(counter: PNCounter, replicaIndex: number): PNCounter {
  const newP = [...counter.P];
  newP[replicaIndex] = (newP[replicaIndex] || 0) + 1;
  return {
    P: newP,
    N: [...counter.N],
  };
}

/**
 * Decrement the counter at the specified replica index
 */
export function decrement(counter: PNCounter, replicaIndex: number): PNCounter {
  const newN = [...counter.N];
  newN[replicaIndex] = (newN[replicaIndex] || 0) + 1;
  return {
    P: [...counter.P],
    N: newN,
  };
}

/**
 * Get the current value of the counter
 * Value = Sum(P) - Sum(N)
 */
export function getValue(counter: PNCounter): number {
  const sumP = counter.P.reduce((acc, val) => acc + val, 0);
  const sumN = counter.N.reduce((acc, val) => acc + val, 0);
  return sumP - sumN;
}

/**
 * Merge two PN-Counters using element-wise maximum
 */
export function merge(counterA: PNCounter, counterB: PNCounter): PNCounter {
  const maxLen = Math.max(
    counterA.P.length,
    counterA.N.length,
    counterB.P.length,
    counterB.N.length
  );

  const newP: number[] = [];
  const newN: number[] = [];

  for (let i = 0; i < maxLen; i++) {
    newP[i] = Math.max(counterA.P[i] || 0, counterB.P[i] || 0);
    newN[i] = Math.max(counterA.N[i] || 0, counterB.N[i] || 0);
  }

  return { P: newP, N: newN };
}

/**
 * Merge multiple PN-Counters
 */
export function mergeAll(counters: PNCounter[]): PNCounter {
  if (counters.length === 0) {
    return createPNCounter(0);
  }
  return counters.reduce((acc, counter) => merge(acc, counter));
}

/**
 * Clone a PN-Counter (for immutability)
 */
export function clone(counter: PNCounter): PNCounter {
  return {
    P: [...counter.P],
    N: [...counter.N],
  };
}

/**
 * Check if two counters are equal
 */
export function equals(counterA: PNCounter, counterB: PNCounter): boolean {
  if (counterA.P.length !== counterB.P.length) return false;
  if (counterA.N.length !== counterB.N.length) return false;

  for (let i = 0; i < counterA.P.length; i++) {
    if (counterA.P[i] !== counterB.P[i]) return false;
  }
  for (let i = 0; i < counterA.N.length; i++) {
    if (counterA.N[i] !== counterB.N[i]) return false;
  }

  return true;
}
