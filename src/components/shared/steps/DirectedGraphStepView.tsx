import { motion } from 'framer-motion';
import type { DirectedGraphSyncStep } from '../../../types/crdt';

interface DirectedGraphStepViewProps {
  step: DirectedGraphSyncStep;
  sourceLabel: string;
  targetLabel: string;
}

export function DirectedGraphStepView({ step, sourceLabel, targetLabel }: DirectedGraphStepViewProps) {
  if (step.operation === 'result') {
    return <ResultStepView step={step} sourceLabel={sourceLabel} targetLabel={targetLabel} />;
  }

  return <UnionStepView step={step} sourceLabel={sourceLabel} targetLabel={targetLabel} />;
}

interface UnionStepViewProps {
  step: DirectedGraphSyncStep & { operation: 'union-vertices' | 'union-vertex-tombstones' | 'union-arcs' | 'union-arc-tombstones' };
  sourceLabel: string;
  targetLabel: string;
}

function UnionStepView({ step, sourceLabel, targetLabel }: UnionStepViewProps) {
  const isTombstone = step.operation.includes('tombstone');
  const isVertex = step.operation.includes('vertices');

  const titleMap = {
    'union-vertices': 'Vertices',
    'union-vertex-tombstones': 'Vertex Tombstones',
    'union-arcs': 'Arcs',
    'union-arc-tombstones': 'Arc Tombstones',
  };

  const colorClass = isTombstone ? 'text-red-400' : isVertex ? 'text-green-400' : 'text-blue-400';
  const bgClass = isTombstone ? 'bg-red-900/20' : isVertex ? 'bg-green-900/20' : 'bg-blue-900/20';
  const borderClass = isTombstone ? 'border-red-500/30' : isVertex ? 'border-green-500/30' : 'border-blue-500/30';

  return (
    <div className="space-y-6">
      {/* Three-column comparison */}
      <div className="grid grid-cols-3 gap-4">
        {/* Source */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-3">
            Replica {sourceLabel}
          </h4>
          <ItemList
            items={step.sourceItems}
            highlightIds={step.onlyInSource}
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
            Replica {targetLabel}
          </h4>
          <ItemList
            items={step.targetItems}
            highlightIds={step.onlyInTarget}
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
          Merged {titleMap[step.operation]}
        </h4>
        <ItemList
          items={step.resultItems}
          highlightIds={[...step.onlyInSource, ...step.onlyInTarget]}
          highlightColor="yellow"
          animateIn
        />
        <div className="text-xs text-slate-400 mt-3 flex flex-wrap gap-2">
          {step.onlyInSource.length > 0 && (
            <span className="text-blue-400">
              From {sourceLabel}: {step.onlyInSource.length} new
            </span>
          )}
          {step.onlyInTarget.length > 0 && (
            <span className="text-green-400">
              From {targetLabel}: {step.onlyInTarget.length} new
            </span>
          )}
          {step.resultItems.length - step.onlyInSource.length - step.onlyInTarget.length > 0 && (
            <span className="text-slate-500">
              Shared: {step.resultItems.length - step.onlyInSource.length - step.onlyInTarget.length}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface ResultStepViewProps {
  step: DirectedGraphSyncStep & { operation: 'result' };
  sourceLabel: string;
  targetLabel: string;
}

function ResultStepView({ step, sourceLabel, targetLabel }: ResultStepViewProps) {
  return (
    <div className="space-y-6">
      {/* Visible vertices comparison */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
          <div className="text-sm text-blue-400 mb-2">Replica {sourceLabel} Visible</div>
          <VertexChips vertices={step.sourceVisibleVertices} />
        </div>
        <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
          <div className="text-sm text-green-400 mb-2">Replica {targetLabel} Visible</div>
          <VertexChips vertices={step.targetVisibleVertices} />
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg p-4 border-2 border-purple-500"
        >
          <div className="text-sm text-purple-300 mb-2">Converged Visible</div>
          <VertexChips vertices={step.resultVisibleVertices} animateIn />
        </motion.div>
      </div>

      {/* Add-wins highlights */}
      {step.addWinsExamples.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-amber-900/30 rounded-lg p-4 border border-amber-500/50"
        >
          <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <span className="text-lg">★</span>
            Add-Wins Detected!
          </h4>
          <div className="space-y-2">
            {step.addWinsExamples.map((example, idx) => (
              <motion.div
                key={example.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="flex items-start gap-2"
              >
                <span className="text-amber-400 font-bold">{example.name}</span>
                <span className="text-slate-400 text-sm">→</span>
                <span className="text-slate-300 text-sm">{example.reason}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            These vertices survived because concurrent additions created new UUIDs
            that were not in the removal set.
          </p>
        </motion.div>
      )}

      {/* No add-wins case */}
      {step.addWinsExamples.length === 0 && (
        <div className="bg-slate-900 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-sm">
            No add-wins conflicts detected in this merge.
            Try the conflict scenario in the instructions below!
          </p>
        </div>
      )}
    </div>
  );
}

interface ItemListProps {
  items: { id: string; label: string }[];
  highlightIds?: string[];
  highlightColor?: 'blue' | 'green' | 'yellow';
  animateIn?: boolean;
}

function ItemList({ items, highlightIds = [], highlightColor = 'yellow', animateIn }: ItemListProps) {
  if (items.length === 0) {
    return <span className="text-slate-500 italic text-sm">(empty)</span>;
  }

  const highlightClasses = {
    blue: 'bg-blue-900/50 border-blue-500',
    green: 'bg-green-900/50 border-green-500',
    yellow: 'bg-yellow-900/50 border-yellow-500',
  };

  return (
    <div className="space-y-1 max-h-32 overflow-y-auto">
      {items.map((item, idx) => {
        const isHighlighted = highlightIds.includes(item.id);
        const Wrapper = animateIn ? motion.div : 'div';
        const wrapperProps = animateIn
          ? {
              initial: { opacity: 0, x: -10 },
              animate: { opacity: 1, x: 0 },
              transition: { delay: idx * 0.03 },
            }
          : {};

        return (
          <Wrapper
            key={item.id}
            {...wrapperProps}
            className={`text-xs px-2 py-1 rounded border ${
              isHighlighted ? highlightClasses[highlightColor] : 'bg-slate-800 border-slate-700'
            } text-slate-300 font-mono truncate`}
            title={item.label}
          >
            {item.label}
          </Wrapper>
        );
      })}
    </div>
  );
}

interface VertexChipsProps {
  vertices: string[];
  animateIn?: boolean;
}

function VertexChips({ vertices, animateIn }: VertexChipsProps) {
  if (vertices.length === 0) {
    return <span className="text-slate-500 italic text-sm">(no vertices)</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {vertices.map((name, idx) => {
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
            key={name}
            {...wrapperProps}
            className="px-2 py-0.5 bg-slate-700 rounded-full text-sm font-medium text-white"
          >
            {name}
          </Wrapper>
        );
      })}
    </div>
  );
}
