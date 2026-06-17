import { villageNodes, villageEdges } from './village-data.js';
import { createInitialState } from './village-state.js';

const state = createInitialState();

console.info('Pre-Cyan village ready', {
  nodeCount: Object.keys(villageNodes).length,
  edgeCount: villageEdges.length,
  state
});
