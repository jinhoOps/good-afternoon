import Phaser from 'phaser';

export class PathGlow {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly path: Phaser.Curves.Path;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.path = new Phaser.Curves.Path(760, 420);
    this.path.quadraticBezierTo(610, 540, 420, 505);
    this.path.quadraticBezierTo(235, 470, 110, 330);
    this.graphics.setDepth(12);
    this.graphics.setVisible(false);
  }

  showHomePath(): void {
    this.graphics.clear();
    this.graphics.setVisible(true);
    this.graphics.lineStyle(16, 0x63b4d2, 0.18);
    this.path.draw(this.graphics);

    this.graphics.lineStyle(5, 0x63b4d2, 0.72);
    this.path.draw(this.graphics);
  }
}
