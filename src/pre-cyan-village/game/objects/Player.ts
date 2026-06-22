import Phaser from 'phaser';

export type MobileMoveIntent = {
  x: number;
  y: number;
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key> | null = null;
  private mobileIntent: MobileMoveIntent = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(20);
    this.setScale(0.72);
    this.createInput();
  }

  createInput(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  }

  setMobileIntent(intent: MobileMoveIntent): void {
    this.mobileIntent = intent;
  }

  updateMovement(speed = 170): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    const left = this.cursors?.left.isDown || this.wasd?.A.isDown || this.mobileIntent.x < 0;
    const right = this.cursors?.right.isDown || this.wasd?.D.isDown || this.mobileIntent.x > 0;
    const up = this.cursors?.up.isDown || this.wasd?.W.isDown || this.mobileIntent.y < 0;
    const down = this.cursors?.down.isDown || this.wasd?.S.isDown || this.mobileIntent.y > 0;

    const velocity = new Phaser.Math.Vector2(Number(right) - Number(left), Number(down) - Number(up));
    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(speed);
    }

    body.setVelocity(velocity.x, velocity.y);

    if (velocity.x !== 0) {
      this.setFlipX(velocity.x < 0);
    }
  }
}
