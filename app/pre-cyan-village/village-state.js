(() => {
  const { cyanFirstLoop, villageNodes } = window.PreCyanVillageData;

  const STORAGE_KEY = 'goodafternoon.preCyanVillage.v1';

  function createInitialState() {
    return {
      unlocked: ['room', 'store', 'bus'],
      visited: ['room'],
      log: '나가기 전에 하나만 챙기면 된다.',
      cyanGateUnlocked: false,
      lotterySeen: false,
      backAlleyDiscovered: false,
      backAlleyEntered: false,
      firstAchievementShown: false,
      playerNodeId: 'room',
      movingToNodeId: null,
      lastMove: null,
      currentStage: 'preCyan',
      cyanLoopSeen: false,
      cyanLoopCompleted: false,
      cyanLoopResult: null
    };
  }

  function normalizeState(parsed) {
    const base = createInitialState();
    const unlocked = Array.isArray(parsed.unlocked)
      ? [...new Set([...base.unlocked, ...parsed.unlocked])]
      : base.unlocked;
    const visited = Array.isArray(parsed.visited)
      ? [...new Set([...base.visited, ...parsed.visited])]
      : base.visited;
    const validPlayerNodeId = villageNodes[parsed.playerNodeId] ? parsed.playerNodeId : null;
    const validCurrentStage = ['preCyan', 'cyanIntro', 'cyanLoop'].includes(parsed.currentStage)
      ? parsed.currentStage
      : null;
    const reachedCyanGateInOldSave = parsed.firstAchievementShown === true
      && parsed.cyanGateUnlocked === true;
    return {
      ...base,
      ...parsed,
      unlocked,
      visited,
      playerNodeId: reachedCyanGateInOldSave && (!validPlayerNodeId || validPlayerNodeId === base.playerNodeId)
        ? 'cyanGate'
        : validPlayerNodeId || base.playerNodeId,
      movingToNodeId: null,
      lastMove: parsed.lastMove && villageNodes[parsed.lastMove.from] && villageNodes[parsed.lastMove.to]
        ? parsed.lastMove
        : base.lastMove,
      currentStage: reachedCyanGateInOldSave && !validCurrentStage
        ? 'cyanLoop'
        : validCurrentStage || base.currentStage,
      cyanLoopSeen: reachedCyanGateInOldSave ? true : Boolean(parsed.cyanLoopSeen),
      cyanLoopResult: ['success', 'failure'].includes(parsed.cyanLoopResult)
        ? parsed.cyanLoopResult
        : base.cyanLoopResult
    };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return createInitialState();
      return normalizeState(JSON.parse(saved));
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
      log: node.log,
      playerNodeId: id,
      movingToNodeId: null
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
      firstAchievementShown: true,
      playerNodeId: 'cyanGate',
      movingToNodeId: null,
      currentStage: 'cyanLoop',
      cyanLoopSeen: true
    };
  }

  function startMove(state, destinationId) {
    if (state.movingToNodeId) return state;
    if (state.playerNodeId === destinationId) return state;
    if (!villageNodes[destinationId] || !isNodeUnlocked(state, destinationId)) return state;
    return {
      ...state,
      movingToNodeId: destinationId,
      lastMove: {
        from: state.playerNodeId,
        to: destinationId
      }
    };
  }

  function completeMove(state) {
    if (!state.movingToNodeId) return state;
    const destinationId = state.movingToNodeId;
    if (!villageNodes[destinationId] || !isNodeUnlocked(state, destinationId)) return state;
    const arrived = {
      ...state,
      playerNodeId: destinationId,
      movingToNodeId: null
    };
    if (destinationId === 'cyanGate') {
      return enterGate(arrived);
    }
    return visitNode(arrived, destinationId);
  }

  function answerCyanLoop(state, choiceId) {
    if (state.currentStage !== 'cyanLoop' || state.cyanLoopCompleted) return state;
    const choice = cyanFirstLoop.choices.find((item) => item.id === choiceId);
    if (!choice) return state;
    const isCorrect = choice.id === cyanFirstLoop.correctChoiceId;
    return {
      ...state,
      log: isCorrect ? cyanFirstLoop.successLog : cyanFirstLoop.failureLog,
      cyanLoopCompleted: true,
      cyanLoopResult: isCorrect ? 'success' : 'failure'
    };
  }

  window.PreCyanVillageState = {
    STORAGE_KEY,
    createInitialState,
    normalizeState,
    loadState,
    saveState,
    resetState,
    isNodeUnlocked,
    countVisitedPublicPlaces,
    visitNode,
    enterGate,
    startMove,
    completeMove,
    answerCyanLoop
  };
})();
