import { outingById } from '../domain/data';
import { renderOutingSlots, renderStatusStrip, renderZoneBoard } from './board-view';
import type { VillageState } from '../../shared/types/village';

export type AppElements = {
  roomScreen: HTMLElement;
  guideLine: HTMLElement;
  startOutingButton: HTMLButtonElement;
  villageBoard: HTMLElement;
  outingTitle: HTMLElement;
  outingSlots: HTMLElement;
  zoneBoard: HTMLElement;
  logText: HTMLElement;
  reactionPanel: HTMLElement;
  reactionText: HTMLElement;
  statusStrip: HTMLElement;
  resetButton: HTMLButtonElement;
};

export function queryAppElements(documentRef: Document = document): AppElements {
  const roomScreen = documentRef.querySelector<HTMLElement>('#room-screen');
  const guideLine = documentRef.querySelector<HTMLElement>('#guide-line');
  const startOutingButton = documentRef.querySelector<HTMLButtonElement>('#start-outing');
  const villageBoard = documentRef.querySelector<HTMLElement>('#village-board');
  const outingTitle = documentRef.querySelector<HTMLElement>('#outing-title');
  const outingSlots = documentRef.querySelector<HTMLElement>('#outing-slots');
  const zoneBoard = documentRef.querySelector<HTMLElement>('#zone-board');
  const logText = documentRef.querySelector<HTMLElement>('#village-log-text');
  const reactionPanel = documentRef.querySelector<HTMLElement>('#reaction-panel');
  const reactionText = documentRef.querySelector<HTMLElement>('#reaction-text');
  const statusStrip = documentRef.querySelector<HTMLElement>('#status-strip');
  const resetButton = documentRef.querySelector<HTMLButtonElement>('#reset-state');

  if (
    !roomScreen
    || !guideLine
    || !startOutingButton
    || !villageBoard
    || !outingTitle
    || !outingSlots
    || !zoneBoard
    || !logText
    || !reactionPanel
    || !reactionText
    || !statusStrip
    || !resetButton
  ) {
    throw new Error('Missing Pre-Cyan village DOM element');
  }

  return {
    roomScreen,
    guideLine,
    startOutingButton,
    villageBoard,
    outingTitle,
    outingSlots,
    zoneBoard,
    logText,
    reactionPanel,
    reactionText,
    statusStrip,
    resetButton
  };
}

function outingTitleFor(state: VillageState): string {
  if (!state.currentOutingId) return '외출';
  return outingById(state.currentOutingId)?.title ?? '다른 하루';
}

export function renderApp(elements: AppElements, state: VillageState): void {
  const inRoom = state.screen === 'room';
  const onBoard = state.screen === 'villageBoard';
  const reaction = state.pendingReaction;

  elements.roomScreen.hidden = !inRoom;
  elements.villageBoard.hidden = !onBoard;
  elements.guideLine.textContent = state.guideLine;
  elements.outingTitle.textContent = outingTitleFor(state);
  elements.logText.textContent = state.log;
  elements.reactionPanel.hidden = !reaction;
  elements.reactionText.textContent = reaction?.log ?? '';

  renderOutingSlots(elements.outingSlots, state);
  renderZoneBoard(elements.zoneBoard, state);
  renderStatusStrip(elements.statusStrip, state);
}
