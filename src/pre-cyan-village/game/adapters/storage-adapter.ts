import { createInitialState, loadState, saveState } from '../../domain/state';
import type { StorageLike } from '../../../shared/storage/local-storage';
import type { VillageState } from '../../../shared/types/village';

export function createMemoryStorage(seed: Record<string, string> = {}): StorageLike {
  const store = { ...seed };
  return {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] ?? null : null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    }
  };
}

export function loadGameState(storage: StorageLike | null): VillageState {
  return storage ? loadState(storage) : createInitialState();
}

export function saveGameState(storage: StorageLike | null, state: VillageState): VillageState {
  return storage ? saveState(storage, state) : state;
}
