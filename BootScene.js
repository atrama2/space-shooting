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
        this.createEffectTextures();
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

        // Health bar red (P1) - gradient from bright to darker
        const p1BarGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        for (let i = 0; i < 196; i++) {
            const ratio = i / 196;
            const r = Math.floor(255 - ratio * 80);
            const g = Math.floor(68 + ratio * 30);
            const b = Math.floor(68 + ratio * 30);
            p1BarGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
            p1BarGraphics.fillRect(i, 0, 1, 20);
        }
        p1BarGraphics.generateTexture('health_bar_p1', 196, 20);

        // Health bar blue (P2) - gradient from bright to darker
        const p2BarGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        for (let i = 0; i < 196; i++) {
            const ratio = i / 196;
            const r = Math.floor(68 + ratio * 30);
            const g = Math.floor(68 + ratio * 30);
            const b = Math.floor(255 - ratio * 80);
            p2BarGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
            p2BarGraphics.fillRect(i, 0, 1, 20);
        }
        p2BarGraphics.generateTexture('health_bar_p2', 196, 20);
    }

    createEffectTextures() {
        // Engine exhaust particle (small orange/yellow glow)
        const exhaustGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        exhaustGraphics.fillStyle(0xff6600, 1);
        exhaustGraphics.fillCircle(8, 8, 8);
        exhaustGraphics.fillStyle(0xffff00, 1);
        exhaustGraphics.fillCircle(8, 8, 4);
        exhaustGraphics.generateTexture('exhaust_particle', 16, 16);

        // Explosion spark particle
        const sparkGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        sparkGraphics.fillStyle(0xffffff, 1);
        sparkGraphics.fillCircle(4, 4, 4);
        sparkGraphics.generateTexture('spark_particle', 8, 8);

        // Muzzle flash particle
        const muzzleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        muzzleGraphics.fillStyle(0xffff88, 1);
        muzzleGraphics.fillCircle(10, 10, 10);
        muzzleGraphics.fillStyle(0xffffff, 1);
        muzzleGraphics.fillCircle(10, 10, 5);
        muzzleGraphics.generateTexture('muzzle_flash', 20, 20);

        // Grass tuft texture
        const grassGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        grassGraphics.fillStyle(0x4a7a4a, 1);
        grassGraphics.fillTriangle(0, 10, 3, 0, 6, 10);
        grassGraphics.fillStyle(0x5a8a5a, 1);
        grassGraphics.fillTriangle(2, 10, 5, 0, 8, 10);
        grassGraphics.fillStyle(0x3a6a3a, 1);
        grassGraphics.fillTriangle(4, 10, 8, 2, 10, 10);
        grassGraphics.generateTexture('grass_tuft', 10, 12);

        // Star layers for background
        this.createStarTextures();
    }

    createStarTextures() {
        // Small star
        const smallStar = this.make.graphics({ x: 0, y: 0, add: false });
        smallStar.fillStyle(0xffffff, 1);
        smallStar.fillCircle(2, 2, 2);
        smallStar.generateTexture('star_small', 4, 4);

        // Medium star
        const medStar = this.make.graphics({ x: 0, y: 0, add: false });
        medStar.fillStyle(0xffffff, 1);
        medStar.fillCircle(3, 3, 3);
        medStar.generateTexture('star_medium', 6, 6);

        // Large twinkling star with glow
        const largeStar = this.make.graphics({ x: 0, y: 0, add: false });
        largeStar.fillStyle(0x666666, 0.3);
        largeStar.fillCircle(8, 8, 8);
        largeStar.fillStyle(0xaaaaaa, 0.5);
        largeStar.fillCircle(8, 8, 5);
        largeStar.fillStyle(0xffffff, 1);
        largeStar.fillCircle(8, 8, 3);
        largeStar.generateTexture('star_large', 16, 16);
    }

    create() {
        this.scene.start('PlayScene');
    }
}
