import type { PNCounter, PNCounterSyncStep } from '../types/crdt';

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

/**
 * Generate step-by-step merge visualization data
 */
export function generateMergeSteps(
  source: PNCounter,
  target: PNCounter
): PNCounterSyncStep[] {
  const totalSteps = 3;
  const maxLen = Math.max(source.P.length, source.N.length, target.P.length, target.N.length);

  // Step 1: Compare P vectors
  const resultP: number[] = [];
  const pWinnerIndices: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const sVal = source.P[i] || 0;
    const tVal = target.P[i] || 0;
    resultP[i] = Math.max(sVal, tVal);
    if (sVal !== tVal) {
      pWinnerIndices.push(i);
    }
  }

  // Step 2: Compare N vectors
  const resultN: number[] = [];
  const nWinnerIndices: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const sVal = source.N[i] || 0;
    const tVal = target.N[i] || 0;
    resultN[i] = Math.max(sVal, tVal);
    if (sVal !== tVal) {
      nWinnerIndices.push(i);
    }
  }

  const sourceValue = getValue(source);
  const targetValue = getValue(target);
  const resultValue = resultP.reduce((a, b) => a + b, 0) - resultN.reduce((a, b) => a + b, 0);

  return [
    {
      id: 'pn-step-1',
      stepNumber: 1,
      totalSteps,
      title: 'Element-wise Maximum of P Vectors',
      description: `Compare each position in the P (increment) vectors. For each index, take the maximum value. This ensures all increments are captured.`,
      type: 'pn-counter',
      operation: 'compare-p',
      sourceVector: [...source.P],
      targetVector: [...target.P],
      resultVector: resultP,
      winnerIndices: pWinnerIndices,
    },
    {
      id: 'pn-step-2',
      stepNumber: 2,
      totalSteps,
      title: 'Element-wise Maximum of N Vectors',
      description: `Compare each position in the N (decrement) vectors. For each index, take the maximum value. This ensures all decrements are captured.`,
      type: 'pn-counter',
      operation: 'compare-n',
      sourceVector: [...source.N],
      targetVector: [...target.N],
      resultVector: resultN,
      winnerIndices: nWinnerIndices,
    },
    {
      id: 'pn-step-3',
      stepNumber: 3,
      totalSteps,
      title: 'Compute Final Value',
      description: `The final counter value is Sum(P) - Sum(N). Both replicas now converge to the same value: ${resultValue}.`,
      type: 'pn-counter',
      operation: 'result',
      mergedP: resultP,
      mergedN: resultN,
      sourceValue,
      targetValue,
      resultValue,
    },
  ];
}
