import type { CRDTModule } from '../../types/crdt';
import { ModuleTabs } from './ModuleTabs';

interface AppShellProps {
  currentModule: CRDTModule;
  children: React.ReactNode;
}

export function AppShell({ currentModule, children }: AppShellProps) {
  const isCmRDT = currentModule === 'directed-graph';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 bg-gradient-to-r from-slate-800 via-slate-800 to-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">
                  <span className="text-blue-400">C</span>
                  <span className="text-green-400">R</span>
                  <span className="text-purple-400">D</span>
                  <span className="text-amber-400">T</span>
                </span>
                <span>Visualizer</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Conflict-free Replicated Data Types
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Implementation Type</div>
              <div className={`text-sm font-medium ${isCmRDT ? 'text-purple-400' : 'text-blue-400'}`}>
                {isCmRDT ? 'CmRDT' : 'CvRDT'} <span className="text-slate-500">({isCmRDT ? 'Op-based' : 'State-based'})</span>
              </div>
            </div>
          </div>
          <ModuleTabs currentModule={currentModule} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-slate-800 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>
            {isCmRDT ? (
              <>
                CmRDTs (Commutative Replicated Data Types) achieve consistency through operation-based delivery.
                Operations are prepared locally and delivered to other replicas via causal broadcast.
              </>
            ) : (
              <>
                CvRDTs (Convergent Replicated Data Types) achieve consistency through state-based merge functions.
                Unlike CmRDTs (Commutative), they transmit full state rather than operations.
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
