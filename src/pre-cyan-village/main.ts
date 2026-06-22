import './styles.css';
import { createInitialState, loadState, saveState } from './domain/state';
import { startPreCyanGame } from './game/main-game';
import type { StorageLike } from '../shared/storage/local-storage';

function getSafeStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = getSafeStorage();
const initialState = storage ? loadState(storage) : createInitialState();

if (storage) {
  saveState(storage, initialState);
}

document.documentElement.dataset.runtime = 'phaser';

const shell = document.querySelector<HTMLElement>('#phaser-shell');
const host = document.querySelector<HTMLElement>('#phaser-game');

if (!shell || !host) throw new Error('Missing Phaser game host');

shell.dataset.runtime = 'phaser';
startPreCyanGame({ host, storage, initialState });
