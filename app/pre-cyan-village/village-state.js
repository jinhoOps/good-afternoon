(() => {
  const { villageNodes } = window.PreCyanVillageData;

  const STORAGE_KEY = 'goodafternoon.preCyanVillage.v1';

function createInitialState() {
  return {
    unlocked: ['room'],
    visited: [],
    log: '나가기 전에 하나만 챙기면 된다.',
    cyanGateUnlocked: false,
    lotterySeen: false,
    backAlleyDiscovered: false,
    backAlleyEntered: false,
    firstAchievementShown: false
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialState();
    const parsed = JSON.parse(saved);
    return {
      ...createInitialState(),
      ...parsed,
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : ['room'],
      visited: Array.isArray(parsed.visited) ? parsed.visited : []
    };
  } catch {
    return createInitialState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  return state;
}

function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return createInitialState();
}

function isNodeUnlocked(state, id) {
  if (id === 'cyanGate') return state.cyanGateUnlocked;
  if (id === 'alley') return state.backAlleyDiscovered;
  return state.unlocked.includes(id);
}

function countVisitedPublicPlaces(state) {
  return state.visited.filter((id) => {
    const node = villageNodes[id];
    return node && !node.hidden && !node.gate;
  }).length;
}

function visitNode(state, id) {
  const node = villageNodes[id];
  if (!node || !isNodeUnlocked(state, id)) return state;

  const nextState = {
    ...state,
    unlocked: [...state.unlocked],
    visited: [...state.visited],
    log: node.log
  };

  if (!nextState.visited.includes(id)) {
    nextState.visited.push(id);
  }

  node.unlocks.forEach((nextId) => {
    if (!nextState.unlocked.includes(nextId)) {
      nextState.unlocked.push(nextId);
    }
  });

  if (id === 'lottery') nextState.lotterySeen = true;
  if (nextState.lotterySeen && (id === 'bank' || id === 'store')) nextState.backAlleyDiscovered = true;
  if (id === 'alley') nextState.backAlleyEntered = true;
  if (countVisitedPublicPlaces(nextState) >= 4) nextState.cyanGateUnlocked = true;

  return nextState;
}

function enterGate(state) {
  if (!state.cyanGateUnlocked) return state;
  return {
    ...state,
    log: villageNodes.cyanGate.log,
    firstAchievementShown: true
  };
}

window.PreCyanVillageState = {
  STORAGE_KEY,
  createInitialState,
  loadState,
  saveState,
  resetState,
  isNodeUnlocked,
  countVisitedPublicPlaces,
  visitNode,
  enterGate
};
})();
