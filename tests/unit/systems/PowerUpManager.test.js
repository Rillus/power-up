import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PowerUpManager } from '../../../src/systems/PowerUpManager.js';
import { PowerUp } from '../../../src/entities/PowerUp.js';

describe('PowerUpManager', () => {
  let powerUpManager;
  let mockGame;
  let mockCharacter;
  let mockPowerUp;

  beforeEach(() => {
    mockCharacter = {
      name: 'TestCharacter',
      speedMultiplier: 1.0,
      repairMultiplier: 1.0,
      hasSpeedBoost: false,
      hasRepairBoost: false,
      getComponent: vi.fn(() => ({ x: 400, y: 300 }))
    };

    mockPowerUp = {
      type: 'speed-boost',
      collected: false,
      shouldRemove: vi.fn(() => false),
      canBeCollectedBy: vi.fn(() => false),
      collect: vi.fn(),
      getComponent: vi.fn(() => ({ x: 200, y: 200 })),
      on: vi.fn()
    };

    mockGame = {
      canvas: { width: 800, height: 600 },
      character: mockCharacter,
      consoles: [
        { getComponent: () => ({ x: 100, y: 100 }) },
        { getComponent: () => ({ x: 300, y: 400 }) }
      ],
      powerUps: [],
      entities: [],
      createFloatingNumber: vi.fn(),
      audioSystem: {
        playPowerUpSound: vi.fn()
      }
    };

    powerUpManager = new PowerUpManager(mockGame);
  });

  describe('constructor', () => {
    it('should initialize with correct default settings', () => {
      expect(powerUpManager.spawnInterval).toBe(45000);
      expect(powerUpManager.maxPowerUps).toBe(2);
      expect(powerUpManager.activeEffects).toBeInstanceOf(Map);
    });
  });

  describe('spawning', () => {
    it('should spawn power-up when interval has passed', () => {
      powerUpManager.lastSpawnTime = Date.now() - 50000; // 50 seconds ago
      
      const spawnSpy = vi.spyOn(powerUpManager, 'spawnRandomPowerUp').mockImplementation(() => {});
      
      powerUpManager.updateSpawning();
      
      expect(spawnSpy).toHaveBeenCalled();
    });

    it('should not spawn when interval has not passed', () => {
      powerUpManager.lastSpawnTime = Date.now() - 10000; // 10 seconds ago
      
      const spawnSpy = vi.spyOn(powerUpManager, 'spawnRandomPowerUp').mockImplementation(() => {});
      
      powerUpManager.updateSpawning();
      
      expect(spawnSpy).not.toHaveBeenCalled();
    });

    it('should not spawn when at max power-ups', () => {
      mockGame.powerUps = [mockPowerUp, mockPowerUp]; // At max capacity
      powerUpManager.lastSpawnTime = Date.now() - 50000;
      
      const spawnSpy = vi.spyOn(powerUpManager, 'spawnRandomPowerUp').mockImplementation(() => {});
      
      powerUpManager.updateSpawning();
      
      expect(spawnSpy).not.toHaveBeenCalled();
    });

    it('should find good spawn position', () => {
      const position = powerUpManager.findGoodSpawnPosition();
      
      expect(position.x).toBeGreaterThan(100);
      expect(position.x).toBeLessThan(700);
      expect(position.y).toBeGreaterThan(100);
      expect(position.y).toBeLessThan(500);
    });

    it('should manually spawn power-up', () => {
      const powerUp = powerUpManager.spawnPowerUp('speed-boost', 200, 300);
      
      expect(mockGame.powerUps).toContain(powerUp);
      expect(mockGame.entities).toContain(powerUp);
      expect(powerUp.type).toBe('speed-boost');
    });
  });

  describe('collection', () => {
    beforeEach(() => {
      mockGame.powerUps = [mockPowerUp];
    });

    it('should detect power-up collection', () => {
      mockPowerUp.canBeCollectedBy.mockReturnValue(true);
      
      powerUpManager.updateCollection();
      
      expect(mockPowerUp.collect).toHaveBeenCalledWith(mockCharacter);
    });

    it('should not collect when character is too far', () => {
      mockPowerUp.canBeCollectedBy.mockReturnValue(false);
      
      powerUpManager.updateCollection();
      
      expect(mockPowerUp.collect).not.toHaveBeenCalled();
    });

    it('should handle power-up collection event', () => {
      const collectionData = {
        powerUp: mockPowerUp,
        character: mockCharacter,
        type: 'speed-boost',
        config: { name: 'Speed Boost', color: '#00FF00', duration: 10000, multiplier: 2.0 }
      };
      
      const activateSpy = vi.spyOn(powerUpManager, 'activateEffect').mockImplementation(() => {});
      
      powerUpManager.handlePowerUpCollection(collectionData);
      
      expect(activateSpy).toHaveBeenCalledWith('speed-boost', collectionData.config);
      expect(mockGame.createFloatingNumber).toHaveBeenCalled();
      expect(mockGame.audioSystem.playPowerUpSound).toHaveBeenCalled();
    });
  });

  describe('effect management', () => {
    it('should activate speed boost effect', () => {
      const config = {
        effect: 'speed',
        multiplier: 2.0,
        duration: 10000,
        cooldown: 30000
      };
      
      powerUpManager.activateEffect('speed-boost', config);
      
      expect(powerUpManager.activeEffects.has('speed-boost')).toBe(true);
      expect(mockCharacter.speedMultiplier).toBe(2.0);
      expect(mockCharacter.hasSpeedBoost).toBe(true);
    });

    it('should activate repair boost effect', () => {
      const config = {
        effect: 'repair',
        multiplier: 10.0,
        duration: 15000,
        cooldown: 45000
      };
      
      powerUpManager.activateEffect('repair-master', config);
      
      expect(powerUpManager.activeEffects.has('repair-master')).toBe(true);
      expect(mockCharacter.repairMultiplier).toBe(10.0);
      expect(mockCharacter.hasRepairBoost).toBe(true);
    });

    it('should not activate effect when on cooldown', () => {
      const config = {
        effect: 'speed',
        multiplier: 2.0,
        duration: 10000,
        cooldown: 30000
      };
      
      // Activate once
      powerUpManager.activateEffect('speed-boost', config);
      
      // Reset character state
      mockCharacter.speedMultiplier = 1.0;
      mockCharacter.hasSpeedBoost = false;
      
      // Try to activate again immediately (should be on cooldown)
      powerUpManager.activateEffect('speed-boost', config);
      
      expect(mockCharacter.speedMultiplier).toBe(1.0);
      expect(mockCharacter.hasSpeedBoost).toBe(false);
    });

    it('should deactivate expired effects', () => {
      const config = {
        effect: 'speed',
        multiplier: 2.0,
        duration: 1000, // 1 second
        cooldown: 30000
      };
      
      // Activate effect
      powerUpManager.activateEffect('speed-boost', config);
      expect(mockCharacter.speedMultiplier).toBe(2.0);
      
      // Mock effect as expired
      const effect = powerUpManager.activeEffects.get('speed-boost');
      effect.startTime = Date.now() - 2000; // 2 seconds ago (expired)
      
      powerUpManager.updateActiveEffects();
      
      expect(powerUpManager.activeEffects.has('speed-boost')).toBe(false);
      expect(mockCharacter.speedMultiplier).toBe(1.0);
      expect(mockCharacter.hasSpeedBoost).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove expired power-ups', () => {
      const expiredPowerUp = { ...mockPowerUp, shouldRemove: () => true };
      mockGame.powerUps = [expiredPowerUp];
      mockGame.entities = [expiredPowerUp];
      
      powerUpManager.cleanupPowerUps();
      
      expect(mockGame.powerUps).not.toContain(expiredPowerUp);
      expect(mockGame.entities).not.toContain(expiredPowerUp);
    });

    it('should keep active power-ups', () => {
      mockGame.powerUps = [mockPowerUp];
      mockGame.entities = [mockPowerUp];
      
      powerUpManager.cleanupPowerUps();
      
      expect(mockGame.powerUps).toContain(mockPowerUp);
      expect(mockGame.entities).toContain(mockPowerUp);
    });
  });

  describe('effect queries', () => {
    beforeEach(() => {
      const config = {
        effect: 'speed',
        multiplier: 2.0,
        duration: 10000,
        cooldown: 30000
      };
      powerUpManager.activateEffect('speed-boost', config);
    });

    it('should return active effects', () => {
      const activeEffects = powerUpManager.getActiveEffects();
      expect(activeEffects.has('speed-boost')).toBe(true);
    });

    it('should check if effect is active', () => {
      expect(powerUpManager.isEffectActive('speed-boost')).toBe(true);
      expect(powerUpManager.isEffectActive('repair-master')).toBe(false);
    });

    it('should get remaining time for active effect', () => {
      const remainingTime = powerUpManager.getEffectRemainingTime('speed-boost');
      expect(remainingTime).toBeGreaterThan(9000);
      expect(remainingTime).toBeLessThanOrEqual(10000);
    });

    it('should return 0 for inactive effect remaining time', () => {
      const remainingTime = powerUpManager.getEffectRemainingTime('repair-master');
      expect(remainingTime).toBe(0);
    });
  });

  describe('update cycle', () => {
    it('should call all update methods', () => {
      const spawnSpy = vi.spyOn(powerUpManager, 'updateSpawning').mockImplementation(() => {});
      const collectionSpy = vi.spyOn(powerUpManager, 'updateCollection').mockImplementation(() => {});
      const effectsSpy = vi.spyOn(powerUpManager, 'updateActiveEffects').mockImplementation(() => {});
      const cleanupSpy = vi.spyOn(powerUpManager, 'cleanupPowerUps').mockImplementation(() => {});
      
      powerUpManager.update(16.67);
      
      expect(spawnSpy).toHaveBeenCalled();
      expect(collectionSpy).toHaveBeenCalled();
      expect(effectsSpy).toHaveBeenCalled();
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('event system', () => {
    it('should emit power-up spawned event', () => {
      const eventSpy = vi.fn();
      powerUpManager.on('powerUpSpawned', eventSpy);
      
      powerUpManager.spawnPowerUp('speed-boost', 200, 300);
      
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit power-up collected event', () => {
      const eventSpy = vi.fn();
      powerUpManager.on('powerUpCollected', eventSpy);
      
      const collectionData = {
        powerUp: mockPowerUp,
        character: mockCharacter,
        type: 'speed-boost',
        config: { name: 'Speed Boost', color: '#00FF00', duration: 10000, multiplier: 2.0 }
      };
      
      powerUpManager.handlePowerUpCollection(collectionData);
      
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit effect activated event', () => {
      const eventSpy = vi.fn();
      powerUpManager.on('effectActivated', eventSpy);
      
      const config = {
        effect: 'speed',
        multiplier: 2.0,
        duration: 10000,
        cooldown: 30000
      };
      
      powerUpManager.activateEffect('speed-boost', config);
      
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should handle errors in event listeners', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const faultyListener = () => { throw new Error('Test error'); };
      
      powerUpManager.on('testEvent', faultyListener);
      powerUpManager.emit('testEvent', {});
      
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});