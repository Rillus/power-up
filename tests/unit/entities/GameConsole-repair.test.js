import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameConsole } from '../../../src/entities/GameConsole.js';

describe('GameConsole Repair Master Integration', () => {
  let gameConsole;

  beforeEach(() => {
    gameConsole = new GameConsole(100, 200, 'retro-arcade');
    // Force console to be broken for repair tests
    gameConsole.durability = 0;
    gameConsole.state = 'broken';
  });

  describe('enhanced repair system', () => {
    it('should accept repair multiplier in startRepair', () => {
      const repairMultiplier = 5.0;
      
      gameConsole.startRepair(repairMultiplier);
      
      expect(gameConsole.state).toBe('under-repair');
      expect(gameConsole.repairStartTime).toBeDefined();
      expect(gameConsole.effectiveRepairTime).toBe(Math.floor(gameConsole.repairTime / repairMultiplier));
    });

    it('should use default repair time when no multiplier provided', () => {
      gameConsole.startRepair();
      
      expect(gameConsole.effectiveRepairTime).toBe(gameConsole.repairTime);
    });

    it('should enforce minimum repair time of 100ms', () => {
      const veryHighMultiplier = 1000.0; // Would result in less than 100ms
      
      gameConsole.startRepair(veryHighMultiplier);
      
      expect(gameConsole.effectiveRepairTime).toBe(100);
    });

    it('should calculate repair progress using effective repair time', () => {
      const repairMultiplier = 10.0;
      gameConsole.startRepair(repairMultiplier);
      
      // Mock elapsed time to be half of effective repair time
      const originalDate = Date.now();
      const mockNow = vi.spyOn(Date, 'now');
      mockNow.mockReturnValue(originalDate + gameConsole.effectiveRepairTime / 2);
      
      const progress = gameConsole.getRepairProgress();
      
      expect(progress).toBeCloseTo(0.5, 1);
      
      mockNow.mockRestore();
    });

    it('should complete repair using effective repair time', () => {
      const repairMultiplier = 5.0;
      gameConsole.startRepair(repairMultiplier);
      
      // Mock elapsed time to exceed effective repair time
      const originalDate = Date.now();
      const mockNow = vi.spyOn(Date, 'now');
      mockNow.mockReturnValue(originalDate + gameConsole.effectiveRepairTime + 100);
      
      gameConsole.updateRepair();
      
      expect(gameConsole.state).toBe('operational');
      expect(gameConsole.durability).toBe(gameConsole.maxDurability);
      expect(gameConsole.repairStartTime).toBeNull();
      expect(gameConsole.effectiveRepairTime).toBeNull();
      
      mockNow.mockRestore();
    });

    it('should reset effective repair time after completion', () => {
      const repairMultiplier = 3.0;
      gameConsole.startRepair(repairMultiplier);
      
      // Complete the repair
      const originalDate = Date.now();
      const mockNow = vi.spyOn(Date, 'now');
      mockNow.mockReturnValue(originalDate + gameConsole.effectiveRepairTime + 100);
      
      gameConsole.updateRepair();
      
      expect(gameConsole.effectiveRepairTime).toBeNull();
      
      mockNow.mockRestore();
    });

    it('should emit repair completed event with boost', () => {
      const eventSpy = vi.fn();
      gameConsole.on('repairCompleted', eventSpy);
      
      const repairMultiplier = 8.0;
      gameConsole.startRepair(repairMultiplier);
      
      // Complete the repair
      const originalDate = Date.now();
      const mockNow = vi.spyOn(Date, 'now');
      mockNow.mockReturnValue(originalDate + gameConsole.effectiveRepairTime + 100);
      
      gameConsole.updateRepair();
      
      expect(eventSpy).toHaveBeenCalledWith({
        console: gameConsole,
        x: gameConsole.x,
        y: gameConsole.y
      });
      
      mockNow.mockRestore();
    });
  });

  describe('repair multiplier edge cases', () => {
    it('should handle repair multiplier of 1.0 (no boost)', () => {
      gameConsole.startRepair(1.0);
      
      expect(gameConsole.effectiveRepairTime).toBe(gameConsole.repairTime);
    });

    it('should handle very small repair multiplier', () => {
      gameConsole.startRepair(0.1);
      
      expect(gameConsole.effectiveRepairTime).toBe(gameConsole.repairTime * 10);
    });

    it('should handle zero repair multiplier gracefully', () => {
      // This should not cause division by zero
      expect(() => {
        gameConsole.startRepair(0);
      }).not.toThrow();
      
      // Should result in maximum repair time
      expect(gameConsole.effectiveRepairTime).toBeGreaterThan(gameConsole.repairTime);
    });

    it('should handle negative repair multiplier gracefully', () => {
      expect(() => {
        gameConsole.startRepair(-1);
      }).not.toThrow();
      
      // Should result in a positive repair time
      expect(gameConsole.effectiveRepairTime).toBeGreaterThan(0);
    });
  });

  describe('Repair Master power-up simulation', () => {
    it('should dramatically reduce repair time with 10x multiplier', () => {
      const originalRepairTime = gameConsole.repairTime; // e.g., 3000ms
      const repairMasterMultiplier = 10.0;
      
      gameConsole.startRepair(repairMasterMultiplier);
      
      expect(gameConsole.effectiveRepairTime).toBe(Math.max(100, Math.floor(originalRepairTime / 10)));
      
      // For retro-arcade (3000ms), this should be 300ms (well above minimum)
      if (originalRepairTime >= 1000) {
        expect(gameConsole.effectiveRepairTime).toBeLessThan(originalRepairTime / 5);
      }
    });

    it('should provide instant-like repairs for typical console types', () => {
      const consoleTypes = ['retro-arcade', 'classic-home', 'modern-gaming', 'vr-experience'];
      
      consoleTypes.forEach(type => {
        const testConsole = new GameConsole(100, 100, type);
        testConsole.durability = 0;
        testConsole.state = 'broken';
        
        const originalTime = testConsole.repairTime;
        testConsole.startRepair(10.0); // Repair Master multiplier
        
        expect(testConsole.effectiveRepairTime).toBeLessThan(originalTime / 5);
        expect(testConsole.effectiveRepairTime).toBeGreaterThanOrEqual(100);
      });
    });
  });
});