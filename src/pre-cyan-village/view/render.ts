import { renderNodes, renderPaths, renderToken } from './board-view';
import { renderCyanLoop } from './loop-view';
import type { VillageState } from '../../shared/types/village';

export type AppElements = {
  board: HTMLElement;
  nodesHost: HTMLElement;
  pathsHost: SVGElement;
  token: HTMLElement;
  logText: HTMLElement;
  achievement: HTMLElement;
  cyanLoop: HTMLElement;
  cyanLoopSituation: HTMLElement;
  cyanLoopQuestion: HTMLElement;
  cyanLoopChoices: HTMLElement;
  resetButton: HTMLButtonElement;
};

export function queryAppElements(documentRef: Document = document): AppElements {
  const board = documentRef.querySelector<HTMLElement>('.village-board');
  const nodesHost = documentRef.querySelector<HTMLElement>('#village-nodes');
  const pathsHost = documentRef.querySelector<SVGElement>('.village-paths');
  const token = documentRef.querySelector<HTMLElement>('#player-token');
  const logText = documentRef.querySelector<HTMLElement>('#village-log-text');
  const achievement = documentRef.querySelector<HTMLElement>('#achievement');
  const cyanLoop = documentRef.querySelector<HTMLElement>('#cyan-loop');
  const cyanLoopSituation = documentRef.querySelector<HTMLElement>('#cyan-loop-situation');
  const cyanLoopQuestion = documentRef.querySelector<HTMLElement>('#cyan-loop-question');
  const cyanLoopChoices = documentRef.querySelector<HTMLElement>('#cyan-loop-choices');
  const resetButton = documentRef.querySelector<HTMLButtonElement>('#reset-state');

  if (
    !board
    || !nodesHost
    || !pathsHost
    || !token
    || !logText
    || !achievement
    || !cyanLoop
    || !cyanLoopSituation
    || !cyanLoopQuestion
    || !cyanLoopChoices
    || !resetButton
  ) {
    throw new Error('Missing Pre-Cyan village DOM element');
  }

  return {
    board,
    nodesHost,
    pathsHost,
    token,
    logText,
    achievement,
    cyanLoop,
    cyanLoopSituation,
    cyanLoopQuestion,
    cyanLoopChoices,
    resetButton
  };
}

export function renderApp(elements: AppElements, state: VillageState): void {
  const moving = Boolean(state.movingToNodeId);

  elements.board.setAttribute('aria-busy', moving ? 'true' : 'false');
  elements.board.classList.toggle('is-moving', moving);
  renderPaths(elements.pathsHost, state);
  renderNodes(elements.nodesHost, state);
  renderToken(elements.token, state);
  renderCyanLoop({
    cyanLoop: elements.cyanLoop,
    situation: elements.cyanLoopSituation,
    question: elements.cyanLoopQuestion,
    choices: elements.cyanLoopChoices
  }, state);
  elements.logText.textContent = state.log;
  elements.achievement.hidden = !state.firstAchievementShown;
}
