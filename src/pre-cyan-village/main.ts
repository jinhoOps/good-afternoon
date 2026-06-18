import './styles.css';
import { createInitialState, loadState, saveState } from './domain/state';
import { wireEvents } from './view/events';
import { queryAppElements, renderApp } from './view/render';
import type { StorageLike } from '../shared/storage/local-storage';

function getSafeStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const elements = queryAppElements();
const storage = getSafeStorage();
const initialState = storage ? loadState(storage) : createInitialState();

if (storage) {
  saveState(storage, initialState);
}
renderApp(elements, initialState);
wireEvents(elements, initialState, storage);
