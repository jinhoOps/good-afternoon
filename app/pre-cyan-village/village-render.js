(() => {
  const { villageEdges, villageNodes } = window.PreCyanVillageData;
  const { enterGate, isNodeUnlocked, loadState, resetState, saveState, visitNode } = window.PreCyanVillageState;

const nodesHost = document.querySelector('#village-nodes');
const pathsHost = document.querySelector('.village-paths');
const logText = document.querySelector('#village-log-text');
const achievement = document.querySelector('#achievement');
const enterButton = document.querySelector('#enter-gate');
const resetButton = document.querySelector('#reset-state');

  let currentState = loadState();

function normalizeEdge(edge) {
  if (Array.isArray(edge)) return { from: edge[0], to: edge[1] };
  return edge;
}

function isEdgeVisible(edge) {
  if (!edge.hiddenUntil) return true;
  return Boolean(currentState[edge.hiddenUntil]);
}

function renderPaths() {
  pathsHost.innerHTML = villageEdges
    .map(normalizeEdge)
    .filter(isEdgeVisible)
    .map((edge) => {
      const fromNode = villageNodes[edge.from];
      const toNode = villageNodes[edge.to];
      const isLit = isNodeUnlocked(currentState, edge.from) && isNodeUnlocked(currentState, edge.to);
      return `<line class="village-path ${isLit ? 'is-lit' : ''}" x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}"></line>`;
    }).join('');
}

function renderNodes() {
  nodesHost.innerHTML = Object.values(villageNodes).map((node) => {
    const unlocked = isNodeUnlocked(currentState, node.id);
    const visited = currentState.visited.includes(node.id);
    const hidden = node.hidden && !currentState.backAlleyDiscovered;
    const classes = ['village-node', unlocked ? 'is-unlocked' : '', visited ? 'is-visited' : '', hidden ? 'is-hidden' : ''].filter(Boolean).join(' ');
    return `<button class="${classes}" type="button" style="--x:${node.x};--y:${node.y}" data-node-id="${node.id}" ${unlocked ? '' : 'disabled'}>${node.label}</button>`;
  }).join('');
}

function render() {
  renderPaths();
  renderNodes();
  logText.textContent = currentState.log;
  achievement.hidden = !currentState.firstAchievementShown;
  enterButton.hidden = !currentState.cyanGateUnlocked || currentState.firstAchievementShown;
}

nodesHost.addEventListener('click', (event) => {
  const button = event.target.closest('[data-node-id]');
  if (!button) return;
  currentState = visitNode(currentState, button.dataset.nodeId);
  saveState(currentState);
  render();
});

enterButton.addEventListener('click', () => {
  currentState = enterGate(currentState);
  saveState(currentState);
  render();
});

resetButton.addEventListener('click', () => {
  currentState = resetState();
  render();
});

render();
})();
