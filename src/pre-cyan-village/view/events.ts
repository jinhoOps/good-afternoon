import { recordMoneyFeverClick, resetState, saveState, selectHotspot, startOuting } from '../domain/state';
import { renderApp, type AppElements } from './render';
import type { StorageLike } from '../../shared/storage/local-storage';
import type { HotspotId, VillageState } from '../../shared/types/village';

export function wireEvents(elements: AppElements, initialState: VillageState, storage: StorageLike | null): void {
  let currentState = initialState;

  function saveCurrentState(): void {
    if (!storage) return;
    saveState(storage, currentState);
  }

  function update(nextState: VillageState): void {
    if (nextState === currentState) return;
    currentState = nextState;
    saveCurrentState();
    renderApp(elements, currentState);
  }

  elements.startOutingButton.addEventListener('click', () => {
    update(startOuting(currentState));
  });

  elements.zoneBoard.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('[data-hotspot-id]');
    if (!button) return;
    const hotspotId = button.dataset.hotspotId as HotspotId | undefined;
    if (!hotspotId) return;
    update(selectHotspot(currentState, hotspotId));
  });

  elements.zoneBoard.addEventListener('pointerdown', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('[data-hotspot-id="bankAtm"], [data-hotspot-id="bankCounter"]');
    if (!button) return;
    update(recordMoneyFeverClick(currentState, Date.now()));
  });

  elements.resetButton.addEventListener('click', () => {
    currentState = storage ? resetState(storage) : resetState();
    saveCurrentState();
    renderApp(elements, currentState);
  });
}
