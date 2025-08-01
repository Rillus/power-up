import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterUpgradeSystem } from '../../../src/systems/CharacterUpgradeSystem.js';
import { Character } from '../../../src/entities/Character.js';

describe('CharacterUpgradeSystem', () => {
  let upgradeSystem;
  let mockGame;
  let mockGameStateManager;
  let mockCharacter;

  beforeEach(() => {
    mockCharacter = new Character(400, 300);
    
    mockGameStateManager = {
      gameData: {
        money: 1000
      },
      spendMoney: vi.fn((amount) => {
        if (mockGameStateManager.gameData.money >= amount) {
          mockGameStateManager.gameData.money -= amount;
          return { success: true, remaining: mockGameStateManager.gameData.money };
        }
        return { success: false, error: 'Insufficient funds' };
      }),
      saveGameData: vi.fn(),
      loadGameData: vi.fn(() => ({}))
    };

    mockGame = {
      canvas: { width: 800, height: 600 },
      character: mockCharacter,
      audioSystem: {
        playSuccessSound: vi.fn()
      },
      createFloatingNumber: vi.fn()
    };

    upgradeSystem = new CharacterUpgradeSystem(mockGame, mockGameStateManager);
  });

  describe('initialization', () => {
    it('should initialize with correct default upgrades', () => {
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(0);
      expect(upgradeSystem.upgrades.repair.currentLevel).toBe(0);
      expect(upgradeSystem.upgrades.efficiency.currentLevel).toBe(0);
    });

    it('should have correct upgrade configurations', () => {
      expect(upgradeSystem.upgrades.speed.name).toBe('Movement Speed');
      expect(upgradeSystem.upgrades.speed.maxLevel).toBe(5);
      expect(upgradeSystem.upgrades.speed.baseCost).toBe(200);
      
      expect(upgradeSystem.upgrades.repair.name).toBe('Repair Skill');
      expect(upgradeSystem.upgrades.repair.maxLevel).toBe(5);
      expect(upgradeSystem.upgrades.repair.baseCost).toBe(300);
      
      expect(upgradeSystem.upgrades.efficiency.name).toBe('Work Efficiency');
      expect(upgradeSystem.upgrades.efficiency.maxLevel).toBe(5);
      expect(upgradeSystem.upgrades.efficiency.baseCost).toBe(250);
    });

    it('should start with closed menu', () => {
      expect(upgradeSystem.showUpgradeMenu).toBe(false);
    });
  });

  describe('cost calculations', () => {
    it('should calculate correct upgrade costs', () => {
      // Level 0->1 should be base cost
      expect(upgradeSystem.getUpgradeCost('speed')).toBe(200);
      expect(upgradeSystem.getUpgradeCost('repair')).toBe(300);
      expect(upgradeSystem.getUpgradeCost('efficiency')).toBe(250);
    });

    it('should increase costs with multiplier', () => {
      upgradeSystem.upgrades.speed.currentLevel = 1;
      const level2Cost = Math.floor(200 * Math.pow(1.5, 1));
      expect(upgradeSystem.getUpgradeCost('speed')).toBe(level2Cost);
    });

    it('should return 0 cost when at max level', () => {
      upgradeSystem.upgrades.speed.currentLevel = 5;
      expect(upgradeSystem.getUpgradeCost('speed')).toBe(0);
    });
  });

  describe('upgrade availability', () => {
    it('should allow upgrade when player has enough money', () => {
      mockGameStateManager.gameData.money = 500;
      expect(upgradeSystem.canUpgrade('speed')).toBe(true);
      expect(upgradeSystem.canUpgrade('repair')).toBe(true);
      expect(upgradeSystem.canUpgrade('efficiency')).toBe(true);
    });

    it('should not allow upgrade when insufficient funds', () => {
      mockGameStateManager.gameData.money = 100;
      expect(upgradeSystem.canUpgrade('speed')).toBe(false);
      expect(upgradeSystem.canUpgrade('repair')).toBe(false);
      expect(upgradeSystem.canUpgrade('efficiency')).toBe(false);
    });

    it('should not allow upgrade at max level', () => {
      upgradeSystem.upgrades.speed.currentLevel = 5;
      mockGameStateManager.gameData.money = 10000;
      expect(upgradeSystem.canUpgrade('speed')).toBe(false);
    });
  });

  describe('purchasing upgrades', () => {
    it('should successfully purchase speed upgrade', () => {
      mockGameStateManager.gameData.money = 500;
      
      const result = upgradeSystem.purchaseUpgrade('speed');
      
      expect(result.success).toBe(true);
      expect(result.upgradeType).toBe('speed');
      expect(result.newLevel).toBe(1);
      expect(result.cost).toBe(200);
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(1);
      expect(mockGameStateManager.spendMoney).toHaveBeenCalledWith(200);
    });

    it('should apply speed upgrade to character', () => {
      mockGameStateManager.gameData.money = 500;
      const movement = mockCharacter.getComponent('Movement');
      const originalSpeed = movement.getSpeed();
      
      upgradeSystem.purchaseUpgrade('speed');
      
      expect(movement.getSpeed()).toBe(originalSpeed + 40); // +40 per level
    });

    it('should apply repair upgrade to character', () => {
      mockGameStateManager.gameData.money = 500;
      
      upgradeSystem.purchaseUpgrade('repair');
      
      expect(mockCharacter.baseRepairSpeedBonus).toBe(1.15); // 1 + (1 * 0.15)
    });

    it('should apply efficiency upgrade to character', () => {
      mockGameStateManager.gameData.money = 500;
      
      upgradeSystem.purchaseUpgrade('efficiency');
      
      expect(mockCharacter.workEfficiencyBonus).toBe(1.2); // 1 + (1 * 0.2)
    });

    it('should fail when insufficient funds', () => {
      mockGameStateManager.gameData.money = 100;
      
      const result = upgradeSystem.purchaseUpgrade('speed');
      
      expect(result.success).toBe(false);
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(0);
    });

    it('should fail when at max level', () => {
      upgradeSystem.upgrades.speed.currentLevel = 5;
      mockGameStateManager.gameData.money = 10000;
      
      const result = upgradeSystem.purchaseUpgrade('speed');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('max level');
    });

    it('should emit upgrade event', () => {
      const eventSpy = vi.fn();
      upgradeSystem.on('upgradesPurchased', eventSpy);
      mockGameStateManager.gameData.money = 500;
      
      upgradeSystem.purchaseUpgrade('speed');
      
      expect(eventSpy).toHaveBeenCalledWith({
        type: 'speed',
        level: 1,
        cost: 200,
        name: 'Movement Speed'
      });
    });

    it('should play success sound', () => {
      mockGameStateManager.gameData.money = 500;
      
      upgradeSystem.purchaseUpgrade('speed');
      
      expect(mockGame.audioSystem.playSuccessSound).toHaveBeenCalled();
    });

    it('should create floating text', () => {
      mockGameStateManager.gameData.money = 500;
      
      upgradeSystem.purchaseUpgrade('speed');
      
      expect(mockGame.createFloatingNumber).toHaveBeenCalledWith(
        400, 260, 'Movement Speed +1!', '#00FF00', 2000, { x: 0, y: -30 }
      );
    });
  });

  describe('multiple upgrades', () => {
    it('should handle multiple levels of same upgrade', () => {
      mockGameStateManager.gameData.money = 2000;
      
      // Purchase level 1
      upgradeSystem.purchaseUpgrade('speed');
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(1);
      
      // Purchase level 2
      upgradeSystem.purchaseUpgrade('speed');
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(2);
      
      // Check character speed increased twice
      const movement = mockCharacter.getComponent('Movement');
      expect(movement.getSpeed()).toBe(280); // 200 + (2 * 40)
    });

    it('should handle different upgrade types', () => {
      mockGameStateManager.gameData.money = 2000;
      
      upgradeSystem.purchaseUpgrade('speed');
      upgradeSystem.purchaseUpgrade('repair');
      upgradeSystem.purchaseUpgrade('efficiency');
      
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(1);
      expect(upgradeSystem.upgrades.repair.currentLevel).toBe(1);
      expect(upgradeSystem.upgrades.efficiency.currentLevel).toBe(1);
      
      expect(mockCharacter.baseRepairSpeedBonus).toBe(1.15);
      expect(mockCharacter.workEfficiencyBonus).toBe(1.2);
    });
  });

  describe('upgrade information', () => {
    it('should return correct upgrade info', () => {
      const info = upgradeSystem.getUpgradeInfo('speed');
      
      expect(info.name).toBe('Movement Speed');
      expect(info.currentLevel).toBe(0);
      expect(info.maxLevel).toBe(5);
      expect(info.nextCost).toBe(200);
      expect(info.canAfford).toBe(true);
      expect(info.isMaxLevel).toBe(false);
      expect(info.currentBonus).toBe('None');
      expect(info.nextBonus).toBe('+40 px/s');
    });

    it('should show correct bonus descriptions', () => {
      upgradeSystem.upgrades.speed.currentLevel = 2;
      upgradeSystem.upgrades.repair.currentLevel = 1;
      upgradeSystem.upgrades.efficiency.currentLevel = 3;
      
      expect(upgradeSystem.getCurrentBonus('speed')).toBe('+80 px/s');
      expect(upgradeSystem.getCurrentBonus('repair')).toBe('-15% repair time');
      expect(upgradeSystem.getCurrentBonus('efficiency')).toBe('+60% work speed');
    });

    it('should handle max level info', () => {
      upgradeSystem.upgrades.speed.currentLevel = 5;
      const info = upgradeSystem.getUpgradeInfo('speed');
      
      expect(info.isMaxLevel).toBe(true);
      expect(info.nextCost).toBe(0);
      expect(info.nextBonus).toBe('MAX');
    });
  });

  describe('menu system', () => {
    it('should toggle menu visibility', () => {
      expect(upgradeSystem.showUpgradeMenu).toBe(false);
      
      upgradeSystem.toggleUpgradeMenu();
      expect(upgradeSystem.showUpgradeMenu).toBe(true);
      
      upgradeSystem.toggleUpgradeMenu();
      expect(upgradeSystem.showUpgradeMenu).toBe(false);
    });

    it('should emit menu events', () => {
      const openSpy = vi.fn();
      const closeSpy = vi.fn();
      upgradeSystem.on('upgradeMenuOpened', openSpy);
      upgradeSystem.on('upgradeMenuClosed', closeSpy);
      
      upgradeSystem.toggleUpgradeMenu();
      expect(openSpy).toHaveBeenCalled();
      
      upgradeSystem.toggleUpgradeMenu();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      upgradeSystem.showUpgradeMenu = true;
      mockGameStateManager.gameData.money = 2000;
    });

    it('should handle digit 1 for speed upgrade', () => {
      const result = upgradeSystem.handleKeyPress('Digit1');
      
      expect(result).toBe(true);
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(1);
    });

    it('should handle digit 2 for repair upgrade', () => {
      const result = upgradeSystem.handleKeyPress('Digit2');
      
      expect(result).toBe(true);
      expect(upgradeSystem.upgrades.repair.currentLevel).toBe(1);
    });

    it('should handle digit 3 for efficiency upgrade', () => {
      const result = upgradeSystem.handleKeyPress('Digit3');
      
      expect(result).toBe(true);
      expect(upgradeSystem.upgrades.efficiency.currentLevel).toBe(1);
    });

    it('should not handle keys when menu closed', () => {
      upgradeSystem.showUpgradeMenu = false;
      
      const result = upgradeSystem.handleKeyPress('Digit1');
      
      expect(result).toBe(false);
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(0);
    });

    it('should not handle invalid keys', () => {
      const result = upgradeSystem.handleKeyPress('KeyA');
      
      expect(result).toBe(false);
    });

    it('should not purchase when cannot afford', () => {
      mockGameStateManager.gameData.money = 50;
      
      const result = upgradeSystem.handleKeyPress('Digit1');
      
      expect(result).toBe(true); // Key was handled
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(0); // But upgrade didn't happen
    });
  });

  describe('persistence', () => {
    it('should save upgrade progress', () => {
      upgradeSystem.upgrades.speed.currentLevel = 2;
      upgradeSystem.upgrades.repair.currentLevel = 1;
      
      upgradeSystem.saveUpgradeProgress();
      
      expect(mockGameStateManager.saveGameData).toHaveBeenCalledWith({
        characterUpgrades: {
          speed: 2,
          repair: 1,
          efficiency: 0
        }
      });
    });

    it('should load upgrade progress', () => {
      mockGameStateManager.gameData = {
        characterUpgrades: {
          speed: 3,
          repair: 2,
          efficiency: 1
        }
      };
      
      upgradeSystem.loadUpgradeProgress();
      
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(3);
      expect(upgradeSystem.upgrades.repair.currentLevel).toBe(2);
      expect(upgradeSystem.upgrades.efficiency.currentLevel).toBe(1);
    });

    it('should apply all upgrades on load', () => {
      upgradeSystem.upgrades.speed.currentLevel = 2;
      upgradeSystem.upgrades.repair.currentLevel = 1;
      upgradeSystem.upgrades.efficiency.currentLevel = 3;
      
      upgradeSystem.applyAllUpgrades();
      
      const movement = mockCharacter.getComponent('Movement');
      expect(movement.getSpeed()).toBe(280); // 200 + (2 * 40)
      expect(mockCharacter.baseRepairSpeedBonus).toBe(1.15); // 1 + (1 * 0.15)
      expect(mockCharacter.workEfficiencyBonus).toBe(1.6); // 1 + (3 * 0.2)
    });
  });

  describe('investment tracking', () => {
    it('should calculate total investment', () => {
      // Purchase some upgrades
      mockGameStateManager.gameData.money = 5000;
      upgradeSystem.purchaseUpgrade('speed'); // 200
      upgradeSystem.purchaseUpgrade('speed'); // 300 (200 * 1.5)
      upgradeSystem.purchaseUpgrade('repair'); // 300
      
      const total = upgradeSystem.getTotalInvestment();
      expect(total).toBe(800); // 200 + 300 + 300
    });

    it('should handle zero investment', () => {
      const total = upgradeSystem.getTotalInvestment();
      expect(total).toBe(0);
    });
  });

  describe('reset functionality', () => {
    it('should reset all upgrades', () => {
      upgradeSystem.upgrades.speed.currentLevel = 3;
      upgradeSystem.upgrades.repair.currentLevel = 2;
      upgradeSystem.upgrades.efficiency.currentLevel = 1;
      
      const eventSpy = vi.fn();
      upgradeSystem.on('upgradesReset', eventSpy);
      
      upgradeSystem.resetUpgrades();
      
      expect(upgradeSystem.upgrades.speed.currentLevel).toBe(0);
      expect(upgradeSystem.upgrades.repair.currentLevel).toBe(0);
      expect(upgradeSystem.upgrades.efficiency.currentLevel).toBe(0);
      expect(eventSpy).toHaveBeenCalled();
      expect(mockGameStateManager.saveGameData).toHaveBeenCalled();
    });
  });
});