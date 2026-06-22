import Phaser from 'phaser';
import type { MobileMoveIntent } from './Player';

type MoveHandler = (intent: MobileMoveIntent) => void;

export class DeviceHud {
  private readonly logText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, onInteract: () => void, onMove: MoveHandler) {
    this.logText = scene.add.text(20, 18, '', {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
      fontSize: '16px',
      color: '#1C1B18',
      backgroundColor: '#FFFFFF',
      padding: { x: 12, y: 9 },
      wordWrap: { width: 410 }
    });
    this.logText.setScrollFactor(0);
    this.logText.setDepth(100);

    this.createButton(scene, 858, 552, 'E', onInteract, '#8E744A');
    this.createMoveButton(scene, 92, 520, '↑', { x: 0, y: -1 }, onMove);
    this.createMoveButton(scene, 92, 600, '↓', { x: 0, y: 1 }, onMove);
    this.createMoveButton(scene, 52, 560, '←', { x: -1, y: 0 }, onMove);
    this.createMoveButton(scene, 132, 560, '→', { x: 1, y: 0 }, onMove);
  }

  setLog(text: string): void {
    this.logText.setText(text);
  }

  private createMoveButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    intent: MobileMoveIntent,
    onMove: MoveHandler
  ): void {
    const button = this.createButton(scene, x, y, label, () => undefined, '#FFFFFF');
    button.on('pointerdown', () => onMove(intent));
    button.on('pointerup', () => onMove({ x: 0, y: 0 }));
    button.on('pointerout', () => onMove({ x: 0, y: 0 }));
  }

  private createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onPointerDown: () => void,
    fillColor: string
  ): Phaser.GameObjects.Container {
    const background = scene.add.rectangle(0, 0, 54, 54, Phaser.Display.Color.HexStringToColor(fillColor).color, 0.9);
    background.setStrokeStyle(1, 0x8e744a, 0.75);

    const text = scene.add.text(0, 0, label, {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
      fontSize: '20px',
      color: fillColor === '#FFFFFF' ? '#1C1B18' : '#FFFFFF'
    });
    text.setOrigin(0.5);

    const button = scene.add.container(x, y, [background, text]);
    button.setScrollFactor(0);
    button.setDepth(100);
    button.setSize(54, 54);
    button.setInteractive(new Phaser.Geom.Rectangle(-27, -27, 54, 54), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', onPointerDown);
    return button;
  }
}
