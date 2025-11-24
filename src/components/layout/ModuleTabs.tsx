import type { CRDTModule } from '../../types/crdt';

interface ModuleTabsProps {
  currentModule: CRDTModule;
  onModuleChange: (module: CRDTModule) => void;
}

const modules: { id: CRDTModule; label: string; description: string }[] = [
  { id: 'pn-counter', label: 'PN-Counter', description: 'Positive-Negative Counter' },
  { id: 'two-p-set', label: '2P-Set', description: 'Two-Phase Set' },
  { id: 'directed-graph', label: 'Directed Graph', description: 'Add-Wins Graph' },
];

export function ModuleTabs({ currentModule, onModuleChange }: ModuleTabsProps) {
  return (
    <div className="flex gap-2">
      {modules.map((module) => (
        <button
          key={module.id}
          onClick={() => onModuleChange(module.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            currentModule === module.id
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
          }`}
          title={module.description}
        >
          {module.label}
        </button>
      ))}
    </div>
  );
}
