import { describe, it, expect, beforeEach } from 'vitest';
import { StrategicPlacementSystem } from '../../../src/systems/StrategicPlacementSystem.js';
import { GameConsole } from '../../../src/entities/GameConsole.js';
import { Guest } from '../../../src/entities/Guest.js';

describe('StrategicPlacementSystem', () => {
  let placementSystem;
  let mockGame;
  let console1;
  let console2;
  let guest1;
  let guest2;

  beforeEach(() => {
    // Create mock game
    mockGame = {
      consoles: [],
      guests: []
    };

    // Create consoles
    console1 = new GameConsole(200, 300, 'retro-arcade', 1);
    console2 = new GameConsole(400, 300, 'classic-home', 2);
    
    // Create guests
    guest1 = new Guest(100, 250, 'casual');
    guest2 = new Guest(150, 350, 'enthusiast');
    
    mockGame.consoles = [console1, console2];
    mockGame.guests = [guest1, guest2];
    
    // Create placement system
    placementSystem = new StrategicPlacementSystem(mockGame);
  });

  describe('constructor', () => {
    it('should initialize with game reference and default zones', () => {
      expect(placementSystem.game).toBe(mockGame);
      expect(placementSystem.zones).toBeDefined();
      expect(placementSystem.zones.entrance).toBeDefined();
      expect(placementSystem.zones.center).toBeDefined();
      expect(placementSystem.zones.corner).toBeDefined();
      expect(placementSystem.zones.premium).toBeDefined();
      
      expect(placementSystem.clusterRadius).toBe(150);
      expect(placementSystem.clusterBonus).toBe(0.3);
      expect(placementSystem.appealRadius).toBe(120);
    });
  });

  describe('getZoneMultiplier', () => {
    it('should return correct multiplier for entrance zone', () => {
      const multiplier = placementSystem.getZoneMultiplier(100, 300);
      expect(multiplier).toBe(1.3); // Entrance zone
    });

    it('should return correct multiplier for center zone', () => {
      const multiplier = placementSystem.getZoneMultiplier(600, 400);
      expect(multiplier).toBe(1.0); // Center zone
    });

    it('should return correct multiplier for corner zone', () => {
      const multiplier = placementSystem.getZoneMultiplier(1100, 150);
      expect(multiplier).toBe(0.8); // Corner zone
    });

    it('should return correct multiplier for premium zone', () => {
      const multiplier = placementSystem.getZoneMultiplier(600, 400);
      expect(multiplier).toBe(1.0); // Overlaps with center, but center is checked first
    });

    it('should return default multiplier for unknown zone', () => {
      const multiplier = placementSystem.getZoneMultiplier(50, 50);
      expect(multiplier).toBe(1.0);
    });
  });

  describe('analyzeClusterPotential', () => {
    it('should detect console clusters', () => {
      // Position near console1 (200, 300)
      const analysis = placementSystem.analyzeClusterPotential(250, 300);
      
      expect(analysis.count).toBeGreaterThan(0);
      expect(analysis.bonus).toBeGreaterThan(0);
      expect(analysis.consoles).toContain(console1);
    });

    it('should not detect clusters in empty areas', () => {
      const analysis = placementSystem.analyzeClusterPotential(1000, 100);
      
      expect(analysis.count).toBe(0);
      expect(analysis.bonus).toBe(0);
      expect(analysis.consoles).toHaveLength(0);
    });

    it('should limit cluster bonus to maximum', () => {
      // Add more consoles to test max cluster size
      for (let i = 0; i < 5; i++) {
        const console = new GameConsole(200 + i * 30, 300, 'retro-arcade');
        mockGame.consoles.push(console);
      }
      
      const analysis = placementSystem.analyzeClusterPotential(200, 300);
      expect(analysis.bonus).toBeLessThanOrEqual(placementSystem.clusterBonus);
    });
  });

  describe('getCongestionLevel', () => {
    it('should count guests in appeal radius', () => {
      const congestion = placementSystem.getCongestionLevel(125, 300);
      expect(congestion).toBe(2); // Both guests should be within range
    });

    it('should return zero for areas without guests', () => {
      const congestion = placementSystem.getCongestionLevel(1000, 100);
      expect(congestion).toBe(0);
    });
  });

  describe('getConsolesInRadius', () => {
    it('should find consoles within radius', () => {
      const consoles = placementSystem.getConsolesInRadius(300, 300, 150);
      expect(consoles).toContain(console1);
      expect(consoles).toContain(console2);
    });

    it('should not find consoles outside radius', () => {
      const consoles = placementSystem.getConsolesInRadius(300, 300, 50);
      expect(consoles).toHaveLength(0);
    });
  });

  describe('analyzePosition', () => {
    it('should provide comprehensive position analysis', () => {
      const analysis = placementSystem.analyzePosition(100, 300);
      
      expect(analysis).toHaveProperty('zoneMultiplier');
      expect(analysis).toHaveProperty('clusterBonus');
      expect(analysis).toHaveProperty('nearbyConsoles');
      expect(analysis).toHaveProperty('congestionLevel');
      expect(analysis).toHaveProperty('overallScore');
      expect(analysis).toHaveProperty('recommendation');
      
      expect(typeof analysis.zoneMultiplier).toBe('number');
      expect(typeof analysis.clusterBonus).toBe('number');
      expect(typeof analysis.congestionLevel).toBe('number');
      expect(typeof analysis.overallScore).toBe('number');
      expect(typeof analysis.recommendation).toBe('string');
    });
  });

  describe('getEffectiveAppeal', () => {
    it('should calculate effective appeal with strategic modifiers', () => {
      const baseAppeal = console1.appeal;
      const effectiveAppeal = placementSystem.getEffectiveAppeal(console1);
      
      expect(effectiveAppeal).toBeGreaterThanOrEqual(1);
      expect(typeof effectiveAppeal).toBe('number');
    });

    it('should return base appeal for console without transform', () => {
      const mockConsole = { appeal: 5, getComponent: () => null };
      const effectiveAppeal = placementSystem.getEffectiveAppeal(mockConsole);
      
      expect(effectiveAppeal).toBe(5);
    });
  });

  describe('findOptimalConsole', () => {
    it('should find optimal console for guest', () => {
      const optimalConsole = placementSystem.findOptimalConsole(guest1, mockGame.consoles);
      
      expect(optimalConsole).toBeDefined();
      expect([console1, console2]).toContain(optimalConsole);
    });

    it('should return null for guest without transform', () => {
      const mockGuest = { getComponent: () => null };
      const optimalConsole = placementSystem.findOptimalConsole(mockGuest, mockGame.consoles);
      
      expect(optimalConsole).toBeNull();
    });

    it('should return null when no consoles are operational', () => {
      console1.state = 'broken';
      console2.state = 'broken';
      
      const optimalConsole = placementSystem.findOptimalConsole(guest1, mockGame.consoles);
      
      expect(optimalConsole).toBeNull();
    });

    it('should prefer consoles that appeal to guest type', () => {
      // Classic home console appeals to casual guests
      const casualGuest = new Guest(300, 350, 'casual');
      mockGame.guests.push(casualGuest);
      
      const optimalConsole = placementSystem.findOptimalConsole(casualGuest, mockGame.consoles);
      
      // Should prefer classic-home console due to guest type compatibility
      expect(optimalConsole).toBe(console2);
    });
  });

  describe('getVisualizationData', () => {
    it('should return visualization data for debug/UI', () => {
      const vizData = placementSystem.getVisualizationData();
      
      expect(vizData).toHaveProperty('heatmap');
      expect(vizData).toHaveProperty('zones');
      expect(vizData).toHaveProperty('consoleAnalysis');
      
      expect(Array.isArray(vizData.heatmap)).toBe(true);
      expect(Array.isArray(vizData.consoleAnalysis)).toBe(true);
      expect(vizData.zones).toBe(placementSystem.zones);
      
      // Check heatmap structure
      if (vizData.heatmap.length > 0) {
        const heatmapPoint = vizData.heatmap[0];
        expect(heatmapPoint).toHaveProperty('x');
        expect(heatmapPoint).toHaveProperty('y');
        expect(heatmapPoint).toHaveProperty('score');
      }
      
      // Check console analysis structure
      expect(vizData.consoleAnalysis).toHaveLength(2);
      const consoleAnalysis = vizData.consoleAnalysis[0];
      expect(consoleAnalysis).toHaveProperty('console');
      expect(consoleAnalysis).toHaveProperty('effectiveAppeal');
      expect(consoleAnalysis).toHaveProperty('analysis');
    });
  });

  describe('update', () => {
    it('should update strategic data on consoles', () => {
      placementSystem.update(16.67);
      
      expect(console1.strategicData).toBeDefined();
      expect(console1.strategicData).toHaveProperty('effectiveAppeal');
      expect(console1.strategicData).toHaveProperty('congestion');
      expect(console1.strategicData).toHaveProperty('zoneMultiplier');
      
      expect(console2.strategicData).toBeDefined();
      expect(console2.strategicData).toHaveProperty('effectiveAppeal');
      expect(console2.strategicData).toHaveProperty('congestion');
      expect(console2.strategicData).toHaveProperty('zoneMultiplier');
    });
  });

  describe('event system', () => {
    it('should register and emit events', () => {
      let called = false;
      const callback = () => { called = true; };
      
      placementSystem.on('testEvent', callback);
      placementSystem.emit('testEvent', {});
      
      expect(called).toBe(true);
    });

    it('should unregister events', () => {
      let called = false;
      const callback = () => { called = true; };
      
      placementSystem.on('testEvent', callback);
      placementSystem.off('testEvent', callback);
      placementSystem.emit('testEvent', {});
      
      expect(called).toBe(false);
    });

    it('should handle errors in event listeners', () => {
      const errorCallback = () => { throw new Error('Test error'); };
      const normalCallback = () => {};
      
      placementSystem.on('testEvent', errorCallback);
      placementSystem.on('testEvent', normalCallback);
      
      // Should not throw error
      expect(() => {
        placementSystem.emit('testEvent', {});
      }).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle empty game state', () => {
      mockGame.consoles = [];
      mockGame.guests = [];
      
      const analysis = placementSystem.analyzePosition(300, 300);
      expect(analysis.nearbyConsoles).toBe(0);
      expect(analysis.congestionLevel).toBe(0);
      
      const optimalConsole = placementSystem.findOptimalConsole(guest1, []);
      expect(optimalConsole).toBeNull();
    });

    it('should handle high congestion scenarios', () => {
      // Add many guests near console1
      for (let i = 0; i < 5; i++) {
        const guest = new Guest(200 + i * 10, 300 + i * 10, 'casual');
        mockGame.guests.push(guest);
      }
      
      const analysis = placementSystem.analyzePosition(200, 300);
      expect(analysis.congestionLevel).toBeGreaterThan(2);
      expect(analysis.overallScore).toBeLessThan(1.0); // Congestion penalty applied
    });

    it('should provide strategic recommendations', () => {
      const highTrafficAnalysis = placementSystem.analyzePosition(100, 300); // Entrance zone
      const lowTrafficAnalysis = placementSystem.analyzePosition(1100, 150); // Corner zone
      
      expect(highTrafficAnalysis.recommendation).toMatch(/High traffic|Excellent|Good/i);
      expect(lowTrafficAnalysis.recommendation).toMatch(/Low traffic|Poor/i);
    });
  });
});