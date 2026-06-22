import Phaser from 'phaser';
import { findNearestHotspot, villageHotspots, villageSize, type VillageHotspot } from '../config/map-layout';
import { loadSvgAsset } from '../config/svg-assets';
import { DeviceHud } from '../objects/DeviceHud';
import { InteractionPrompt } from '../objects/InteractionPrompt';
import { PathGlow } from '../objects/PathGlow';
import { Player } from '../objects/Player';
import type { OutingSession } from '../adapters/outing-session';

export class VillageScene extends Phaser.Scene {
  private player: Player | null = null;
  private prompt: InteractionPrompt | null = null;
  private hud: DeviceHud | null = null;
  private pathGlow: PathGlow | null = null;
  private interactKey: Phaser.Input.Keyboard.Key | null = null;
  private nearestHotspot: VillageHotspot | null = null;
  private returningHome = false;

  constructor() {
    super('VillageScene');
  }

  preload(): void {
    loadSvgAsset(this, 'player');
    loadSvgAsset(this, 'bank');
    loadSvgAsset(this, 'store');
    loadSvgAsset(this, 'bus-stop');
    loadSvgAsset(this, 'board');
    loadSvgAsset(this, 'lottery');
    loadSvgAsset(this, 'dark-alley');
    loadSvgAsset(this, 'cyan-trace');
  }

  create(): void {
    this.returningHome = false;
    this.physics.world.setBounds(0, 0, villageSize.width, villageSize.height);

    this.add.rectangle(villageSize.width / 2, villageSize.height / 2, villageSize.width, villageSize.height, 0xfaf9f5);
    this.drawVillagePaths();
    this.createHotspots();

    this.pathGlow = new PathGlow(this);
    this.player = new Player(this, 116, 330);
    this.prompt = new InteractionPrompt(this);
    this.hud = new DeviceHud(this, () => this.tryInteract(), (intent) => this.player?.setMobileIntent(intent));
    this.hud.setLog(this.session().getState().guideLine || this.session().getState().log);
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null;
  }

  update(): void {
    if (!this.player || !this.prompt) return;

    this.player.updateMovement();
    this.nearestHotspot = findNearestHotspot({ x: this.player.x, y: this.player.y });

    if (this.nearestHotspot) {
      this.prompt.show(this.nearestHotspot.x, this.nearestHotspot.y - 54, `${this.nearestHotspot.label} E / 버튼`);
    } else {
      this.prompt.hide();
    }

    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.tryInteract();
    }
  }

  private tryInteract(): void {
    if (this.returningHome || !this.nearestHotspot || !this.hud) return;

    const hotspot = this.nearestHotspot;
    if (hotspot.kind === 'background') {
      this.hud.setLog(`${hotspot.label}이 조용히 남아 있다.`);
      return;
    }

    const session = this.session();
    const nextState = session.interact(hotspot.domainId, Date.now());
    this.hud.setLog(nextState.pendingReaction?.log ?? nextState.log);

    if (nextState.screen === 'room') {
      this.returningHome = true;
      this.pathGlow?.showHomePath();
      this.cameras.main.fadeOut(560, 250, 249, 245);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('RoomScene');
      });
    }
  }

  private drawVillagePaths(): void {
    const graphics = this.add.graphics();
    graphics.setDepth(1);
    graphics.lineStyle(18, 0xe5dec9, 0.9);
    graphics.beginPath();
    graphics.moveTo(110, 330);
    graphics.lineTo(245, 420);
    graphics.lineTo(455, 340);
    graphics.lineTo(720, 250);
    graphics.strokePath();

    graphics.lineStyle(10, 0xffffff, 0.82);
    graphics.beginPath();
    graphics.moveTo(180, 220);
    graphics.lineTo(245, 420);
    graphics.lineTo(795, 430);
    graphics.lineTo(875, 505);
    graphics.strokePath();
  }

  private createHotspots(): void {
    for (const hotspot of villageHotspots) {
      const size = hotspot.kind === 'core' ? 76 : 58;
      const marker = this.add.image(hotspot.x, hotspot.y, hotspot.assetKey);
      marker.setDisplaySize(size, size);
      marker.setDepth(hotspot.kind === 'core' ? 8 : 5);

      this.add.circle(hotspot.x, hotspot.y, hotspot.radius, 0xffffff, 0.08)
        .setStrokeStyle(1, hotspot.kind === 'core' ? 0x8e744a : 0x63b4d2, 0.25)
        .setDepth(3);

      this.add.text(hotspot.x, hotspot.y + size / 2 + 16, hotspot.label, {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
        fontSize: '14px',
        color: '#1C1B18',
        backgroundColor: '#FAF9F5',
        padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setDepth(9);
    }
  }

  private session(): OutingSession {
    return this.registry.get('outingSession') as OutingSession;
  }
}
