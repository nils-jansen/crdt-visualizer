import { useState } from 'react';
import type { CRDTModule } from './types/crdt';
import { AppShell } from './components/layout/AppShell';
import { PNCounterModule } from './components/pn-counter/PNCounterModule';
import { TwoPSetModule } from './components/two-p-set/TwoPSetModule';
import { AddOnlySetModule } from './components/add-only-set/AddOnlySetModule';
import { DirectedGraphModule } from './components/directed-graph/DirectedGraphModule';

function App() {
  const [currentModule, setCurrentModule] = useState<CRDTModule>('pn-counter');

  return (
    <AppShell currentModule={currentModule} onModuleChange={setCurrentModule}>
      {currentModule === 'pn-counter' && <PNCounterModule />}
      {currentModule === 'two-p-set' && <TwoPSetModule />}
      {currentModule === 'add-only-set' && <AddOnlySetModule />}
      {currentModule === 'directed-graph' && <DirectedGraphModule />}
    </AppShell>
  );
}

export default App;
