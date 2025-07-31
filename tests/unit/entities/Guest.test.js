import { describe, it, expect, beforeEach } from 'vitest';
import { Guest } from '../../../src/entities/Guest.js';
import { Transform } from '../../../src/components/Transform.js';

describe('Guest', () => {
  let guest;

  beforeEach(() => {
    guest = new Guest(100, 200, 'casual');
  });

  describe('constructor', () => {
    it('should initialize with correct position and type', () => {
      expect(guest.x).toBe(100);
      expect(guest.y).toBe(200);
      expect(guest.type).toBe('casual');
    });

    it('should have Transform component', () => {
      expect(guest.hasComponent('Transform')).toBe(true);
      const transform = guest.getComponent('Transform');
      expect(transform.x).toBe(100);
      expect(transform.y).toBe(200);
    });

    it('should initialize with default casual guest stats', () => {
      expect(guest.patience).toBe(30000); // 30 seconds
      expect(guest.satisfaction).toBe(5); // Neutral
      expect(guest.money).toBe(5);
      expect(guest.speed).toBe(50);
    });

    it('should initialize with correct state', () => {
      expect(guest.state).toBe('seeking'); // seeking, using, leaving, angry
      expect(guest.arrivalTime).toBeDefined();
      expect(guest.currentConsole).toBeNull();
      expect(guest.useStartTime).toBeNull();
    });

    it('should accept different guest types', () => {
      const enthusiastGuest = new Guest(0, 0, 'enthusiast');
      expect(enthusiastGuest.type).toBe('enthusiast');
      expect(enthusiastGuest.patience).toBe(45000); // 45 seconds
      expect(enthusiastGuest.money).toBe(8);
      expect(enthusiastGuest.satisfaction).toBe(7);
    });

    it('should throw error for invalid guest type', () => {
      expect(() => {
        new Guest(0, 0, 'invalid-type');
      }).toThrow('Invalid guest type: invalid-type');
    });
  });

  describe('patience system', () => {
    it('should return current patience remaining', () => {
      const remaining = guest.getPatienceRemaining();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30000);
    });

    it('should become angry when patience runs out', () => {
      // Set arrival time to past patience limit
      guest.arrivalTime = Date.now() - 35000;
      guest.updatePatience();
      
      expect(guest.state).toBe('angry');
      expect(guest.satisfaction).toBe(-5);
    });

    it('should lose satisfaction as patience decreases', () => {
      // Simulate half patience elapsed
      guest.arrivalTime = Date.now() - 15000;
      guest.updatePatience();
      
      expect(guest.satisfaction).toBeLessThan(5);
      expect(guest.satisfaction).toBeGreaterThan(0);
    });
  });

  describe('console interaction', () => {
    let mockConsole;

    beforeEach(() => {
      mockConsole = {
        type: 'retro-arcade',
        appeal: 3,
        isOperational: () => true,
        use: () => {},
        finishUse: () => {},
        calculateRevenue: (guest) => 2
      };
    });

    it('should start using console when seeking', () => {
      guest.startUsingConsole(mockConsole);
      
      expect(guest.state).toBe('using');
      expect(guest.currentConsole).toBe(mockConsole);
      expect(guest.useStartTime).toBeDefined();
    });

    it('should throw error when not seeking', () => {
      guest.state = 'using';
      
      expect(() => {
        guest.startUsingConsole(mockConsole);
      }).toThrow('Guest is not seeking a console');
    });

    it('should increase satisfaction when using appealing console', () => {
      const initialSatisfaction = guest.satisfaction;
      guest.startUsingConsole(mockConsole);
      
      expect(guest.satisfaction).toBeGreaterThan(initialSatisfaction);
    });

    it('should finish using console after use time', () => {
      guest.startUsingConsole(mockConsole);
      
      // Simulate use time passing
      guest.useStartTime = Date.now() - guest.useTime - 100;
      guest.updateConsoleUse();
      
      expect(guest.state).toBe('leaving');
      expect(guest.currentConsole).toBeNull();
      expect(guest.useStartTime).toBeNull();
    });

    it('should calculate revenue based on satisfaction', () => {
      guest.satisfaction = 8; // Happy guest
      const revenue = guest.calculatePayment(mockConsole);
      expect(revenue).toBe(2); // Full revenue
    });

    it('should pay nothing when angry', () => {
      guest.satisfaction = -2; // Angry guest
      // Use mock console without calculateRevenue to test guest's logic
      const simpleConsole = { type: 'retro-arcade', appeal: 3 };
      const revenue = guest.calculatePayment(simpleConsole);
      expect(revenue).toBe(0);
    });
  });

  describe('movement and AI', () => {
    it('should move towards target position', () => {
      guest.targetX = 200;
      guest.targetY = 300;
      
      const transform = guest.getComponent('Transform');
      const initialX = transform.x;
      const initialY = transform.y;
      
      guest.updateMovement(100); // 100ms delta
      
      // Should move closer to target
      expect(Math.abs(transform.x - guest.targetX)).toBeLessThan(Math.abs(initialX - guest.targetX));
      expect(Math.abs(transform.y - guest.targetY)).toBeLessThan(Math.abs(initialY - guest.targetY));
    });

    it('should stop moving when reaching target', () => {
      const transform = guest.getComponent('Transform');
      guest.targetX = transform.x;
      guest.targetY = transform.y;
      
      guest.updateMovement(100);
      
      expect(guest.isMoving()).toBe(false);
    });

    it('should find nearest available console', () => {
      const consoles = [
        { x: 150, y: 200, isOperational: () => true, getComponent: () => ({ x: 150, y: 200 }) },
        { x: 300, y: 400, isOperational: () => true, getComponent: () => ({ x: 300, y: 400 }) },
        { x: 120, y: 180, isOperational: () => false, getComponent: () => ({ x: 120, y: 180 }) } // Broken
      ];
      
      const nearest = guest.findNearestConsole(consoles);
      expect(nearest).toBe(consoles[0]); // Closest operational console
    });
  });

  describe('getStatusColor', () => {
    it('should return green for seeking', () => {
      expect(guest.getStatusColor()).toBe('#00ff00');
    });

    it('should return blue for using', () => {
      guest.state = 'using';
      expect(guest.getStatusColor()).toBe('#0066ff');
    });

    it('should return gray for leaving', () => {
      guest.state = 'leaving';
      expect(guest.getStatusColor()).toBe('#888888');
    });

    it('should return red for angry', () => {
      guest.state = 'angry';
      expect(guest.getStatusColor()).toBe('#ff0000');
    });
  });

  describe('update', () => {
    it('should update patience when seeking', () => {
      const initialSatisfaction = guest.satisfaction;
      guest.arrivalTime = Date.now() - 20000; // 20 seconds ago (over 60% patience used)
      
      guest.update(16.67);
      
      expect(guest.satisfaction).toBeLessThan(initialSatisfaction);
    });

    it('should update console use when using', () => {
      const mockConsole = {
        type: 'retro-arcade',
        appeal: 3,
        isOperational: () => true,
        use: () => {},
        finishUse: () => {},
        calculateRevenue: () => 2
      };
      
      guest.startUsingConsole(mockConsole);
      guest.useStartTime = Date.now() - guest.useTime - 100;
      
      guest.update(16.67);
      
      expect(guest.state).toBe('leaving');
    });

    it('should move towards exit when leaving', () => {
      guest.state = 'leaving';
      guest.targetX = 0; // Set exit target
      guest.targetY = 400;
      
      const transform = guest.getComponent('Transform');
      const initialX = transform.x;
      
      guest.update(16.67);
      
      // Should move towards exit (x: 0)
      expect(transform.x).toBeLessThan(initialX);
    });
  });
});