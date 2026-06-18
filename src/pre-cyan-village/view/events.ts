import { answerCyanLoop, completeMove, createInitialState, resetState, saveState, startMove } from '../domain/state';
import { renderApp, type AppElements } from './render';
import type { StorageLike } from '../../shared/storage/local-storage';
import type { VillageState } from '../../shared/types/village';

const MOVE_FALLBACK_MS = 520;

export function wireEvents(elements: AppElements, initialState: VillageState, storage: StorageLike | null): void {
  let currentState = initialState;
  let moveFallbackId: number | null = null;
  let completingMove = false;

  function saveCurrentState(): void {
    if (!storage) return;
    saveState(storage, currentState);
  }

  function clearMoveFallback(): void {
    if (moveFallbackId === null) return;
    window.clearTimeout(moveFallbackId);
    moveFallbackId = null;
  }

  function finishMove(): void {
    if (completingMove || !currentState.movingToNodeId) return;
    completingMove = true;

    try {
      clearMoveFallback();
      currentState = completeMove(currentState);
      saveCurrentState();
      renderApp(elements, currentState);
    } finally {
      completingMove = false;
    }
  }

  function scheduleMoveFallback(): void {
    clearMoveFallback();
    moveFallbackId = window.setTimeout(finishMove, MOVE_FALLBACK_MS);
  }

  elements.nodesHost.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('[data-node-id]');
    if (!button) return;

    const nextState = startMove(currentState, button.dataset.nodeId ?? '');
    if (nextState === currentState) return;

    currentState = nextState;
    saveCurrentState();
    renderApp(elements, currentState);
    scheduleMoveFallback();
  });

  elements.token.addEventListener('transitionend', (event) => {
    if (event.propertyName !== 'left' && event.propertyName !== 'top') return;
    finishMove();
  });

  elements.cyanLoopChoices.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('[data-cyan-choice]');
    if (!button) return;

    currentState = answerCyanLoop(currentState, button.dataset.cyanChoice ?? '');
    saveCurrentState();
    renderApp(elements, currentState);
  });

  elements.resetButton.addEventListener('click', () => {
    clearMoveFallback();
    currentState = storage ? resetState(storage) : createInitialState();
    saveCurrentState();
    renderApp(elements, currentState);
  });
}
