import { motion } from 'framer-motion';

interface ReplicaCardProps {
  name: string;
  color: 'amber' | 'green' | 'purple';
  children: React.ReactNode;
  isSyncing?: boolean;
}

const colorClasses = {
  amber: 'border-amber-500 bg-amber-500/10',
  green: 'border-green-500 bg-green-500/10',
  purple: 'border-purple-500 bg-purple-500/10',
};

const headerColors = {
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
};

export function ReplicaCard({ name, color, children, isSyncing }: ReplicaCardProps) {
  return (
    <motion.div
      className={`rounded-xl border-2 ${colorClasses[color]} overflow-hidden`}
      animate={isSyncing ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <div className={`${headerColors[color]} px-4 py-2`}>
        <h3 className="text-lg font-bold text-white">Replica {name}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </motion.div>
  );
}
