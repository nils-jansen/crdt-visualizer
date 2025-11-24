import { Route, Switch, Redirect } from 'wouter';
import { AppShell } from './components/layout/AppShell';
import { PNCounterModule } from './components/pn-counter/PNCounterModule';
import { TwoPSetModule } from './components/two-p-set/TwoPSetModule';
import { AddOnlySetModule } from './components/add-only-set/AddOnlySetModule';
import { DirectedGraphModule } from './components/directed-graph/DirectedGraphModule';
import { ROUTES } from './utils/routes';

function App() {
  return (
    <Switch>
      <Route path={ROUTES.PN_COUNTER}>
        <AppShell currentModule="pn-counter">
          <PNCounterModule />
        </AppShell>
      </Route>

      <Route path={ROUTES.TWO_P_SET}>
        <AppShell currentModule="two-p-set">
          <TwoPSetModule />
        </AppShell>
      </Route>

      <Route path={ROUTES.ADD_ONLY_SET}>
        <AppShell currentModule="add-only-set">
          <AddOnlySetModule />
        </AppShell>
      </Route>

      <Route path={ROUTES.DIRECTED_GRAPH}>
        <AppShell currentModule="directed-graph">
          <DirectedGraphModule />
        </AppShell>
      </Route>

      <Route path={ROUTES.HOME}>
        <Redirect to={ROUTES.PN_COUNTER} />
      </Route>

      <Route>
        <Redirect to={ROUTES.PN_COUNTER} />
      </Route>
    </Switch>
  );
}

export default App;
