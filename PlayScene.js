class PlayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PlayScene' });
    }

    create() {
        this.setupGround();
        this.setupPlayers();
        this.setupUI();
        this.setupTouchControls();
        this.setupInput();
        this.initGameState();
    }

    setupGround() {
        // Ground/planet surface - at bottom for portrait mode
        const ground = this.add.graphics();
        ground.fillStyle(0x3a5a3a, 1);
        ground.fillRect(0, 720, 600, 80);
        ground.lineStyle(3, 0x2a4a2a, 1);
        ground.strokeRect(0, 720, 600, 80);

        // Some terrain details
        ground.fillStyle(0x4a6a4a, 1);
        ground.fillCircle(100, 720, 35);
        ground.fillCircle(250, 720, 50);
        ground.fillCircle(450, 720, 45);
        ground.fillCircle(550, 720, 30);

        // Stars background
        const stars = this.add.graphics();
        stars.fillStyle(0xffffff, 0.6);
        for (let i = 0; i < 120; i++) {
            const x = Phaser.Math.Between(0, 600);
            const y = Phaser.Math.Between(0, 700);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            stars.fillCircle(x, y, size);
        }
    }

    setupPlayers() {
        // Player 1 (red) - bottom left corner
        this.player1 = this.physics.add.sprite(80, 650, 'ship_p1');
        this.player1.setCollideWorldBounds(true);
        this.player1.body.setAllowGravity(false);
        this.player1.setImmovable(true);

        // Player 2 (blue) - bottom right corner
        this.player2 = this.physics.add.sprite(520, 650, 'ship_p2');
        this.player2.setCollideWorldBounds(true);
        this.player2.body.setAllowGravity(false);
        this.player2.setImmovable(true);
    }

    setupUI() {
        // Top bar background
        const topBar = this.add.graphics();
        topBar.fillStyle(0x111122, 0.9);
        topBar.fillRect(0, 0, 600, 60);

        // Turn text (center top)
        this.turnText = this.add.text(300, 30, 'Player 1\'s Turn', {
            fontSize: '22px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Wind text (below turn)
        this.windText = this.add.text(300, 85, 'Wind: 0', {
            fontSize: '16px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Player 1 health bar (top left)
        this.add.image(70, 30, 'health_bar_bg').setOrigin(0.5);
        this.p1HealthBar = this.add.image(10, 30, 'health_bar_p1').setOrigin(0, 0.5);

        this.p1HealthText = this.add.text(10, 55, 'P1: 100 HP', {
            fontSize: '14px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#ff4444',
            fontStyle: 'bold'
        });

        // Player 2 health bar (top right)
        this.add.image(530, 30, 'health_bar_bg').setOrigin(0.5);
        this.p2HealthBar = this.add.image(370, 30, 'health_bar_p2').setOrigin(0, 0.5);

        this.p2HealthText = this.add.text(530, 55, 'P2: 100 HP', {
            fontSize: '14px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#4444ff',
            fontStyle: 'bold'
        }).setOrigin(1, 0);

        // Angle display (left side panel)
        this.angleText = this.add.text(20, 120, 'Angle: 45°', {
            fontSize: '18px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#ffffff'
        });

        // Power bar (left side panel)
        this.powerBarBg = this.add.graphics();
        this.powerBarBg.fillStyle(0x333333, 1);
        this.powerBarBg.fillRect(20, 145, 160, 18);
        this.powerBarBg.lineStyle(2, 0x555555, 1);
        this.powerBarBg.strokeRect(20, 145, 160, 18);

        this.powerBar = this.add.graphics();
        this.updatePowerBar(50);

        this.powerText = this.add.text(20, 168, 'Power: 50%', {
            fontSize: '18px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#ffffff'
        });

        // Controls help (top area)
        this.controlsText = this.add.text(300, 110, 'A/D: Angle  |  W/S: Power  |  SPACE: Shoot', {
            fontSize: '12px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#666666'
        }).setOrigin(0.5);

        // Aim line (graphics object for drawing trajectory)
        this.aimGraphics = this.add.graphics();
    }

    setupTouchControls() {
        // Create touch button textures
        this.createTouchButtonTextures();

        // Touch button definitions
        const btnY = 550; // Y position for angle/power buttons
        const btnSpacing = 70;

        // Angle Decrease Button (◀) - left side
        this.angleDownBtn = this.add.image(60, btnY, 'touch_btn_left')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.85);

        // Angle Increase Button (▶) - left side
        this.angleUpBtn = this.add.image(140, btnY, 'touch_btn_right')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.85);

        // Power Decrease Button (▼) - right side
        this.powerDownBtn = this.add.image(460, btnY, 'touch_btn_down')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.85);

        // Power Increase Button (▲) - right side
        this.powerUpBtn = this.add.image(540, btnY, 'touch_btn_up')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.85);

        // FIRE Button - center bottom
        this.fireBtn = this.add.image(300, 700, 'touch_fire_btn')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.9);

        // Button labels
        this.add.text(60, btnY, '◀', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(140, btnY, '▶', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(460, btnY, '▼', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(540, btnY, '▲', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(300, 700, 'FIRE', {
            fontSize: '24px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Touch input handling
        this.setupTouchInput();

        // Button hover effects
        const setupHover = (btn) => {
            btn.on('pointerover', () => btn.setAlpha(1));
            btn.on('pointerout', () => btn.setAlpha(0.85));
            btn.on('pointerdown', () => btn.setAlpha(0.6));
            btn.on('pointerup', () => btn.setAlpha(0.85));
        };

        setupHover(this.angleDownBtn);
        setupHover(this.angleUpBtn);
        setupHover(this.powerDownBtn);
        setupHover(this.powerUpBtn);
        setupHover(this.fireBtn);
    }

    createTouchButtonTextures() {
        // Left arrow button (◀)
        const leftGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        leftGraphics.fillStyle(0x3366aa, 1);
        leftGraphics.fillRoundedRect(0, 0, 60, 60, 12);
        leftGraphics.lineStyle(3, 0x5588cc, 1);
        leftGraphics.strokeRoundedRect(0, 0, 60, 60, 12);
        // Arrow shape pointing left
        leftGraphics.fillStyle(0xffffff, 1);
        leftGraphics.beginPath();
        leftGraphics.moveTo(35, 20);
        leftGraphics.lineTo(20, 30);
        leftGraphics.lineTo(35, 40);
        leftGraphics.closePath();
        leftGraphics.fillPath();
        leftGraphics.generateTexture('touch_btn_left', 60, 60);

        // Right arrow button (▶)
        const rightGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        rightGraphics.fillStyle(0x3366aa, 1);
        rightGraphics.fillRoundedRect(0, 0, 60, 60, 12);
        rightGraphics.lineStyle(3, 0x5588cc, 1);
        rightGraphics.strokeRoundedRect(0, 0, 60, 60, 12);
        // Arrow shape pointing right
        rightGraphics.fillStyle(0xffffff, 1);
        rightGraphics.beginPath();
        rightGraphics.moveTo(25, 20);
        rightGraphics.lineTo(40, 30);
        rightGraphics.lineTo(25, 40);
        rightGraphics.closePath();
        rightGraphics.fillPath();
        rightGraphics.generateTexture('touch_btn_right', 60, 60);

        // Down arrow button (▼)
        const downGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        downGraphics.fillStyle(0xaa6633, 1);
        downGraphics.fillRoundedRect(0, 0, 60, 60, 12);
        downGraphics.lineStyle(3, 0xcc8844, 1);
        downGraphics.strokeRoundedRect(0, 0, 60, 60, 12);
        // Arrow shape pointing down
        downGraphics.fillStyle(0xffffff, 1);
        downGraphics.beginPath();
        downGraphics.moveTo(20, 25);
        downGraphics.lineTo(30, 40);
        downGraphics.lineTo(40, 25);
        downGraphics.closePath();
        downGraphics.fillPath();
        downGraphics.generateTexture('touch_btn_down', 60, 60);

        // Up arrow button (▲)
        const upGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        upGraphics.fillStyle(0xaa6633, 1);
        upGraphics.fillRoundedRect(0, 0, 60, 60, 12);
        upGraphics.lineStyle(3, 0xcc8844, 1);
        upGraphics.strokeRoundedRect(0, 0, 60, 60, 12);
        // Arrow shape pointing up
        upGraphics.fillStyle(0xffffff, 1);
        upGraphics.beginPath();
        upGraphics.moveTo(20, 40);
        upGraphics.lineTo(30, 25);
        upGraphics.lineTo(40, 40);
        upGraphics.closePath();
        upGraphics.fillPath();
        upGraphics.generateTexture('touch_btn_up', 60, 60);

        // Fire button
        const fireGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        fireGraphics.fillStyle(0xcc3333, 1);
        fireGraphics.fillRoundedRect(0, 0, 120, 50, 25);
        fireGraphics.lineStyle(4, 0xff5555, 1);
        fireGraphics.strokeRoundedRect(0, 0, 120, 50, 25);
        fireGraphics.generateTexture('touch_fire_btn', 120, 50);
    }

    setupTouchInput() {
        // Track touch state for continuous adjustment
        this.touchState = {
            angleDown: false,
            angleUp: false,
            powerDown: false,
            powerUp: false
        };

        // Angle down button
        this.angleDownBtn.on('pointerdown', () => {
            this.touchState.angleDown = true;
        });
        this.angleDownBtn.on('pointerup', () => {
            this.touchState.angleDown = false;
        });
        this.angleDownBtn.on('pointerout', () => {
            this.touchState.angleDown = false;
        });

        // Angle up button
        this.angleUpBtn.on('pointerdown', () => {
            this.touchState.angleUp = true;
        });
        this.angleUpBtn.on('pointerup', () => {
            this.touchState.angleUp = false;
        });
        this.angleUpBtn.on('pointerout', () => {
            this.touchState.angleUp = false;
        });

        // Power down button
        this.powerDownBtn.on('pointerdown', () => {
            this.touchState.powerDown = true;
        });
        this.powerDownBtn.on('pointerup', () => {
            this.touchState.powerDown = false;
        });
        this.powerDownBtn.on('pointerout', () => {
            this.touchState.powerDown = false;
        });

        // Power up button
        this.powerUpBtn.on('pointerdown', () => {
            this.touchState.powerUp = true;
        });
        this.powerUpBtn.on('pointerup', () => {
            this.touchState.powerUp = false;
        });
        this.powerUpBtn.on('pointerout', () => {
            this.touchState.powerUp = false;
        });

        // Fire button
        this.fireBtn.on('pointerdown', () => {
            if (!this.isShooting && !this.gameOver) {
                this.shoot();
            }
        });

        // Visual feedback for fire button press
        this.fireBtn.on('pointerdown', () => {
            this.fireBtn.setScale(0.95);
        });
        this.fireBtn.on('pointerup', () => {
            this.fireBtn.setScale(1);
        });
        this.fireBtn.on('pointerout', () => {
            this.fireBtn.setScale(1);
        });
    }

    setupInput() {
        this.keys = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            leftArrow: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            rightArrow: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            upArrow: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            downArrow: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            r: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
        };

        // Track which keys are held for continuous adjustment
        this.keysPressed = {};
    }

    initGameState() {
        this.currentPlayer = 1;
        this.angle = 45;
        this.power = 50;
        this.wind = 0;
        this.projectile = null;
        this.isShooting = false;
        this.gameOver = false;
        this.player1Health = 100;
        this.player2Health = 100;

        this.generateWind();
        this.updateUI();
        this.drawTrajectory();
    }

    generateWind() {
        this.wind = Phaser.Math.Between(-50, 50);
        if (this.wind > -10 && this.wind < 10) {
            this.wind = this.wind >= 0 ? 15 : -15;
        }
    }

    updateUI() {
        const windStr = this.wind >= 0 ? `Wind: +${this.wind}` : `Wind: ${this.wind}`;
        this.windText.setText(windStr);
        this.windText.setColor(this.wind >= 0 ? '#88ccff' : '#ffaa88');

        this.turnText.setText(`Player ${this.currentPlayer}'s Turn`);
        this.turnText.setColor(this.currentPlayer === 1 ? '#ff4444' : '#4444ff');

        this.angleText.setText(`Angle: ${Math.round(this.angle)}°`);
        this.powerText.setText(`Power: ${Math.round(this.power)}%`);

        this.p1HealthText.setText(`P1: ${Math.round(this.player1Health)} HP`);
        this.p2HealthText.setText(`P2: ${Math.round(this.player2Health)} HP`);

        this.p1HealthBar.setScale(this.player1Health / 100, 1);
        this.p2HealthBar.setScale(this.player2Health / 100, 1);
    }

    updatePowerBar(power) {
        this.powerBar.clear();

        // Color based on power level
        if (power > 70) {
            this.powerBar.fillStyle(0xff4444, 1);
        } else if (power > 40) {
            this.powerBar.fillStyle(0xffff00, 1);
        } else {
            this.powerBar.fillStyle(0x00ff00, 1);
        }
        this.powerBar.fillRect(22, 147, (power / 100) * 156, 14);
    }

    drawTrajectory() {
        this.aimGraphics.clear();

        if (this.isShooting || this.gameOver) {
            return;
        }

        const player = this.currentPlayer === 1 ? this.player1 : this.player2;
        const direction = this.currentPlayer === 1 ? 1 : -1;
        const angleRad = Phaser.Math.DegToRad(this.angle * direction);

        const startX = player.x + (direction * 30);
        const startY = player.y - 15;

        const velocity = this.power * 8;
        const vx = Math.cos(angleRad) * velocity;
        const vy = -Math.sin(angleRad) * velocity;

        let x = startX;
        let y = startY;
        let pvx = vx;
        let pvy = vy;

        this.aimGraphics.lineStyle(2, 0xffffff, 0.5);

        for (let i = 0; i < 50; i++) {
            const dt = 0.05;
            pvx += this.wind * 0.5;
            pvy += 300 * dt;

            x += pvx;
            y += pvy * dt;

            if (y > 720 || x < 0 || x > 600) {
                break;
            }

            if (i % 3 === 0) {
                this.aimGraphics.fillStyle(0xffffff, 0.4);
                this.aimGraphics.fillCircle(x, y, 3);
            }
        }
    }

    shoot() {
        if (this.isShooting || this.gameOver) {
            return;
        }

        this.isShooting = true;
        this.aimGraphics.clear();

        const player = this.currentPlayer === 1 ? this.player1 : this.player2;
        const direction = this.currentPlayer === 1 ? 1 : -1;
        const angleRad = Phaser.Math.DegToRad(this.angle * direction);

        this.projectile = this.physics.add.sprite(
            player.x + (direction * 30),
            player.y - 15,
            'projectile'
        );

        const velocity = this.power * 8;
        this.projectile.setVelocity(
            Math.cos(angleRad) * velocity,
            -Math.sin(angleRad) * velocity
        );

        this.projectile.body.setAllowGravity(true);
        this.projectile.wind = this.wind;

        // Collision with players
        this.physics.add.overlap(this.projectile, this.player1, this.hitPlayer, null, this);
        this.physics.add.overlap(this.projectile, this.player2, this.hitPlayer, null, this);
    }

    hitPlayer(projectile, player) {
        const target = player === this.player1 ? 1 : 2;
        const damage = this.power * 0.5;

        if (target === 1) {
            this.player1Health = Math.max(0, this.player1Health - damage);
        } else {
            this.player2Health = Math.max(0, this.player2Health - damage);
        }

        this.createExplosion(projectile.x, projectile.y);
        this.destroyProjectile();

        this.updateUI();
        this.checkWinCondition();
    }

    createExplosion(x, y) {
        const explosion = this.add.sprite(x, y, 'explosion');
        explosion.setScale(0.5);

        this.tweens.add({
            targets: explosion,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                explosion.destroy();
            }
        });
    }

    destroyProjectile() {
        if (this.projectile) {
            this.projectile.destroy();
            this.projectile = null;
        }
    }

    checkWinCondition() {
        if (this.player1Health <= 0) {
            this.showWinScreen(2);
        } else if (this.player2Health <= 0) {
            this.showWinScreen(1);
        } else {
            this.endTurn();
        }
    }

    endTurn() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.generateWind();
        this.isShooting = false;
        this.updateUI();
        this.drawTrajectory();
    }

    showWinScreen(winner) {
        this.gameOver = true;

        this.aimGraphics.clear();

        // Dark overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, 600, 800);

        // Win text
        const winText = this.add.text(300, 350, `Player ${winner} Wins!`, {
            fontSize: '52px',
            fontFamily: 'Segoe UI, sans-serif',
            color: winner === 1 ? '#ff4444' : '#4444ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: winText,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.add.text(300, 420, 'Congratulations!', {
            fontSize: '22px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);

        const restartText = this.add.text(300, 480, 'Press R to Restart', {
            fontSize: '24px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#ffff00'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: restartText,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    restart() {
        this.scene.restart();
        this.initGameState();
    }

    update() {
        if (this.gameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
                this.restart();
            }
            return;
        }

        if (this.isShooting) {
            // Check if projectile is out of bounds or hit ground
            if (this.projectile) {
                // Apply wind force to projectile
                if (this.projectile.visible && this.projectile.body.velocity.x !== 0) {
                    this.projectile.body.velocity.x += this.wind * 0.5;
                }

                if (this.projectile.y > 720) {
                    this.createExplosion(this.projectile.x, 720);
                    this.destroyProjectile();
                    this.endTurn();
                } else if (this.projectile.x < -50 || this.projectile.x > 650) {
                    this.destroyProjectile();
                    this.endTurn();
                }
            }
            return;
        }

        // Angle adjustment (keyboard)
        if (this.keys.left.isDown) {
            if (!this.keysPressed['left']) {
                this.keysPressed['left'] = true;
                this.angle = Math.min(80, this.angle + 5);
                this.updatePowerBar(this.power);
                this.updateUI();
                this.drawTrajectory();
            }
        } else if (this.keys.right.isDown) {
            if (!this.keysPressed['right']) {
                this.keysPressed['right'] = true;
                this.angle = Math.max(10, this.angle - 5);
                this.updatePowerBar(this.power);
                this.updateUI();
                this.drawTrajectory();
            }
        }

        // Power adjustment (keyboard)
        if (this.keys.up.isDown || this.keys.upArrow.isDown) {
            if (!this.keysPressed['up']) {
                this.keysPressed['up'] = true;
                this.power = Math.min(100, this.power + 3);
                this.updatePowerBar(this.power);
                this.updateUI();
                this.drawTrajectory();
            }
        } else if (this.keys.down.isDown || this.keys.downArrow.isDown) {
            if (!this.keysPressed['down']) {
                this.keysPressed['down'] = true;
                this.power = Math.max(10, this.power - 3);
                this.updatePowerBar(this.power);
                this.updateUI();
                this.drawTrajectory();
            }
        }

        // Touch controls - angle
        if (this.touchState.angleDown) {
            this.angle = Math.min(80, this.angle + 5);
            this.updatePowerBar(this.power);
            this.updateUI();
            this.drawTrajectory();
        }
        if (this.touchState.angleUp) {
            this.angle = Math.max(10, this.angle - 5);
            this.updatePowerBar(this.power);
            this.updateUI();
            this.drawTrajectory();
        }

        // Touch controls - power
        if (this.touchState.powerUp) {
            this.power = Math.min(100, this.power + 3);
            this.updatePowerBar(this.power);
            this.updateUI();
            this.drawTrajectory();
        }
        if (this.touchState.powerDown) {
            this.power = Math.max(10, this.power - 3);
            this.updatePowerBar(this.power);
            this.updateUI();
            this.drawTrajectory();
        }

        // Reset key pressed states when keys are released
        if (this.keys.left.isUp) {
            this.keysPressed['left'] = false;
        }
        if (this.keys.right.isUp) {
            this.keysPressed['right'] = false;
        }
        if (this.keys.up.isUp && this.keys.upArrow.isUp) {
            this.keysPressed['up'] = false;
        }
        if (this.keys.down.isUp && this.keys.downArrow.isUp) {
            this.keysPressed['down'] = false;
        }

        // Shooting (keyboard)
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.shoot();
        }
    }
}
