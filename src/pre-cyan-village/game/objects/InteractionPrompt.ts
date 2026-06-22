import Phaser from 'phaser';

export class InteractionPrompt {
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(0, 0, '', {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
      fontSize: '17px',
      color: '#1C1B18',
      backgroundColor: '#FFFFFF',
      padding: { x: 10, y: 7 }
    });
    this.text.setOrigin(0.5, 1);
    this.text.setDepth(50);
    this.hide();
  }

  show(x: number, y: number, text: string): void {
    this.text.setPosition(x, y);
    this.text.setText(text);
    this.text.setVisible(true);
  }

  hide(): void {
    this.text.setVisible(false);
  }
}
