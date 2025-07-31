# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Power Up is a web-based HTML5/JavaScript management/action hybrid game where players run a computer games exhibition at the Science Museum. The game combines real-time action with resource management and progression mechanics, designed to be addictive and successful based on the real-life Power Up exhibition.

## Source of Truth

**IMPORTANT:** The `power_up_gdd.md` file is the definitive source of truth for all game design decisions, technical specifications, and development phases. Always reference this document when making implementation decisions.

## Development Status

This is a very early-stage project with only documentation files present:
- `README.md` - Basic project title
- `power_up_gdd.md` - **PRIMARY SOURCE** - Comprehensive game design document with refined development phases
- No source code files exist yet

## Technical Architecture (Planned)

Based on the game design document:

**Core Technology Stack:**
- HTML5, CSS3, JavaScript (ES6+)
- Graphics: HTML5 Canvas or WebGL
- Audio: Web Audio API
- Storage: localStorage (session), IndexedDB (future)
- Build Tools: Webpack/Vite for bundling, Babel for compatibility

**Core Classes Structure:**
```javascript
class Game {
  // Main game loop, state management
}

class Character {
  // Player character properties and methods
}

class Console {
  // Individual console behavior
}

class Guest {
  // Guest AI, pathfinding, satisfaction
}

class PowerUp {
  // Power-up effects and timers
}

class UIManager {
  // All interface elements
}
```

## Game Specifications

- **Target Performance:** 60 FPS on desktop, 30 FPS on mobile
- **Screen Resolution:** 800x600 minimum, 1920x1080 recommended
- **Play Area:** 1200x800 pixel game area with 40x40 pixel tile grid
- **Daily Game Cycle:** 5-10 minutes per day
- **Failure Condition:** 10 angry guests per day

## Key Game Systems

1. **Character System:** Customizable volunteer with upgradeable stats (movement speed, repair speed, admission speed)
2. **Console Management:** 4 console types (Retro Arcade, Classic Home, Modern Gaming, VR Experience) with upgrade tiers
3. **Guest AI:** 3 guest types (Casual Families 60%, Enthusiast Gamers 25%, School Groups 15%) with satisfaction mechanics
4. **Power-Up System:** 4 temporary boosts (Speed Boost, Repair Master, Guest Magnet, Money Multiplier)
5. **Economy:** Revenue from guests, daily costs, permanent upgrades with score points

## Mobile Compatibility

- Progressive Web App features planned
- Touch controls with virtual joystick
- Responsive design for 320px-768px width
- Installation capability ("Add to home screen")

## Development Phases (Addiction-Focused)

1. **Phase 1 (Weeks 1-4):** Minimum Viable Game - Core addictive loop with immediate feedback, basic progression, and essential tension mechanics
2. **Phase 2 (Weeks 5-7):** Addictive Depth - Console variety, guest personalities, power-ups, achievement system, and difficulty scaling
3. **Phase 3 (Weeks 8-10):** Polish & Retention - Game juice, balance tuning, quality of life features, and replayability
4. **Phase 4 (Weeks 11-12):** Mobile PWA adaptation and cross-platform optimization
5. **Phase 5 (Future):** User accounts, cloud saves, social features, analytics

### Key Design Principles
- **Immediate Feedback:** Every action has instant visual/audio response
- **"Just One More Day":** Each session ends with compelling reason to continue
- **Flow State Balance:** Challenge scales with player ability to avoid frustration

## Visual Style

- Retro-modern museum aesthetic
- Science Museum color palette: blue (#0066CC), white, light grays
- Character sprites: 32x48 pixels
- Console sprites: 64x64 pixels
- Guest sprites: 24x32 pixels

## Common Development Tasks

Since no build system exists yet, standard web development commands will need to be established once the project structure is created.