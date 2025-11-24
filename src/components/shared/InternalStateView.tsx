import { motion } from 'framer-motion';

interface InternalStateViewProps {
  title: string;
  children: React.ReactNode;
  isHighlighted?: boolean;
}

export function InternalStateView({ title, children, isHighlighted }: InternalStateViewProps) {
  return (
    <motion.div
      className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700"
      animate={isHighlighted ? { borderColor: ['#475569', '#3b82f6', '#475569'] } : {}}
      transition={{ duration: 0.6 }}
    >
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="font-mono text-sm">
        {children}
      </div>
    </motion.div>
  );
}

interface VectorDisplayProps {
  label: string;
  values: number[];
  replicaLabels?: string[];
  highlightIndex?: number;
}

export function VectorDisplay({ label, values, replicaLabels = ['A', 'B', 'C'], highlightIndex }: VectorDisplayProps) {
  return (
    <div className="mb-2">
      <span className="text-slate-400">{label}: </span>
      <span className="text-slate-200">[</span>
      {values.map((value, index) => (
        <span key={index}>
          <motion.span
            className={`${highlightIndex === index ? 'text-yellow-400 font-bold' : 'text-slate-200'}`}
            animate={highlightIndex === index ? { scale: [1, 1.2, 1] } : {}}
          >
            {value}
          </motion.span>
          <span className="text-slate-500 text-xs">
            <sub>{replicaLabels[index]}</sub>
          </span>
          {index < values.length - 1 && <span className="text-slate-200">, </span>}
        </span>
      ))}
      <span className="text-slate-200">]</span>
    </div>
  );
}

interface SetDisplayProps {
  label: string;
  values: string[];
  colorClass?: string;
}

export function SetDisplay({ label, values, colorClass = 'text-slate-200' }: SetDisplayProps) {
  return (
    <div className="mb-2">
      <span className="text-slate-400">{label}: </span>
      <span className={colorClass}>
        {'{'}
        {values.length === 0 ? (
          <span className="text-slate-500 italic">empty</span>
        ) : (
          values.map((value, index) => (
            <span key={value}>
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block"
              >
                "{value}"
              </motion.span>
              {index < values.length - 1 && ', '}
            </span>
          ))
        )}
        {'}'}
      </span>
    </div>
  );
}
