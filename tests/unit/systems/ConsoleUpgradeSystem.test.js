import { describe, it, expect, beforeEach } from 'vitest';
import { ConsoleUpgradeSystem } from '../../../src/systems/ConsoleUpgradeSystem.js';
import { GameConsole } from '../../../src/entities/GameConsole.js';

describe('ConsoleUpgradeSystem', () => {
  let upgradeSystem;
  let mockGame;
  let console1;
  let console2;

  beforeEach(() => {
    // Create mock game
    mockGame = {
      money: 2000,
      consoles: []
    };

    // Create consoles
    console1 = new GameConsole(100, 200, 'retro-arcade', 1); // Tier 1
    console2 = new GameConsole(300, 400, 'classic-home', 2); // Tier 2
    
    mockGame.consoles = [console1, console2];
    
    // Create upgrade system
    upgradeSystem = new ConsoleUpgradeSystem(mockGame);
  });

  describe('constructor', () => {
    it('should initialize with game reference', () => {
      expect(upgradeSystem.game).toBe(mockGame);
      expect(upgradeSystem.selectedConsole).toBeNull();
      expect(upgradeSystem.upgradeMode).toBe(false);
    });
  });

  describe('canAffordUpgrade', () => {
    it('should return true when player has enough money', () => {
      expect(upgradeSystem.canAffordUpgrade(console1)).toBe(true);
    });

    it('should return false when player does not have enough money', () => {
      mockGame.money = 100; // Not enough for upgrade
      expect(upgradeSystem.canAffordUpgrade(console1)).toBe(false);
    });

    it('should return false for console that cannot be upgraded', () => {
      const maxTierConsole = new GameConsole(500, 600, 'retro-arcade', 3); // Tier 3 (max)
      expect(upgradeSystem.canAffordUpgrade(maxTierConsole)).toBe(false);
    });

    it('should return false for null console', () => {
      expect(upgradeSystem.canAffordUpgrade(null)).toBe(false);
    });
  });

  describe('getUpgradeableConsoles', () => {
    it('should return consoles that can be upgraded and are affordable', () => {
      mockGame.money = 2000; // Enough for both
      const upgradeable = upgradeSystem.getUpgradeableConsoles();
      
      expect(upgradeable).toContain(console1);
      expect(upgradeable).toContain(console2);
    });

    it('should exclude consoles player cannot afford', () => {
      mockGame.money = 500; // Only enough for console1
      const upgradeable = upgradeSystem.getUpgradeableConsoles();
      
      expect(upgradeable).toContain(console1);
      expect(upgradeable).not.toContain(console2);
    });

    it('should exclude max tier consoles', () => {
      const maxTierConsole = new GameConsole(500, 600, 'retro-arcade', 3);
      mockGame.consoles.push(maxTierConsole);
      
      const upgradeable = upgradeSystem.getUpgradeableConsoles();
      expect(upgradeable).not.toContain(maxTierConsole);
    });
  });

  describe('selectConsole', () => {
    it('should select console that can be upgraded', () => {
      const result = upgradeSystem.selectConsole(console1);
      
      expect(result).toBe(true);
      expect(upgradeSystem.selectedConsole).toBe(console1);
    });

    it('should not select console that cannot be upgraded', () => {
      const maxTierConsole = new GameConsole(500, 600, 'retro-arcade', 3);
      const result = upgradeSystem.selectConsole(maxTierConsole);
      
      expect(result).toBe(false);
      expect(upgradeSystem.selectedConsole).toBeNull();
    });

    it('should not select null console', () => {
      const result = upgradeSystem.selectConsole(null);
      
      expect(result).toBe(false);
      expect(upgradeSystem.selectedConsole).toBeNull();
    });
  });

  describe('deselectConsole', () => {
    it('should deselect currently selected console', () => {
      upgradeSystem.selectConsole(console1);
      expect(upgradeSystem.selectedConsole).toBe(console1);
      
      upgradeSystem.deselectConsole();
      expect(upgradeSystem.selectedConsole).toBeNull();
    });
  });

  describe('confirmUpgrade', () => {
    it('should upgrade selected console successfully', () => {
      upgradeSystem.selectConsole(console1);
      const originalTier = console1.tier;
      const upgradeCost = console1.getUpgradeCost();
      const originalMoney = mockGame.money;
      
      const result = upgradeSystem.confirmUpgrade();
      
      expect(result).toBe(true);
      expect(console1.tier).toBe(originalTier + 1);
      expect(mockGame.money).toBe(originalMoney - upgradeCost);
      expect(upgradeSystem.selectedConsole).toBeNull();
    });

    it('should fail when no console is selected', () => {
      const result = upgradeSystem.confirmUpgrade();
      
      expect(result).toBe(false);
    });

    it('should fail when player cannot afford upgrade', () => {
      upgradeSystem.selectConsole(console1);
      mockGame.money = 10; // Not enough
      
      const result = upgradeSystem.confirmUpgrade();
      
      expect(result).toBe(false);
    });

    it('should emit upgradeComplete event on successful upgrade', () => {
      let eventData = null;
      upgradeSystem.on('upgradeComplete', (data) => {
        eventData = data;
      });
      
      upgradeSystem.selectConsole(console1);
      upgradeSystem.confirmUpgrade();
      
      expect(eventData).not.toBeNull();
      expect(eventData.console).toBe(console1);
      expect(eventData.newTier).toBe(2);
      expect(eventData.oldTier).toBe(1);
    });
  });

  describe('getUpgradeInfo', () => {
    it('should return upgrade information for upgradeable console', () => {
      const info = upgradeSystem.getUpgradeInfo(console1);
      
      expect(info).not.toBeNull();
      expect(info.currentTier).toBe(1);
      expect(info.nextTier).toBe(2);
      expect(info.currentTierName).toBe('Basic');
      expect(info.nextTierName).toBe('Enhanced');
      expect(info.affordable).toBe(true);
      expect(typeof info.cost).toBe('number');
      expect(info.cost).toBeGreaterThan(0);
    });

    it('should return null for console that cannot be upgraded', () => {
      const maxTierConsole = new GameConsole(500, 600, 'retro-arcade', 3);
      const info = upgradeSystem.getUpgradeInfo(maxTierConsole);
      
      expect(info).toBeNull();
    });

    it('should return null for null console', () => {
      const info = upgradeSystem.getUpgradeInfo(null);
      
      expect(info).toBeNull();
    });
  });

  describe('getTierName', () => {
    it('should return correct tier names', () => {
      expect(upgradeSystem.getTierName(1)).toBe('Basic');
      expect(upgradeSystem.getTierName(2)).toBe('Enhanced');
      expect(upgradeSystem.getTierName(3)).toBe('Premium');
      expect(upgradeSystem.getTierName(4)).toBe('Unknown');
    });
  });

  describe('getUpgradeBenefits', () => {
    it('should return upgrade benefits for valid console', () => {
      const benefits = upgradeSystem.getUpgradeBenefits(console1);
      
      expect(typeof benefits.revenueIncrease).toBe('number');
      expect(typeof benefits.durabilityIncrease).toBe('number');
      expect(typeof benefits.repairTimeDecrease).toBe('number');
      expect(typeof benefits.appealIncrease).toBe('number');
      
      expect(benefits.revenueIncrease).toBeGreaterThan(0);
      expect(benefits.durabilityIncrease).toBeGreaterThan(0);
    });

    it('should return empty object for console that cannot be upgraded', () => {
      const maxTierConsole = new GameConsole(500, 600, 'retro-arcade', 3);
      const benefits = upgradeSystem.getUpgradeBenefits(maxTierConsole);
      
      expect(benefits).toEqual({});
    });
  });

  describe('getUpgradeMenu', () => {
    it('should return upgrade menu data for UI', () => {
      const menu = upgradeSystem.getUpgradeMenu();
      
      expect(Array.isArray(menu)).toBe(true);
      expect(menu.length).toBe(2); // Both consoles can be upgraded
      
      const item1 = menu.find(item => item.console === console1);
      expect(item1).toBeDefined();
      expect(item1.canUpgrade).toBe(true);
      expect(item1.upgradeInfo).not.toBeNull();
      expect(item1.selected).toBe(false);
    });

    it('should mark selected console in menu', () => {
      upgradeSystem.selectConsole(console1);
      const menu = upgradeSystem.getUpgradeMenu();
      
      const item1 = menu.find(item => item.console === console1);
      expect(item1.selected).toBe(true);
    });
  });

  describe('findConsoleAtPosition', () => {
    it('should find console at given position', () => {
      const foundConsole = upgradeSystem.findConsoleAtPosition(100, 200);
      expect(foundConsole).toBe(console1);
    });

    it('should return null when no console at position', () => {
      const foundConsole = upgradeSystem.findConsoleAtPosition(1000, 1000);
      expect(foundConsole).toBeNull();
    });

    it('should not return console that cannot be upgraded', () => {
      const maxTierConsole = new GameConsole(500, 600, 'retro-arcade', 3);
      mockGame.consoles.push(maxTierConsole);
      
      const foundConsole = upgradeSystem.findConsoleAtPosition(500, 600);
      expect(foundConsole).toBeNull();
    });
  });

  describe('event system', () => {
    it('should register and emit events', () => {
      let called = false;
      const callback = () => { called = true; };
      
      upgradeSystem.on('testEvent', callback);
      upgradeSystem.emit('testEvent', {});
      
      expect(called).toBe(true);
    });

    it('should unregister events', () => {
      let called = false;
      const callback = () => { called = true; };
      
      upgradeSystem.on('testEvent', callback);
      upgradeSystem.off('testEvent', callback);
      upgradeSystem.emit('testEvent', {});
      
      expect(called).toBe(false);
    });
  });
});