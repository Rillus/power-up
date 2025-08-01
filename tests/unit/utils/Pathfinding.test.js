import { describe, it, expect, beforeEach } from 'vitest';
import { Pathfinding } from '../../../src/utils/Pathfinding.js';

describe('Pathfinding', () => {
  let pathfinding;

  beforeEach(() => {
    pathfinding = new Pathfinding(40); // 40px grid size
    pathfinding.initializeGrid(800, 600); // 800x600 game area
  });

  describe('initialization', () => {
    it('should initialize with correct grid size', () => {
      expect(pathfinding.gridSize).toBe(40);
      expect(pathfinding.gridWidth).toBe(20); // 800 / 40
      expect(pathfinding.gridHeight).toBe(15); // 600 / 40
    });

    it('should initialize all cells as walkable', () => {
      for (let y = 0; y < pathfinding.gridHeight; y++) {
        for (let x = 0; x < pathfinding.gridWidth; x++) {
          expect(pathfinding.grid[y][x].walkable).toBe(true);
        }
      }
    });
  });

  describe('coordinate conversion', () => {
    it('should convert world coordinates to grid coordinates', () => {
      const gridPos = pathfinding.worldToGrid(100, 200);
      expect(gridPos.x).toBe(2); // 100 / 40 = 2.5, floored to 2
      expect(gridPos.y).toBe(5); // 200 / 40 = 5
    });

    it('should convert grid coordinates to world coordinates', () => {
      const worldPos = pathfinding.gridToWorld(2, 5);
      expect(worldPos.x).toBe(100); // 2 * 40 + 20 = 100
      expect(worldPos.y).toBe(220); // 5 * 40 + 20 = 220
    });
  });

  describe('obstacle management', () => {
    it('should mark obstacles as unwalkable', () => {
      const obstacles = [
        { x: 80, y: 120, width: 40, height: 40 } // Covers grid cells (2,3)
      ];
      
      pathfinding.updateObstacles(obstacles);
      
      expect(pathfinding.grid[3][2].walkable).toBe(false);
    });

    it('should handle obstacles at grid boundaries', () => {
      const obstacles = [
        { x: 0, y: 0, width: 40, height: 40 } // Top-left corner - covers exactly one grid cell
      ];
      
      pathfinding.updateObstacles(obstacles);
      
      expect(pathfinding.grid[0][0].walkable).toBe(false); // Only this cell should be blocked
      expect(pathfinding.grid[0][1].walkable).toBe(true);  // Adjacent cells should be walkable
      expect(pathfinding.grid[1][0].walkable).toBe(true);
    });

    it('should reset walkability when updating obstacles', () => {
      const obstacles1 = [{ x: 80, y: 120, width: 40, height: 40 }];
      const obstacles2 = [{ x: 160, y: 240, width: 40, height: 40 }];
      
      pathfinding.updateObstacles(obstacles1);
      expect(pathfinding.grid[3][2].walkable).toBe(false);
      
      pathfinding.updateObstacles(obstacles2);
      expect(pathfinding.grid[3][2].walkable).toBe(true); // Should be walkable again
      expect(pathfinding.grid[6][4].walkable).toBe(false); // New obstacle
    });
  });

  describe('pathfinding', () => {
    it('should find a direct path when no obstacles', () => {
      const path = pathfinding.findPath(100, 100, 300, 300);
      
      expect(path).not.toBeNull();
      expect(path.length).toBeGreaterThan(1);
      expect(path[0].x).toBeCloseTo(100, 10); // Start position
      expect(path[0].y).toBeCloseTo(100, 10);
      expect(path[path.length - 1].x).toBeCloseTo(300, 10); // End position
      expect(path[path.length - 1].y).toBeCloseTo(300, 10);
    });

    it('should find path around obstacles', () => {
      // Create a wall in the middle
      const obstacles = [
        { x: 200, y: 100, width: 40, height: 200 }
      ];
      pathfinding.updateObstacles(obstacles);
      
      const path = pathfinding.findPath(100, 200, 300, 200);
      
      expect(path).not.toBeNull();
      expect(path.length).toBeGreaterThan(2); // Should go around obstacle
    });

    it('should return null for invalid coordinates', () => {
      const path = pathfinding.findPath(-100, -100, 300, 300);
      expect(path).toBeNull();
    });

    it('should handle start and end positions at same location', () => {
      const path = pathfinding.findPath(100, 100, 100, 100);
      expect(path).not.toBeNull();
      expect(path.length).toBe(1);
    });
  });

  describe('nearest walkable node', () => {
    it('should find nearest walkable node when target is blocked', () => {
      // Block a 3x3 area
      const obstacles = [
        { x: 200, y: 200, width: 120, height: 120 }
      ];
      pathfinding.updateObstacles(obstacles);
      
      const nearestNode = pathfinding.findNearestWalkableNode(5, 5); // Center of blocked area
      expect(nearestNode).not.toBeNull();
      expect(nearestNode.walkable).toBe(true);
    });

    it('should return null when no walkable nodes exist', () => {
      // Block entire grid
      const obstacles = [
        { x: 0, y: 0, width: 800, height: 600 }
      ];
      pathfinding.updateObstacles(obstacles);
      
      const nearestNode = pathfinding.findNearestWalkableNode(10, 10);
      expect(nearestNode).toBeNull();
    });
  });

  describe('path simplification', () => {
    it('should simplify straight line paths', () => {
      const originalPath = [
        { x: 100, y: 100 },
        { x: 120, y: 100 },
        { x: 140, y: 100 },
        { x: 160, y: 100 },
        { x: 180, y: 100 }
      ];
      
      const simplified = pathfinding.simplifyPath(originalPath);
      expect(simplified.length).toBeLessThan(originalPath.length);
      expect(simplified[0]).toEqual({ x: 100, y: 100 });
      expect(simplified[simplified.length - 1]).toEqual({ x: 180, y: 100 });
    });

    it('should preserve important waypoints', () => {
      const path = [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 200 }
      ];
      
      const simplified = pathfinding.simplifyPath(path);
      // The path makes a 90-degree turn, so it should keep the corner point
      expect(simplified.length).toBeGreaterThanOrEqual(2);
      expect(simplified[0]).toEqual({ x: 100, y: 100 }); // Start
      expect(simplified[simplified.length - 1]).toEqual({ x: 300, y: 200 }); // End
    });

    it('should return original path if already minimal', () => {
      const path = [
        { x: 100, y: 100 },
        { x: 300, y: 300 }
      ];
      
      const simplified = pathfinding.simplifyPath(path);
      expect(simplified).toEqual(path);
    });
  });

  describe('direct path checking', () => {
    it('should detect clear direct paths', () => {
      const hasPath = pathfinding.hasDirectPath(100, 100, 300, 300);
      expect(hasPath).toBe(true);
    });

    it('should detect blocked direct paths', () => {
      const obstacles = [
        { x: 180, y: 180, width: 40, height: 40 }
      ];
      pathfinding.updateObstacles(obstacles);
      
      const hasPath = pathfinding.hasDirectPath(100, 100, 300, 300);
      expect(hasPath).toBe(false);
    });
  });

  describe('heuristic calculation', () => {
    it('should calculate Manhattan distance correctly', () => {
      const nodeA = { x: 0, y: 0 };
      const nodeB = { x: 3, y: 4 };
      
      const distance = pathfinding.heuristic(nodeA, nodeB);
      expect(distance).toBe(7); // |3-0| + |4-0| = 7
    });
  });

  describe('neighbor detection', () => {
    it('should find all 8 neighbors for internal nodes', () => {
      const node = pathfinding.grid[5][5]; // Internal node
      const neighbors = pathfinding.getNeighbors(node);
      
      expect(neighbors.length).toBe(8); // All 8 directions
    });

    it('should find fewer neighbors for edge nodes', () => {
      const node = pathfinding.grid[0][0]; // Corner node
      const neighbors = pathfinding.getNeighbors(node);
      
      expect(neighbors.length).toBe(3); // Only 3 valid directions
    });

    it('should exclude unwalkable neighbors', () => {
      // Block some cells around center
      const obstacles = [
        { x: 160, y: 160, width: 80, height: 80 }
      ];
      pathfinding.updateObstacles(obstacles);
      
      const node = pathfinding.grid[4][4]; // Just outside blocked area
      const neighbors = pathfinding.getNeighbors(node);
      
      // Should have fewer than 8 neighbors due to blocked cells
      expect(neighbors.length).toBeLessThan(8);
      neighbors.forEach(neighbor => {
        expect(neighbor.walkable).toBe(true);
      });
    });
  });
});