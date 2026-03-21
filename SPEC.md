# Space Shooting - Project Specification

## Project Info
- **Name:** Space Shooting
- **Type:** 2-Player Turn-based Browser Game (Hot-seat Multiplayer)
- **Core Functionality:** Two players take turns shooting projectiles at each other, similar to Gunbound/Worms style games
- **Target Users:** Casual gamers playing on the same machine

## Tech Stack
- **Framework:** Phaser 3 (via CDN)
- **Language:** Vanilla JavaScript
- **No Backend/Database Required**

## Gameplay

### Core Mechanics
1. **Turn-based Combat:** Players alternate turns (hot-seat)
2. **Aiming System:** Adjust angle (0-90°) and power (0-100%)
3. **Projectile Physics:** Arcing trajectory affected by gravity and wind
4. **Damage System:** Health points that decrease when hit
5. **Win Condition:** Reduce opponent's health to 0

### Controls (per turn)
| Action | Player 1 | Player 2 |
|--------|----------|----------|
| Adjust Angle | A / D | ← / → |
| Adjust Power | W / S | ↑ / ↓ |
| Shoot | SPACE | SPACE |

### Game Parameters
- **Starting Health:** 100 HP per player
- **Damage Calculation:** `power * 0.5` (max 50 damage per hit)
- **Wind Range:** -50 to +50 (affects horizontal projectile velocity)
- **Gravity:** 300 (arcade physics default)

## Visual Design

### Color Palette
| Element | Color |
|---------|-------|
| Background | #0a0a2e (deep space blue) |
| Player 1 Ship | #ff4444 (red) |
| Player 2 Ship | #4444ff (blue) |
| Projectile | #ffff00 (yellow) |
| Explosion | #ff8800 (orange) |
| Ground/Planet | #3a5a3a (green) |
| UI Panel | #111122 (dark blue) |
| Health Bar P1 | #ff4444 |
| Health Bar P2 | #4444ff |

### UI Layout
- **Top Center:** Turn indicator, Wind indicator
- **Top Left:** P1 Health bar
- **Top Right:** P2 Health bar
- **Bottom Left:** Power bar, Angle display, Controls help
- **Center:** Game canvas (1000x600)

## Features

### Must Have
- [ ] Two player sprites (different colors/positions)
- [ ] Turn switching mechanism
- [ ] Angle adjustment (visual aim line)
- [ ] Power adjustment (bar indicator)
- [ ] Trajectory preview (dotted line)
- [ ] Wind system (random each turn)
- [ ] Projectile with physics (gravity + wind)
- [ ] Collision detection (ground, players)
- [ ] Health bars for both players
- [ ] Damage calculation on hit
- [ ] Win screen with restart option

### Nice to Have (Future)
- [ ] Multiple weapons (different projectile types)
- [ ] Terrain/platforms
- [ ] Sound effects
- [ ] Animation effects
- [ ] Score tracking across rounds

## File Structure
```
space-shooting/
├── index.html          # Entry point
├── SPEC.md             # This file
└── src/
    ├── main.js         # Phaser config
    ├── BootScene.js    # Asset loading
    └── PlayScene.js    # Game logic
```

## Confirmation Needed
- [ ] Is Phaser 3 acceptable or prefer another framework?
- [ ] Any specific visual style preferences?
- [ ] Add sound effects?
- [ ] Weapon types variety?
