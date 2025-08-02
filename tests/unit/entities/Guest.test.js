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
      expect(guest.patience).toBe(25000); // 25 seconds (updated in Phase 2)
      expect(guest.satisfaction).toBe(5); // Neutral
      expect(guest.money).toBe(4); // Updated to 4 in Phase 2
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
      expect(enthusiastGuest.patience).toBe(15000); // 15 seconds (impatient in Phase 2)
      expect(enthusiastGuest.money).toBe(12); // Higher spending in Phase 2
      expect(enthusiastGuest.satisfaction).toBe(4); // Lower starting satisfaction (high expectations)
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
        calculateRevenue: (guest) => 2,
        addUser: () => true,
        removeUser: () => {},
        canAcceptUser: () => true
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
      guest.satisfaction = 8; // Very happy guest
      const revenue = guest.calculatePayment(mockConsole);
      expect(revenue).toBe(6); // 4 (base money) * 1.5 (very happy bonus) = 6
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
        calculateRevenue: () => 2,
        addUser: () => true,
        removeUser: () => {},
        canAcceptUser: () => true
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

  describe('emotion system', () => {
    it('should return correct emotion states based on satisfaction', () => {
      // Very happy
      guest.satisfaction = 9;
      expect(guest.getEmotionState()).toBe('very-happy');
      
      // Happy
      guest.satisfaction = 7;
      expect(guest.getEmotionState()).toBe('happy');
      
      // Neutral
      guest.satisfaction = 5;
      expect(guest.getEmotionState()).toBe('neutral');
      
      // Unhappy
      guest.satisfaction = 3;
      expect(guest.getEmotionState()).toBe('unhappy');
      
      // Angry
      guest.satisfaction = 1;
      expect(guest.getEmotionState()).toBe('angry');
    });

    it('should adjust emotion based on patience levels', () => {
      guest.satisfaction = 8; // Very happy base
      
      // High patience - should remain very happy
      guest.arrivalTime = Date.now() - 5000; // 5 seconds ago (plenty of patience)
      expect(guest.getEmotionState()).toBe('very-happy');
      
      // Low patience - should downgrade emotion
      guest.arrivalTime = Date.now() - 20000; // 20 seconds ago (low patience)
      expect(guest.getEmotionState()).toBe('happy'); // Downgraded from very-happy
    });

    it('should return correct emotion icons', () => {
      guest.satisfaction = 9;
      expect(guest.getEmotionIcon()).toBe('😄');
      
      guest.satisfaction = 7;
      expect(guest.getEmotionIcon()).toBe('😊');
      
      guest.satisfaction = 5;
      expect(guest.getEmotionIcon()).toBe('😐');
      
      guest.satisfaction = 3;
      expect(guest.getEmotionIcon()).toBe('😕');
      
      guest.satisfaction = 1;
      expect(guest.getEmotionIcon()).toBe('😠');
    });

    it('should return correct emotion colors', () => {
      guest.satisfaction = 9;
      expect(guest.getEmotionColor()).toBe('#00FF00'); // Bright green
      
      guest.satisfaction = 7;
      expect(guest.getEmotionColor()).toBe('#90EE90'); // Light green
      
      guest.satisfaction = 5;
      expect(guest.getEmotionColor()).toBe('#FFFF00'); // Yellow
      
      guest.satisfaction = 3;
      expect(guest.getEmotionColor()).toBe('#FFA500'); // Orange
      
      guest.satisfaction = 1;
      expect(guest.getEmotionColor()).toBe('#FF0000'); // Red
    });

    it('should override with angry state regardless of satisfaction', () => {
      guest.satisfaction = 10; // Very high satisfaction
      guest.state = 'angry'; // But guest is angry (patience ran out)
      
      expect(guest.getEmotionState()).toBe('angry');
      expect(guest.getEmotionIcon()).toBe('😠');
      expect(guest.getEmotionColor()).toBe('#FF0000');
    });
  });

  describe('queue behavior', () => {
    let mockConsole;
    
    beforeEach(() => {
      mockConsole = {
        type: 'retro-arcade',
        appeal: 3,
        queue: [],
        addToQueue: () => {},
        removeFromQueue: () => {},
        getComponent: () => ({ x: 300, y: 200 })
      };
    });
    
    it('should join queue correctly', () => {
      guest.joinQueue(mockConsole, 0);
      
      expect(guest.state).toBe('waiting');
      expect(guest.queuedConsole).toBe(mockConsole);
      expect(guest.queuePosition).toBe(0);
      expect(guest.waitStartTime).toBeDefined();
    });
    
    it('should leave queue correctly', () => {
      guest.joinQueue(mockConsole, 1);
      guest.leaveQueue();
      
      expect(guest.state).toBe('seeking');
      expect(guest.queuedConsole).toBeNull();
      expect(guest.queuePosition).toBe(-1);
      expect(guest.waitStartTime).toBeNull();
    });
    
    it('should update queue position', () => {
      guest.joinQueue(mockConsole, 2);
      guest.updateQueuePosition(1);
      
      expect(guest.queuePosition).toBe(1);
    });
    
    it('should calculate queue position coordinates', () => {
      guest.joinQueue(mockConsole, 1);
      const coords = guest.getQueuePositionCoords();
      
      expect(coords).toBeDefined();
      expect(coords.x).toBe(180); // 300 - 80 - (1 * 40)
      expect(coords.y).toBe(200);
    });
    
    it('should check if guest can start using console', () => {
      guest.joinQueue(mockConsole, 0);
      mockConsole.isOperational = () => true;
      mockConsole.isInUse = () => false;
      
      expect(guest.canStartUsingConsole()).toBe(true);
    });
    
    it('should track waiting time', () => {
      guest.joinQueue(mockConsole, 0);
      
      // Simulate some time passing
      guest.waitStartTime = Date.now() - 5000; // 5 seconds ago
      
      const waitingTime = guest.getWaitingTime();
      expect(waitingTime).toBeGreaterThanOrEqual(4900);
      expect(waitingTime).toBeLessThanOrEqual(5100);
    });
    
    it('should not have waiting time when not in queue', () => {
      expect(guest.getWaitingTime()).toBe(0);
    });
  });

  describe('Phase 2 guest type behaviors', () => {
    it('should handle family guest type correctly', () => {
      const familyGuest = new Guest(0, 0, 'family');
      
      expect(familyGuest.type).toBe('family');
      expect(familyGuest.patience).toBe(45000); // Very patient
      expect(familyGuest.money).toBe(6); // Moderate spending
      expect(familyGuest.groupSize).toBe(3); // Group of 3
      expect(familyGuest.preferredConsoles).toContain('classic-home');
      expect(familyGuest.getDisplayName()).toBe('Family Group');
    });

    it('should handle enthusiast guest type correctly', () => {
      const enthusiastGuest = new Guest(0, 0, 'enthusiast');
      
      expect(enthusiastGuest.type).toBe('enthusiast');
      expect(enthusiastGuest.patience).toBe(15000); // Impatient
      expect(enthusiastGuest.money).toBe(12); // High spending
      expect(enthusiastGuest.groupSize).toBe(1); // Solo
      expect(enthusiastGuest.preferredConsoles).toContain('modern-gaming');
      expect(enthusiastGuest.preferredConsoles).toContain('vr-experience');
      expect(enthusiastGuest.getDisplayName()).toBe('Gaming Enthusiast');
    });

    it('should apply console preferences correctly', () => {
      const familyGuest = new Guest(0, 0, 'family');
      
      expect(familyGuest.prefersConsoleType('classic-home')).toBe(true);
      expect(familyGuest.prefersConsoleType('retro-arcade')).toBe(true);
      expect(familyGuest.prefersConsoleType('vr-experience')).toBe(false);
    });

    it('should calculate satisfaction modifiers based on console compatibility', () => {
      const enthusiastGuest = new Guest(0, 0, 'enthusiast');
      
      // High-appeal console that enthusiasts prefer
      const highEndConsole = { type: 'vr-experience', appeal: 10, capacity: 1 };
      const highModifier = enthusiastGuest.getConsoleCompatibilityModifier(highEndConsole);
      
      // Low-appeal console that enthusiasts don't prefer
      const lowEndConsole = { type: 'retro-arcade', appeal: 2, capacity: 1 };
      const lowModifier = enthusiastGuest.getConsoleCompatibilityModifier(lowEndConsole);
      
      expect(highModifier).toBeGreaterThan(lowModifier);
      expect(highModifier).toBeGreaterThan(0);
      expect(lowModifier).toBeLessThan(0); // Enthusiasts are disappointed by basic consoles
    });

    it('should calculate family payment with group multiplier', () => {
      const familyGuest = new Guest(0, 0, 'family');
      familyGuest.satisfaction = 6; // Happy family
      
      const mockConsole = { type: 'classic-home', appeal: 5 };
      const payment = familyGuest.calculatePayment(mockConsole);
      
      // 6 (base money) * 1.2 (happy bonus) * 3 (group size) * 0.8 (family discount) = 17.28 -> 17 (but Math.floor rounds down step by step)
      // Actually: Math.floor(6 * 1.2) = Math.floor(7.2) = 7, then 7 * 3 * 0.8 = 16.8 -> 16
      expect(payment).toBe(16);
    });

    it('should handle tourist guest type', () => {
      const touristGuest = new Guest(0, 0, 'tourist');
      
      expect(touristGuest.type).toBe('tourist');
      expect(touristGuest.money).toBe(3); // Budget conscious
      expect(touristGuest.groupSize).toBe(2); // Small groups
      expect(touristGuest.speed).toBe(40); // Slow, looking around
      expect(touristGuest.getDisplayName()).toBe('Tourist');
    });
  });
});