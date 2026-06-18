(() => {
  const { cyanFirstLoop, villageEdges, villageNodes } = window.PreCyanVillageData;
  const {
    answerCyanLoop,
    completeMove,
    isNodeUnlocked,
    loadState,
    resetState,
    saveState,
    startMove
  } = window.PreCyanVillageState;

  const MOVE_FALLBACK_MS = 520;

  const board = document.querySelector('.village-board');
  const nodesHost = document.querySelector('#village-nodes');
  const pathsHost = document.querySelector('.village-paths');
  const token = document.querySelector('#player-token');
  const logText = document.querySelector('#village-log-text');
  const achievement = document.querySelector('#achievement');
  const cyanLoop = document.querySelector('#cyan-loop');
  const cyanLoopSituation = document.querySelector('#cyan-loop-situation');
  const cyanLoopQuestion = document.querySelector('#cyan-loop-question');
  const cyanLoopChoices = document.querySelector('#cyan-loop-choices');
  const resetButton = document.querySelector('#reset-state');

  let currentState = loadState();
  let moveFallbackId = null;
  let completingMove = false;

  function normalizeEdge(edge) {
    if (Array.isArray(edge)) return { from: edge[0], to: edge[1] };
    return edge;
  }

  function isMoving() {
    return Boolean(currentState.movingToNodeId);
  }

  function isEdgeVisible(edge) {
    if (!edge.hiddenUntil) return true;
    return Boolean(currentState[edge.hiddenUntil]);
  }

  function isLastMove(edge) {
    const lastMove = currentState.lastMove;
    return Boolean(lastMove && lastMove.from === edge.from && lastMove.to === edge.to);
  }

  function clearMoveFallback() {
    if (!moveFallbackId) return;
    window.clearTimeout(moveFallbackId);
    moveFallbackId = null;
  }

  function scheduleMoveFallback() {
    clearMoveFallback();
    moveFallbackId = window.setTimeout(finishMove, MOVE_FALLBACK_MS);
  }

  function renderPaths() {
    pathsHost.innerHTML = villageEdges
      .map(normalizeEdge)
      .filter(isEdgeVisible)
      .map((edge) => {
        const fromNode = villageNodes[edge.from];
        const toNode = villageNodes[edge.to];
        const isLit = isNodeUnlocked(currentState, edge.from) && isNodeUnlocked(currentState, edge.to);
        const classes = [
          'village-path',
          isLit ? 'is-lit' : '',
          isLastMove(edge) ? 'is-last-move' : ''
        ].filter(Boolean).join(' ');
        return `<line class="${classes}" x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}"></line>`;
      }).join('');
  }

  function renderNodes() {
    const moving = isMoving();
    nodesHost.innerHTML = Object.values(villageNodes).map((node) => {
      const unlocked = isNodeUnlocked(currentState, node.id);
      const visited = currentState.visited.includes(node.id);
      const hidden = node.hidden && !currentState.backAlleyDiscovered;
      const current = currentState.playerNodeId === node.id;
      const movingTarget = currentState.movingToNodeId === node.id;
      const classes = [
        'village-node',
        unlocked ? 'is-unlocked' : '',
        visited ? 'is-visited' : '',
        hidden ? 'is-hidden' : '',
        current ? 'is-current' : '',
        movingTarget ? 'is-moving-target' : '',
        node.gate ? 'is-gate' : ''
      ].filter(Boolean).join(' ');
      const disabled = moving || !unlocked ? 'disabled' : '';
      return `<button class="${classes}" type="button" style="--x:${node.x};--y:${node.y}" data-node-id="${node.id}" ${disabled}>${node.label}</button>`;
    }).join('');
  }

  function renderToken() {
    const targetId = currentState.movingToNodeId || currentState.playerNodeId;
    const targetNode = villageNodes[targetId] || villageNodes.room;
    token.style.setProperty('--x', targetNode.x);
    token.style.setProperty('--y', targetNode.y);
    token.classList.toggle('is-moving', isMoving());
  }

  function renderCyanLoop() {
    const shouldShow = currentState.currentStage === 'cyanLoop' && currentState.cyanLoopSeen;
    cyanLoop.hidden = !shouldShow;
    if (!shouldShow) return;

    cyanLoopSituation.textContent = cyanFirstLoop.situation;
    cyanLoopQuestion.textContent = cyanFirstLoop.question;
    cyanLoopChoices.innerHTML = cyanFirstLoop.choices.map((choice) => {
      const selected = currentState.cyanLoopResult === 'success'
        && choice.id === cyanFirstLoop.correctChoiceId;
      const classes = ['cyan-choice', selected ? 'is-selected' : ''].filter(Boolean).join(' ');
      const disabled = currentState.cyanLoopCompleted ? 'disabled' : '';
      return `<button class="${classes}" type="button" data-cyan-choice="${choice.id}" ${disabled}>${choice.label}</button>`;
    }).join('');
  }

  function render() {
    const moving = isMoving();
    board.setAttribute('aria-busy', moving ? 'true' : 'false');
    board.classList.toggle('is-moving', moving);
    renderPaths();
    renderNodes();
    renderToken();
    renderCyanLoop();
    logText.textContent = currentState.log;
    achievement.hidden = !currentState.firstAchievementShown;
  }

  function finishMove() {
    if (completingMove || !currentState.movingToNodeId) return;
    completingMove = true;
    try {
      clearMoveFallback();
      currentState = completeMove(currentState);
      saveState(currentState);
      render();
    } finally {
      completingMove = false;
    }
  }

  nodesHost.addEventListener('click', (event) => {
    const button = event.target.closest('[data-node-id]');
    if (!button) return;
    const nextState = startMove(currentState, button.dataset.nodeId);
    if (nextState === currentState) return;
    currentState = nextState;
    saveState(currentState);
    render();
    scheduleMoveFallback();
  });

  token.addEventListener('transitionend', (event) => {
    if (event.propertyName !== 'left' && event.propertyName !== 'top') return;
    finishMove();
  });

  cyanLoopChoices.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cyan-choice]');
    if (!button) return;
    currentState = answerCyanLoop(currentState, button.dataset.cyanChoice);
    saveState(currentState);
    render();
  });

  resetButton.addEventListener('click', () => {
    clearMoveFallback();
    currentState = resetState();
    saveState(currentState);
    render();
  });

  render();
})();
