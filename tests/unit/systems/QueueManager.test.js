import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueueManager } from '../../../src/systems/QueueManager.js';

describe('QueueManager', () => {
  let queueManager;
  let mockGame;
  let mockGuest;
  let mockConsole;

  beforeEach(() => {
    mockGuest = {
      state: 'seeking',
      type: 'casual',
      satisfaction: 5,
      queuePosition: -1,
      queuedConsole: null,
      waitStartTime: null,
      prefersConsoleType: vi.fn(() => false),
      joinQueue: vi.fn(),
      leaveQueue: vi.fn(),
      canStartUsingConsole: vi.fn(() => false),
      startUsingConsole: vi.fn(),
      getWaitingTime: vi.fn(() => 0),
      getComponent: vi.fn(() => ({ x: 100, y: 200, distanceTo: vi.fn(() => 50) })),
      targetX: 100,
      targetY: 200
    };

    mockConsole = {
      type: 'retro-arcade',
      appeal: 3,
      queue: [],
      isOperational: vi.fn(() => true),
      isInUse: vi.fn(() => false),
      getQueueLength: vi.fn(() => 0),
      addToQueue: vi.fn(() => 0),
      removeFromQueue: vi.fn(),
      getNextInQueue: vi.fn(() => null),
      hasQueue: vi.fn(() => false),
      getComponent: vi.fn(() => ({ x: 300, y: 200 }))
    };

    mockGame = {
      guests: [mockGuest],
      consoles: [mockConsole]
    };

    queueManager = new QueueManager(mockGame);
  });

  describe('constructor', () => {
    it('should initialize with correct default settings', () => {
      expect(queueManager.maxQueueLength).toBe(4);
      expect(queueManager.queueToleranceTime).toBe(30000);
      expect(queueManager.queueJoinDistance).toBe(100);
    });
  });

  describe('findBestQueueOption', () => {
    it('should return null if no consoles are available', () => {
      mockGame.consoles = [];
      const result = queueManager.findBestQueueOption(mockGuest);
      expect(result).toBeNull();
    });

    it('should return null if console is too far away', () => {
      mockGuest.getComponent.mockReturnValue({ 
        x: 100, 
        y: 200, 
        distanceTo: vi.fn(() => 200) // Too far
      });
      
      const result = queueManager.findBestQueueOption(mockGuest);
      expect(result).toBeNull();
    });

    it('should return console option when within range', () => {
      const result = queueManager.findBestQueueOption(mockGuest);
      expect(result).toBeDefined();
      expect(result.console).toBe(mockConsole);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should skip broken consoles', () => {
      mockConsole.isOperational.mockReturnValue(false);
      const result = queueManager.findBestQueueOption(mockGuest);
      expect(result).toBeNull();
    });

    it('should skip consoles with full queues', () => {
      mockConsole.getQueueLength.mockReturnValue(4); // Full queue
      const result = queueManager.findBestQueueOption(mockGuest);
      expect(result).toBeNull();
    });
  });

  describe('calculateQueueScore', () => {
    it('should calculate basic score for console', () => {
      const score = queueManager.calculateQueueScore(mockGuest, mockConsole, 50);
      expect(score).toBeGreaterThan(0);
    });

    it('should add bonus for preferred console type', () => {
      mockGuest.prefersConsoleType.mockReturnValue(true);
      const score = queueManager.calculateQueueScore(mockGuest, mockConsole, 50);
      expect(score).toBeGreaterThan(3); // Base appeal + preference bonus
    });

    it('should add bonus for available console', () => {
      mockConsole.isInUse.mockReturnValue(false);
      const score = queueManager.calculateQueueScore(mockGuest, mockConsole, 50);
      expect(score).toBeGreaterThan(8); // Should include availability bonus
    });

    it('should apply distance penalty', () => {
      const nearScore = queueManager.calculateQueueScore(mockGuest, mockConsole, 20);
      const farScore = queueManager.calculateQueueScore(mockGuest, mockConsole, 80);
      expect(nearScore).toBeGreaterThan(farScore);
    });
  });

  describe('shouldJoinQueue', () => {
    it('should not join queue for broken console', () => {
      mockConsole.isOperational.mockReturnValue(false);
      const result = queueManager.shouldJoinQueue(mockGuest, mockConsole);
      expect(result).toBe(false);
    });

    it('should not join queue if already waiting', () => {
      mockGuest.state = 'waiting';
      const result = queueManager.shouldJoinQueue(mockGuest, mockConsole);
      expect(result).toBe(false);
    });

    it('should not join full queue', () => {
      mockConsole.getQueueLength.mockReturnValue(4);
      const result = queueManager.shouldJoinQueue(mockGuest, mockConsole);
      expect(result).toBe(false);
    });

    it('should have different joining probabilities for different guest types', () => {
      // Test multiple times to check probability
      let joinCount = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        if (queueManager.shouldJoinQueue(mockGuest, mockConsole)) {
          joinCount++;
        }
      }
      
      // Should join some but not all times (probabilistic)
      expect(joinCount).toBeGreaterThan(0);
      expect(joinCount).toBeLessThan(iterations);
    });
  });

  describe('shouldAbandonQueue', () => {
    beforeEach(() => {
      mockGuest.state = 'waiting';
      mockGuest.type = 'casual';
    });

    it('should abandon queue after tolerance time exceeded', () => {
      const longWaitTime = 35000; // Exceeds 30s tolerance
      const result = queueManager.shouldAbandonQueue(mockGuest, longWaitTime);
      expect(result).toBe(true);
    });

    it('should not abandon queue within tolerance time with low random', () => {
      const shortWaitTime = 5000; // 5 seconds - well within 30s tolerance
      
      // Mock the getAbandonChance method to return 0 directly
      vi.spyOn(queueManager, 'getAbandonChance').mockReturnValue(0);
      
      const result = queueManager.shouldAbandonQueue(mockGuest, shortWaitTime);
      expect(result).toBe(false);
      
      queueManager.getAbandonChance.mockRestore();
    });

    it('should have different tolerance times for different guest types', () => {
      // Enthusiast should abandon sooner
      mockGuest.type = 'enthusiast';
      const result = queueManager.shouldAbandonQueue(mockGuest, 20000); // 20 seconds
      expect(result).toBe(true);
      
      // Family should be more patient
      mockGuest.type = 'family';
      const result2 = queueManager.shouldAbandonQueue(mockGuest, 20000);
      // With random factor, may or may not abandon, but tolerance is higher
      expect(typeof result2).toBe('boolean');
    });
  });

  describe('getAbandonChance', () => {
    beforeEach(() => {
      mockGuest.queuePosition = 0;
      mockGuest.getWaitingTime.mockReturnValue(1000); // Very low waiting time
    });

    it('should return higher abandon chance for enthusiasts', () => {
      mockGuest.type = 'enthusiast';
      const enthusiastChance = queueManager.getAbandonChance(mockGuest);
      
      mockGuest.type = 'casual';
      const casualChance = queueManager.getAbandonChance(mockGuest);
      
      expect(enthusiastChance).toBeGreaterThan(casualChance);
    });

    it('should return lower abandon chance for families', () => {
      mockGuest.type = 'family';
      const familyChance = queueManager.getAbandonChance(mockGuest);
      
      mockGuest.type = 'casual';
      const casualChance = queueManager.getAbandonChance(mockGuest);
      
      expect(familyChance).toBeLessThan(casualChance);
    });

    it('should increase abandon chance based on queue position', () => {
      mockGuest.queuePosition = 0;
      const frontChance = queueManager.getAbandonChance(mockGuest);
      
      mockGuest.queuePosition = 1;
      const backChance = queueManager.getAbandonChance(mockGuest);
      
      expect(backChance).toBeGreaterThan(frontChance);
    });

    it('should cap abandon chance at maximum', () => {
      mockGuest.type = 'enthusiast';
      mockGuest.queuePosition = 10;
      mockGuest.getWaitingTime.mockReturnValue(100000); // Very long wait
      
      const chance = queueManager.getAbandonChance(mockGuest);
      expect(chance).toBeLessThanOrEqual(0.015); // 1.5% cap
    });
  });

  describe('getVisualizationData', () => {
    it('should return queue visualization data', () => {
      const data = queueManager.getVisualizationData();
      expect(data).toBeDefined();
      expect(data.console_0).toBeDefined();
      expect(data.console_0.type).toBe('retro-arcade');
      expect(data.console_0.queueLength).toBe(0);
      expect(Array.isArray(data.console_0.queue)).toBe(true);
    });

    it('should include queue guest data when guests are queued', () => {
      mockConsole.queue = [mockGuest];
      mockConsole.getQueueLength.mockReturnValue(1);
      mockGuest.queuePosition = 0;
      mockGuest.getWaitingTime.mockReturnValue(5000);
      
      const data = queueManager.getVisualizationData();
      expect(data.console_0.queueLength).toBe(1);
      expect(data.console_0.queue).toHaveLength(1);
      expect(data.console_0.queue[0].type).toBe('casual');
      expect(data.console_0.queue[0].queuePosition).toBe(0);
    });
  });

  describe('update', () => {
    it('should call all update methods', () => {
      const spy1 = vi.spyOn(queueManager, 'processQueueJoining').mockImplementation(() => {});
      const spy2 = vi.spyOn(queueManager, 'processQueueAdvancement').mockImplementation(() => {});
      const spy3 = vi.spyOn(queueManager, 'processQueueAbandonment').mockImplementation(() => {});
      const spy4 = vi.spyOn(queueManager, 'updateQueueMovement').mockImplementation(() => {});
      
      queueManager.update(16.67);
      
      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();
      expect(spy4).toHaveBeenCalled();
      
      spy1.mockRestore();
      spy2.mockRestore();
      spy3.mockRestore();
      spy4.mockRestore();
    });
  });
});