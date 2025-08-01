import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PowerUpGame } from '../../../src/main.js';
import { Wall } from '../../../src/entities/Wall.js';
import { GameConsole } from '../../../src/entities/GameConsole.js';
import { Character } from '../../../src/entities/Character.js';
import { Guest } from '../../../src/entities/Guest.js';
import { PowerUp } from '../../../src/entities/PowerUp.js';
import { FloatingNumber } from '../../../src/entities/FloatingNumber.js';

// Mock DOM elements
global.document = {
  getElementById: vi.fn((id) => {
    if (id === 'game-canvas') {
      return {
        getContext: vi.fn(() => ({
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          fillText: vi.fn(),
          strokeRect: vi.fn(),
          setTransform: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          stroke: vi.fn(),
          fill: vi.fn(),
          arc: vi.fn(),
          closePath: vi.fn(),
          measureText: vi.fn(() => ({ width: 100 })),
          font: '',
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 1,
          textAlign: 'left',
          textBaseline: 'top'
        })),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        focus: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1200, height: 800 })),
        width: 1200,
        height: 800
      };
    } else if (id === 'loading') {
      return {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(() => false)
        }
      };
    } else if (id === 'money-counter' || id === 'day-counter' || id === 'angry-counter') {
      return {
        textContent: '',
        innerHTML: ''
      };
    } else if (id === 'error-message') {
      return {
        textContent: '',
        innerHTML: '',
        style: {
          display: 'none'
        }
      };
    } else {
      return null;
    }
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  createElement: vi.fn(),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
};

