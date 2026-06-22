import type { VillageState } from '../../shared/types/village';
import type { StorageLike } from '../../shared/storage/local-storage';

export type PreCyanGameOptions = {
  host: HTMLElement;
  storage: StorageLike | null;
  initialState: VillageState;
};

export type PreCyanGameHandle = {
  destroy(): void;
};

export function startPreCyanGame(options: PreCyanGameOptions): PreCyanGameHandle {
  options.host.textContent = options.initialState.log;
  return {
    destroy() {
      options.host.replaceChildren();
    }
  };
}
