class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Generate sprites programmatically
        this.createShipTextures();
        this.createProjectileTexture();
        this.createExplosionTexture();
        this.createHealthBarTextures();
    }

    createShipTextures() {
        // Player 1 ship (red triangle pointing right)
        const p1Graphics = this.make.graphics({ x: 0, y: 0, add: false });
        p1Graphics.fillStyle(0xff4444, 1);
        p1Graphics.beginPath();
        p1Graphics.moveTo(40, 0);
        p1Graphics.lineTo(0, 30);
        p1Graphics.lineTo(10, 30);
        p1Graphics.lineTo(10, 60);
        p1Graphics.lineTo(40, 30);
        p1Graphics.closePath();
        p1Graphics.fillPath();
        p1Graphics.lineStyle(2, 0xcc2222, 1);
        p1Graphics.strokePath();
        p1Graphics.generateTexture('ship_p1', 50, 60);

        // Player 2 ship (blue triangle pointing left)
        const p2Graphics = this.make.graphics({ x: 0, y: 0, add: false });
        p2Graphics.fillStyle(0x4444ff, 1);
        p2Graphics.beginPath();
        p2Graphics.moveTo(0, 0);
        p2Graphics.lineTo(40, 30);
        p2Graphics.lineTo(30, 30);
        p2Graphics.lineTo(30, 60);
        p2Graphics.lineTo(0, 30);
        p2Graphics.closePath();
        p2Graphics.fillPath();
        p2Graphics.lineStyle(2, 0x2222cc, 1);
        p2Graphics.strokePath();
        p2Graphics.generateTexture('ship_p2', 50, 60);
    }

    createProjectileTexture() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(15, 15, 15);
        graphics.lineStyle(2, 0xffaa00, 1);
        graphics.strokeCircle(15, 15, 15);
        graphics.generateTexture('projectile', 30, 30);
    }

    createExplosionTexture() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xff8800, 1);
        graphics.fillCircle(32, 32, 32);
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(32, 32, 16);
        graphics.generateTexture('explosion', 64, 64);
    }

    createHealthBarTextures() {
        // Health bar background (dark)
        const bgGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        bgGraphics.fillStyle(0x333333, 1);
        bgGraphics.fillRect(0, 0, 200, 24);
        bgGraphics.lineStyle(2, 0x555555, 1);
        bgGraphics.strokeRect(0, 0, 200, 24);
        bgGraphics.generateTexture('health_bar_bg', 200, 24);

        // Health bar red (P1)
        const p1BarGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        p1BarGraphics.fillStyle(0xff4444, 1);
        p1BarGraphics.fillRect(0, 0, 196, 20);
        p1BarGraphics.generateTexture('health_bar_p1', 196, 20);

        // Health bar blue (P2)
        const p2BarGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        p2BarGraphics.fillStyle(0x4444ff, 1);
        p2BarGraphics.fillRect(0, 0, 196, 20);
        p2BarGraphics.generateTexture('health_bar_p2', 196, 20);
    }

    create() {
        this.scene.start('PlayScene');
    }
}
