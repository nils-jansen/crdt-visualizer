import { motion } from 'framer-motion';
import type { TwoPSetSyncStep } from '../../../types/crdt';

interface TwoPSetStepViewProps {
  step: TwoPSetSyncStep;
  sourceLabel: string;
  targetLabel: string;
}

export function TwoPSetStepView({ step, sourceLabel, targetLabel }: TwoPSetStepViewProps) {
  if (step.operation === 'result') {
    return <ResultStepView step={step} sourceLabel={sourceLabel} targetLabel={targetLabel} />;
  }

  return <UnionStepView step={step} sourceLabel={sourceLabel} targetLabel={targetLabel} />;
}

interface UnionStepViewProps {
  step: TwoPSetSyncStep & { operation: 'union-added' | 'union-removed' };
  sourceLabel: string;
  targetLabel: string;
}

function UnionStepView({ step, sourceLabel, targetLabel }: UnionStepViewProps) {
  const isAdded = step.operation === 'union-added';
  const setName = isAdded ? 'Added' : 'Removed';
  const colorClass = isAdded ? 'text-green-400' : 'text-red-400';
  const bgClass = isAdded ? 'bg-green-900/20' : 'bg-red-900/20';
  const borderClass = isAdded ? 'border-green-500/30' : 'border-red-500/30';

  return (
    <div className="space-y-6">
      {/* Three-column comparison */}
      <div className="grid grid-cols-3 gap-4">
        {/* Source */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-3">
            Replica {sourceLabel} - {setName}
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
            Replica {targetLabel} - {setName}
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
        className={`rounded-lg p-4 border ${bgClass} ${borderClass}`}
      >
        <h4 className={`text-sm font-semibold ${colorClass} mb-3`}>
          Merged {setName} Set
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
  step: TwoPSetSyncStep & { operation: 'result' };
  sourceLabel: string;
  targetLabel: string;
}

function ResultStepView({ step, sourceLabel, targetLabel }: ResultStepViewProps) {
  return (
    <div className="space-y-6">
      {/* Sets side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
          <h4 className="text-sm font-semibold text-green-400 mb-2">Merged Added Set</h4>
          <SetChips elements={step.mergedAdded} />
        </div>
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
          <h4 className="text-sm font-semibold text-red-400 mb-2">Merged Removed Set</h4>
          <SetChips elements={step.mergedRemoved} />
        </div>
      </div>

      {/* Visible set comparison */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
          <div className="text-sm text-blue-400 mb-2">Replica {sourceLabel} Visible</div>
          <SetChips elements={step.sourceVisible} small />
        </div>
        <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
          <div className="text-sm text-green-400 mb-2">Replica {targetLabel} Visible</div>
          <SetChips elements={step.targetVisible} small />
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg p-4 border-2 border-purple-500"
        >
          <div className="text-sm text-purple-300 mb-2">Converged Visible Set</div>
          <SetChips elements={step.resultVisible} small animateIn />
        </motion.div>
      </div>

      {/* Changes */}
      {(step.newlyVisible.length > 0 || step.newlyHidden.length > 0) && (
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Changes After Merge</h4>
          <div className="flex gap-4">
            {step.newlyVisible.length > 0 && (
              <div>
                <span className="text-green-400 text-xs">Newly visible: </span>
                <span className="text-white">{step.newlyVisible.join(', ')}</span>
              </div>
            )}
            {step.newlyHidden.length > 0 && (
              <div>
                <span className="text-red-400 text-xs">Newly hidden: </span>
                <span className="text-white">{step.newlyHidden.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formula */}
      <div className="text-center text-slate-400 text-sm">
        Visible = Added \ Removed = {'{' + step.resultVisible.join(', ') + '}'}
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
