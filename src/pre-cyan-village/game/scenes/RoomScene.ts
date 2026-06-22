import Phaser from 'phaser';
import { findNearestDoor, roomDoor, roomSize } from '../config/map-layout';
import { loadSvgAsset } from '../config/svg-assets';
import { DeviceHud } from '../objects/DeviceHud';
import { InteractionPrompt } from '../objects/InteractionPrompt';
import { Player } from '../objects/Player';
import type { OutingSession } from '../adapters/outing-session';

export class RoomScene extends Phaser.Scene {
  private player: Player | null = null;
  private prompt: InteractionPrompt | null = null;
  private hud: DeviceHud | null = null;
  private interactKey: Phaser.Input.Keyboard.Key | null = null;
  private isLeaving = false;

  constructor() {
    super('RoomScene');
  }

  preload(): void {
    loadSvgAsset(this, 'player');
    loadSvgAsset(this, 'room');
  }

  create(): void {
    this.isLeaving = false;
    this.physics.world.setBounds(0, 0, roomSize.width, roomSize.height);

    this.add.rectangle(480, 320, 960, 640, 0xfaf9f5);
    const room = this.add.image(roomSize.width / 2, roomSize.height / 2, 'room');
    room.setDisplaySize(roomSize.width, roomSize.height);
    room.setDepth(0);

    this.add.rectangle(roomDoor.x, roomDoor.y, 66, 126, 0xf2efe9, 0.74)
      .setStrokeStyle(2, 0x8e744a, 0.62)
      .setDepth(4);
    this.add.text(roomDoor.x, roomDoor.y + 84, roomDoor.label, {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
      fontSize: '15px',
      color: '#6C6A64'
    }).setOrigin(0.5).setDepth(5);

    this.player = new Player(this, 150, 300);
    this.prompt = new InteractionPrompt(this);
    this.hud = new DeviceHud(this, () => this.tryLeaveRoom(), (intent) => this.player?.setMobileIntent(intent));

    const state = this.session().getState();
    this.hud.setLog(state.guideLine || state.log);

    if (state.roomFeatures.firstRecord && state.outingHistory[0]) {
      this.add.text(32, 402, state.outingHistory[0].summary, {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
        fontSize: '15px',
        color: '#1C1B18',
        backgroundColor: '#FFFFFF',
        padding: { x: 10, y: 8 },
        wordWrap: { width: 320 }
      }).setDepth(6);
    }

    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null;
  }

  update(): void {
    if (!this.player || !this.prompt) return;

    this.player.updateMovement();
    const door = findNearestDoor({ x: this.player.x, y: this.player.y });
    if (door) {
      this.prompt.show(door.x, door.y - 78, 'E / 버튼');
    } else {
      this.prompt.hide();
    }

    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.tryLeaveRoom();
    }
  }

  private tryLeaveRoom(): void {
    if (this.isLeaving || !this.player) return;
    const door = findNearestDoor({ x: this.player.x, y: this.player.y });
    if (!door) return;

    this.isLeaving = true;
    this.session().start();
    this.cameras.main.fadeOut(220, 250, 249, 245);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('VillageScene');
    });
  }

  private session(): OutingSession {
    return this.registry.get('outingSession') as OutingSession;
  }
}
