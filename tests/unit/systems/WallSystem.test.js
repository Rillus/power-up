import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WallSystem } from '../../../src/systems/WallSystem.js';

describe('WallSystem', () => {
  let wallSystem;
  let mockGame;

  beforeEach(() => {
    mockGame = {
      canvas: {
        width: 1200,
        height: 800
      },
      entities: []
    };

    wallSystem = new WallSystem(mockGame);
  });

  describe('initialization', () => {
    it('should create boundary walls', () => {
      expect(wallSystem.walls).toHaveLength(4); // top, bottom, left, right
      expect(mockGame.entities).toHaveLength(4); // walls added to game entities
    });

    it('should set correct playable area', () => {
      const playableArea = wallSystem.getPlayableArea();
      
      expect(playableArea.left).toBe(30); // Updated wall thickness
      expect(playableArea.right).toBe(1170); // 1200 - 30
      expect(playableArea.top).toBe(30); // Updated wall thickness
      expect(playableArea.bottom).toBe(770); // 800 - 30
    });

    it('should calculate correct playable dimensions', () => {
      const dimensions = wallSystem.getPlayableAreaDimensions();
      
      expect(dimensions.width).toBe(1140); // 1170 - 30
      expect(dimensions.height).toBe(740); // 770 - 30
    });
  });

  describe('boundary checking', () => {
    it('should identify positions within playable area', () => {
      expect(wallSystem.isWithinPlayableArea(100, 100)).toBe(true);
      expect(wallSystem.isWithinPlayableArea(600, 400)).toBe(true);
      expect(wallSystem.isWithinPlayableArea(1100, 700)).toBe(true);
    });

    it('should identify positions outside playable area', () => {
      expect(wallSystem.isWithinPlayableArea(10, 100)).toBe(false); // too far left
      expect(wallSystem.isWithinPlayableArea(1190, 100)).toBe(false); // too far right
      expect(wallSystem.isWithinPlayableArea(100, 10)).toBe(false); // too far up
      expect(wallSystem.isWithinPlayableArea(100, 790)).toBe(false); // too far down
    });

    it('should respect margin parameter', () => {
      const margin = 50;
      
      expect(wallSystem.isWithinPlayableArea(40, 40, margin)).toBe(false); // within wall margin but not within requested margin
      expect(wallSystem.isWithinPlayableArea(80, 80, margin)).toBe(true); // within requested margin
    });
  });

  describe('position clamping', () => {
    it('should clamp positions to playable area', () => {
      const clamped1 = wallSystem.clampToPlayableArea(10, 10);
      expect(clamped1.x).toBe(30);
      expect(clamped1.y).toBe(30);

      const clamped2 = wallSystem.clampToPlayableArea(1190, 790);
      expect(clamped2.x).toBe(1170);
      expect(clamped2.y).toBe(770);
    });

    it('should not change positions already within bounds', () => {
      const clamped = wallSystem.clampToPlayableArea(600, 400);
      expect(clamped.x).toBe(600);
      expect(clamped.y).toBe(400);
    });

    it('should respect margin when clamping', () => {
      const margin = 50;
      const clamped = wallSystem.clampToPlayableArea(10, 10, margin);
      expect(clamped.x).toBe(80); // 30 + 50
      expect(clamped.y).toBe(80); // 30 + 50
    });
  });

  describe('random position generation', () => {
    it('should generate positions within playable area', () => {
      for (let i = 0; i < 20; i++) {
        const pos = wallSystem.getRandomPlayablePosition();
        expect(wallSystem.isWithinPlayableArea(pos.x, pos.y, 50)).toBe(true);
      }
    });

    it('should respect margin parameter', () => {
      const margin = 100;
      for (let i = 0; i < 10; i++) {
        const pos = wallSystem.getRandomPlayablePosition(margin);
        expect(pos.x).toBeGreaterThanOrEqual(120); // 20 + 100
        expect(pos.x).toBeLessThanOrEqual(1080); // 1180 - 100
        expect(pos.y).toBeGreaterThanOrEqual(120); // 20 + 100
        expect(pos.y).toBeLessThanOrEqual(680); // 780 - 100
      }
    });
  });

  describe('rectangle validation', () => {
    it('should validate rectangles within playable area', () => {
      expect(wallSystem.isRectangleWithinPlayableArea(100, 100, 50, 30)).toBe(true);
      expect(wallSystem.isRectangleWithinPlayableArea(600, 400, 100, 100)).toBe(true);
    });

    it('should reject rectangles outside playable area', () => {
      // Rectangle extends beyond left edge
      expect(wallSystem.isRectangleWithinPlayableArea(10, 100, 50, 30)).toBe(false);
      
      // Rectangle extends beyond right edge
      expect(wallSystem.isRectangleWithinPlayableArea(1160, 100, 50, 30)).toBe(false);
      
      // Rectangle extends beyond top edge
      expect(wallSystem.isRectangleWithinPlayableArea(100, 10, 50, 30)).toBe(false);
      
      // Rectangle extends beyond bottom edge
      expect(wallSystem.isRectangleWithinPlayableArea(100, 760, 50, 30)).toBe(false);
    });

    it('should respect margin for rectangles', () => {
      const margin = 30;
      
      // Rectangle would be valid without margin but invalid with margin
      expect(wallSystem.isRectangleWithinPlayableArea(35, 35, 20, 20)).toBe(true);
      expect(wallSystem.isRectangleWithinPlayableArea(35, 35, 20, 20, margin)).toBe(false);
    });
  });

  describe('collision detection', () => {
    it('should detect point collisions with walls', () => {
      // Point on top wall
      expect(wallSystem.checkPointCollision(100, 10)).toBeTruthy();
      
      // Point on left wall  
      expect(wallSystem.checkPointCollision(10, 100)).toBeTruthy();
      
      // Point in playable area
      expect(wallSystem.checkPointCollision(100, 100)).toBeNull();
    });

    it('should detect rectangle collisions with walls', () => {
      // Rectangle overlapping top wall
      expect(wallSystem.checkRectangleCollision(100, 15, 50, 20)).toBeTruthy();
      
      // Rectangle overlapping left wall
      expect(wallSystem.checkRectangleCollision(15, 100, 20, 50)).toBeTruthy();
      
      // Rectangle in playable area
      expect(wallSystem.checkRectangleCollision(100, 100, 50, 50)).toBeNull();
    });
  });

  describe('wall properties', () => {
    it('should return all walls', () => {
      const walls = wallSystem.getWalls();
      expect(walls).toHaveLength(4);
      expect(walls[0]).toHaveProperty('type', 'wall');
      expect(walls[0]).toHaveProperty('solid', true);
    });

    it('should provide system information', () => {
      const info = wallSystem.getSystemInfo();
      
      expect(info.wallCount).toBe(4);
      expect(info.wallThickness).toBe(30);
      expect(info.playableArea).toBeDefined();
      expect(info.playableDimensions).toBeDefined();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should handle W key for wall info', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = wallSystem.handleKeyPress('KeyW');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Wall System Info:', expect.any(Object));
      
      consoleSpy.mockRestore();
    });

    it('should handle V key for wall visibility toggle', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const initialVisibility = wallSystem.wallsVisible;
      
      const result = wallSystem.handleKeyPress('KeyV');
      
      expect(result).toBe(true);
      expect(wallSystem.wallsVisible).toBe(!initialVisibility);
      expect(consoleSpy).toHaveBeenCalledWith(`Walls ${!initialVisibility ? 'visible' : 'hidden'}`);
      
      // Toggle back
      wallSystem.handleKeyPress('KeyV');
      expect(wallSystem.wallsVisible).toBe(initialVisibility);
      
      consoleSpy.mockRestore();
    });

    it('should not handle other keys', () => {
      const result = wallSystem.handleKeyPress('KeyX');
      
      expect(result).toBe(false);
    });
  });

  describe('different canvas sizes', () => {
    it('should work with different canvas dimensions', () => {
      const mockSmallGame = {
        canvas: { width: 800, height: 600 },
        entities: []
      };

      const smallWallSystem = new WallSystem(mockSmallGame);
      const playableArea = smallWallSystem.getPlayableArea();
      
      expect(playableArea.right).toBe(770); // 800 - 30
      expect(playableArea.bottom).toBe(570); // 600 - 30
    });
  });

  describe('edge cases', () => {
    it('should handle positions exactly on boundaries', () => {
      expect(wallSystem.isWithinPlayableArea(30, 30)).toBe(true); // exactly on boundary
      expect(wallSystem.isWithinPlayableArea(1170, 770)).toBe(true); // exactly on boundary
    });

    it('should handle zero-size rectangles', () => {
      expect(wallSystem.isRectangleWithinPlayableArea(100, 100, 0, 0)).toBe(true);
    });

    it('should handle negative coordinates', () => {
      expect(wallSystem.isWithinPlayableArea(-10, -10)).toBe(false);
      const clamped = wallSystem.clampToPlayableArea(-10, -10);
      expect(clamped.x).toBe(30);
      expect(clamped.y).toBe(30);
    });
  });
});