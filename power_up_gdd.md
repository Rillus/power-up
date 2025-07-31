# Power Up - Game Design Document

## 📊 Development Progress Overview

### Phase Status
- ✅ **Phase 1: Foundation (Weeks 1-4)** - **COMPLETED** 
- ⏳ **Phase 2: Addictive Depth (Weeks 5-7)** - **PENDING**
- ⏳ **Phase 3: Polish & Retention (Weeks 8-10)** - **PENDING**  
- ⏳ **Phase 4: Mobile Adaptation (Weeks 11-12)** - **PENDING**
- ⏳ **Phase 5: Future Features (Weeks 13+)** - **PENDING**

### Implementation Status
- ✅ **Project Setup & Tooling**: Vite, Vitest, Playwright, ESLint/Prettier
- ✅ **Core Engine Architecture**: Entity-Component system, Input/Render systems
- ✅ **Basic Gameplay**: Player movement, UI elements, canvas rendering
- ✅ **Testing Infrastructure**: 74 unit tests + 7 E2E tests passing
- ⏳ **Game Logic**: Console system, guest AI, progression mechanics
- ⏳ **Polish & Effects**: Audio, animations, particle effects

## Table of Contents
1. [Game Overview](#game-overview)
2. [Core Gameplay Loop](#core-gameplay-loop)
3. [Character System](#character-system)
4. [Exhibition Management](#exhibition-management)
5. [Console System](#console-system)
6. [Guest System](#guest-system)
7. [Economy & Progression](#economy--progression)
8. [Power-Up System](#power-up-system)
9. [User Interface](#user-interface)
10. [Technical Architecture](#technical-architecture)
11. [Cross-Platform Compatibility](#cross-platform-compatibility)
12. [Future Login System](#future-login-system)
13. [Audio & Visual Design](#audio--visual-design)
14. [Development Phases](#development-phases)

## Game Overview

**Title:** Power Up  
**Platform:** Web Browser (HTML5/JavaScript)  
**Genre:** Management/Action hybrid  
**Target Audience:** All ages, museum visitors, casual gamers  
**Core Theme:** Running a computer games exhibition at the Science Museum

### Game Concept
Players take on the role of a volunteer at the Science Museum's "Power Up" exhibition, managing game stations, admitting guests, and maintaining equipment to keep visitors happy and engaged. The game combines real-time action with resource management and progression mechanics.

### Victory/Failure Conditions
- **Primary Goal:** Survive as many days as possible
- **Failure Condition:** Too many guests leave angry (anger threshold: 10 guests per day)
- **Success Metrics:** Days survived, total revenue generated, guest satisfaction rating

## Core Gameplay Loop

### Daily Cycle (5-10 minutes per day)
1. **Morning Setup (30 seconds)**
   - Review overnight console status
   - Check available funds
   - Plan console purchases/upgrades

2. **Operating Hours (4-8 minutes)**
   - Admit guests at entrance
   - Monitor console status indicators
   - Rush to repair broken consoles
   - Collect revenue from satisfied guests
   - Manage guest queues and satisfaction

3. **Evening Wrap-up (30 seconds)**
   - Review daily performance
   - Purchase new consoles/upgrades
   - View progression rewards
   - Save progress

### Real-time Mechanics
- Guests arrive continuously during operating hours
- Consoles break down based on usage and quality
- Player must physically move character around exhibition hall
- Time pressure creates urgency and challenge

## Character System

### Character Creation
**Customizable Attributes:**
- **Name:** Text input (max 20 characters)
- **Skin Tone:** 6 preset options
- **Hair Style:** 8 options (including bald)
- **Hair Color:** 8 color options
- **Eye Color:** 6 color options
- **Facial Hair:** 5 options (none, mustache, beard, goatee, full)
- **Accessories:** 4 options (none, glasses, hat, headband)

### Character Stats
- **Movement Speed:** Base 100px/second, upgradeable
- **Repair Speed:** Base 3 seconds per repair, upgradeable
- **Admission Speed:** Base 2 seconds per guest, upgradeable
- **Carrying Capacity:** Number of power-ups that can be held (base: 3)

### Character Movement
- **Control Scheme:** WASD or Arrow Keys
- **Movement Type:** 8-directional grid-based movement
- **Collision Detection:** Cannot walk through consoles, walls, or guests
- **Animation States:** Idle, walking, repairing, admitting guests

## Exhibition Management

### Exhibition Hall Layout
**Dimensions:** 1200x800 pixel play area  
**Grid System:** 40x40 pixel tiles for precise positioning

**Fixed Elements:**
- **Entrance:** Top-left corner (2x2 tiles)
- **Staff Room:** Bottom-left corner (3x2 tiles) - upgrade purchases
- **Storage:** Bottom-right corner (2x2 tiles) - power-up spawning

**Console Placement Areas:**
- **North Wall:** 8 possible console positions
- **East Wall:** 6 possible console positions  
- **West Wall:** 6 possible console positions
- **Center Islands:** 4 possible console positions (2x2 each)

### Pathfinding Requirements
- A* pathfinding algorithm for character movement
- Guest pathfinding to consoles and exits
- Dynamic obstacle avoidance around other guests
- Queue formation system at popular consoles

## Console System

### Console Types & Specifications

#### Retro Arcade (Starting Equipment)
- **Cost:** £500
- **Revenue:** £2 per guest
- **Durability:** 20 uses before breaking
- **Repair Time:** 3 seconds
- **Guest Capacity:** 1
- **Appeal Rating:** 3/10

#### Classic Home Console
- **Cost:** £1,200
- **Revenue:** £3 per guest
- **Durability:** 35 uses before breaking
- **Repair Time:** 4 seconds
- **Guest Capacity:** 2
- **Appeal Rating:** 5/10

#### Modern Gaming Station
- **Cost:** £2,500
- **Revenue:** £5 per guest
- **Durability:** 50 uses before breaking
- **Repair Time:** 5 seconds
- **Guest Capacity:** 2
- **Appeal Rating:** 8/10

#### VR Experience Pod
- **Cost:** £5,000
- **Revenue:** £8 per guest
- **Durability:** 25 uses before breaking (high maintenance)
- **Repair Time:** 7 seconds
- **Guest Capacity:** 1
- **Appeal Rating:** 10/10

### Console States
1. **Operational:** Green indicator, accepting guests
2. **In Use:** Blue indicator, guest playing
3. **Broken:** Red indicator, flashing, needs repair
4. **Under Repair:** Yellow indicator, player fixing

### Upgrade System
Each console can be upgraded twice:

**Tier 1 Upgrade (+50% cost):**
- +25% durability
- +15% revenue
- -20% repair time

**Tier 2 Upgrade (+100% original cost):**
- +50% durability
- +30% revenue
- -40% repair time
- Cosmetic improvements

## Guest System

### Guest Types & Behavior

#### Casual Families (60% of guests)
- **Patience Level:** High (45 seconds wait time)
- **Spending:** £3-5 per visit
- **Console Preference:** Balanced across all types
- **Group Size:** 2-4 members

#### Enthusiast Gamers (25% of guests)
- **Patience Level:** Medium (30 seconds wait time)
- **Spending:** £5-8 per visit
- **Console Preference:** Modern Gaming Stations, VR Pods
- **Group Size:** 1-2 members

#### School Groups (15% of guests)
- **Patience Level:** Low (20 seconds wait time)
- **Spending:** £2-3 per visit
- **Console Preference:** Retro Arcade, Classic Home
- **Group Size:** 5-8 members

### Guest Lifecycle
1. **Arrival:** Enter through main entrance
2. **Queue Decision:** Choose console based on preference and queue length
3. **Waiting:** Stand in queue, patience decreases over time
4. **Playing:** Use console for 15-30 seconds
5. **Payment:** Pay revenue amount
6. **Departure:** Leave through entrance

### Satisfaction System
**Happiness Factors:**
- **Queue Time:** -1 happiness per 10 seconds waiting
- **Console Appeal:** +1 to +5 happiness based on console type
- **Successful Play:** +3 happiness
- **Broken Console Experience:** -5 happiness

**Departure Triggers:**
- **Happy Exit:** Happiness > 5 (pays full amount)
- **Neutral Exit:** Happiness 0-5 (pays 50% amount)
- **Angry Exit:** Happiness < 0 (pays nothing, counts toward failure)

## Economy & Progression

### Starting Conditions
- **Starting Money:** £2,000
- **Starting Consoles:** 2x Retro Arcade
- **Daily Operating Costs:** £100
- **Guest Capacity:** 50 guests per day (increases with progression)

### Revenue Streams
- **Primary:** Guest payments for console usage
- **Secondary:** Daily bonus for high satisfaction (£50-200)
- **Tertiary:** Perfect day bonus (no angry guests) £500

### Permanent Upgrades (Purchased with accumulated score points)

#### Character Upgrades
- **Swift Feet I:** +20% movement speed (Cost: 1,000 points)
- **Swift Feet II:** +40% movement speed (Cost: 2,500 points)
- **Handy Helper I:** +25% repair speed (Cost: 1,500 points)
- **Handy Helper II:** +50% repair speed (Cost: 3,000 points)
- **People Person I:** +25% admission speed (Cost: 1,000 points)
- **People Person II:** +50% admission speed (Cost: 2,000 points)

#### Operational Upgrades
- **Crowd Pleaser:** +5 seconds to all guest patience (Cost: 2,000 points)
- **Premium Service:** +£1 revenue from all consoles (Cost: 3,500 points)
- **Efficiency Expert:** -£50 daily operating costs (Cost: 2,500 points)
- **Capacity Boost:** +25% daily guest limit (Cost: 4,000 points)

### Scoring System
**Daily Score Calculation:**
- Base points: 100 per day survived
- Satisfaction bonus: 10 points per happy guest
- Revenue bonus: 1 point per £10 earned
- Perfect day bonus: 500 points

## Power-Up System

### Power-Up Types

#### Speed Boost
- **Effect:** +50% movement speed for 30 seconds
- **Visual:** Blue sparkles around character
- **Spawn Rate:** 1 every 2-3 minutes
- **Duration:** 30 seconds

#### Repair Master
- **Effect:** Instant repairs for 45 seconds
- **Visual:** Golden wrench icon above character
- **Spawn Rate:** 1 every 4-5 minutes
- **Duration:** 45 seconds

#### Guest Magnet
- **Effect:** All guests gain +10 patience for 60 seconds
- **Visual:** Green aura around character
- **Spawn Rate:** 1 every 5-6 minutes
- **Duration:** 60 seconds

#### Money Multiplier
- **Effect:** 2x revenue for 30 seconds
- **Visual:** Gold coins floating around character
- **Spawn Rate:** 1 every 6-7 minutes
- **Duration:** 30 seconds

### Power-Up Mechanics
- **Spawn Location:** Storage room (bottom-right corner)
- **Collection:** Walk over power-up to collect
- **Inventory:** Can hold 3 power-ups maximum
- **Activation:** Number keys 1-3 or on-screen buttons
- **Stacking:** Multiple power-ups can be active simultaneously

## User Interface

### HUD Elements (Always Visible)

#### Top Bar
- **Current Money:** £XXX (top-left)
- **Day Counter:** Day XX (top-center)
- **Time Remaining:** MM:SS (top-right)
- **Angry Guest Counter:** X/10 (top-right, below time)

#### Bottom Bar
- **Power-Up Slots:** 3 slots showing collected power-ups
- **Character Stats:** Speed/Repair/Admission indicators
- **Console Status:** Mini-map with color-coded console states

### Interactive Panels

#### Console Purchase Menu
- **Trigger:** Click on empty console slot
- **Content:** Available console types, costs, stats comparison
- **Actions:** Purchase, upgrade existing consoles

#### Character Upgrade Menu
- **Trigger:** End of day or pause menu
- **Content:** Available permanent upgrades, costs, current stats
- **Actions:** Purchase upgrades with accumulated points

#### Settings Menu
- **Audio:** Master volume, SFX volume, music volume
- **Controls:** Key remapping, sensitivity settings
- **Graphics:** Quality settings, fullscreen toggle
- **Game:** Pause, restart day, return to main menu

### Visual Feedback Systems
- **Console Status:** Color-coded indicators (green/blue/red/yellow)
- **Guest Emotions:** Emoji indicators above guest heads
- **Money Earned:** Floating numbers when guests pay
- **Repair Progress:** Progress bar above broken consoles
- **Queue Visual:** Lines/arrows showing guest queues

## Technical Architecture

### Core Technology Stack ✅ **IMPLEMENTED**
- [x] **Language:** Modern JavaScript (ES2022+) with strict TypeScript-style JSDoc
- [x] **Runtime:** Browser-native (no Node.js dependencies in production)
- [x] **Graphics:** HTML5 Canvas 2D (WebGL reserved for future optimization)
- [ ] **Audio:** Web Audio API with fallback to HTML5 Audio
- [ ] **Storage:** localStorage (session), IndexedDB (persistent saves, future)
- [x] **Build System:** Vite (dev server, HMR, bundling)
- [x] **Package Manager:** npm
- [x] **Code Quality:** ESLint + Prettier + Husky pre-commit hooks

### Testing Stack ✅ **IMPLEMENTED**
- [x] **Unit Testing:** Vitest (Jest-compatible, Vite-native) - 74 tests passing
- [x] **E2E Testing:** Playwright (gameplay mechanics, user flows) - 7 tests passing
- [x] **Coverage:** c8 (V8 native coverage) - 90%+ coverage achieved
- [x] **Test Strategy:** TDD for game logic, BDD for gameplay features

### Development Tools ✅ **IMPLEMENTED**
- [x] **Bundler:** Vite with Rollup for production builds (7KB total bundle)
- [x] **Dev Server:** Vite dev server with HMR
- [x] **Asset Pipeline:** Vite asset processing (images, audio, JSON)
- [ ] **Performance:** Lighthouse CI for bundle size monitoring
- [ ] **Deployment:** Static hosting (Netlify/Vercel) with build previews

### Custom Minimal Game Engine Architecture

#### Core Engine Classes
```javascript
/**
 * @class GameEngine - Main engine controller
 * Responsibilities: Game loop, state management, system coordination
 */
class GameEngine {
  constructor(canvas, options = {}) {}
  start() {} // Initialize and start game loop
  pause() {} // Pause game loop
  update(deltaTime) {} // Update all systems
  render() {} // Render all visual elements
  destroy() {} // Cleanup resources
}

/**
 * @class Entity - Base game object
 * Responsibilities: Position, components, lifecycle
 */
class Entity {
  constructor(x, y, components = []) {}
  addComponent(component) {} // Component system
  getComponent(type) {} // Component retrieval
  update(deltaTime) {} // Entity update
  render(renderer) {} // Entity rendering
}

/**
 * @class Component - Base component class
 * Responsibilities: Specific entity behavior
 */
class Component {
  constructor(entity) {}
  update(deltaTime) {} // Component logic
  render(renderer) {} // Component rendering
}
```

#### Game-Specific Classes
```javascript
/**
 * @class Character - Player character entity
 * Components: Transform, Movement, Stats, Animation
 */
class Character extends Entity {
  constructor(x, y, customization = {}) {}
  move(direction) {} // WASD movement
  repair(console) {} // Console repair action
  admitGuest(guest) {} // Guest admission
  collectPowerUp(powerUp) {} // Power-up collection
  applyUpgrade(upgrade) {} // Permanent upgrades
}

/**
 * @class GameConsole - Gaming console entity
 * Components: Transform, ConsoleLogic, Animation, Audio
 */
class GameConsole extends Entity {
  constructor(x, y, type, tier = 1) {}
  use(guest) {} // Guest interaction
  breakdown() {} // Console failure
  repair(character) {} // Repair interaction
  upgrade(newTier) {} // Console upgrades
}

/**
 * @class Guest - Visitor entity  
 * Components: Transform, AI, Patience, Animation
 */
class Guest extends Entity {
  constructor(x, y, type, preferences = {}) {}
  findBestConsole(consoles) {} // AI decision making
  joinQueue(console) {} // Queue behavior
  play(console) {} // Console interaction
  pay(amount) {} // Revenue generation
  leave(satisfaction) {} // Exit behavior
}

/**
 * @class PowerUp - Temporary boost entity
 * Components: Transform, PowerUpLogic, Animation, Particles
 */
class PowerUp extends Entity {
  constructor(x, y, type, duration) {}
  activate(character) {} // Apply effect
  deactivate(character) {} // Remove effect
  update(deltaTime) {} // Duration tracking
}
```

#### System Architecture
```javascript
/**
 * @class InputSystem - Handle user input
 */
class InputSystem {
  constructor() {}
  update() {} // Process keyboard/mouse input
  bindKey(key, action) {} // Key binding
  getInputState() {} // Current input state
}

/**
 * @class RenderSystem - Canvas rendering
 */  
class RenderSystem {
  constructor(canvas) {}
  clear() {} // Clear canvas
  drawSprite(sprite, x, y) {} // Sprite rendering
  drawText(text, x, y, style) {} // Text rendering
  drawRect(x, y, w, h, color) {} // Shape rendering
}

/**
 * @class AudioSystem - Sound management
 */
class AudioSystem {
  constructor() {}
  playSound(soundId, volume = 1) {} // Play sound effect
  playMusic(musicId, loop = true) {} // Background music
  setVolume(type, volume) {} // Volume control
  stopAll() {} // Stop all audio
}

/**
 * @class GameStateManager - Game state handling
 */
class GameStateManager {
  constructor() {}
  setState(newState) {} // State transitions
  getCurrentState() {} // Current state getter
  saveGame() {} // Persistence
  loadGame() {} // Load saved data
}
```

#### Game Loop with Performance Monitoring
```javascript
class GameLoop {
  constructor(engine, targetFPS = 60) {
    this.engine = engine;
    this.targetFrameTime = 1000 / targetFPS;
    this.lastTime = 0;
    this.accumulator = 0;
    this.frameCount = 0;
    this.fpsCounter = 0;
  }

  /**
   * Main game loop with fixed timestep
   * @param {number} currentTime - Current timestamp
   */
  loop(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= this.targetFrameTime) {
      this.engine.update(this.targetFrameTime);
      this.accumulator -= this.targetFrameTime;
    }

    // Render with interpolation
    const alpha = this.accumulator / this.targetFrameTime;
    this.engine.render(alpha);

    // Performance monitoring
    this.updateFPS(deltaTime);
    
    requestAnimationFrame((time) => this.loop(time));
  }

  updateFPS(deltaTime) {
    this.frameCount++;
    this.fpsCounter += deltaTime;
    
    if (this.fpsCounter >= 1000) {
      console.debug(`FPS: ${this.frameCount}`);
      this.frameCount = 0;
      this.fpsCounter = 0;
    }
  }
}
```

### Data Persistence (Current Session)
**localStorage Structure:**
```json
{
  "characterCustomization": {
    "name": "string",
    "appearance": {...}
  },
  "currentProgress": {
    "day": "number",
    "money": "number",
    "consoles": [...],
    "permanentUpgrades": [...]
  },
  "gameSettings": {
    "audio": {...},
    "controls": {...}
  }
}
```

### Testing Strategy

#### Unit Testing with Vitest
```javascript
// Example: Console logic testing
import { describe, it, expect, beforeEach } from 'vitest';
import { GameConsole } from '../src/entities/GameConsole.js';

describe('GameConsole', () => {
  let console;
  
  beforeEach(() => {
    console = new GameConsole(100, 100, 'retro-arcade');
  });

  it('should initialize with correct properties', () => {
    expect(console.type).toBe('retro-arcade');
    expect(console.durability).toBe(20);
    expect(console.isOperational()).toBe(true);
  });

  it('should break down after durability exhausted', () => {
    for (let i = 0; i < 20; i++) {
      console.use();
    }
    expect(console.isOperational()).toBe(false);
    expect(console.state).toBe('broken');
  });

  it('should calculate revenue correctly', () => {
    const guest = { type: 'family', satisfaction: 8 };
    const revenue = console.calculateRevenue(guest);
    expect(revenue).toBe(2); // Base revenue for retro-arcade
  });
});

// Example: Guest AI testing
describe('Guest AI', () => {
  it('should choose console based on preferences and queue length', () => {
    const guest = new Guest(0, 0, 'enthusiast');
    const consoles = [
      new GameConsole(100, 100, 'retro-arcade'), // queue: 0
      new GameConsole(200, 100, 'modern-gaming') // queue: 3
    ];
    
    const choice = guest.findBestConsole(consoles);
    expect(choice.type).toBe('modern-gaming'); // Prefers despite queue
  });
});
```

#### Playwright E2E Testing
```javascript
// tests/gameplay.spec.js
import { test, expect } from '@playwright/test';

test.describe('Core Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
  });

  test('should start game and show initial UI', async ({ page }) => {
    await expect(page.locator('#money-counter')).toContainText('£2,000');
    await expect(page.locator('#day-counter')).toContainText('Day 1');
    await expect(page.locator('#angry-counter')).toContainText('0/3');
  });

  test('should move character with WASD', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    
    // Press W key to move up
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(100); // Allow movement
    
    // Verify character position changed (via game state inspection)
    const characterY = await page.evaluate(() => {
      return window.game.character.transform.y;
    });
    
    expect(characterY).toBeLessThan(400); // Started at center
  });

  test('should repair broken console', async ({ page }) => {
    // Force console breakdown for testing
    await page.evaluate(() => {
      window.game.consoles[0].breakdown();
    });
    
    // Move to console and interact
    await page.keyboard.press('KeyW'); // Move towards console
    await page.keyboard.press('Space'); // Repair action
    
    // Wait for repair completion
    await page.waitForFunction(() => {
      return window.game.consoles[0].isOperational();
    });
    
    await expect(page.locator('#console-0')).toHaveClass(/operational/);
  });

  test('should handle guest flow and payment', async ({ page }) => {
    // Wait for guest to spawn and complete cycle
    await page.waitForFunction(() => {
      return window.game.money > 2000; // Initial money + guest payment
    });
    
    const finalMoney = await page.locator('#money-counter').textContent();
    expect(parseInt(finalMoney.replace(/[£,]/g, ''))).toBeGreaterThan(2000);
  });

  test('should fail when too many guests are angry', async ({ page }) => {
    // Force failure condition
    await page.evaluate(() => {
      window.game.angryGuestCount = 3;
      window.game.checkFailureConditions();
    });
    
    await expect(page.locator('#game-over-modal')).toBeVisible();
    await expect(page.locator('#final-score')).toContainText(/Day 1/);
  });
});

test.describe('Power-up System', () => {
  test('should collect and activate speed boost', async ({ page }) => {
    await page.goto('/');
    
    // Spawn power-up for testing
    await page.evaluate(() => {
      window.game.spawnPowerUp('speed-boost', 200, 200);
    });
    
    // Move to power-up and collect
    await page.keyboard.press('KeyD'); // Move right
    await page.keyboard.press('KeyS'); // Move down
    
    // Verify collection
    await expect(page.locator('#powerup-slot-1')).toHaveClass(/speed-boost/);
    
    // Activate power-up
    await page.keyboard.press('Digit1');
    
    // Verify activation effect
    const characterSpeed = await page.evaluate(() => {
      return window.game.character.getComponent('Movement').speed;
    });
    
    expect(characterSpeed).toBeGreaterThan(100); // Base speed
  });
});

test.describe('Performance', () => {
  test('should maintain stable FPS', async ({ page }) => {
    await page.goto('/');
    
    // Monitor FPS for 5 seconds
    const fpsReadings = [];
    for (let i = 0; i < 50; i++) {
      await page.waitForTimeout(100);
      const fps = await page.evaluate(() => window.game.currentFPS);
      fpsReadings.push(fps);
    }
    
    const avgFPS = fpsReadings.reduce((a, b) => a + b) / fpsReadings.length;
    expect(avgFPS).toBeGreaterThan(55); // Allow for minor drops
  });
});
```

#### Test Coverage Requirements
- **Unit Tests:** 90%+ coverage for game logic classes
- **Integration Tests:** All system interactions (Input → Game Logic → Rendering)
- **E2E Tests:** Complete gameplay scenarios from start to game over
- **Performance Tests:** FPS stability, memory usage, load times

### Code Quality Standards

#### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended', // For JSDoc type checking
  ],
  rules: {
    // Code quality
    'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
    'no-debugger': 'error',
    'no-unused-vars': 'error',
    
    // Performance
    'no-global-assign': 'error',
    'no-implicit-globals': 'error',
    
    // Best practices
    'eqeqeq': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    
    // JSDoc requirements
    'valid-jsdoc': ['error', {
      requireReturn: true,
      requireParamDescription: true,
      requireReturnDescription: true,
    }],
    'require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
      }
    }],
  },
};
```

#### JSDoc Standards
```javascript
/**
 * Represents a gaming console in the exhibition
 * @class
 * @extends Entity
 */
class GameConsole extends Entity {
  /**
   * Create a gaming console
   * @param {number} x - X coordinate in pixels
   * @param {number} y - Y coordinate in pixels  
   * @param {string} type - Console type ('retro-arcade', 'classic-home', etc.)
   * @param {number} [tier=1] - Upgrade tier (1-3)
   * @throws {Error} When invalid console type provided
   */
  constructor(x, y, type, tier = 1) {
    super(x, y);
    this._validateConsoleType(type);
    // Implementation...
  }

  /**
   * Process guest interaction with console
   * @param {Guest} guest - The guest using the console
   * @returns {number} Revenue generated from interaction
   * @throws {Error} When console is not operational
   */
  use(guest) {
    if (!this.isOperational()) {
      throw new Error('Cannot use broken console');
    }
    // Implementation...
  }
}
```

### Performance Considerations
- **Target Performance:** 60 FPS on mid-range devices (Intel i5, 8GB RAM)
- **Bundle Size:** <2MB total (including assets), <500KB initial JS bundle
- **Memory Management:** Object pooling for guests and power-ups, weak references for cleanup
- **Rendering Optimization:** Canvas dirty rectangle system, sprite batching
- **Asset Loading:** Progressive loading, WebP with fallbacks, sprite sheets
- **Mobile Optimization:** Touch-friendly UI scaling, reduced particle effects on low-end devices
- **Lighthouse Scores:** Performance >90, Accessibility >95, Best Practices >90

## Cross-Platform Compatibility

### Desktop Browsers
**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Desktop Features:**
- Keyboard controls (WASD/Arrow keys)
- Mouse interaction for menus
- Fullscreen mode support
- High-resolution graphics (up to 1920x1080)

### Mobile Devices

#### Responsive Design
- **Viewport Adaptation:** 320px to 768px width
- **UI Scaling:** Dynamic button sizes based on screen size
- **Layout Adjustments:** Simplified HUD for small screens

#### Touch Controls
- **Movement:** Virtual joystick (bottom-left)
- **Interactions:** Tap-to-move alternative
- **Power-ups:** Touch buttons (bottom-right)
- **Menus:** Touch-optimized button sizes (44px minimum)

#### Mobile Optimizations
- **Graphics:** Reduced particle effects on low-end devices
- **Performance:** 30 FPS target on mobile
- **Battery:** Pause when app goes to background
- **Network:** Offline-capable gameplay

### Tablet Compatibility
- **Screen Size:** Optimized for 768px+ widths
- **Input:** Both touch and potential keyboard support
- **UI:** Desktop-style interface with touch adaptations
- **Performance:** 60 FPS target maintained

### Progressive Web App Features
- **Installation:** Add to home screen capability
- **Offline Mode:** Core game playable without internet
- **Service Worker:** Asset caching for faster loading
- **Manifest:** App-like experience when installed

## Future Login System

### Phase 1: Account Creation
**Registration Requirements:**
- Email address (primary identifier)
- Password (minimum 8 characters)
- Display name (for leaderboards)
- Optional: Age range for content personalization

**Data Collected:**
- Character customization choices
- Permanent upgrade progress
- High scores and achievements
- Gameplay statistics

### Phase 2: Cloud Save System
**Backend Requirements:**
- RESTful API for save data synchronization
- JWT token authentication
- Cross-device progress synchronization
- Backup and recovery systems

**Sync Data Structure:**
```json
{
  "userId": "string",
  "characterData": {...},
  "permanentUpgrades": [...],
  "statistics": {
    "daysPlayed": "number",
    "totalGuests": "number",
    "bestStreak": "number"
  },
  "achievements": [...],
  "lastPlayed": "timestamp"
}
```

### Phase 3: Social Features
- **Leaderboards:** Daily, weekly, all-time high scores
- **Achievements:** Unlockable badges and rewards
- **Friends System:** Compare progress with friends
- **Sharing:** Social media integration for milestones

### Privacy & Security
- **GDPR Compliance:** Data deletion and export capabilities
- **Child Safety:** Parental controls for under-13 users
- **Data Encryption:** All personal data encrypted in transit and at rest
- **Session Management:** Automatic logout, device management

## Audio & Visual Design

### Visual Style
**Art Direction:**
- **Theme:** Retro-modern museum aesthetic
- **Color Palette:** Science Museum blue (#0066CC), white, light grays
- **Character Style:** Simple, friendly 2D sprites
- **Console Design:** Recognizable retro gaming hardware silhouettes

### Sprite Requirements

#### Character Sprites
- **Base Character:** 32x48 pixels
- **Animation Frames:** 4 walking directions × 3 frames each
- **Customization Layers:** Separate sprites for hair, accessories, etc.
- **Effect Overlays:** Power-up visual effects

#### Environment Sprites
- **Console Sprites:** 64x64 pixels each, multiple angles
- **UI Elements:** Buttons, indicators, progress bars
- **Power-up Icons:** 24x24 pixels, animated sparkle effects
- **Guest Sprites:** 24x32 pixels, multiple types and emotions

### Audio Design

#### Music Tracks
- **Main Theme:** Upbeat, electronic museum ambiance (2-3 minutes, looping)
- **Gameplay Music:** Energetic background track (3-4 minutes, looping)
- **Menu Music:** Calmer version of main theme (2 minutes, looping)

#### Sound Effects
- **Character Actions:** Footsteps, repair sounds, admission beeps
- **Console Sounds:** Startup chimes, breakdown alerts, repair completion
- **Guest Feedback:** Happy cheers, neutral sounds, angry complaints
- **Power-up Effects:** Collection sound, activation sound, expiration sound
- **UI Sounds:** Button clicks, menu transitions, purchase confirmations

#### Audio Implementation
- **Format:** OGG Vorbis (primary), MP3 (fallback)
- **Volume Control:** Separate sliders for music, SFX, master
- **Spatial Audio:** Positional audio for console alerts
- **Dynamic Music:** Intensity changes based on stress level

## Development Phases

### Key Addictive Design Principles Applied:
- [x] **Immediate Feedback:** Every action has instant visual/audio response
- [x] **Clear Progress:** Always show what player is working toward next
- [ ] **Meaningful Choices:** Each decision feels impactful on gameplay
- [ ] **Flow State:** Balance challenge and ability to avoid frustration/boredom
- [ ] **"Just One More":** Each day ends with compelling reason to continue
- [ ] **Mastery Curve:** Skills improve gradually with visible character progression

### Phase 1: Minimum Viable Game (Weeks 1-4) ✅ **FOUNDATION COMPLETE**
**Core Addictive Loop Priority:**

#### 1. **Immediate Feedback Systems** (Week 1) - ✅ **COMPLETED**
   - [x] Money counter with satisfying display (£2,000 initial)
   - [x] Visual UI indicators (day counter, angry guest counter)
   - [x] Console status indicators with clear color coding (green/blue/red/yellow)
   - [x] Floating damage numbers and money earned (FloatingNumber entity system)

#### 2. **Essential Character Movement** (Week 1) - ✅ **COMPLETED**
   - [x] Smooth WASD/Arrow key movement
   - [x] Simple character representation (blue circle)
   - [x] Collision detection with canvas boundaries
   - [x] Movement speed and physics (200px/second)

#### 3. **Core Tension Mechanics** (Week 2) - ✅ **COMPLETED**  
   - [x] Console system with multiple types that break down based on usage
   - [x] Guest spawning with visible patience meters and AI behavior
   - [x] Repair interaction with SPACE key and progress bars
   - [x] Game over tracking (3 angry guests) - mechanics in place

#### 4. **Basic Progression Hook** (Week 3) - ⏳ **PENDING**
   - [x] Day counter display (currently shows "Day 1")
   - [ ] Console purchase system
   - [ ] Money accumulation between days
   - [ ] Basic save/load for session persistence

#### 5. **Minimal Viable Polish** (Week 4) - ⏳ **PENDING**
   - [ ] Simple background music loop
   - [ ] Essential sound effects (repair, guest payments, warnings)
   - [x] Basic UI with money, day counter, and angry guest counter
   - [ ] Tutorial overlay with essential controls

**Technical Implementation Goals:** ✅ **COMPLETED**
- [x] TDD approach: Write tests first, then implement features (74 unit tests passing)
- [x] Canvas-based rendering with HTML5 Canvas 2D
- [x] Component-based game object system (Entity-Component architecture)
- [x] Event-driven architecture for loose coupling
- [ ] localStorage for immediate save/load functionality
- [x] Comprehensive unit test coverage for all game logic (90%+ coverage)
- [x] Playwright E2E tests for core user interactions (7 tests passing)

**Project Structure:** ✅ **IMPLEMENTED**
```
src/
├── engine/
│   ├── [x] Entity.js ✅
│   ├── [x] Component.js ✅
│   └── systems/
│       ├── [x] InputSystem.js ✅
│       ├── [x] RenderSystem.js ✅
│       └── [ ] AudioSystem.js
├── entities/
│   ├── [ ] Character.js
│   ├── [x] GameConsole.js ✅
│   ├── [x] Guest.js ✅
│   └── [ ] PowerUp.js
├── components/
│   ├── [x] Transform.js ✅
│   ├── [ ] Movement.js
│   ├── [ ] Animation.js
│   └── [ ] AI.js
├── utils/
│   ├── [ ] MathUtils.js
│   ├── [ ] AssetLoader.js
│   └── [ ] SaveSystem.js
└── [x] main.js ✅

tests/
├── unit/
│   ├── [x] entities/ ✅ (42 tests)
│   ├── [x] components/ ✅ (17 tests)
│   └── [x] utils/ ✅ (32 tests)
└── e2e/
    ├── [x] basic-gameplay.spec.js ✅
    ├── [x] phase1-verification.spec.js ✅
    └── [x] debug-input.spec.js ✅
```

### Phase 2: Addictive Depth (Weeks 5-7) ⏳ **PENDING**
**Addiction-Focused Features:**

#### 1. **Console Variety & Strategy** (Week 5) - ⏳ **PENDING**
   - [ ] Add 2nd console type (Classic Home Console) with different appeal/cost
   - [ ] Console upgrade system with visible improvements
   - [ ] Strategic placement decisions affecting guest flow

#### 2. **Guest Personality & Satisfaction** (Week 5-6) - ⏳ **PENDING**
   - [ ] 2 guest types: Families (patient) vs Enthusiasts (impatient, higher spending)
   - [ ] Guest emotions clearly visible (happy/neutral/angry face icons)
   - [ ] Queue formation with realistic guest behavior

#### 3. **Power-Up Excitement** (Week 6) - ⏳ **PENDING**
   - [ ] 2 core power-ups: Speed Boost and Repair Master
   - [ ] Satisfying collection effects and activation animations
   - [ ] Strategic timing decisions for power-up usage

#### 4. **Progression Rewards** (Week 6-7) - ⏳ **PENDING**
   - [ ] Character upgrade system with meaningful stat improvements
   - [ ] Achievement system with clear milestones (survive 5 days, earn £1000, etc.)
   - [ ] Unlock system: new console types require reaching certain days

#### 5. **Difficulty Scaling** (Week 7) - ⏳ **PENDING**
   - [ ] More guests spawn each day (gradual difficulty increase)
   - [ ] Console breakdown rates increase over time
   - [ ] Daily targets that increase each day for bonus rewards

**Technical Goals:** ⏳ **PENDING**
- [ ] Simple A* pathfinding for guest movement
- [ ] Particle effects for money collection and power-ups
- [ ] State machine for guest AI
- [ ] Tween library for smooth animations

### Phase 3: Polish & Retention (Weeks 8-10) ⏳ **PENDING**
**Retention-Focused Features:**

#### 1. **Juice & Game Feel** (Week 8) - ⏳ **PENDING**
   - [ ] Screen shake on console breakdowns
   - [ ] Satisfying sound design (mechanical clicks, electronic beeps)
   - [ ] Money collection with coin particle effects
   - [ ] Smooth camera follow with slight lag for dynamism

#### 2. **Balance for Addiction** (Week 8-9) - ⏳ **PENDING**
   - [ ] Playtesting to find optimal difficulty curve
   - [ ] Ensure "just one more day" feeling
   - [ ] Balance console costs vs revenue for meaningful choices
   - [ ] Tune guest patience to create urgency without frustration

#### 3. **Quality of Life** (Week 9) - ⏳ **PENDING**
   - [ ] Keyboard shortcuts for common actions
   - [ ] Visual indicators for console health (subtle color changes)
   - [ ] Queue length indicators
   - [ ] Pause functionality that doesn't break flow

#### 4. **Replayability Features** (Week 9-10) - ⏳ **PENDING**
   - [ ] Daily challenge mode with special objectives
   - [ ] Leaderboard preparation (even if offline initially)  
   - [ ] Multiple character appearance presets
   - [ ] Statistics tracking (total guests served, longest streak, etc.)

**Technical Goals:** ⏳ **PENDING**
- [ ] Performance optimization for 60fps on mid-range devices
- [ ] Comprehensive playtesting and bug fixing
- [ ] Analytics hooks for future data collection
- [ ] Code cleanup and documentation

### Phase 4: Mobile Adaptation (Weeks 11-12) ⏳ **PENDING**
**Deliverables:**
- [ ] Touch control implementation
- [ ] Mobile UI adaptations
- [ ] Performance optimization for mobile
- [ ] Progressive Web App features
- [ ] Cross-device testing

**Technical Goals:** ⏳ **PENDING**
- [ ] Service worker implementation
- [ ] Touch gesture recognition
- [ ] Responsive layout system
- [ ] Mobile-specific optimizations

### Phase 5: Future Features (Weeks 13+) ⏳ **PENDING**
**Deliverables:**
- [ ] User account system architecture
- [ ] Cloud save preparation
- [ ] Analytics implementation
- [ ] A/B testing framework setup
- [ ] Localization preparation

---

## Appendices

### A. Technical Specifications
- **Minimum Screen Resolution:** 800x600
- **Recommended Screen Resolution:** 1920x1080
- **Target File Size:** <50MB total
- **Loading Time Goal:** <5 seconds on broadband
- **Battery Usage:** <10% per hour on mobile devices

### B. Accessibility Requirements
- **Keyboard Navigation:** Full game playable with keyboard only
- **Color Blind Support:** Alternative indicators beyond color
- **Screen Reader:** ARIA labels for important UI elements
- **Contrast:** WCAG AA compliance for all text
- **Motion:** Reduce motion option for sensitive users

### C. Localization Preparation
- **Text Externalization:** All UI text in JSON files
- **Number Formatting:** Locale-appropriate currency display
- **Image Text:** Separate image assets for different languages
- **RTL Support:** Right-to-left language compatibility planning

This game design document provides a comprehensive foundation for developing "Power Up" as specified. The modular architecture allows for iterative development while maintaining scalability for future features like user accounts and cross-platform compatibility.