import { describe, it, expect, beforeEach } from 'vitest';
import { FloatingNumber } from '../../../src/entities/FloatingNumber.js';
import { Transform } from '../../../src/components/Transform.js';

describe('FloatingNumber', () => {
  let floatingNumber;

  beforeEach(() => {
    floatingNumber = new FloatingNumber(100, 200, '+£5', 'green', 2000);
  });

  describe('constructor', () => {
    it('should initialize with correct position and text', () => {
      expect(floatingNumber.x).toBe(100);
      expect(floatingNumber.y).toBe(200);
      expect(floatingNumber.text).toBe('+£5');
      expect(floatingNumber.color).toBe('green');
    });

    it('should have Transform component', () => {
      expect(floatingNumber.hasComponent('Transform')).toBe(true);
      const transform = floatingNumber.getComponent('Transform');
      expect(transform.x).toBe(100);
      expect(transform.y).toBe(200);
    });

    it('should initialize with correct duration and movement', () => {
      expect(floatingNumber.duration).toBe(2000); // 2 seconds
      expect(floatingNumber.lifetime).toBe(0);
      expect(floatingNumber.velocity.x).toBe(0);
      expect(floatingNumber.velocity.y).toBeLessThan(0); // Moving upward
    });

    it('should accept custom colors', () => {
      const redNumber = new FloatingNumber(0, 0, '-£10', 'red');
      expect(redNumber.color).toBe('red');
      expect(redNumber.text).toBe('-£10');
    });

    it('should accept custom movement patterns', () => {
      const customNumber = new FloatingNumber(0, 0, 'REPAIR!', 'yellow', 1500, { x: 20, y: -50 });
      expect(customNumber.velocity.x).toBe(20);
      expect(customNumber.velocity.y).toBe(-50);
      expect(customNumber.duration).toBe(1500);
    });
  });

  describe('animation', () => {
    it('should move upward over time', () => {
      const initialY = floatingNumber.getComponent('Transform').y;
      
      floatingNumber.update(100); // 100ms
      
      const newY = floatingNumber.getComponent('Transform').y;
      expect(newY).toBeLessThan(initialY);
    });

    it('should move horizontally if velocity is set', () => {
      floatingNumber.velocity.x = 30;
      const initialX = floatingNumber.getComponent('Transform').x;
      
      floatingNumber.update(100); // 100ms
      
      const newX = floatingNumber.getComponent('Transform').x;
      expect(newX).toBeGreaterThan(initialX);
    });

    it('should fade out over time', () => {
      const initialOpacity = floatingNumber.opacity;
      
      floatingNumber.update(1000); // 1 second (halfway through 2 second duration)
      
      expect(floatingNumber.opacity).toBeLessThan(initialOpacity);
      expect(floatingNumber.opacity).toBeGreaterThan(0);
    });

    it('should become invisible at end of lifetime', () => {
      floatingNumber.update(2500); // Beyond 2 second duration
      
      expect(floatingNumber.opacity).toBe(0);
      expect(floatingNumber.shouldRemove()).toBe(true);
    });
  });

  describe('lifecycle', () => {
    it('should track lifetime correctly', () => {
      expect(floatingNumber.lifetime).toBe(0);
      
      floatingNumber.update(500);
      expect(floatingNumber.lifetime).toBe(500);
      
      floatingNumber.update(300);
      expect(floatingNumber.lifetime).toBe(800);
    });

    it('should not exceed maximum lifetime', () => {
      floatingNumber.update(5000); // Much longer than duration
      
      expect(floatingNumber.lifetime).toBe(floatingNumber.duration);
    });

    it('should indicate removal when lifetime exceeded', () => {
      expect(floatingNumber.shouldRemove()).toBe(false);
      
      floatingNumber.update(2500); // Beyond duration
      
      expect(floatingNumber.shouldRemove()).toBe(true);
    });

    it('should remain active during normal lifetime', () => {
      floatingNumber.update(1000); // Halfway through
      
      expect(floatingNumber.shouldRemove()).toBe(false);
      expect(floatingNumber.opacity).toBeGreaterThan(0);
    });
  });

  describe('visual properties', () => {
    it('should calculate correct opacity at different times', () => {
      // Start of life
      expect(floatingNumber.getOpacity()).toBe(1);
      
      // Quarter way through
      floatingNumber.update(500);
      expect(floatingNumber.getOpacity()).toBeGreaterThan(0.7);
      
      // Halfway through
      floatingNumber.lifetime = 1000;
      expect(floatingNumber.getOpacity()).toBe(0.5);
      
      // Near end
      floatingNumber.lifetime = 1800;
      expect(floatingNumber.getOpacity()).toBeLessThan(0.2);
    });

    it('should provide rendering data', () => {
      const renderData = floatingNumber.getRenderData();
      
      expect(renderData).toEqual({
        text: '+£5',
        x: 100,
        y: 200,
        color: 'green',
        opacity: 1,
        fontSize: 16
      });
    });

    it('should update render data after movement', () => {
      floatingNumber.update(100);
      const renderData = floatingNumber.getRenderData();
      
      expect(renderData.y).toBeLessThan(200); // Moved up
      expect(renderData.opacity).toBeLessThan(1); // Faded
    });
  });

  describe('different types', () => {
    it('should handle money gain numbers', () => {
      const money = new FloatingNumber(100, 100, '+£8', '#00ff00');
      expect(money.text).toBe('+£8');
      expect(money.color).toBe('#00ff00');
    });

    it('should handle repair cost numbers', () => {
      const repair = new FloatingNumber(200, 150, 'REPAIRING', '#ffff00', 3000);
      expect(repair.text).toBe('REPAIRING');
      expect(repair.color).toBe('#ffff00');
      expect(repair.duration).toBe(3000);
    });

    it('should handle damage numbers', () => {
      const damage = new FloatingNumber(150, 120, 'BROKEN!', '#ff0000', 1500);
      expect(damage.text).toBe('BROKEN!');
      expect(damage.color).toBe('#ff0000');
      expect(damage.duration).toBe(1500);
    });

    it('should handle guest satisfaction numbers', () => {
      const satisfaction = new FloatingNumber(180, 140, '+3 HAPPY', '#0066ff');
      expect(satisfaction.text).toBe('+3 HAPPY');
      expect(satisfaction.color).toBe('#0066ff');
    });
  });

  describe('physics', () => {
    it('should apply velocity correctly', () => {
      floatingNumber.velocity.x = 10;
      floatingNumber.velocity.y = -20;
      
      const initialTransform = floatingNumber.getComponent('Transform');
      const initialX = initialTransform.x;
      const initialY = initialTransform.y;
      
      floatingNumber.update(1000); // 1 second
      
      const finalTransform = floatingNumber.getComponent('Transform');
      
      // Should move by velocity * time
      expect(finalTransform.x).toBeCloseTo(initialX + 10, 1);
      expect(finalTransform.y).toBeCloseTo(initialY - 20, 1);
    });

    it('should handle gravity effect', () => {
      const gravityNumber = new FloatingNumber(100, 100, 'TEST', 'white', 2000, { x: 0, y: -30 }, true);
      
      const initialY = gravityNumber.getComponent('Transform').y;
      
      // Small time step - should still be moving up due to initial velocity
      gravityNumber.update(100);
      let currentY = gravityNumber.getComponent('Transform').y;
      expect(currentY).toBeLessThan(initialY);
      
      // Longer time - gravity should start pulling down
      gravityNumber.update(1000);
      const finalY = gravityNumber.getComponent('Transform').y;
      expect(gravityNumber.velocity.y).toBeGreaterThan(-30); // Gravity effect
    });
  });
});