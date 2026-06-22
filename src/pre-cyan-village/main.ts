import './styles.css';
import { createInitialState, loadState, saveState } from './domain/state';
import { wireEvents } from './view/events';
import { queryAppElements, renderApp } from './view/render';
import { startPreCyanGame } from './game/main-game';
import type { StorageLike } from '../shared/storage/local-storage';

function getSafeStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function runtimeSearch(): 'dom' | 'phaser' {
  const params = new URLSearchParams(window.location.search);
  return params.get('runtime') === 'phaser' ? 'phaser' : 'dom';
}

const storage = getSafeStorage();
const initialState = storage ? loadState(storage) : createInitialState();

if (storage) {
  saveState(storage, initialState);
}

if (runtimeSearch() === 'phaser') {
  document.documentElement.dataset.runtime = 'phaser';
  const domShell = document.querySelector<HTMLElement>('.app-shell');
  const shell = document.querySelector<HTMLElement>('#phaser-shell');
  const host = document.querySelector<HTMLElement>('#phaser-game');
  if (!shell || !host) throw new Error('Missing Phaser game host');
  if (domShell) domShell.hidden = true;
  shell.hidden = false;
  shell.dataset.runtime = 'phaser';
  startPreCyanGame({ host, storage, initialState });
} else {
  document.documentElement.dataset.runtime = 'dom';
  const domShell = document.querySelector<HTMLElement>('.app-shell');
  if (domShell) domShell.hidden = false;
  const elements = queryAppElements();
  renderApp(elements, initialState);
  wireEvents(elements, initialState, storage);
}
