import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DifficultyScalingSystem } from '../../../src/systems/DifficultyScalingSystem.js';

describe('DifficultyScalingSystem', () => {
  let difficultySystem;
  let mockGame;
  let mockGameStateManager;

  beforeEach(() => {
    mockGameStateManager = {
      gameData: {
        day: 1
      },
      on: vi.fn(),
      saveGameData: vi.fn(),
      loadGameData: vi.fn(() => ({}))
    };

    mockGame = {
      guestSpawnInterval: 8000,
      guests: [],
      consoles: [
        { breakdownChance: 0.15 },
        { breakdownChance: 0.15 }
      ]
    };

    difficultySystem = new DifficultyScalingSystem(mockGame, mockGameStateManager);
  });

  describe('initialization', () => {
    it('should initialize with base difficulty settings', () => {
      expect(difficultySystem.baseDifficulty).toBeDefined();
      expect(difficultySystem.baseDifficulty.guestSpawnInterval).toBe(8000);
      expect(difficultySystem.baseDifficulty.maxSimultaneousGuests).toBe(8);
      expect(difficultySystem.baseDifficulty.guestPatienceModifier).toBe(1.0);
      expect(difficultySystem.baseDifficulty.consoleBreakdownRate).toBe(0.15);
    });

    it('should have scaling factors defined', () => {
      expect(difficultySystem.scalingFactors).toBeDefined();
      expect(difficultySystem.scalingFactors.spawnIntervalReduction).toBe(300);
      expect(difficultySystem.scalingFactors.minSpawnInterval).toBe(3000);
      expect(difficultySystem.scalingFactors.maxGuestsIncrease).toBe(1);
      expect(difficultySystem.scalingFactors.patienceDecline).toBe(0.05);
    });

    it('should initialize current difficulty to base difficulty', () => {
      expect(difficultySystem.currentDifficulty.guestSpawnInterval).toBe(8000);
      expect(difficultySystem.currentDifficulty.maxSimultaneousGuests).toBe(8);
      expect(difficultySystem.currentDifficulty.guestPatienceModifier).toBe(1.0);
    });

    it('should set up game event listeners', () => {
      expect(mockGameStateManager.on).toHaveBeenCalledWith('dayStarted', expect.any(Function));
      expect(mockGameStateManager.on).toHaveBeenCalledWith('gameStarted', expect.any(Function));
    });
  });

  describe('difficulty scaling', () => {
    it('should reduce spawn interval as days progress', () => {
      difficultySystem.updateDifficultyForDay(1);
      const day1Interval = difficultySystem.getGuestSpawnInterval();
      
      difficultySystem.updateDifficultyForDay(5);
      const day5Interval = difficultySystem.getGuestSpawnInterval();
      
      expect(day5Interval).toBeLessThan(day1Interval);
      expect(day5Interval).toBe(8000 - (4 * 300)); // 6800ms
    });

    it('should respect minimum spawn interval', () => {
      difficultySystem.updateDifficultyForDay(20); // Very high day
      const interval = difficultySystem.getGuestSpawnInterval();
      
      expect(interval).toBeGreaterThanOrEqual(3000);
    });

    it('should increase max guests as days progress', () => {
      difficultySystem.updateDifficultyForDay(1);
      const day1MaxGuests = difficultySystem.getMaxSimultaneousGuests();
      
      difficultySystem.updateDifficultyForDay(5);
      const day5MaxGuests = difficultySystem.getMaxSimultaneousGuests();
      
      expect(day5MaxGuests).toBeGreaterThanOrEqual(day1MaxGuests);
    });

    it('should respect maximum guest limit', () => {
      difficultySystem.updateDifficultyForDay(50); // Very high day
      const maxGuests = difficultySystem.getMaxSimultaneousGuests();
      
      expect(maxGuests).toBeLessThanOrEqual(16);
    });

    it('should decrease guest patience as days progress', () => {
      difficultySystem.updateDifficultyForDay(1);
      const day1Patience = difficultySystem.getGuestPatienceModifier();
      
      difficultySystem.updateDifficultyForDay(5);
      const day5Patience = difficultySystem.getGuestPatienceModifier();
      
      expect(day5Patience).toBeLessThan(day1Patience);
      expect(day5Patience).toBe(1.0 - (4 * 0.05)); // 0.8
    });

    it('should respect minimum patience modifier', () => {
      difficultySystem.updateDifficultyForDay(30); // Very high day
      const patience = difficultySystem.getGuestPatienceModifier();
      
      expect(patience).toBeGreaterThanOrEqual(0.5);
    });

    it('should increase console breakdown rate as days progress', () => {
      difficultySystem.updateDifficultyForDay(1);
      const day1Rate = difficultySystem.getConsoleBreakdownRate();
      
      difficultySystem.updateDifficultyForDay(5);
      const day5Rate = difficultySystem.getConsoleBreakdownRate();
      
      expect(day5Rate).toBeGreaterThan(day1Rate);
      expect(day5Rate).toBe(0.15 + (4 * 0.02)); // 0.23
    });

    it('should respect maximum breakdown rate', () => {
      difficultySystem.updateDifficultyForDay(30); // Very high day
      const rate = difficultySystem.getConsoleBreakdownRate();
      
      expect(rate).toBeLessThanOrEqual(0.35);
    });
  });

  describe('guest type distribution scaling', () => {
    it('should increase enthusiast percentage over time', () => {
      difficultySystem.updateDifficultyForDay(1);
      const day1Enthusiast = difficultySystem.currentDifficulty.guestTypeDistribution.enthusiast;
      
      difficultySystem.updateDifficultyForDay(10);
      const day10Enthusiast = difficultySystem.currentDifficulty.guestTypeDistribution.enthusiast;
      
      expect(day10Enthusiast).toBeGreaterThan(day1Enthusiast);
    });

    it('should decrease family percentage over time', () => {
      difficultySystem.updateDifficultyForDay(1);
      const day1Family = difficultySystem.currentDifficulty.guestTypeDistribution.family;
      
      difficultySystem.updateDifficultyForDay(10);
      const day10Family = difficultySystem.currentDifficulty.guestTypeDistribution.family;
      
      expect(day10Family).toBeLessThan(day1Family);
    });

    it('should respect maximum enthusiast ratio', () => {
      difficultySystem.updateDifficultyForDay(50); // Very high day
      const enthusiastRatio = difficultySystem.currentDifficulty.guestTypeDistribution.enthusiast;
      
      expect(enthusiastRatio).toBeLessThanOrEqual(0.60);
    });

    it('should normalize distribution to sum to 1.0', () => {
      difficultySystem.updateDifficultyForDay(10);
      const distribution = difficultySystem.currentDifficulty.guestTypeDistribution;
      const sum = Object.values(distribution).reduce((total, val) => total + val, 0);
      
      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe('guest type selection', () => {
    it('should return valid guest types', () => {
      const validTypes = ['family', 'enthusiast', 'casual', 'tourist'];
      
      for (let i = 0; i < 20; i++) {
        const type = difficultySystem.getRandomGuestType();
        expect(validTypes).toContain(type);
      }
    });

    it('should respect distribution probabilities approximately', () => {
      difficultySystem.updateDifficultyForDay(1);
      const typeCounts = { family: 0, enthusiast: 0, casual: 0, tourist: 0 };
      const trials = 1000;
      
      for (let i = 0; i < trials; i++) {
        const type = difficultySystem.getRandomGuestType();
        typeCounts[type]++;
      }
      
      // Check that family is most common (around 40%)
      expect(typeCounts.family).toBeGreaterThan(typeCounts.enthusiast);
      expect(typeCounts.family).toBeGreaterThan(typeCounts.casual);
      expect(typeCounts.family).toBeGreaterThan(typeCounts.tourist);
    });
  });

  describe('guest spawning limits', () => {
    it('should allow spawning when under guest limit', () => {
      mockGame.guests = new Array(5); // 5 guests
      difficultySystem.updateDifficultyForDay(1); // Max 8 guests
      
      expect(difficultySystem.canSpawnMoreGuests()).toBe(true);
    });

    it('should prevent spawning when at guest limit', () => {
      mockGame.guests = new Array(8); // 8 guests
      difficultySystem.updateDifficultyForDay(1); // Max 8 guests
      
      expect(difficultySystem.canSpawnMoreGuests()).toBe(false);
    });

    it('should prevent spawning when over guest limit', () => {
      mockGame.guests = new Array(10); // 10 guests
      difficultySystem.updateDifficultyForDay(1); // Max 8 guests
      
      expect(difficultySystem.canSpawnMoreGuests()).toBe(false);
    });
  });

  describe('difficulty application to game', () => {
    it('should update game spawn interval', () => {
      difficultySystem.updateDifficultyForDay(5);
      
      expect(mockGame.guestSpawnInterval).toBe(6800); // 8000 - (4 * 300)
    });

    it('should update console breakdown rates', () => {
      difficultySystem.updateDifficultyForDay(5);
      const expectedRate = 0.15 + (4 * 0.02); // 0.23
      
      mockGame.consoles.forEach(console => {
        expect(console.breakdownChance).toBe(expectedRate);
      });
    });
  });

  describe('difficulty summary', () => {
    it('should provide current difficulty summary', () => {
      difficultySystem.updateDifficultyForDay(5);
      const summary = difficultySystem.getDifficultyScalingSummary();
      
      expect(summary.day).toBe(5);
      expect(summary.spawnInterval).toBe('6.8s');
      expect(summary.maxGuests).toBe(10); // 8 + floor(4/2) * 1
      expect(summary.patience).toBe('80%'); // 100% - (4 * 5%)
      expect(summary.breakdownRate).toBe('23%'); // 15% + (4 * 2%)
      expect(summary.guestTypes).toBeDefined();
    });

    it('should provide difficulty preview for future days', () => {
      difficultySystem.updateDifficultyForDay(3);
      const preview = difficultySystem.getDifficultyPreview(3);
      
      expect(preview).toHaveLength(3);
      expect(preview[0].day).toBe(4);
      expect(preview[1].day).toBe(5);
      expect(preview[2].day).toBe(6);
      
      // Spawn intervals should decrease
      expect(parseFloat(preview[1].spawnInterval)).toBeLessThan(parseFloat(preview[0].spawnInterval));
    });
  });

  describe('keyboard shortcuts', () => {
    it('should handle D key for difficulty info', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = difficultySystem.handleKeyPress('KeyD');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Current Difficulty:', expect.any(Object));
      expect(consoleSpy).toHaveBeenCalledWith('Next 5 Days Preview:', expect.any(Array));
      
      consoleSpy.mockRestore();
    });

    it('should handle N key for next day simulation', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockGameStateManager.gameData.day = 5;
      
      const result = difficultySystem.handleKeyPress('KeyN');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Simulated difficulty for day 6');
      
      consoleSpy.mockRestore();
    });

    it('should not handle other keys', () => {
      const result = difficultySystem.handleKeyPress('KeyX');
      
      expect(result).toBe(false);
    });
  });

  describe('difficulty reset', () => {
    it('should reset difficulty to base settings', () => {
      difficultySystem.updateDifficultyForDay(10);
      const eventSpy = vi.fn();
      difficultySystem.on('difficultyReset', eventSpy);
      
      difficultySystem.resetDifficulty();
      
      expect(difficultySystem.currentDifficulty.guestSpawnInterval).toBe(8000);
      expect(difficultySystem.currentDifficulty.maxSimultaneousGuests).toBe(8);
      expect(difficultySystem.currentDifficulty.guestPatienceModifier).toBe(1.0);
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('event system', () => {
    it('should emit difficulty changed event', () => {
      const eventSpy = vi.fn();
      difficultySystem.on('difficultyChanged', eventSpy);
      
      difficultySystem.updateDifficultyForDay(5);
      
      expect(eventSpy).toHaveBeenCalledWith({
        day: 5,
        difficulty: expect.any(Object),
        scaling: expect.any(Object)
      });
    });

    it('should handle event listener errors gracefully', () => {
      const errorCallback = vi.fn(() => { throw new Error('Test error'); });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      difficultySystem.on('testEvent', errorCallback);
      
      expect(() => {
        difficultySystem.emit('testEvent', {});
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should allow removing event listeners', () => {
      const eventSpy = vi.fn();
      difficultySystem.on('testEvent', eventSpy);
      difficultySystem.off('testEvent', eventSpy);
      
      difficultySystem.emit('testEvent', {});
      
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle day 1 correctly (no scaling)', () => {
      difficultySystem.updateDifficultyForDay(1);
      
      expect(difficultySystem.getGuestSpawnInterval()).toBe(8000);
      expect(difficultySystem.getMaxSimultaneousGuests()).toBe(8);
      expect(difficultySystem.getGuestPatienceModifier()).toBe(1.0);
      expect(difficultySystem.getConsoleBreakdownRate()).toBe(0.15);
    });

    it('should handle very high day numbers', () => {
      difficultySystem.updateDifficultyForDay(100);
      
      // Should respect all limits
      expect(difficultySystem.getGuestSpawnInterval()).toBeGreaterThanOrEqual(3000);
      expect(difficultySystem.getMaxSimultaneousGuests()).toBeLessThanOrEqual(16);
      expect(difficultySystem.getGuestPatienceModifier()).toBeGreaterThanOrEqual(0.5);
      expect(difficultySystem.getConsoleBreakdownRate()).toBeLessThanOrEqual(0.35);
    });

    it('should handle zero or negative day numbers', () => {
      difficultySystem.updateDifficultyForDay(0);
      
      // Should use base difficulty
      expect(difficultySystem.getGuestSpawnInterval()).toBe(8000);
      expect(difficultySystem.getMaxSimultaneousGuests()).toBe(8);
    });
  });

  describe('realistic scaling progression', () => {
    it('should provide reasonable difficulty curve over 14 days', () => {
      const progression = [];
      
      for (let day = 1; day <= 14; day++) {
        difficultySystem.updateDifficultyForDay(day);
        progression.push({
          day,
          spawnInterval: difficultySystem.getGuestSpawnInterval(), 
          maxGuests: difficultySystem.getMaxSimultaneousGuests(),
          patience: difficultySystem.getGuestPatienceModifier(),
          breakdown: difficultySystem.getConsoleBreakdownRate()
        });
      }
      
      // Day 1 should be base difficulty
      expect(progression[0].spawnInterval).toBe(8000);
      expect(progression[0].maxGuests).toBe(8);
      expect(progression[0].patience).toBe(1.0);
      
      // Day 14 should be significantly harder
      expect(progression[13].spawnInterval).toBeLessThan(5000);
      expect(progression[13].maxGuests).toBeGreaterThan(10);
      expect(progression[13].patience).toBeLessThan(0.8);
      expect(progression[13].breakdown).toBeGreaterThan(0.25);
      
      // Progression should be smooth (no sudden jumps)
      for (let i = 1; i < progression.length; i++) {
        expect(progression[i].spawnInterval).toBeLessThanOrEqual(progression[i-1].spawnInterval);
        expect(progression[i].maxGuests).toBeGreaterThanOrEqual(progression[i-1].maxGuests);
        expect(progression[i].patience).toBeLessThanOrEqual(progression[i-1].patience);
        expect(progression[i].breakdown).toBeGreaterThanOrEqual(progression[i-1].breakdown);
      }
    });
  });
});