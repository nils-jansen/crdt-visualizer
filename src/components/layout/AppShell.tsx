import type { CRDTModule } from '../../types/crdt';
import { ModuleTabs } from './ModuleTabs';

interface AppShellProps {
  currentModule: CRDTModule;
  onModuleChange: (module: CRDTModule) => void;
  children: React.ReactNode;
}

export function AppShell({ currentModule, onModuleChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">
            CRDT Visualizer
          </h1>
          <ModuleTabs currentModule={currentModule} onModuleChange={onModuleChange} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
