import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PowerUp } from '../../../src/entities/PowerUp.js';
import { Transform } from '../../../src/components/Transform.js';

describe('PowerUp', () => {
  let powerUp;
  let mockCharacter;

  beforeEach(() => {
    powerUp = new PowerUp(100, 200, 'speed-boost');
    
    mockCharacter = {
      name: 'TestCharacter',
      getComponent: vi.fn(() => ({ x: 100, y: 200, distanceTo: vi.fn(() => 25) }))
    };
  });

  describe('constructor', () => {
    it('should initialize with correct position and type', () => {
      expect(powerUp.x).toBe(100);
      expect(powerUp.y).toBe(200);
      expect(powerUp.type).toBe('speed-boost');
    });

    it('should have Transform component', () => {
      expect(powerUp.hasComponent('Transform')).toBe(true);
      const transform = powerUp.getComponent('Transform');
      expect(transform.x).toBe(100);
      expect(transform.y).toBe(200);
    });

    it('should initialize with speed-boost configuration', () => {
      expect(powerUp.config.name).toBe('Speed Boost');
      expect(powerUp.config.effect).toBe('speed');
      expect(powerUp.config.multiplier).toBe(2.0);
      expect(powerUp.config.duration).toBe(10000);
    });

    it('should initialize repair-master correctly', () => {
      const repairPowerUp = new PowerUp(0, 0, 'repair-master');
      expect(repairPowerUp.config.name).toBe('Repair Master');
      expect(repairPowerUp.config.effect).toBe('repair');
      expect(repairPowerUp.config.multiplier).toBe(10.0);
      expect(repairPowerUp.config.duration).toBe(15000);
    });

    it('should throw error for invalid power-up type', () => {
      expect(() => {
        new PowerUp(0, 0, 'invalid-type');
      }).toThrow('Invalid power-up type: invalid-type');
    });

    it('should initialize with correct default state', () => {
      expect(powerUp.collected).toBe(false);
      expect(powerUp.spawnTime).toBeDefined();
      expect(powerUp.lifespan).toBe(30000);
    });
  });

  describe('collection', () => {
    it('should detect when character is close enough to collect', () => {
      expect(powerUp.canBeCollectedBy(mockCharacter)).toBe(true);
    });

    it('should not allow collection when character is too far', () => {
      mockCharacter.getComponent.mockReturnValue({ 
        x: 200, 
        y: 200, 
        distanceTo: vi.fn(() => 50) 
      });
      expect(powerUp.canBeCollectedBy(mockCharacter)).toBe(false);
    });

    it('should not allow collection when already collected', () => {
      powerUp.collected = true;
      expect(powerUp.canBeCollectedBy(mockCharacter)).toBe(false);
    });

    it('should collect power-up and emit event', () => {
      const collectSpy = vi.fn();
      powerUp.on('collected', collectSpy);
      
      powerUp.collect(mockCharacter);
      
      expect(powerUp.collected).toBe(true);
      expect(collectSpy).toHaveBeenCalledWith({
        powerUp: powerUp,
        character: mockCharacter,
        type: 'speed-boost',
        config: powerUp.config
      });
    });

    it('should not collect twice', () => {
      const collectSpy = vi.fn();
      powerUp.on('collected', collectSpy);
      
      powerUp.collect(mockCharacter);
      powerUp.collect(mockCharacter);
      
      expect(collectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('lifecycle', () => {
    it('should not be removed when fresh', () => {
      expect(powerUp.shouldRemove()).toBe(false);
    });

    it('should be removed when collected', () => {
      powerUp.collect(mockCharacter);
      expect(powerUp.shouldRemove()).toBe(true);
    });

    it('should be removed when expired', () => {
      powerUp.spawnTime = Date.now() - 35000; // 35 seconds ago (exceeds 30s lifespan)
      expect(powerUp.shouldRemove()).toBe(true);
    });

    it('should update pulse time', () => {
      const initialPulseTime = powerUp.pulseTime;
      powerUp.update(16.67);
      expect(powerUp.pulseTime).toBeGreaterThan(initialPulseTime);
    });

    it('should not update when collected', () => {
      powerUp.collected = true;
      const initialPulseTime = powerUp.pulseTime;
      powerUp.update(16.67);
      expect(powerUp.pulseTime).toBe(initialPulseTime);
    });
  });

  describe('display information', () => {
    it('should return correct display info', () => {
      const info = powerUp.getDisplayInfo();
      
      expect(info.name).toBe('Speed Boost');
      expect(info.description).toBe('Doubles movement speed for 10 seconds');
      expect(info.duration).toBe(10000);
      expect(info.icon).toBe('⚡');
      expect(info.color).toBe('#00FF00');
      expect(typeof info.timeRemaining).toBe('number');
    });

    it('should calculate remaining time correctly', () => {
      powerUp.spawnTime = Date.now() - 5000; // 5 seconds ago
      const info = powerUp.getDisplayInfo();
      
      expect(info.timeRemaining).toBeGreaterThan(20000); // Should have ~25 seconds left
      expect(info.timeRemaining).toBeLessThan(30000);
    });
  });

  describe('static methods', () => {
    it('should return all power-up types', () => {
      const types = PowerUp.getTypes();
      expect(types).toHaveProperty('speed-boost');
      expect(types).toHaveProperty('repair-master');
      expect(types['speed-boost'].name).toBe('Speed Boost');
      expect(types['repair-master'].name).toBe('Repair Master');
    });

    it('should return random type based on rarity', () => {
      // Mock Math.random to test rarity system
      const originalRandom = Math.random;
      
      // Test speed-boost selection (70% chance)
      Math.random = vi.fn(() => 0.5); // 50% should get speed-boost
      expect(PowerUp.getRandomType()).toBe('speed-boost');
      
      // Test repair-master selection (30% chance)
      Math.random = vi.fn(() => 0.9); // 90% should get repair-master (fallback)
      expect(PowerUp.getRandomType()).toBe('speed-boost'); // Fallback to first type
      
      Math.random = originalRandom;
    });
  });

  describe('event system', () => {
    it('should register and emit events', () => {
      const eventSpy = vi.fn();
      powerUp.on('testEvent', eventSpy);
      
      powerUp.emit('testEvent', { data: 'test' });
      expect(eventSpy).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should unregister event listeners', () => {
      const eventSpy = vi.fn();
      powerUp.on('testEvent', eventSpy);
      powerUp.off('testEvent', eventSpy);
      
      powerUp.emit('testEvent', { data: 'test' });
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('should handle errors in event listeners', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const faultyListener = () => { throw new Error('Test error'); };
      
      powerUp.on('testEvent', faultyListener);
      powerUp.emit('testEvent', {});
      
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('visual effects', () => {
    it('should have visual effect properties', () => {
      expect(typeof powerUp.pulseTime).toBe('number');
      expect(typeof powerUp.bobOffset).toBe('number');
    });

    it('should render when not collected', () => {
      const mockRenderer = {
        drawCircle: vi.fn(),
        drawText: vi.fn()
      };
      
      powerUp.render(mockRenderer);
      
      expect(mockRenderer.drawCircle).toHaveBeenCalled();
      expect(mockRenderer.drawText).toHaveBeenCalled();
    });

    it('should not render when collected', () => {
      const mockRenderer = {
        drawCircle: vi.fn(),
        drawText: vi.fn()
      };
      
      powerUp.collected = true;
      powerUp.render(mockRenderer);
      
      expect(mockRenderer.drawCircle).not.toHaveBeenCalled();
      expect(mockRenderer.drawText).not.toHaveBeenCalled();
    });
  });
});