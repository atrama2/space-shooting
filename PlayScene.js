class PlayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PlayScene' });
        this.MOVE_SPEED = 150; // pixels per second
        this.BASE_TERRAIN_Y = 720; // Base ground level
        this.MIN_TERRAIN_Y = 600; // Highest point (hill)
        this.MAX_TERRAIN_Y = 760; // Lowest point (valley)
    }

    create() {
        this.initTerrainHeightMap();
        this.setupBackground(); // Create background ONCE (nebula, planet, stars)
        this.setupGround();
        this.setupPlayers();
        this.setupDustParticles();
        this.setupUI();
        this.setupTouchControls();
        this.setupInput();
        this.setupSound();
        this.createBirdTexture();
        this.spawnBirds();
        this.initGameState();
    }

    setupSound() {
        // Create audio context for procedural sounds
        this.audioContext = this.sound.context;

        // Wind sound state
        this.windSound = null;
        this.windNoiseNode = null;
        this.windGainNode = null;
    }

    playSound(type) {
        const ctx = this.audioContext;
        if (!ctx) return;

        const now = ctx.currentTime;

        switch (type) {
            case 'shoot': {
                // Short 'pew' tone - high frequency sweep down
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'square';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

                osc.start(now);
                osc.stop(now + 0.1);
                break;
            }

            case 'explosion': {
                // Noise burst with low frequency rumble
                const bufferSize = ctx.sampleRate * 0.3;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);

                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
                }

                const noise = ctx.createBufferSource();
                noise.buffer = buffer;

                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.4, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1000, now);
                filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(ctx.destination);

                noise.start(now);

                // Low rumble oscillator
                const osc = ctx.createOscillator();
                const oscGain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
                oscGain.gain.setValueAtTime(0.3, now);
                oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

                osc.connect(oscGain);
                oscGain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            }

            case 'hit': {
                // Impact thud - low punch with quick decay
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.15);
                break;
            }

            case 'move': {
                // Subtle footstep - short low thud
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(80 + Math.random() * 20, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.05);
                break;
            }

            case 'click': {
                // UI click - short high-pitched tick
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(600, now + 0.02);

                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.03);
                break;
            }
        }
    }

    startWindSound() {
        if (this.windSound || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create white noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.windNoiseNode = ctx.createBufferSource();
        this.windNoiseNode.buffer = buffer;
        this.windNoiseNode.loop = true;

        // Bandpass filter for wind-like sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.Q.setValueAtTime(0.5, now);

        // LFO for filter sweep
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.2, now);
        lfoGain.gain.setValueAtTime(200, now);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        this.windGainNode = ctx.createGain();
        this.windGainNode.gain.setValueAtTime(0, now);
        this.windGainNode.gain.linearRampToValueAtTime(0.08, now + 0.5);

        this.windNoiseNode.connect(filter);
        filter.connect(this.windGainNode);
        this.windGainNode.connect(ctx.destination);

        this.windNoiseNode.start(now);
        lfo.start(now);
        this.windLfo = lfo;
    }

    stopWindSound() {
        if (!this.windSound && !this.windNoiseNode) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        if (this.windGainNode) {
            this.windGainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        }

        if (this.windNoiseNode) {
            this.windNoiseNode.stop(now + 0.35);
            this.windNoiseNode = null;
        }

        if (this.windLfo) {
            this.windLfo.stop(now + 0.35);
            this.windLfo = null;
        }

        this.windSound = false;
    }

    setupBackground() {
        // Nebula gradient background (drawn once)
        const nebula = this.add.graphics();
        nebula.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x0d1b3e, 0x0d1b3e, 1);
        nebula.fillRect(0, 0, 600, 720);
        this.backgroundNebula = nebula;

        // Distant planet with ring
        const planet = this.add.graphics();
        planet.fillStyle(0x4a3060, 1);
        planet.fillCircle(520, 120, 60);
        planet.fillStyle(0x5a4070, 1);
        planet.fillCircle(510, 115, 55);
        planet.fillStyle(0x6a5080, 1);
        planet.fillCircle(500, 110, 45);
        planet.lineStyle(3, 0x8a70a0, 0.6);
        planet.strokeEllipse(520, 120, 140, 30);
        this.backgroundPlanet = planet;

        // Create star field (once)
        this.createStarField();

        // Draw initial grass tufts (stored for redraw)
        this.grassTufts = [];
        for (let x = 20; x < 600; x += Phaser.Math.Between(25, 40)) {
            const terrainY = this.getTerrainY(x);
            if (terrainY < 760) {
                const tuft = this.add.image(x, terrainY - 8, 'grass_tuft').setScale(Phaser.Math.FloatBetween(0.8, 1.2));
                this.grassTufts.push(tuft);
            }
        }
    }

    initTerrainHeightMap() {
        // Initialize terrain heightmap (600 pixels wide, 1 value per pixel)
        // Lower values = higher terrain (hill), Higher values = lower terrain (valley)
        this.terrainHeightMap = new Float32Array(600);
        this.craterMap = new Float32Array(600); // Tracks crater depth at each x

        // Generate procedural terrain with hills and valleys
        let height = this.BASE_TERRAIN_Y;
        for (let x = 0; x < 600; x++) {
            // Layer multiple sine waves for natural-looking terrain
            const wave1 = Math.sin(x * 0.02) * 30;
            const wave2 = Math.sin(x * 0.05 + 1) * 15;
            const wave3 = Math.sin(x * 0.1 + 2) * 8;

            // Add some random bumps
            const bump = Phaser.Math.Between(-5, 5);

            height = this.BASE_TERRAIN_Y - (wave1 + wave2 + wave3 + bump);
            height = Phaser.Math.Clamp(height, this.MIN_TERRAIN_Y, this.MAX_TERRAIN_Y);

            this.terrainHeightMap[x] = height;
            this.craterMap[x] = 0;
        }

        // Flatten areas under players for better starting positions
        const p1x = 80;
        const p2x = 520;
        for (let x = p1x - 30; x < p1x + 30; x++) {
            if (x >= 0 && x < 600) {
                this.terrainHeightMap[x] = 720;
            }
        }
        for (let x = p2x - 30; x < p2x + 30; x++) {
            if (x >= 0 && x < 600) {
                this.terrainHeightMap[x] = 720;
            }
        }
    }

    getTerrainY(x) {
        // Get the terrain height at given x position
        const clampedX = Phaser.Math.Clamp(Math.floor(x), 0, 599);
        return this.terrainHeightMap[clampedX];
    }

    createCrater(x, y, radius) {
        // Create a crater at impact point
        const craterRadius = Math.floor(radius);
        const centerX = Math.floor(x);

        for (let cx = centerX - craterRadius; cx <= centerX + craterRadius; cx++) {
            if (cx < 0 || cx >= 600) continue;

            const distFromCenter = Math.abs(cx - centerX);
            if (distFromCenter <= craterRadius) {
                // Calculate crater depth using a parabolic curve
                const normalizedDist = distFromCenter / craterRadius;
                const craterDepth = craterRadius * 0.6 * Math.sqrt(1 - normalizedDist * normalizedDist);

                // Only deepen, don't raise terrain
                const newHeight = y + craterDepth;
                if (newHeight > this.terrainHeightMap[cx]) {
                    this.terrainHeightMap[cx] = Math.min(newHeight, this.MAX_TERRAIN_Y);
                    this.craterMap[cx] = Math.max(this.craterMap[cx], craterDepth);
                }
            }
        }

        // Redraw terrain to show crater
        this.redrawTerrain();
    }

    adjustPlayersToTerrain() {
        // Adjust player 1 position to terrain
        const p1TerrainY = this.getTerrainY(this.player1.x);
        this.player1.y = p1TerrainY - 35;

        // Adjust player 2 position to terrain
        const p2TerrainY = this.getTerrainY(this.player2.x);
        this.player2.y = p2TerrainY - 35;
    }

    handlePlayerMovement() {
        const delta = this.game.loop.delta;
        let p1Moving = false;
        let p2Moving = false;

        // Player 1 movement: W = forward (right), S = backward (left)
        if (this.keys.p1Forward.isDown) {
            this.movePlayer(this.player1, this.dustEmitter1, this.dustEmitter1Active, 1, delta);
            p1Moving = true;
        } else if (this.keys.p1Backward.isDown) {
            this.movePlayer(this.player1, this.dustEmitter1, this.dustEmitter1Active, -1, delta);
            p1Moving = true;
        }

        // Player 2 movement: Arrow Up = forward (left), Arrow Down = backward (right)
        if (this.keys.p2Forward.isDown) {
            this.movePlayer(this.player2, this.dustEmitter2, this.dustEmitter2Active, -1, delta);
            p2Moving = true;
        } else if (this.keys.p2Backward.isDown) {
            this.movePlayer(this.player2, this.dustEmitter2, this.dustEmitter2Active, 1, delta);
            p2Moving = true;
        }

        // Stop dust particles when player stops moving
        if (!p1Moving && this.dustEmitter1 && this.dustEmitter1Active) {
            this.dustEmitter1.stop();
            this.dustEmitter1Active = false;
        }
        if (!p2Moving && this.dustEmitter2 && this.dustEmitter2Active) {
            this.dustEmitter2.stop();
            this.dustEmitter2Active = false;
        }

        // Update trajectory after movement
        if (p1Moving || p2Moving) {
            this.drawTrajectory();
        }
    }

    redrawTerrain() {
        // Only redraw terrain graphics (background is already set up in create)
        this.terrainGraphics.clear();

        // Draw terrain fill with gradient based on heightmap
        this.terrainGraphics.fillStyle(0x2a4a2a, 1);
        this.terrainGraphics.beginPath();
        this.terrainGraphics.moveTo(0, 800);

        for (let x = 0; x < 600; x++) {
            this.terrainGraphics.lineTo(x, this.terrainHeightMap[x]);
        }

        this.terrainGraphics.lineTo(600, 800);
        this.terrainGraphics.closePath();
        this.terrainGraphics.fillPath();

        // Add terrain gradient overlay
        for (let x = 0; x < 600; x++) {
            const terrainY = this.terrainHeightMap[x];
            const depth = terrainY - this.MIN_TERRAIN_Y;
            const ratio = depth / (this.MAX_TERRAIN_Y - this.MIN_TERRAIN_Y);
            const g = Math.floor(42 + ratio * 20);
            this.terrainGraphics.fillStyle(Phaser.Display.Color.GetColor(g + 20, g + 40, g + 20), 1);
            this.terrainGraphics.fillRect(x, terrainY, 1, 800 - terrainY);
        }

        // Surface highlight line
        this.terrainGraphics.lineStyle(3, 0x4a6a4a, 1);
        for (let x = 0; x < 600; x++) {
            if (x < 599) {
                this.terrainGraphics.lineBetween(x, this.terrainHeightMap[x], x + 1, this.terrainHeightMap[x + 1]);
            }
        }

        // Draw terrain bumps/details
        this.terrainGraphics.fillStyle(0x3a5a3a, 1);
        this.terrainGraphics.fillCircle(100, 720, 35);
        this.terrainGraphics.fillCircle(250, 720, 50);
        this.terrainGraphics.fillCircle(450, 720, 45);
        this.terrainGraphics.fillCircle(550, 720, 30);

        // Note: Grass tufts and terrain details are drawn once in setupGround, not every redraw
    }

    setupGround() {
        // Create terrain graphics object for dynamic updates
        this.terrainGraphics = this.add.graphics();
        this.redrawTerrain();
    }

    createStarField() {
        // Layer 1: Distant tiny stars (slowest, smallest)
        const stars1 = this.add.graphics();
        stars1.fillStyle(0x888888, 0.4);
        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(0, 600);
            const y = Phaser.Math.Between(0, 700);
            stars1.fillCircle(x, y, 0.5);
        }
        this.starField1 = stars1;

        // Layer 2: Medium stars
        const stars2 = this.add.graphics();
        stars2.fillStyle(0xaaaaaa, 0.6);
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, 600);
            const y = Phaser.Math.Between(0, 700);
            stars2.fillCircle(x, y, 1);
        }
        this.starField2 = stars2;
        this.twinkleStars = [];

        // Layer 3: Bright twinkling stars
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(50, 550);
            const y = Phaser.Math.Between(50, 600);
            const star = this.add.image(x, y, 'star_large').setAlpha(0.8);
            this.twinkleStars.push(star);
        }

        // Layer 4: Foreground accent stars
        const stars4 = this.add.graphics();
        stars4.fillStyle(0xffffff, 0.8);
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, 600);
            const y = Phaser.Math.Between(0, 700);
            stars4.fillCircle(x, y, 1.5);
        }
    }

    createBirdTexture() {
        // Create a simple V-shape bird silhouette using Phaser graphics
        if (this.textures.exists('bird')) return;

        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Bird body (small oval)
        graphics.fillStyle(0x222233, 1);
        graphics.fillEllipse(10, 10, 6, 4);

        // Left wing (V-shape)
        graphics.fillStyle(0x222233, 1);
        graphics.beginPath();
        graphics.moveTo(7, 9);
        graphics.lineTo(0, 4);
        graphics.lineTo(5, 8);
        graphics.closePath();
        graphics.fillPath();

        // Right wing (V-shape)
        graphics.beginPath();
        graphics.moveTo(13, 9);
        graphics.lineTo(20, 4);
        graphics.lineTo(15, 8);
        graphics.closePath();
        graphics.fillPath();

        graphics.generateTexture('bird', 20, 14);
    }

    spawnBirds() {
        // Create a group of 6 birds with varying properties for depth
        const birdCount = 6;
        this.birds = [];

        for (let i = 0; i < birdCount; i++) {
            // Depth layer: 0 = farthest, 1 = closest
            const depth = i / (birdCount - 1);

            // Smaller and more transparent birds are farther away
            const scale = 0.5 + depth * 0.6; // 0.5 to 1.1
            const alpha = 0.4 + depth * 0.5; // 0.4 to 0.9

            // Speed varies - farther birds appear slower
            const speed = 20 + depth * 40; // 20 to 60 pixels per second

            // Y position between 50-200 with some variation
            const baseY = 50 + Math.random() * 150;

            // Sine wave amplitude and frequency for floating motion
            const sineAmplitude = 5 + Math.random() * 10;
            const sineFrequency = 0.5 + Math.random() * 1.5;
            const sineOffset = Math.random() * Math.PI * 2;

            const bird = this.add.image(-50 - Math.random() * 200, baseY, 'bird');
            bird.setScale(scale);
            bird.setAlpha(alpha);
            bird.setTint(0x333344); // Slight blue tint for distant birds

            // Store bird properties for animation
            bird.birdData = {
                speed: speed,
                baseY: baseY,
                sineAmplitude: sineAmplitude,
                sineFrequency: sineFrequency,
                sineOffset: sineOffset,
                depth: depth,
                time: 0
            };

            this.birds.push(bird);
        }
    }

    updateBirds(delta) {
        if (!this.birds) return;

        const deltaSeconds = delta / 1000;

        this.birds.forEach(bird => {
            const data = bird.birdData;
            if (!data) return;

            // Move bird from left to right
            bird.x += data.speed * deltaSeconds;

            // Sine wave vertical motion
            data.time += deltaSeconds;
            const sineY = Math.sin(data.time * data.sineFrequency * Math.PI * 2 + data.sineOffset) * data.sineAmplitude;
            bird.y = data.baseY + sineY;

            // Wing flap animation - subtle rotation
            bird.rotation = Math.sin(data.time * 8) * 0.1;

            // Loop when bird exits screen
            if (bird.x > 650) {
                bird.x = -50 - Math.random() * 100;
                bird.y = 50 + Math.random() * 150;
                data.baseY = bird.y;
                data.sineOffset = Math.random() * Math.PI * 2;
            }
        });
    }

    setupPlayers() {
        // Get terrain Y for player starting positions
        const p1TerrainY = this.getTerrainY(80);
        const p2TerrainY = this.getTerrainY(520);

        // Player 1 (red) - positioned on terrain
        this.player1 = this.physics.add.sprite(80, p1TerrainY - 35, 'ship_p1');
        this.player1.setCollideWorldBounds(true);
        this.player1.body.setAllowGravity(false);
        this.player1.setImmovable(true);
        this.player1.lastX = 80; // Track for movement

        // Player 1 glow effect
        this.player1Glow = this.add.graphics();
        this.player1Glow.fillStyle(0xff4444, 0.15);
        this.player1Glow.fillCircle(80, p1TerrainY - 35, 45);
        this.player1Glow.setBlendMode(Phaser.BlendModes.ADD);

        // Player 2 (blue) - positioned on terrain
        this.player2 = this.physics.add.sprite(520, p2TerrainY - 35, 'ship_p2');
        this.player2.setCollideWorldBounds(true);
        this.player2.body.setAllowGravity(false);
        this.player2.setImmovable(true);
        this.player2.lastX = 520; // Track for movement

        // Player 2 glow effect
        this.player2Glow = this.add.graphics();
        this.player2Glow.fillStyle(0x4444ff, 0.15);
        this.player2Glow.fillCircle(520, p2TerrainY - 35, 45);
        this.player2Glow.setBlendMode(Phaser.BlendModes.ADD);

        // Engine exhaust emitters for idle ships
        this.setupEngineExhaust();
    }

    setupEngineExhaust() {
        // Create particle emitter for engine exhaust
        this.exhaustEmitter1 = this.add.particles(0, 0, 'exhaust_particle', {
            speed: { min: 20, max: 40 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 400,
            frequency: 100,
            tint: [0xff6600, 0xffaa00, 0xffcc00],
            emitFrom: { x: -20, y: 15 },
            emitting: false
        });
        this.exhaustEmitter1.startFollow(this.player1);

        this.exhaustEmitter2 = this.add.particles(0, 0, 'exhaust_particle', {
            speed: { min: 20, max: 40 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 400,
            frequency: 100,
            tint: [0x0066ff, 0x00aaff, 0x00ccff],
            emitFrom: { x: -20, y: 15 },
            emitting: false
        });
        this.exhaustEmitter2.startFollow(this.player2);

        // Start idle exhaust
        this.exhaustEmitter1.start();
        this.exhaustEmitter2.start();
    }

    setupDustParticles() {
        // Create dust particle texture
        if (!this.textures.exists('dust_particle')) {
            const dustGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            dustGraphics.fillStyle(0x8B7355, 1);
            dustGraphics.fillCircle(6, 6, 6);
            dustGraphics.fillStyle(0xA0906E, 1);
            dustGraphics.fillCircle(6, 6, 3);
            dustGraphics.generateTexture('dust_particle', 12, 12);
        }

        // Player 1 dust emitter (tracks behind when moving left/right)
        this.dustEmitter1 = this.add.particles(0, 0, 'dust_particle', {
            speed: { min: 20, max: 50 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 500,
            frequency: 50,
            tint: [0x8B7355, 0xA0906E, 0x9B8B7A],
            emitFrom: { x: 0, y: 10 },
            emitting: false
        });

        // Player 2 dust emitter
        this.dustEmitter2 = this.add.particles(0, 0, 'dust_particle', {
            speed: { min: 20, max: 50 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 500,
            frequency: 50,
            tint: [0x8B7355, 0xA0906E, 0x9B8B7A],
            emitFrom: { x: 0, y: 10 },
            emitting: false
        });

        // Track dust emitter state
        this.dustEmitter1Active = false;
        this.dustEmitter2Active = false;
    }

    movePlayer(player, dustEmitter, dustEmitterActive, direction, delta) {
        // direction: 1 = forward (right for P1, left for P2), -1 = backward
        const speed = this.MOVE_SPEED * direction * (delta / 1000);
        const newX = player.x + speed;

        // Boundary checks
        const minX = 50;
        const maxX = player === this.player1 ? 300 : 550;
        const clampedX = Phaser.Math.Clamp(newX, minX, maxX);

        // Update player X position
        player.x = clampedX;
        player.lastX = clampedX;

        // Adjust Y to terrain surface
        const terrainY = this.getTerrainY(clampedX);
        player.y = terrainY - 35;

        // Start dust particles
        if (!dustEmitterActive) {
            dustEmitter.start();
            this.playSound('move');
            if (player === this.player1) {
                this.dustEmitter1Active = true;
            } else {
                this.dustEmitter2Active = true;
            }
        }

        // Position dust emitter behind player
        dustEmitter.setPosition(clampedX - direction * 20, terrainY - 10);
    }

    updatePlayerGlow(playerNum, x, y) {
        if (playerNum === 1 && this.player1Glow) {
            this.player1Glow.clear();
            this.player1Glow.fillStyle(0xff4444, 0.15);
            this.player1Glow.fillCircle(x, y, 45);
        } else if (playerNum === 2 && this.player2Glow) {
            this.player2Glow.clear();
            this.player2Glow.fillStyle(0x4444ff, 0.15);
            this.player2Glow.fillCircle(x, y, 45);
        }
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
        this.p1HealthBar = this.add.image(-30, 30, 'health_bar_p1').setOrigin(0, 0.5);

        this.p1HealthText = this.add.text(10, 55, 'P1: 100 HP', {
            fontSize: '14px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#ff4444',
            fontStyle: 'bold'
        });

        // Player 2 health bar (top right)
        this.add.image(530, 30, 'health_bar_bg').setOrigin(0.5);
        this.p2HealthBar = this.add.image(430, 30, 'health_bar_p2').setOrigin(0, 0.5);

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
        this.controlsText = this.add.text(300, 110, 'A/D: Angle  |  Q/E or SHIFT: Power  |  W/S or Arrows: Move  |  SPACE: Shoot  |  H: Wind Toggle', {
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

        // Movement button Y position (below angle/power buttons)
        const moveBtnY = 620;
        const moveBtnSize = 50;

        // P1 Left Button (<) - backward for P1
        this.p1LeftBtn = this.add.image(60, moveBtnY, 'touch_btn_p1_left')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.85);

        // P1 Right Button (>) - forward for P1
        this.p1RightBtn = this.add.image(140, moveBtnY, 'touch_btn_p1_right')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.85);

        // P2 Left Button (<) - backward for P2
        this.p2LeftBtn = this.add.image(460, moveBtnY, 'touch_btn_p2_left')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.85);

        // P2 Right Button (>) - forward for P2
        this.p2RightBtn = this.add.image(540, moveBtnY, 'touch_btn_p2_right')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.85);

        // FIRE Button - center bottom
        this.fireBtn = this.add.image(300, 700, 'touch_fire_btn')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.9);

        // WIND Toggle Button - above fire button, center
        this.windBtn = this.add.image(300, 640, 'touch_wind_btn')
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.85);

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

        // P1 movement labels
        this.add.text(60, moveBtnY, '<', {
            fontSize: '24px',
            color: '#ff6666',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(140, moveBtnY, '>', {
            fontSize: '24px',
            color: '#ff6666',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // P2 movement labels
        this.add.text(460, moveBtnY, '<', {
            fontSize: '24px',
            color: '#6666ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(540, moveBtnY, '>', {
            fontSize: '24px',
            color: '#6666ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(300, 700, 'FIRE', {
            fontSize: '24px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // WIND label
        this.windBtnLabel = this.add.text(300, 640, 'WIND', {
            fontSize: '18px',
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
        setupHover(this.p1LeftBtn);
        setupHover(this.p1RightBtn);
        setupHover(this.p2LeftBtn);
        setupHover(this.p2RightBtn);
        setupHover(this.fireBtn);
        setupHover(this.windBtn);
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

        // Wind toggle button
        const windGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        windGraphics.fillStyle(0x33aa55, 1);
        windGraphics.fillRoundedRect(0, 0, 80, 50, 12);
        windGraphics.lineStyle(3, 0x55cc77, 1);
        windGraphics.strokeRoundedRect(0, 0, 80, 50, 12);
        // Wind symbol (curved arrow)
        windGraphics.lineStyle(3, 0xffffff, 1);
        windGraphics.beginPath();
        windGraphics.moveTo(20, 30);
        windGraphics.lineTo(45, 30);
        windGraphics.arc(45, 22, 8, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(90), false);
        windGraphics.moveTo(45, 30);
        windGraphics.lineTo(60, 20);
        windGraphics.stroke();
        windGraphics.generateTexture('touch_wind_btn', 80, 50);

        // Wind button OFF state
        const windOffGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        windOffGraphics.fillStyle(0x555555, 1);
        windOffGraphics.fillRoundedRect(0, 0, 80, 50, 12);
        windOffGraphics.lineStyle(3, 0x777777, 1);
        windOffGraphics.strokeRoundedRect(0, 0, 80, 50, 12);
        // Wind symbol crossed out (X)
        windOffGraphics.lineStyle(3, 0xaaaaaa, 1);
        windOffGraphics.lineBetween(20, 20, 35, 35);
        windOffGraphics.lineBetween(35, 20, 20, 35);
        windOffGraphics.generateTexture('touch_wind_btn_off', 80, 50);

        // P1 Left movement button (<) - red tint
        const p1LeftGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        p1LeftGraphics.fillStyle(0xaa4444, 1);
        p1LeftGraphics.fillRoundedRect(0, 0, 50, 50, 10);
        p1LeftGraphics.lineStyle(3, 0xcc6666, 1);
        p1LeftGraphics.strokeRoundedRect(0, 0, 50, 50, 10);
        // Left arrow
        p1LeftGraphics.fillStyle(0xffffff, 1);
        p1LeftGraphics.beginPath();
        p1LeftGraphics.moveTo(30, 15);
        p1LeftGraphics.lineTo(15, 25);
        p1LeftGraphics.lineTo(30, 35);
        p1LeftGraphics.closePath();
        p1LeftGraphics.fillPath();
        p1LeftGraphics.generateTexture('touch_btn_p1_left', 50, 50);

        // P1 Right movement button (>) - red tint
        const p1RightGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        p1RightGraphics.fillStyle(0xaa4444, 1);
        p1RightGraphics.fillRoundedRect(0, 0, 50, 50, 10);
        p1RightGraphics.lineStyle(3, 0xcc6666, 1);
        p1RightGraphics.strokeRoundedRect(0, 0, 50, 50, 10);
        // Right arrow
        p1RightGraphics.fillStyle(0xffffff, 1);
        p1RightGraphics.beginPath();
        p1RightGraphics.moveTo(20, 15);
        p1RightGraphics.lineTo(35, 25);
        p1RightGraphics.lineTo(20, 35);
        p1RightGraphics.closePath();
        p1RightGraphics.fillPath();
        p1RightGraphics.generateTexture('touch_btn_p1_right', 50, 50);

        // P2 Left movement button (<) - blue tint
        const p2LeftGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        p2LeftGraphics.fillStyle(0x4444aa, 1);
        p2LeftGraphics.fillRoundedRect(0, 0, 50, 50, 10);
        p2LeftGraphics.lineStyle(3, 0x6666cc, 1);
        p2LeftGraphics.strokeRoundedRect(0, 0, 50, 50, 10);
        // Left arrow
        p2LeftGraphics.fillStyle(0xffffff, 1);
        p2LeftGraphics.beginPath();
        p2LeftGraphics.moveTo(30, 15);
        p2LeftGraphics.lineTo(15, 25);
        p2LeftGraphics.lineTo(30, 35);
        p2LeftGraphics.closePath();
        p2LeftGraphics.fillPath();
        p2LeftGraphics.generateTexture('touch_btn_p2_left', 50, 50);

        // P2 Right movement button (>) - blue tint
        const p2RightGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        p2RightGraphics.fillStyle(0x4444aa, 1);
        p2RightGraphics.fillRoundedRect(0, 0, 50, 50, 10);
        p2RightGraphics.lineStyle(3, 0x6666cc, 1);
        p2RightGraphics.strokeRoundedRect(0, 0, 50, 50, 10);
        // Right arrow
        p2RightGraphics.fillStyle(0xffffff, 1);
        p2RightGraphics.beginPath();
        p2RightGraphics.moveTo(20, 15);
        p2RightGraphics.lineTo(35, 25);
        p2RightGraphics.lineTo(20, 35);
        p2RightGraphics.closePath();
        p2RightGraphics.fillPath();
        p2RightGraphics.generateTexture('touch_btn_p2_right', 50, 50);
    }

    setupTouchInput() {
        // Track touch state for continuous adjustment
        this.touchState = {
            angleDown: false,
            angleUp: false,
            powerDown: false,
            powerUp: false,
            p1Left: false,
            p1Right: false,
            p2Left: false,
            p2Right: false
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

        // P1 Left button - backward (S)
        this.p1LeftBtn.on('pointerdown', () => {
            this.touchState.p1Left = true;
        });
        this.p1LeftBtn.on('pointerup', () => {
            this.touchState.p1Left = false;
        });
        this.p1LeftBtn.on('pointerout', () => {
            this.touchState.p1Left = false;
        });

        // P1 Right button - forward (W)
        this.p1RightBtn.on('pointerdown', () => {
            this.touchState.p1Right = true;
        });
        this.p1RightBtn.on('pointerup', () => {
            this.touchState.p1Right = false;
        });
        this.p1RightBtn.on('pointerout', () => {
            this.touchState.p1Right = false;
        });

        // P2 Left button - backward (Arrow Down)
        this.p2LeftBtn.on('pointerdown', () => {
            this.touchState.p2Left = true;
        });
        this.p2LeftBtn.on('pointerup', () => {
            this.touchState.p2Left = false;
        });
        this.p2LeftBtn.on('pointerout', () => {
            this.touchState.p2Left = false;
        });

        // P2 Right button - forward (Arrow Up)
        this.p2RightBtn.on('pointerdown', () => {
            this.touchState.p2Right = true;
        });
        this.p2RightBtn.on('pointerup', () => {
            this.touchState.p2Right = false;
        });
        this.p2RightBtn.on('pointerout', () => {
            this.touchState.p2Right = false;
        });

        // Fire button - merged pointerdown handlers
        this.fireBtn.on('pointerdown', () => {
            this.fireBtn.setScale(0.95);
            if (!this.isShooting && !this.gameOver) {
                this.shoot();
            }
        });
        this.fireBtn.on('pointerup', () => {
            this.fireBtn.setScale(1);
        });
        this.fireBtn.on('pointerout', () => {
            this.fireBtn.setScale(1);
        });

        // Wind toggle button
        this.windBtn.on('pointerdown', () => {
            this.playSound('click');
            this.windEnabled = !this.windEnabled;
            if (this.windEnabled) {
                this.startWindSound();
            } else {
                this.stopWindSound();
            }
            this.updateUI();
            this.drawTrajectory();
            this.updateWindButtonVisual();
        });
    }

    updateWindButtonVisual() {
        // Update wind button texture and label color based on windEnabled state
        if (this.windEnabled) {
            this.windBtn.setTexture('touch_wind_btn');
            this.windBtnLabel.setColor('#ffffff');
        } else {
            this.windBtn.setTexture('touch_wind_btn_off');
            this.windBtnLabel.setColor('#aaaaaa');
        }
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
            r: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
            h: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),
            // New keys for player movement
            p1Forward: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            p1Backward: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            p2Forward: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            p2Backward: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            // New keys for power (replacing W/S and Arrow for power)
            p1PowerUp: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            p1PowerDown: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            p2PowerUp: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT_LEFT),
            p2PowerDown: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT_RIGHT)
        };

        // Track which keys are held for continuous adjustment
        this.keysPressed = {};
        // Track player movement state
        this.playerMoving = { 1: false, 2: false };
    }

    initGameState() {
        this.currentPlayer = 1;
        this.angle = 45;
        this.power = 50;
        this.wind = 0;
        this.windEnabled = true;
        this.projectile = null;
        this.isShooting = false;
        this.gameOver = false;
        this.player1Health = 100;
        this.player2Health = 100;

        this.generateWind();
        this.updateUI();
        this.drawTrajectory();

        // Start ambient wind sound if enabled
        if (this.windEnabled) {
            this.startWindSound();
        }
    }

    generateWind() {
        this.wind = Phaser.Math.Between(-50, 50);
        if (this.wind > -10 && this.wind < 10) {
            this.wind = this.wind >= 0 ? 15 : -15;
        }
    }

    updateUI() {
        if (!this.windEnabled) {
            this.windText.setText('Wind: OFF');
            this.windText.setColor('#888888');
        } else {
            const windStr = this.wind >= 0 ? `Wind: +${this.wind}` : `Wind: ${this.wind}`;
            this.windText.setText(windStr);
            this.windText.setColor(this.wind >= 0 ? '#88ccff' : '#ffaa88');
        }

        this.turnText.setText(`Player ${this.currentPlayer}'s Turn`);
        this.turnText.setColor(this.currentPlayer === 1 ? '#ff4444' : '#4444ff');

        this.angleText.setText(`Angle: ${Math.round(this.angle)}°`);
        this.powerText.setText(`Power: ${Math.round(this.power)}%`);

        this.p1HealthText.setText(`P1: ${Math.round(this.player1Health)} HP`);
        this.p2HealthText.setText(`P2: ${Math.round(this.player2Health)} HP`);

        this.p1HealthBar.setScale(this.player1Health / 100, 1);
        this.p2HealthBar.setScale(this.player2Health / 100, 1);

        // Update wind button visual state
        if (this.windBtn) {
            this.updateWindButtonVisual();
        }
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
        const angleRad = Phaser.Math.DegToRad(this.currentPlayer === 1 ? -this.angle : this.angle);

        const startX = player.x + (direction * 30);
        const startY = player.y - 15;

        const velocity = this.power * 8;
        const vx = Math.cos(angleRad) * velocity * direction;
        const vy = -Math.sin(angleRad) * velocity;

        let x = startX;
        let y = startY;
        let pvx = vx;
        let pvy = vy;

        for (let i = 0; i < 50; i++) {
            const dt = 0.05;

            // Apply wind to trajectory preview (same formula as in update())
            if (this.windEnabled) {
                const windForce = this.wind * 0.01 * dt;
                pvx += windForce;
            }

            x += pvx * dt;
            y += pvy * dt;

            if (y > 720 || x < 0 || x > 600) {
                break;
            }

            // Draw dashed line segment (short line every 3 steps)
            if (i % 3 === 0) {
                const prevX = x - pvx * dt;
                const prevY = y - pvy * dt;
                this.aimGraphics.lineStyle(2, 0xffff00, 0.6);
                this.aimGraphics.lineBetween(prevX, prevY, x, y);
            }

            // Draw yellow dot every 3 steps (larger, more visible)
            if (i % 3 === 0) {
                this.aimGraphics.fillStyle(0xffff00, 0.8);
                this.aimGraphics.fillCircle(x, y, 4);
            }
        }
    }

    shoot() {
        if (this.isShooting || this.gameOver) {
            return;
        }

        this.isShooting = true;
        this.aimGraphics.clear();
        this.playSound('shoot');

        const player = this.currentPlayer === 1 ? this.player1 : this.player2;
        this.shooter = this.currentPlayer; // Track who fired this projectile
        const direction = this.currentPlayer === 1 ? 1 : -1;
        // Use the same angle calculation as drawTrajectory for consistency
        const angleRad = Phaser.Math.DegToRad(this.currentPlayer === 1 ? -this.angle : this.angle);

        this.projectile = this.physics.add.sprite(
            player.x + (direction * 30),
            player.y - 15,
            'projectile'
        );

        const velocity = this.power * 8;
        this.projectile.setVelocity(
            Math.cos(angleRad) * velocity * direction,
            -Math.sin(angleRad) * velocity
        );

        this.projectile.body.setAllowGravity(true);
        if (this.windEnabled) {
            this.projectile.wind = this.wind;
        }
        this.projectile.shooter = this.currentPlayer; // Tag projectile with shooter
        this.projectile.hitConfirmed = false; // Prevent double-hit from overlap
        this.projectile.body.setCircle(8);

        // Muzzle flash effect
        this.createMuzzleFlash(player.x + (direction * 30), player.y - 15);

        // Create projectile trail particles
        this.createProjectileTrail();

        // Collision with players
        // Overlaps auto-clear when objects destroyed
        this.physics.add.overlap(this.projectile, this.player1, this.hitPlayer, null, this);
        this.physics.add.overlap(this.projectile, this.player2, this.hitPlayer, null, this);
    }

    createMuzzleFlash(x, y) {
        const flash = this.add.image(x, y, 'muzzle_flash');
        flash.setScale(1.5);
        flash.setBlendMode(Phaser.BlendModes.ADD);

        this.tweens.add({
            targets: flash,
            scale: 0,
            alpha: 0,
            duration: 100,
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    createProjectileTrail() {
        // Create particle texture for trail
        if (!this.textures.exists('trail_particle')) {
            const trailGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            trailGraphics.fillStyle(0xffff00, 1);
            trailGraphics.fillCircle(8, 8, 8);
            trailGraphics.generateTexture('trail_particle', 16, 16);
        }

        // Create particle emitter for trail
        this.trailEmitter = this.add.particles(0, 0, 'trail_particle', {
            speed: 10,
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 300,
            frequency: 20,
            tint: [0xffff00, 0xffaa00, 0xff8800],
            emitting: false
        });

        // Start emitting from projectile position
        if (this.projectile) {
            this.trailEmitter.startFollow(this.projectile, {
                x: 0,
                y: 0,
                emitFrom: true
            });
            this.trailEmitter.start();
        }
    }

    stopProjectileTrail() {
        if (this.trailEmitter) {
            this.trailEmitter.stop();
            this.trailEmitter.destroy();
            this.trailEmitter = null;
        }
    }

    hitPlayer(projectile, player) {
        // Prevent double-hit from physics overlap
        if (projectile.hitConfirmed) {
            return;
        }
        projectile.hitConfirmed = true;

        const target = player === this.player1 ? 1 : 2;
        
        // Prevent shooter from damaging themselves
        if (projectile.shooter === target) {
            return;
        }

        const damage = this.power * 0.5;

        if (target === 1) {
            this.player1Health = Math.max(0, this.player1Health - damage);
        } else {
            this.player2Health = Math.max(0, this.player2Health - damage);
        }

        this.createExplosion(projectile.x, projectile.y);
        this.playSound('hit');
        this.stopProjectileTrail();
        if (this.projectile) {
            this.destroyProjectile();
        }

        this.updateUI();
        this.checkWinCondition();
    }

    createExplosion(x, y) {
        // Screen shake on impact
        this.cameras.main.shake(200, 0.01);

        // Main explosion sprite
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

        // Particle explosion burst
        this.createExplosionParticles(x, y);
    }

    createExplosionParticles(x, y) {
        // Spark particles bursting outward
        const sparkEmitter = this.add.particles(x, y, 'spark_particle', {
            speed: { min: 100, max: 250 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            frequency: -1,
            quantity: 20,
            tint: [0xffff00, 0xff8800, 0xff4400, 0xffffff],
            emitting: false
        });
        sparkEmitter.explode();

        // Orange fire particles
        const fireEmitter = this.add.particles(x, y, 'exhaust_particle', {
            speed: { min: 50, max: 120 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 400,
            frequency: -1,
            quantity: 15,
            tint: [0xff6600, 0xffaa00, 0xffcc00],
            emitting: false
        });
        fireEmitter.explode();

        // Clean up emitters after animation
        this.time.delayedCall(700, () => {
            sparkEmitter.destroy();
            fireEmitter.destroy();
        });
    }

    destroyProjectile() {
        this.stopProjectileTrail();
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

        // Update birds animation
        this.updateBirds(this.game.loop.delta);

        // Twinkle stars animation
        if (this.twinkleStars) {
            const time = this.time.now * 0.003;
            this.twinkleStars.forEach((star, index) => {
                const alpha = 0.4 + Math.sin(time + index * 0.7) * 0.4;
                star.setAlpha(alpha);
            });
        }

        // Update player glow positions
        if (this.player1) {
            this.updatePlayerGlow(1, this.player1.x, this.player1.y);
        }
        if (this.player2) {
            this.updatePlayerGlow(2, this.player2.x, this.player2.y);
        }

        if (this.isShooting) {
            // Check if projectile is out of bounds or hit ground
            if (this.projectile) {
                // Apply wind force to projectile (use delta time to be frame-rate independent)
                if (this.windEnabled && this.projectile.visible && this.projectile.body.velocity.x !== 0) {
                    const windForce = this.wind * 0.01 * this.game.loop.delta;
                    this.projectile.body.velocity.x += windForce;
                }

                if (!this.projectile.hitConfirmed) {
                    const dx1 = this.projectile.body.center.x - this.player1.body.center.x;
                    const dy1 = this.projectile.body.center.y - this.player1.body.center.y;
                    const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                    if (dist1 < 30) {
                        this.hitPlayer(this.projectile, this.player1);
                    } else {
                        const dx2 = this.projectile.body.center.x - this.player2.body.center.x;
                        const dy2 = this.projectile.body.center.y - this.player2.body.center.y;
                        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                        if (dist2 < 30) {
                            this.hitPlayer(this.projectile, this.player2);
                        }
                    }
                }

                if (this.projectile.y > 720) {
                    // Calculate crater size based on power (20-40px)
                    const craterRadius = 20 + (this.power / 100) * 20;
                    this.createCrater(this.projectile.x, 720, craterRadius);
                    this.createExplosion(this.projectile.x, 720);
                    this.playSound('explosion');

                    // Adjust all players to new terrain after crater
                    this.adjustPlayersToTerrain();

                    this.stopProjectileTrail();
                    this.destroyProjectile();
                    this.endTurn();
                } else if (this.projectile.x < -50 || this.projectile.x > 650) {
                    this.stopProjectileTrail();
                    this.destroyProjectile();
                    this.endTurn();
                }
            }
            return;
        }

        // Player movement (only during aiming phase, not while shooting)
        this.handlePlayerMovement();

        // Angle adjustment (keyboard) - FIXED: LEFT decreases, RIGHT increases
        if (this.keys.left.isDown) {
            if (!this.keysPressed['left']) {
                this.keysPressed['left'] = true;
                this.angle = Math.max(-80, this.angle - 5);
                this.updatePowerBar(this.power);
                this.updateUI();
                this.drawTrajectory();
            }
        } else if (this.keys.right.isDown) {
            if (!this.keysPressed['right']) {
                this.keysPressed['right'] = true;
                this.angle = Math.min(80, this.angle + 5);
                this.updatePowerBar(this.power);
                this.updateUI();
                this.drawTrajectory();
            }
        }

        // Power adjustment (keyboard) - Q/E and Shift keys
        if (this.keys.p1PowerUp.isDown || this.keys.p2PowerUp.isDown) {
            if (!this.keysPressed['powerUp']) {
                this.keysPressed['powerUp'] = true;
                this.power = Math.min(100, this.power + 3);
                this.updatePowerBar(this.power);
                this.updateUI();
                this.drawTrajectory();
            }
        } else if (this.keys.p1PowerDown.isDown || this.keys.p2PowerDown.isDown) {
            if (!this.keysPressed['powerDown']) {
                this.keysPressed['powerDown'] = true;
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
            this.angle = Math.max(-80, this.angle - 5);
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

        // Touch controls - player movement
        const delta = this.game.loop.delta;
        let p1Moving = false;
        let p2Moving = false;

        // P1 movement via touch: p1Right = forward (W), p1Left = backward (S)
        if (this.touchState.p1Right) {
            this.movePlayer(this.player1, this.dustEmitter1, this.dustEmitter1Active, 1, delta);
            p1Moving = true;
        } else if (this.touchState.p1Left) {
            this.movePlayer(this.player1, this.dustEmitter1, this.dustEmitter1Active, -1, delta);
            p1Moving = true;
        }

        // P2 movement via touch: p2Right = forward (Arrow Up), p2Left = backward (Arrow Down)
        if (this.touchState.p2Right) {
            this.movePlayer(this.player2, this.dustEmitter2, this.dustEmitter2Active, -1, delta);
            p2Moving = true;
        } else if (this.touchState.p2Left) {
            this.movePlayer(this.player2, this.dustEmitter2, this.dustEmitter2Active, 1, delta);
            p2Moving = true;
        }

        // Stop dust particles when player stops moving
        if (!p1Moving && this.dustEmitter1 && this.dustEmitter1Active) {
            this.dustEmitter1.stop();
            this.dustEmitter1Active = false;
        }
        if (!p2Moving && this.dustEmitter2 && this.dustEmitter2Active) {
            this.dustEmitter2.stop();
            this.dustEmitter2Active = false;
        }

        // Update trajectory after movement
        if (p1Moving || p2Moving) {
            this.drawTrajectory();
        }

        // Reset key pressed states when keys are released
        if (this.keys.left.isUp) {
            this.keysPressed['left'] = false;
        }
        if (this.keys.right.isUp) {
            this.keysPressed['right'] = false;
        }
        if (this.keys.p1PowerUp.isUp && this.keys.p2PowerUp.isUp) {
            this.keysPressed['powerUp'] = false;
        }
        if (this.keys.p1PowerDown.isUp && this.keys.p2PowerDown.isUp) {
            this.keysPressed['powerDown'] = false;
        }

        // Shooting (keyboard)
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.shoot();
        }

        // Wind toggle (H key)
        if (Phaser.Input.Keyboard.JustDown(this.keys.h)) {
            this.playSound('click');
            this.windEnabled = !this.windEnabled;
            if (this.windEnabled) {
                this.startWindSound();
            } else {
                this.stopWindSound();
            }
            this.updateUI();
            this.drawTrajectory();
        }
    }
}
