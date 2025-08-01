import { describe, it, expect, beforeEach } from 'vitest';
import { Movement } from '../../../src/components/Movement.js';
import { Entity } from '../../../src/engine/Entity.js';
import { Transform } from '../../../src/components/Transform.js';

describe('Movement', () => {
  let entity;
  let movement;
  let transform;

  beforeEach(() => {
    entity = new Entity(100, 100);
    transform = new Transform(100, 100);
    entity.addComponent(transform);
    movement = new Movement(200); // 200px/second speed
    entity.addComponent(movement);
  });

  describe('constructor', () => {
    it('should initialize with correct speed', () => {
      expect(movement.speed).toBe(200);
    });

    it('should initialize with zero velocity', () => {
      expect(movement.velocity.x).toBe(0);
      expect(movement.velocity.y).toBe(0);
    });

    it('should initialize with zero direction', () => {
      expect(movement.direction.x).toBe(0);
      expect(movement.direction.y).toBe(0);
    });

    it('should have correct component type', () => {
      expect(movement.type).toBe('Movement');
    });
  });

  describe('setDirection', () => {
    it('should set normalized direction vector', () => {
      movement.setDirection(1, 1);
      
      // Should be normalized (length = 1)
      const magnitude = Math.sqrt(movement.direction.x ** 2 + movement.direction.y ** 2);
      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('should handle zero direction', () => {
      movement.setDirection(0, 0);
      expect(movement.direction.x).toBe(0);
      expect(movement.direction.y).toBe(0);
    });

    it('should handle cardinal directions', () => {
      movement.setDirection(1, 0); // Right
      expect(movement.direction.x).toBe(1);
      expect(movement.direction.y).toBe(0);

      movement.setDirection(0, 1); // Down
      expect(movement.direction.x).toBe(0);
      expect(movement.direction.y).toBe(1);
    });
  });

  describe('update', () => {
    it('should update velocity based on direction and speed', () => {
      movement.setDirection(1, 0); // Moving right
      movement.update(1000); // 1 second

      expect(movement.velocity.x).toBe(200); // 200px/second
      expect(movement.velocity.y).toBe(0);
    });

    it('should update position through transform', () => {
      movement.setDirection(1, 0); // Moving right
      movement.update(1000); // 1 second

      expect(transform.x).toBe(300); // 100 + 200
      expect(transform.y).toBe(100); // No Y movement
    });

    it('should handle diagonal movement correctly', () => {
      movement.setDirection(1, 1); // Moving diagonally
      movement.update(1000); // 1 second

      // Should move at full speed diagonally (normalized direction)
      const expectedDistance = 200; // Full speed
      const actualDistance = Math.sqrt(
        (transform.x - 100) ** 2 + (transform.y - 100) ** 2
      );
      expect(actualDistance).toBeCloseTo(expectedDistance, 1);
    });

    it('should handle fractional deltaTime', () => {
      movement.setDirection(1, 0);
      movement.update(500); // 0.5 seconds

      expect(transform.x).toBe(200); // 100 + (200 * 0.5)
    });
  });

  describe('collision detection', () => {
    it('should prevent movement beyond right boundary', () => {
      transform.x = 780; // Near right edge (800 - 20 radius)
      movement.setDirection(1, 0);
      movement.update(1000);

      expect(transform.x).toBe(780); // Should not move beyond boundary
    });

    it('should prevent movement beyond left boundary', () => {
      transform.x = 20; // Near left edge
      movement.setDirection(-1, 0);
      movement.update(1000);

      expect(transform.x).toBe(20); // Should not move beyond boundary
    });

    it('should prevent movement beyond bottom boundary', () => {
      transform.y = 580; // Near bottom edge (600 - 20 radius)
      movement.setDirection(0, 1);
      movement.update(1000);

      expect(transform.y).toBe(580); // Should not move beyond boundary
    });

    it('should prevent movement beyond top boundary', () => {
      transform.y = 20; // Near top edge
      movement.setDirection(0, -1);
      movement.update(1000);

      expect(transform.y).toBe(20); // Should not move beyond boundary
    });

    it('should allow movement within boundaries', () => {
      transform.x = 400;
      transform.y = 300;
      movement.setDirection(1, 0);
      movement.update(100); // Small movement

      expect(transform.x).toBe(420); // Should move freely
    });
  });

  describe('stop', () => {
    it('should stop movement', () => {
      movement.setDirection(1, 1);
      movement.stop();

      expect(movement.direction.x).toBe(0);
      expect(movement.direction.y).toBe(0);
      expect(movement.velocity.x).toBe(0);
      expect(movement.velocity.y).toBe(0);
    });
  });

  describe('getSpeed', () => {
    it('should return current speed', () => {
      expect(movement.getSpeed()).toBe(200);
    });
  });

  describe('setSpeed', () => {
    it('should update speed', () => {
      movement.setSpeed(300);
      expect(movement.speed).toBe(300);
      expect(movement.getSpeed()).toBe(300);
    });

    it('should not allow negative speed', () => {
      movement.setSpeed(-100);
      expect(movement.speed).toBe(0);
    });
  });

  describe('integration with entity', () => {
    it('should be retrievable from entity', () => {
      const retrievedMovement = entity.getComponent('Movement');
      expect(retrievedMovement).toBe(movement);
    });

    it('should update position when entity updates', () => {
      movement.setDirection(1, 0);
      entity.update(1000);

      expect(transform.x).toBe(300);
    });
  });
});