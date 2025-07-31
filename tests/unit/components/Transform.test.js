import { describe, it, expect, beforeEach } from 'vitest';
import { Transform } from '../../../src/components/Transform.js';
import { Entity } from '../../../src/engine/Entity.js';

describe('Transform', () => {
  let entity;
  let transform;

  beforeEach(() => {
    entity = new Entity(0, 0);
    transform = new Transform(entity, 100, 200);
  });

  describe('constructor', () => {
    it('should initialize with correct position', () => {
      expect(transform.x).toBe(100);
      expect(transform.y).toBe(200);
    });

    it('should have correct type', () => {
      expect(transform.type).toBe('Transform');
    });

    it('should initialize with default position if not provided', () => {
      const defaultTransform = new Transform(entity);
      expect(defaultTransform.x).toBe(0);
      expect(defaultTransform.y).toBe(0);
    });

    it('should initialize with zero rotation and scale 1', () => {
      expect(transform.rotation).toBe(0);
      expect(transform.scaleX).toBe(1);
      expect(transform.scaleY).toBe(1);
    });
  });

  describe('setPosition', () => {
    it('should update position', () => {
      transform.setPosition(50, 75);
      expect(transform.x).toBe(50);
      expect(transform.y).toBe(75);
    });

    it('should return transform for method chaining', () => {
      const result = transform.setPosition(50, 75);
      expect(result).toBe(transform);
    });

    it('should sync with entity position', () => {
      transform.setPosition(150, 250);
      expect(entity.x).toBe(150);
      expect(entity.y).toBe(250);
    });
  });

  describe('translate', () => {
    it('should move by offset', () => {
      transform.translate(25, 35);
      expect(transform.x).toBe(125);
      expect(transform.y).toBe(235);
    });

    it('should return transform for method chaining', () => {
      const result = transform.translate(10, 20);
      expect(result).toBe(transform);
    });
  });

  describe('setRotation', () => {
    it('should update rotation', () => {
      transform.setRotation(Math.PI / 2);
      expect(transform.rotation).toBe(Math.PI / 2);
    });

    it('should normalize rotation to 0-2π range', () => {
      transform.setRotation(Math.PI * 3);
      expect(transform.rotation).toBeCloseTo(Math.PI);
    });

    it('should handle negative rotations', () => {
      transform.setRotation(-Math.PI / 2);
      expect(transform.rotation).toBeCloseTo(Math.PI * 1.5);
    });
  });

  describe('setScale', () => {
    it('should update scale', () => {
      transform.setScale(2, 3);
      expect(transform.scaleX).toBe(2);
      expect(transform.scaleY).toBe(3);
    });

    it('should use same value for both axes if only one provided', () => {
      transform.setScale(1.5);
      expect(transform.scaleX).toBe(1.5);
      expect(transform.scaleY).toBe(1.5);
    });
  });

  describe('getWorldMatrix', () => {
    it('should return transformation matrix for rendering', () => {
      transform.setPosition(100, 200);
      transform.setRotation(Math.PI / 4);
      transform.setScale(2, 3);
      
      const matrix = transform.getWorldMatrix();
      
      expect(matrix).toHaveProperty('x', 100);
      expect(matrix).toHaveProperty('y', 200);
      expect(matrix).toHaveProperty('rotation', Math.PI / 4);
      expect(matrix).toHaveProperty('scaleX', 2);
      expect(matrix).toHaveProperty('scaleY', 3);
    });
  });

  describe('distanceTo', () => {
    it('should calculate distance to another transform', () => {
      const otherEntity = new Entity(0, 0);
      const otherTransform = new Transform(otherEntity, 300, 600);
      
      const distance = transform.distanceTo(otherTransform);
      
      // Distance from (100, 200) to (300, 600)
      // sqrt((300-100)² + (600-200)²) = sqrt(200² + 400²) = sqrt(200000) ≈ 447.21
      expect(distance).toBeCloseTo(447.21, 1);
    });

    it('should return 0 for same position', () => {
      const otherEntity = new Entity(0, 0);
      const otherTransform = new Transform(otherEntity, 100, 200);
      
      const distance = transform.distanceTo(otherTransform);
      expect(distance).toBe(0);
    });
  });
});