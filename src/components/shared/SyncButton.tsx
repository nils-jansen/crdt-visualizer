import { motion } from 'framer-motion';

interface SyncButtonProps {
  onSync: () => void;
  onReset: () => void;
  isSyncing?: boolean;
  syncLabel?: string;
}

export function SyncButton({ onSync, onReset, isSyncing, syncLabel }: SyncButtonProps) {
  return (
    <div className="flex justify-center gap-4 my-6">
      <motion.button
        onClick={onSync}
        disabled={isSyncing}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="flex items-center gap-2">
          <SyncIcon isSyncing={isSyncing} />
          {isSyncing ? 'Syncing...' : (syncLabel || 'Sync All Replicas')}
        </span>
      </motion.button>
      <button
        onClick={onReset}
        className="px-6 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-all"
      >
        Reset
      </button>
    </div>
  );
}

function SyncIcon({ isSyncing }: { isSyncing?: boolean }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={isSyncing ? { rotate: 360 } : {}}
      transition={{ duration: 1, repeat: isSyncing ? Infinity : 0, ease: 'linear' }}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </motion.svg>
  );
}
