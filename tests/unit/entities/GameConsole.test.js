import { describe, it, expect, beforeEach } from 'vitest';
import { GameConsole } from '../../../src/entities/GameConsole.js';
import { Transform } from '../../../src/components/Transform.js';

describe('GameConsole', () => {
  let console;

  beforeEach(() => {
    console = new GameConsole(100, 200, 'retro-arcade');
  });

  describe('constructor', () => {
    it('should initialize with correct position and type', () => {
      expect(console.x).toBe(100);
      expect(console.y).toBe(200);
      expect(console.type).toBe('retro-arcade');
    });

    it('should have Transform component', () => {
      expect(console.hasComponent('Transform')).toBe(true);
      const transform = console.getComponent('Transform');
      expect(transform.x).toBe(100);
      expect(transform.y).toBe(200);
    });

    it('should initialize with default retro-arcade stats', () => {
      expect(console.cost).toBe(500);
      expect(console.revenue).toBe(2);
      expect(console.maxDurability).toBe(20);
      expect(console.durability).toBe(20);
      expect(console.repairTime).toBe(3000); // 3 seconds in ms
      expect(console.capacity).toBe(1);
      expect(console.appeal).toBe(3);
    });

    it('should initialize as operational', () => {
      expect(console.state).toBe('operational');
      expect(console.isOperational()).toBe(true);
    });

    it('should accept different console types', () => {
      const classicConsole = new GameConsole(0, 0, 'classic-home');
      expect(classicConsole.type).toBe('classic-home');
      expect(classicConsole.cost).toBe(1200);
      expect(classicConsole.revenue).toBe(4); // Updated from 3 to 4
      expect(classicConsole.capacity).toBe(2);
    });

    it('should throw error for invalid console type', () => {
      expect(() => {
        new GameConsole(0, 0, 'invalid-type');
      }).toThrow('Invalid console type: invalid-type');
    });
  });

  describe('use', () => {
    it('should decrease durability when used', () => {
      console.use();
      expect(console.durability).toBe(19);
    });

    it('should break down when durability reaches 0', () => {
      // Use console until it breaks
      for (let i = 0; i < 20; i++) {
        console.use();
      }
      
      expect(console.durability).toBe(0);
      expect(console.state).toBe('broken');
      expect(console.isOperational()).toBe(false);
    });

    it('should throw error when trying to use broken console', () => {
      // Break the console
      console.durability = 0;
      console.state = 'broken';
      
      expect(() => {
        console.use();
      }).toThrow('Cannot use broken console');
    });

    it('should set state to in-use temporarily', () => {
      console.use();
      expect(console.state).toBe('in-use');
      
      // Should return to operational after use time
      console.finishUse();
      expect(console.state).toBe('operational');
    });
  });

  describe('repair', () => {
    beforeEach(() => {
      // Break the console
      console.durability = 0;
      console.state = 'broken';
    });

    it('should start repair process', () => {
      console.startRepair();
      expect(console.state).toBe('under-repair');
      expect(console.repairStartTime).toBeDefined();
    });

    it('should complete repair after repair time', () => {
      console.startRepair();
      
      // Simulate repair time passing
      console.repairStartTime = Date.now() - console.repairTime - 100;
      console.updateRepair();
      
      expect(console.state).toBe('operational');
      expect(console.durability).toBe(console.maxDurability);
      expect(console.repairStartTime).toBeNull();
    });

    it('should not complete repair before repair time', () => {
      console.startRepair();
      
      // Repair just started
      console.updateRepair();
      
      expect(console.state).toBe('under-repair');
      expect(console.durability).toBe(0);
    });

    it('should throw error when trying to repair operational console', () => {
      console.durability = 10;
      console.state = 'operational';
      
      expect(() => {
        console.startRepair();
      }).toThrow('Console is not broken');
    });
  });

  describe('calculateRevenue', () => {
    it('should return base revenue for normal guest', () => {
      const guest = { satisfaction: 5 };
      const revenue = console.calculateRevenue(guest);
      expect(revenue).toBe(2); // Base revenue for retro-arcade
    });

    it('should return 0 for angry guest', () => {
      const guest = { satisfaction: -1 };
      const revenue = console.calculateRevenue(guest);
      expect(revenue).toBe(0);
    });

    it('should return half revenue for neutral guest', () => {
      const guest = { satisfaction: 2 };
      const revenue = console.calculateRevenue(guest);
      expect(revenue).toBe(1); // Half of base revenue
    });
  });

  describe('getStatusColor', () => {
    it('should return green for operational', () => {
      expect(console.getStatusColor()).toBe('#00ff00');
    });

    it('should return blue for in-use', () => {
      console.state = 'in-use';
      expect(console.getStatusColor()).toBe('#0066ff');
    });

    it('should return red for broken', () => {
      console.state = 'broken';
      expect(console.getStatusColor()).toBe('#ff0000');
    });

    it('should return yellow for under-repair', () => {
      console.state = 'under-repair';
      expect(console.getStatusColor()).toBe('#ffff00');
    });
  });

  describe('queue management', () => {
    let mockGuest;
    
    beforeEach(() => {
      mockGuest = {
        joinQueue: () => {},
        leaveQueue: () => {},
        updateQueuePosition: () => {},
        queuePosition: -1
      };
    });
    
    it('should add guest to queue', () => {
      const position = console.addToQueue(mockGuest);
      
      expect(console.queue).toContain(mockGuest);
      expect(position).toBe(0);
    });
    
    it('should remove guest from queue', () => {
      console.addToQueue(mockGuest);
      console.removeFromQueue(mockGuest);
      
      expect(console.queue).not.toContain(mockGuest);
    });
    
    it('should get next guest in queue', () => {
      const guest1 = { ...mockGuest };
      const guest2 = { ...mockGuest };
      
      console.addToQueue(guest1);
      console.addToQueue(guest2);
      
      expect(console.getNextInQueue()).toBe(guest1);
    });
    
    it('should return null for next guest when queue is empty', () => {
      expect(console.getNextInQueue()).toBeNull();
    });
    
    it('should get correct queue length', () => {
      expect(console.getQueueLength()).toBe(0);
      
      console.addToQueue(mockGuest);
      expect(console.getQueueLength()).toBe(1);
    });
    
    it('should check if console has queue', () => {
      expect(console.hasQueue()).toBe(false);
      
      console.addToQueue(mockGuest);
      expect(console.hasQueue()).toBe(true);
    });
    
    it('should calculate total demand', () => {
      console.currentUsers = ['user1'];
      console.addToQueue(mockGuest);
      
      expect(console.getTotalDemand()).toBe(2);
    });
  });

  describe('update', () => {
    it('should update repair progress when under repair', () => {
      console.state = 'broken';
      console.startRepair();
      
      // Mock repair completion
      console.repairStartTime = Date.now() - console.repairTime - 100;
      
      console.update(16.67);
      
      expect(console.state).toBe('operational');
      expect(console.durability).toBe(console.maxDurability);
    });

    it('should not update repair when not under repair', () => {
      const originalState = console.state;
      console.update(16.67);
      expect(console.state).toBe(originalState);
    });
  });
});