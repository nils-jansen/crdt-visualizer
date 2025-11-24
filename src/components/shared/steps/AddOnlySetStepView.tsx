import { motion } from 'framer-motion';
import type { AddOnlySetSyncStep } from '../../../types/crdt';

interface AddOnlySetStepViewProps {
  step: AddOnlySetSyncStep;
  sourceLabel: string;
  targetLabel: string;
}

export function AddOnlySetStepView({ step, sourceLabel, targetLabel }: AddOnlySetStepViewProps) {
  if (step.operation === 'result') {
    return <ResultStepView step={step} sourceLabel={sourceLabel} targetLabel={targetLabel} />;
  }

  return <UnionStepView step={step} sourceLabel={sourceLabel} targetLabel={targetLabel} />;
}

interface UnionStepViewProps {
  step: AddOnlySetSyncStep & { operation: 'union' };
  sourceLabel: string;
  targetLabel: string;
}

function UnionStepView({ step, sourceLabel, targetLabel }: UnionStepViewProps) {
  return (
    <div className="space-y-6">
      {/* Three-column comparison */}
      <div className="grid grid-cols-3 gap-4">
        {/* Source */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-3">
            Replica {sourceLabel} - Elements
          </h4>
          <SetChips
            elements={step.sourceSet}
            highlightElements={step.onlyInSource}
            highlightColor="blue"
          />
        </div>

        {/* Operation */}
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl text-slate-500 mb-2">∪</div>
            <div className="text-xs text-slate-500">Union</div>
          </div>
        </div>

        {/* Target */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-400 mb-3">
            Replica {targetLabel} - Elements
          </h4>
          <SetChips
            elements={step.targetSet}
            highlightElements={step.onlyInTarget}
            highlightColor="green"
          />
        </div>
      </div>

      {/* Result */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg p-4 border bg-cyan-900/20 border-cyan-500/30"
      >
        <h4 className="text-sm font-semibold text-cyan-400 mb-3">
          Merged Element Set
        </h4>
        <SetChips
          elements={step.resultSet}
          highlightElements={[...step.onlyInSource, ...step.onlyInTarget]}
          highlightColor="yellow"
          animateIn
        />
        <div className="text-xs text-slate-400 mt-3">
          {step.onlyInSource.length > 0 && (
            <span className="text-blue-400">From {sourceLabel}: {step.onlyInSource.join(', ')}</span>
          )}
          {step.onlyInSource.length > 0 && step.onlyInTarget.length > 0 && ' | '}
          {step.onlyInTarget.length > 0 && (
            <span className="text-green-400">From {targetLabel}: {step.onlyInTarget.join(', ')}</span>
          )}
          {step.inBoth.length > 0 && (
            <span className="text-slate-500"> | Shared: {step.inBoth.join(', ')}</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface ResultStepViewProps {
  step: AddOnlySetSyncStep & { operation: 'result' };
  sourceLabel: string;
  targetLabel: string;
}

function ResultStepView({ step, sourceLabel, targetLabel }: ResultStepViewProps) {
  return (
    <div className="space-y-6">
      {/* Before merge - side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
          <div className="text-sm text-blue-400 mb-2">Replica {sourceLabel} Before</div>
          <SetChips elements={step.sourceElements} small />
          <div className="text-xs text-slate-500 mt-2">
            {step.sourceElements.length} elements
          </div>
        </div>
        <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
          <div className="text-sm text-green-400 mb-2">Replica {targetLabel} Before</div>
          <SetChips elements={step.targetElements} small />
          <div className="text-xs text-slate-500 mt-2">
            {step.targetElements.length} elements
          </div>
        </div>
      </div>

      {/* After merge - converged state */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-cyan-600/30 to-teal-600/30 rounded-lg p-4 border-2 border-cyan-500"
      >
        <div className="text-sm text-cyan-300 mb-2">Converged State (Both Replicas)</div>
        <SetChips elements={step.resultElements} animateIn />
        <div className="text-xs text-slate-300 mt-2">
          {step.resultElements.length} elements total
        </div>
      </motion.div>

      {/* Changes */}
      {step.newElements.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Changes After Merge</h4>
          <div>
            <span className="text-cyan-400 text-xs">Newly added to some replicas: </span>
            <span className="text-white">{step.newElements.join(', ')}</span>
          </div>
        </div>
      )}

      {/* Formula */}
      <div className="text-center text-slate-400 text-sm">
        Result = {sourceLabel} ∪ {targetLabel} = {'{' + step.resultElements.join(', ') + '}'}
      </div>
    </div>
  );
}

interface SetChipsProps {
  elements: string[];
  highlightElements?: string[];
  highlightColor?: 'blue' | 'green' | 'yellow';
  animateIn?: boolean;
  small?: boolean;
}

function SetChips({ elements, highlightElements = [], highlightColor = 'yellow', animateIn, small }: SetChipsProps) {
  if (elements.length === 0) {
    return <span className="text-slate-500 italic text-sm">(empty)</span>;
  }

  const highlightClasses = {
    blue: 'bg-blue-600 ring-2 ring-blue-400',
    green: 'bg-green-600 ring-2 ring-green-400',
    yellow: 'bg-yellow-600 ring-2 ring-yellow-400',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {elements.map((element, idx) => {
        const isHighlighted = highlightElements.includes(element);
        const Wrapper = animateIn ? motion.span : 'span';
        const wrapperProps = animateIn
          ? {
              initial: { opacity: 0, scale: 0.5 },
              animate: { opacity: 1, scale: 1 },
              transition: { delay: idx * 0.05 },
            }
          : {};

        return (
          <Wrapper
            key={element}
            {...wrapperProps}
            className={`px-2 py-0.5 rounded-full ${small ? 'text-xs' : 'text-sm'} font-medium ${
              isHighlighted ? highlightClasses[highlightColor] : 'bg-slate-700'
            } text-white`}
          >
            {element}
          </Wrapper>
        );
      })}
    </div>
  );
}
