import { recordMoneyFeverClick, selectHotspot, startOuting } from '../../domain/state';
import { saveGameState } from './storage-adapter';
import type { StorageLike } from '../../../shared/storage/local-storage';
import type { HotspotId, VillageState } from '../../../shared/types/village';

function isFinanceHotspot(hotspotId: HotspotId): boolean {
  return hotspotId === 'bankAtm' || hotspotId === 'bankCounter';
}

export type OutingSession = {
  getState(): VillageState;
  replaceState(nextState: VillageState): VillageState;
  start(): VillageState;
  interact(hotspotId: HotspotId, nowMs: number): VillageState;
};

export function createOutingSession(initialState: VillageState, storage: StorageLike | null): OutingSession {
  let currentState = initialState;

  function commit(nextState: VillageState): VillageState {
    currentState = saveGameState(storage, nextState);
    return currentState;
  }

  return {
    getState() {
      return currentState;
    },
    replaceState(nextState: VillageState) {
      return commit(nextState);
    },
    start() {
      return commit(startOuting(currentState));
    },
    interact(hotspotId: HotspotId, nowMs: number) {
      const sourceState = isFinanceHotspot(hotspotId)
        ? recordMoneyFeverClick(currentState, nowMs)
        : currentState;
      return commit(selectHotspot(sourceState, hotspotId));
    }
  };
}
