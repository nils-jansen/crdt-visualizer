import { Link } from 'wouter';
import type { CRDTModule } from '../../types/crdt';
import { MODULE_TO_ROUTE } from '../../utils/routes';

interface ModuleTabsProps {
  currentModule: CRDTModule;
}

const modules: { id: CRDTModule; label: string; description: string }[] = [
  { id: 'pn-counter', label: 'PN-Counter', description: 'Positive-Negative Counter' },
  { id: 'two-p-set', label: '2P-Set', description: 'Two-Phase Set' },
  { id: 'add-only-set', label: 'Add-Only Set', description: 'Grow-Only Set (G-Set)' },
  { id: 'directed-graph', label: 'Directed Graph', description: 'Add-Wins Graph' },
];

export function ModuleTabs({ currentModule }: ModuleTabsProps) {
  return (
    <div className="flex gap-2">
      {modules.map((module) => (
        <Link key={module.id} href={MODULE_TO_ROUTE[module.id]}>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentModule === module.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
            title={module.description}
          >
            {module.label}
          </button>
        </Link>
      ))}
    </div>
  );
}
