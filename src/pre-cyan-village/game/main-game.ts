import Phaser from 'phaser';
import { createOutingSession } from './adapters/outing-session';
import { RoomScene } from './scenes/RoomScene';
import { VillageScene } from './scenes/VillageScene';
import type { StorageLike } from '../../shared/storage/local-storage';
import type { VillageState } from '../../shared/types/village';

export type PreCyanGameOptions = {
  host: HTMLElement;
  storage: StorageLike | null;
  initialState: VillageState;
};

export type PreCyanGameHandle = {
  destroy(): void;
};

export function startPreCyanGame(options: PreCyanGameOptions): PreCyanGameHandle {
  options.host.replaceChildren();

  const session = createOutingSession(options.initialState, options.storage);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.host,
    backgroundColor: '#FAF9F5',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 960,
      height: 640
    },
    scene: [RoomScene, VillageScene],
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    }
  });

  game.registry.set('outingSession', session);

  return {
    destroy() {
      game.destroy(true);
    }
  };
}
