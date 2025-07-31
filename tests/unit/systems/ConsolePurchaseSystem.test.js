import { describe, it, expect, beforeEach } from 'vitest';
import { ConsolePurchaseSystem } from '../../../src/systems/ConsolePurchaseSystem.js';

describe('ConsolePurchaseSystem', () => {
  let purchaseSystem;
  let mockGame;

  beforeEach(() => {
    // Mock game object
    mockGame = {
      money: 6000, // Enough for all console types
      consoles: [],
      createConsole: (x, y, type) => {
        const mockConsole = { x, y, type, id: Math.random() };
        mockGame.consoles.push(mockConsole);
        return mockConsole;
      },
      createFloatingNumber: (x, y, text, color) => {
        mockGame.lastFloatingNumber = { x, y, text, color };
      }
    };

    purchaseSystem = new ConsolePurchaseSystem(mockGame);
  });

  describe('constructor', () => {
    it('should initialize with game reference and placement mode off', () => {
      expect(purchaseSystem.game).toBe(mockGame);
      expect(purchaseSystem.placementMode).toBe(false);
      expect(purchaseSystem.selectedConsoleType).toBeNull();
      expect(purchaseSystem.previewPosition).toEqual({ x: 0, y: 0 });
    });

    it('should initialize with console types and costs', () => {
      expect(purchaseSystem.consoleTypes).toEqual({
        'retro-arcade': { cost: 500, name: 'Retro Arcade' },
        'classic-home': { cost: 1200, name: 'Classic Home' },
        'modern-gaming': { cost: 2500, name: 'Modern Gaming' },
        'vr-experience': { cost: 5000, name: 'VR Experience' }
      });
    });
  });

  describe('canAfford', () => {
    it('should return true when player has enough money', () => {
      expect(purchaseSystem.canAfford('retro-arcade')).toBe(true);
      expect(purchaseSystem.canAfford('classic-home')).toBe(true);
      expect(purchaseSystem.canAfford('modern-gaming')).toBe(true);
    });

    it('should return false when player does not have enough money', () => {
      mockGame.money = 400;
      expect(purchaseSystem.canAfford('retro-arcade')).toBe(false);
    });

    it('should return false for invalid console type', () => {
      expect(purchaseSystem.canAfford('invalid-type')).toBe(false);
    });
  });

  describe('getAffordableConsoles', () => {
    it('should return all affordable console types', () => {
      mockGame.money = 3000;
      const affordable = purchaseSystem.getAffordableConsoles();
      
      expect(affordable).toEqual([
        'retro-arcade',
        'classic-home',
        'modern-gaming'
      ]);
    });

    it('should return empty array when no consoles are affordable', () => {
      mockGame.money = 100;
      const affordable = purchaseSystem.getAffordableConsoles();
      
      expect(affordable).toEqual([]);
    });

    it('should return only cheapest console when money is limited', () => {
      mockGame.money = 600;
      const affordable = purchaseSystem.getAffordableConsoles();
      
      expect(affordable).toEqual(['retro-arcade']);
    });
  });

  describe('startPlacement', () => {
    it('should enter placement mode for valid console type', () => {
      const result = purchaseSystem.startPlacement('retro-arcade');
      
      expect(result).toBe(true);
      expect(purchaseSystem.placementMode).toBe(true);
      expect(purchaseSystem.selectedConsoleType).toBe('retro-arcade');
    });

    it('should not enter placement mode for unaffordable console', () => {
      mockGame.money = 400;
      const result = purchaseSystem.startPlacement('retro-arcade');
      
      expect(result).toBe(false);
      expect(purchaseSystem.placementMode).toBe(false);
      expect(purchaseSystem.selectedConsoleType).toBeNull();
    });

    it('should not enter placement mode for invalid console type', () => {
      const result = purchaseSystem.startPlacement('invalid-type');
      
      expect(result).toBe(false);
      expect(purchaseSystem.placementMode).toBe(false);
    });
  });

  describe('updatePreviewPosition', () => {
    beforeEach(() => {
      purchaseSystem.startPlacement('retro-arcade');
    });

    it('should update preview position when in placement mode', () => {
      purchaseSystem.updatePreviewPosition(300, 200);
      
      // Should snap to grid (320, 200 for 40px grid)
      expect(purchaseSystem.previewPosition).toEqual({ x: 320, y: 200 });
    });

    it('should snap to grid', () => {
      purchaseSystem.updatePreviewPosition(315, 225);
      
      // Should snap to 40px grid
      expect(purchaseSystem.previewPosition).toEqual({ x: 320, y: 240 });
    });

    it('should not update when not in placement mode', () => {
      purchaseSystem.cancelPlacement();
      purchaseSystem.updatePreviewPosition(300, 200);
      
      expect(purchaseSystem.previewPosition).toEqual({ x: 0, y: 0 });
    });
  });

  describe('isValidPlacement', () => {
    beforeEach(() => {
      // Add existing console
      mockGame.consoles.push({ x: 200, y: 200, type: 'retro-arcade' });
      purchaseSystem.startPlacement('retro-arcade');
    });

    it('should return true for valid placement position', () => {
      const isValid = purchaseSystem.isValidPlacement(400, 300);
      expect(isValid).toBe(true);
    });

    it('should return false for position too close to existing console', () => {
      const isValid = purchaseSystem.isValidPlacement(220, 220);
      expect(isValid).toBe(false);
    });

    it('should return false for position too close to canvas edge', () => {
      expect(purchaseSystem.isValidPlacement(50, 100)).toBe(false); // Too close to left
      expect(purchaseSystem.isValidPlacement(1150, 100)).toBe(false); // Too close to right
      expect(purchaseSystem.isValidPlacement(400, 50)).toBe(false); // Too close to top
      expect(purchaseSystem.isValidPlacement(400, 750)).toBe(false); // Too close to bottom
    });
  });

  describe('confirmPlacement', () => {
    beforeEach(() => {
      purchaseSystem.startPlacement('retro-arcade');
      purchaseSystem.updatePreviewPosition(400, 300);
    });

    it('should purchase and place console at valid position', () => {
      const result = purchaseSystem.confirmPlacement();
      
      expect(result).toBe(true);
      expect(mockGame.consoles.length).toBe(1);
      expect(mockGame.consoles[0]).toEqual({
        x: 400,
        y: 320, // Snapped to grid (40px)
        type: 'retro-arcade',
        id: expect.any(Number)
      });
      expect(mockGame.money).toBe(5500); // 6000 - 500
      expect(purchaseSystem.placementMode).toBe(false);
    });

    it('should create floating number notification', () => {
      purchaseSystem.confirmPlacement();
      
      expect(mockGame.lastFloatingNumber).toEqual({
        x: 400,
        y: 290, // y - 30 (320 - 30)
        text: '-£500',
        color: '#ff9900'
      });
    });

    it('should not place console at invalid position', () => {
      // Move to invalid position
      mockGame.consoles.push({ x: 420, y: 320, type: 'classic-home' });
      const result = purchaseSystem.confirmPlacement();
      
      expect(result).toBe(false);
      expect(mockGame.consoles.length).toBe(1); // Only the pre-existing one
      expect(mockGame.money).toBe(6000); // No money spent
      expect(purchaseSystem.placementMode).toBe(true); // Still in placement mode
    });

    it('should not place console when not in placement mode', () => {
      purchaseSystem.cancelPlacement();
      const result = purchaseSystem.confirmPlacement();
      
      expect(result).toBe(false);
      expect(mockGame.consoles.length).toBe(0);
      expect(mockGame.money).toBe(6000);
    });

    it('should not place console when player cannot afford it', () => {
      mockGame.money = 400; // Less than cost
      const result = purchaseSystem.confirmPlacement();
      
      expect(result).toBe(false);
      expect(mockGame.consoles.length).toBe(0);
      expect(mockGame.money).toBe(400);
    });
  });

  describe('cancelPlacement', () => {
    it('should exit placement mode', () => {
      purchaseSystem.startPlacement('retro-arcade');
      expect(purchaseSystem.placementMode).toBe(true);
      
      purchaseSystem.cancelPlacement();
      
      expect(purchaseSystem.placementMode).toBe(false);
      expect(purchaseSystem.selectedConsoleType).toBeNull();
      expect(purchaseSystem.previewPosition).toEqual({ x: 0, y: 0 });
    });
  });

  describe('getConsoleInfo', () => {
    it('should return console information for valid type', () => {
      const info = purchaseSystem.getConsoleInfo('retro-arcade');
      
      expect(info).toEqual({
        cost: 500,
        name: 'Retro Arcade'
      });
    });

    it('should return null for invalid type', () => {
      const info = purchaseSystem.getConsoleInfo('invalid-type');
      expect(info).toBeNull();
    });
  });

  describe('getPurchaseMenu', () => {
    it('should return purchase menu data with affordability', () => {
      mockGame.money = 1500;
      const menu = purchaseSystem.getPurchaseMenu();
      
      expect(menu).toEqual([
        { type: 'retro-arcade', name: 'Retro Arcade', cost: 500, affordable: true },
        { type: 'classic-home', name: 'Classic Home', cost: 1200, affordable: true },
        { type: 'modern-gaming', name: 'Modern Gaming', cost: 2500, affordable: false },
        { type: 'vr-experience', name: 'VR Experience', cost: 5000, affordable: false }
      ]);
    });
  });
});