describe('Render Order', () => {
  let game;

  beforeEach(() => {
    // Create game instance - the global document mock will handle all DOM elements
    game = new PowerUpGame();
  });

  describe('wall rendering order', () => {
    it('should render walls first (in background)', () => {
      // Mock the render method to track call order
      const renderCalls = [];
      
      // Mock wall render method
      game.wallSystem.walls.forEach(wall => {
        const originalRender = wall.render;
        wall.render = vi.fn((renderer) => {
          renderCalls.push('wall');
          originalRender.call(wall, renderer);
        });
      });

      // Mock console render method
      const mockConsole = new GameConsole(100, 100, 'retro-arcade');
      mockConsole.render = vi.fn(() => renderCalls.push('console'));
      game.consoles = [mockConsole];

      // Mock character render method
      const mockCharacter = new Character(200, 200);
      mockCharacter.render = vi.fn(() => renderCalls.push('character'));
      game.character = mockCharacter;

      // Mock guest render method
      const mockGuest = new Guest(300, 300, 'casual');
      mockGuest.render = vi.fn(() => renderCalls.push('guest'));
      game.guests = [mockGuest];

      // Mock power-up render method
      const mockPowerUp = new PowerUp(400, 400, 'speed-boost');
      mockPowerUp.render = vi.fn(() => renderCalls.push('powerup'));
      game.powerUps = [mockPowerUp];

      // Mock floating number render method
      const mockFloatingNumber = new FloatingNumber(500, 500, '+10', '#00FF00');
      mockFloatingNumber.render = vi.fn(() => renderCalls.push('floating'));
      game.floatingNumbers = [mockFloatingNumber];

      // Call render method
      game.render();

      // Verify render order: walls should be first
      expect(renderCalls).toContain('wall');
      expect(renderCalls).toContain('console');
      expect(renderCalls).toContain('character');
      expect(renderCalls).toContain('guest');
      expect(renderCalls).toContain('powerup');
      expect(renderCalls).toContain('floating');

      // Find the first occurrence of each entity type
      const wallIndex = renderCalls.indexOf('wall');
      const consoleIndex = renderCalls.indexOf('console');
      const characterIndex = renderCalls.indexOf('character');
      const guestIndex = renderCalls.indexOf('guest');
      const powerupIndex = renderCalls.indexOf('powerup');
      const floatingIndex = renderCalls.indexOf('floating');

      // Walls should be rendered before other entities
      expect(wallIndex).toBeLessThan(consoleIndex);
      expect(wallIndex).toBeLessThan(characterIndex);
      expect(wallIndex).toBeLessThan(guestIndex);
      expect(wallIndex).toBeLessThan(powerupIndex);
      expect(wallIndex).toBeLessThan(floatingIndex);
    });

    it('should respect wall visibility toggle', () => {
      const renderCalls = [];
      
      // Mock wall render method
      game.wallSystem.walls.forEach(wall => {
        wall.render = vi.fn(() => renderCalls.push('wall'));
      });

      // Mock other entities
      const mockConsole = new GameConsole(100, 100, 'retro-arcade');
      mockConsole.render = vi.fn(() => renderCalls.push('console'));
      game.consoles = [mockConsole];

      // Test with walls visible
      game.wallSystem.wallsVisible = true;
      renderCalls.length = 0; // Clear array
      game.render();
      expect(renderCalls).toContain('wall');

      // Test with walls hidden
      game.wallSystem.wallsVisible = false;
      renderCalls.length = 0; // Clear array
      game.render();
      expect(renderCalls).not.toContain('wall');
    });

    it('should render walls before grid', () => {
      const renderCalls = [];
      
      // Mock drawGrid method
      const originalDrawGrid = game.drawGrid;
      game.drawGrid = vi.fn(() => renderCalls.push('grid'));

      // Mock wall render method
      game.wallSystem.walls.forEach(wall => {
        wall.render = vi.fn(() => renderCalls.push('wall'));
      });

      // Call render method
      game.render();

      // Find indices
      const wallIndex = renderCalls.indexOf('wall');
      const gridIndex = renderCalls.indexOf('grid');

      // Walls should be rendered before grid
      expect(wallIndex).toBeLessThan(gridIndex);
    });
  });

  describe('entity layer ordering', () => {
    it('should render entities in correct layer order', () => {
      const renderCalls = [];
      
      // Mock all entity render methods
      game.wallSystem.walls.forEach(wall => {
        wall.render = vi.fn(() => renderCalls.push('wall'));
      });

      const mockConsole = new GameConsole(100, 100, 'retro-arcade');
      mockConsole.render = vi.fn(() => renderCalls.push('console'));
      game.consoles = [mockConsole];

      const mockPowerUp = new PowerUp(200, 200, 'speed-boost');
      mockPowerUp.render = vi.fn(() => renderCalls.push('powerup'));
      game.powerUps = [mockPowerUp];

      const mockCharacter = new Character(300, 300);
      mockCharacter.render = vi.fn(() => renderCalls.push('character'));
      game.character = mockCharacter;

      const mockGuest = new Guest(400, 400, 'casual');
      mockGuest.render = vi.fn(() => renderCalls.push('guest'));
      game.guests = [mockGuest];

      const mockFloatingNumber = new FloatingNumber(500, 500, '+10', '#00FF00');
      mockFloatingNumber.render = vi.fn(() => renderCalls.push('floating'));
      game.floatingNumbers = [mockFloatingNumber];

      // Call render method
      game.render();

      // Verify layer order: walls -> consoles -> powerups -> character/guests -> floating numbers
      const expectedOrder = ['wall', 'wall', 'wall', 'wall', 'console', 'powerup', 'character', 'guest', 'floating'];
      
      // Check that all expected entities were rendered
      expectedOrder.forEach(entityType => {
        expect(renderCalls).toContain(entityType);
      });

      // Verify relative ordering (walls first, floating numbers last)
      const wallIndices = renderCalls.map((call, index) => call === 'wall' ? index : -1).filter(i => i !== -1);
      const floatingIndices = renderCalls.map((call, index) => call === 'floating' ? index : -1).filter(i => i !== -1);

      // All walls should be rendered before any floating numbers
      wallIndices.forEach(wallIndex => {
        floatingIndices.forEach(floatingIndex => {
          expect(wallIndex).toBeLessThan(floatingIndex);
        });
      });
    });
  });

  describe('wall system integration', () => {
    it('should create correct number of boundary walls', () => {
      expect(game.wallSystem.walls).toHaveLength(4); // top, bottom, left, right
    });

    it('should have walls visible by default', () => {
      expect(game.wallSystem.wallsVisible).toBe(true);
    });

    it('should toggle wall visibility with V key', () => {
      const initialVisibility = game.wallSystem.wallsVisible;
      
      // Simulate V key press
      game.wallSystem.handleKeyPress('KeyV');
      expect(game.wallSystem.wallsVisible).toBe(!initialVisibility);
      
      // Simulate V key press again
      game.wallSystem.handleKeyPress('KeyV');
      expect(game.wallSystem.wallsVisible).toBe(initialVisibility);
    });
  });
}); 