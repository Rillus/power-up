import { describe, it, expect, beforeEach } from 'vitest';
import { CameraSystem } from '../../../src/engine/systems/CameraSystem.js';

describe('CameraSystem', () => {
  let cameraSystem;

  beforeEach(() => {
    cameraSystem = new CameraSystem(800, 600);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(cameraSystem.canvasWidth).toBe(800);
      expect(cameraSystem.canvasHeight).toBe(600);
      expect(cameraSystem.followSpeed).toBe(0.1);
      expect(cameraSystem.lookAheadDistance).toBe(50);
      expect(cameraSystem.maxLookAhead).toBe(100);
      expect(cameraSystem.enabled).toBe(true);
      expect(cameraSystem.x).toBe(0);
      expect(cameraSystem.y).toBe(0);
    });

    it('should accept custom options', () => {
      const customCamera = new CameraSystem(1200, 800, {
        followSpeed: 0.2,
        lookAheadDistance: 100,
        maxLookAhead: 200,
        enabled: false
      });

      expect(customCamera.followSpeed).toBe(0.2);
      expect(customCamera.lookAheadDistance).toBe(100);
      expect(customCamera.maxLookAhead).toBe(200);
      expect(customCamera.enabled).toBe(false);
    });
  });

  describe('setTarget', () => {
    it('should set target position when enabled', () => {
      cameraSystem.setTarget(400, 300);
      
      // Target should be centered on screen
      expect(cameraSystem.targetX).toBe(400 - 400); // 400 - canvasWidth/2
      expect(cameraSystem.targetY).toBe(300 - 300); // 300 - canvasHeight/2
    });

    it('should not set target when disabled', () => {
      cameraSystem.setEnabled(false);
      cameraSystem.setTarget(400, 300);
      
      expect(cameraSystem.targetX).toBe(0);
      expect(cameraSystem.targetY).toBe(0);
    });

    it('should apply look-ahead based on velocity', () => {
      cameraSystem.setTarget(400, 300, { x: 100, y: 50 });
      
      // Should look ahead in the direction of movement
      const expectedLookAheadX = Math.min(100 * 50 / 200, 100); // velocity.x * lookAheadDistance / 200, maxLookAhead
      const expectedLookAheadY = Math.min(50 * 50 / 200, 100);
      
      expect(cameraSystem.targetX).toBe(400 + expectedLookAheadX - 400);
      expect(cameraSystem.targetY).toBe(300 + expectedLookAheadY - 300);
    });

    it('should limit look-ahead to maximum distance', () => {
      cameraSystem.setTarget(400, 300, { x: 1000, y: 1000 });
      
      // Should be limited to maxLookAhead
      expect(cameraSystem.targetX).toBe(400 + 100 - 400); // 400 + maxLookAhead - canvasWidth/2
      expect(cameraSystem.targetY).toBe(300 + 100 - 300); // 300 + maxLookAhead - canvasHeight/2
    });
  });

  describe('update', () => {
    it('should smoothly follow target', () => {
      cameraSystem.setTarget(400, 300);
      cameraSystem.update(1/60); // 60 FPS
      
      // Should move towards target (target is at 0,0 after centering)
      expect(cameraSystem.x).toBeLessThanOrEqual(0);
      expect(cameraSystem.y).toBeLessThanOrEqual(0);
    });

    it('should not update when disabled', () => {
      cameraSystem.setEnabled(false);
      cameraSystem.setTarget(400, 300);
      cameraSystem.update(1/60);
      
      expect(cameraSystem.x).toBe(0);
      expect(cameraSystem.y).toBe(0);
    });

    it('should clamp to world bounds', () => {
      cameraSystem.setWorldBounds({
        left: 0,
        right: 1000,
        top: 0,
        bottom: 800
      });
      
      cameraSystem.setTarget(-100, -100); // Outside bounds
      cameraSystem.update(1/60);
      
      expect(cameraSystem.x).toBe(0); // Clamped to left bound
      expect(cameraSystem.y).toBe(0); // Clamped to top bound
    });
  });

  describe('screen shake', () => {
    it('should add shake effect', () => {
      cameraSystem.addShake(20, 0.9);
      
      expect(cameraSystem.shakeIntensity).toBe(20);
      expect(cameraSystem.shakeDecay).toBe(0.9);
    });

    it('should update shake offset', () => {
      cameraSystem.addShake(10);
      cameraSystem.update(1/60);
      
      // Should have some shake offset
      expect(Math.abs(cameraSystem.shakeOffsetX)).toBeLessThanOrEqual(5);
      expect(Math.abs(cameraSystem.shakeOffsetY)).toBeLessThanOrEqual(5);
    });

    it('should decay shake over time', () => {
      cameraSystem.addShake(10);
      const initialIntensity = cameraSystem.shakeIntensity;
      
      cameraSystem.update(1/60);
      
      expect(cameraSystem.shakeIntensity).toBeLessThan(initialIntensity);
    });

    it('should stop shake when intensity is low', () => {
      cameraSystem.addShake(0.15);
      cameraSystem.update(1/60);
      
      // Should start with shake active
      expect(cameraSystem.shakeIntensity).toBeGreaterThan(0);
      
      // Update until shake stops (should happen when intensity < 0.05)
      let updates = 0;
      while (cameraSystem.shakeIntensity > 0 && updates < 50) {
        cameraSystem.update(1/60);
        updates++;
      }
      
      // Now shake should be stopped
      expect(cameraSystem.shakeIntensity).toBe(0);
      expect(cameraSystem.shakeOffsetX).toBe(0);
      expect(cameraSystem.shakeOffsetY).toBe(0);
    });
  });

  describe('getTransform', () => {
    it('should return transform matrix with camera offset', () => {
      cameraSystem.x = 100;
      cameraSystem.y = 50;
      cameraSystem.shakeOffsetX = 5;
      cameraSystem.shakeOffsetY = -3;
      
      const transform = cameraSystem.getTransform();
      
      // Should translate by negative camera position plus shake
      expect(transform.a).toBe(1); // Scale X
      expect(transform.d).toBe(1); // Scale Y
      expect(transform.e).toBe(-100 + 5); // Translate X
      expect(transform.f).toBe(-50 + (-3)); // Translate Y
    });
  });

  describe('getPosition', () => {
    it('should return current camera position', () => {
      cameraSystem.x = 150;
      cameraSystem.y = 75;
      
      const position = cameraSystem.getPosition();
      
      expect(position.x).toBe(150);
      expect(position.y).toBe(75);
    });
  });

  describe('setWorldBounds', () => {
    it('should set world bounds', () => {
      const bounds = {
        left: 10,
        right: 790,
        top: 20,
        bottom: 580
      };
      
      cameraSystem.setWorldBounds(bounds);
      
      expect(cameraSystem.worldBounds).toEqual(bounds);
    });
  });

  describe('setEnabled', () => {
    it('should enable/disable camera follow', () => {
      cameraSystem.setEnabled(false);
      expect(cameraSystem.enabled).toBe(false);
      
      cameraSystem.setEnabled(true);
      expect(cameraSystem.enabled).toBe(true);
    });
  });

  describe('setFollowSpeed', () => {
    it('should set follow speed within valid range', () => {
      cameraSystem.setFollowSpeed(0.5);
      expect(cameraSystem.followSpeed).toBe(0.5);
      
      cameraSystem.setFollowSpeed(-1); // Should clamp to 0
      expect(cameraSystem.followSpeed).toBe(0);
      
      cameraSystem.setFollowSpeed(2); // Should clamp to 1
      expect(cameraSystem.followSpeed).toBe(1);
    });
  });

  describe('setLookAheadDistance', () => {
    it('should set look-ahead distance', () => {
      cameraSystem.setLookAheadDistance(75);
      expect(cameraSystem.lookAheadDistance).toBe(75);
      
      cameraSystem.setLookAheadDistance(-10); // Should clamp to 0
      expect(cameraSystem.lookAheadDistance).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset camera to origin', () => {
      cameraSystem.x = 100;
      cameraSystem.y = 50;
      cameraSystem.targetX = 200;
      cameraSystem.targetY = 100;
      cameraSystem.shakeIntensity = 10;
      cameraSystem.shakeOffsetX = 5;
      cameraSystem.shakeOffsetY = 3;
      
      cameraSystem.reset();
      
      expect(cameraSystem.x).toBe(0);
      expect(cameraSystem.y).toBe(0);
      expect(cameraSystem.targetX).toBe(0);
      expect(cameraSystem.targetY).toBe(0);
      expect(cameraSystem.shakeIntensity).toBe(0);
      expect(cameraSystem.shakeOffsetX).toBe(0);
      expect(cameraSystem.shakeOffsetY).toBe(0);
    });
  });

  describe('exportState/importState', () => {
    it('should export and import camera state', () => {
      cameraSystem.x = 100;
      cameraSystem.y = 50;
      cameraSystem.targetX = 200;
      cameraSystem.targetY = 100;
      cameraSystem.enabled = false;
      cameraSystem.followSpeed = 0.2;
      cameraSystem.lookAheadDistance = 75;
      cameraSystem.worldBounds = { left: 10, right: 790, top: 20, bottom: 580 };
      
      const state = cameraSystem.exportState();
      
      const newCamera = new CameraSystem(800, 600);
      newCamera.importState(state);
      
      expect(newCamera.x).toBe(100);
      expect(newCamera.y).toBe(50);
      expect(newCamera.targetX).toBe(200);
      expect(newCamera.targetY).toBe(100);
      expect(newCamera.enabled).toBe(false);
      expect(newCamera.followSpeed).toBe(0.2);
      expect(newCamera.lookAheadDistance).toBe(75);
      expect(newCamera.worldBounds).toEqual({ left: 10, right: 790, top: 20, bottom: 580 });
    });
  });
}); 