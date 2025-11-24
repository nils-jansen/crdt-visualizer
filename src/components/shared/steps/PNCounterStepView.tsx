import { motion } from 'framer-motion';
import type { PNCounterSyncStep } from '../../../types/crdt';

interface PNCounterStepViewProps {
  step: PNCounterSyncStep;
  sourceLabel: string;
  targetLabel: string;
}

export function PNCounterStepView({ step, sourceLabel, targetLabel }: PNCounterStepViewProps) {
  if (step.operation === 'result') {
    return <ResultStepView step={step} sourceLabel={sourceLabel} targetLabel={targetLabel} />;
  }

  return <VectorCompareView step={step} sourceLabel={sourceLabel} targetLabel={targetLabel} />;
}

interface VectorCompareViewProps {
  step: PNCounterSyncStep & { operation: 'compare-p' | 'compare-n' };
  sourceLabel: string;
  targetLabel: string;
}

function VectorCompareView({ step, sourceLabel, targetLabel }: VectorCompareViewProps) {
  const vectorName = step.operation === 'compare-p' ? 'P' : 'N';
  const vectorColor = step.operation === 'compare-p' ? 'text-green-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Three-column comparison */}
      <div className="grid grid-cols-3 gap-4">
        {/* Source */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-3">
            Replica {sourceLabel}
          </h4>
          <div className={`font-mono ${vectorColor}`}>
            {vectorName} = [{step.sourceVector.map((val, idx) => (
              <span key={idx}>
                <motion.span
                  animate={step.winnerIndices.includes(idx) ? { scale: [1, 1.2, 1] } : {}}
                  className={`inline-block ${
                    step.winnerIndices.includes(idx) && val >= step.targetVector[idx]
                      ? 'text-yellow-400 font-bold'
                      : ''
                  }`}
                >
                  {val}
                </motion.span>
                {idx < step.sourceVector.length - 1 ? ', ' : ''}
              </span>
            ))}]
          </div>
        </div>

        {/* Operation */}
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl text-slate-500 mb-2">→ max() →</div>
            <div className="text-xs text-slate-500">
              Element-wise maximum
            </div>
          </div>
        </div>

        {/* Target */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-400 mb-3">
            Replica {targetLabel}
          </h4>
          <div className={`font-mono ${vectorColor}`}>
            {vectorName} = [{step.targetVector.map((val, idx) => (
              <span key={idx}>
                <motion.span
                  animate={step.winnerIndices.includes(idx) ? { scale: [1, 1.2, 1] } : {}}
                  className={`inline-block ${
                    step.winnerIndices.includes(idx) && val >= step.sourceVector[idx]
                      ? 'text-yellow-400 font-bold'
                      : ''
                  }`}
                >
                  {val}
                </motion.span>
                {idx < step.targetVector.length - 1 ? ', ' : ''}
              </span>
            ))}]
          </div>
        </div>
      </div>

      {/* Result */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30"
      >
        <h4 className="text-sm font-semibold text-white mb-3">Result</h4>
        <div className={`font-mono text-lg ${vectorColor}`}>
          {vectorName} = [{step.resultVector.map((val, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={`inline-block ${
                step.winnerIndices.includes(idx) ? 'text-yellow-400 font-bold' : ''
              }`}
            >
              {val}{idx < step.resultVector.length - 1 ? ', ' : ''}
            </motion.span>
          ))}]
        </div>
        {step.winnerIndices.length > 0 && (
          <div className="text-xs text-slate-400 mt-2">
            Different values at indices: {step.winnerIndices.join(', ')}
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface ResultStepViewProps {
  step: PNCounterSyncStep & { operation: 'result' };
  sourceLabel: string;
  targetLabel: string;
}

function ResultStepView({ step, sourceLabel, targetLabel }: ResultStepViewProps) {
  return (
    <div className="space-y-6">
      {/* Final vectors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-400 mb-2">Merged P Vector</h4>
          <div className="font-mono text-green-400">
            P = [{step.mergedP.join(', ')}]
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Sum(P) = {step.mergedP.reduce((a, b) => a + b, 0)}
          </div>
        </div>
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-400 mb-2">Merged N Vector</h4>
          <div className="font-mono text-red-400">
            N = [{step.mergedN.join(', ')}]
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Sum(N) = {step.mergedN.reduce((a, b) => a + b, 0)}
          </div>
        </div>
      </div>

      {/* Value comparison */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-900/30 rounded-lg p-4 text-center border border-blue-500/30">
          <div className="text-sm text-blue-400 mb-1">Replica {sourceLabel}</div>
          <div className="text-3xl font-bold text-white">{step.sourceValue}</div>
        </div>
        <div className="bg-green-900/30 rounded-lg p-4 text-center border border-green-500/30">
          <div className="text-sm text-green-400 mb-1">Replica {targetLabel}</div>
          <div className="text-3xl font-bold text-white">{step.targetValue}</div>
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg p-4 text-center border-2 border-purple-500"
        >
          <div className="text-sm text-purple-300 mb-1">Converged Value</div>
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="text-4xl font-bold text-white"
          >
            {step.resultValue}
          </motion.div>
        </motion.div>
      </div>

      {/* Formula */}
      <div className="text-center text-slate-400 text-sm">
        Value = Sum(P) - Sum(N) = {step.mergedP.reduce((a, b) => a + b, 0)} - {step.mergedN.reduce((a, b) => a + b, 0)} = {step.resultValue}
      </div>
    </div>
  );
}
