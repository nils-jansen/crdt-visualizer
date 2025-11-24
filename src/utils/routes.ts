import type { CRDTModule } from '../types/crdt';

export const ROUTES = {
  HOME: '/',
  PN_COUNTER: '/pn-counter',
  TWO_P_SET: '/two-p-set',
  ADD_ONLY_SET: '/add-only-set',
  DIRECTED_GRAPH: '/directed-graph',
} as const;

export const MODULE_TO_ROUTE: Record<CRDTModule, string> = {
  'pn-counter': ROUTES.PN_COUNTER,
  'two-p-set': ROUTES.TWO_P_SET,
  'add-only-set': ROUTES.ADD_ONLY_SET,
  'directed-graph': ROUTES.DIRECTED_GRAPH,
};
