import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementSystem } from '../../../src/systems/AchievementSystem.js';

describe('AchievementSystem', () => {
  let achievementSystem;
  let mockGame;
  let mockGameStateManager;

  beforeEach(() => {
    mockGameStateManager = {
      gameData: {
        money: 1000,
        day: 1
      },
      on: vi.fn(),
      saveGameData: vi.fn(),
      loadGameData: vi.fn(() => ({}))
    };

    mockGame = {
      canvas: { width: 800, height: 600 },
      character: {
        getPosition: () => ({ x: 400, y: 300 })
      },
      consoles: [
        { on: vi.fn() },
        { on: vi.fn() }
      ],
      audioSystem: {
        playSuccessSound: vi.fn()
      },
      createFloatingNumber: vi.fn(),
      characterUpgradeSystem: {
        on: vi.fn()
      },
      powerUpManager: {
        on: vi.fn()
      }
    };

    achievementSystem = new AchievementSystem(mockGame, mockGameStateManager);
  });

  describe('initialization', () => {
    it('should initialize with correct default achievements', () => {
      expect(achievementSystem.achievements).toBeDefined();
      expect(achievementSystem.achievements['first-day']).toBeDefined();
      expect(achievementSystem.achievements['money-maker']).toBeDefined();
      expect(achievementSystem.achievements['crowd-pleaser']).toBeDefined();
    });

    it('should have correct achievement categories', () => {
      const categories = ['survival', 'money', 'guests', 'maintenance', 'expansion', 'progression', 'power-ups', 'mastery'];
      const achievementCategories = Object.values(achievementSystem.achievements).map(a => a.category);
      
      categories.forEach(category => {
        expect(achievementCategories).toContain(category);
      });
    });

    it('should start with no achievements unlocked', () => {
      const unlockedAchievements = Object.values(achievementSystem.achievements).filter(a => a.unlocked);
      expect(unlockedAchievements).toHaveLength(0);
    });

    it('should set up game event listeners', () => {
      expect(mockGameStateManager.on).toHaveBeenCalled();
      expect(mockGame.characterUpgradeSystem.on).toHaveBeenCalled();
      expect(mockGame.powerUpManager.on).toHaveBeenCalled();
    });
  });

  describe('achievement updating', () => {
    it('should update cumulative achievement progress', () => {
      achievementSystem.updateAchievement('money-maker', 100);
      
      expect(achievementSystem.achievements['money-maker'].progress).toBe(100);
      expect(achievementSystem.achievements['money-maker'].unlocked).toBe(false);
    });

    it('should update milestone achievement progress', () => {
      achievementSystem.updateAchievement('first-day', 1);
      
      expect(achievementSystem.achievements['first-day'].progress).toBe(1);
      expect(achievementSystem.achievements['first-day'].unlocked).toBe(true);
    });

    it('should not update already unlocked achievements', () => {
      achievementSystem.achievements['first-day'].unlocked = true;
      achievementSystem.achievements['first-day'].progress = 1;
      
      achievementSystem.updateAchievement('first-day', 2);
      
      expect(achievementSystem.achievements['first-day'].progress).toBe(1);
    });

    it('should unlock achievement when target is reached', () => {
      const unlockSpy = vi.spyOn(achievementSystem, 'unlockAchievement');
      
      achievementSystem.updateAchievement('money-maker', 1000);
      
      expect(unlockSpy).toHaveBeenCalledWith('money-maker');
    });
  });

  describe('achievement unlocking', () => {
    it('should unlock achievement correctly', () => {
      const eventSpy = vi.fn();
      achievementSystem.on('achievementUnlocked', eventSpy);
      
      achievementSystem.unlockAchievement('first-day');
      
      const achievement = achievementSystem.achievements['first-day'];
      expect(achievement.unlocked).toBe(true);
      expect(achievement.unlockedAt).toBeDefined();
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should add unlocked achievement to new achievements list', () => {
      achievementSystem.unlockAchievement('first-day');
      
      expect(achievementSystem.newAchievements).toContain(achievementSystem.achievements['first-day']);
    });

    it('should add achievement to notification queue', () => {
      achievementSystem.unlockAchievement('first-day');
      
      expect(achievementSystem.notificationQueue).toHaveLength(1);
      expect(achievementSystem.notificationQueue[0].type).toBe('achievement');
    });

    it('should play success sound', () => {
      achievementSystem.unlockAchievement('first-day');
      
      expect(mockGame.audioSystem.playSuccessSound).toHaveBeenCalled();
    });

    it('should create floating text', () => {
      achievementSystem.unlockAchievement('first-day');
      
      expect(mockGame.createFloatingNumber).toHaveBeenCalledWith(
        400, 250, '🎮 Exhibition Rookie!', '#FFD700', 3000, { x: 0, y: -20 }
      );
    });

    it('should not unlock already unlocked achievement', () => {
      achievementSystem.achievements['first-day'].unlocked = true;
      const eventSpy = vi.fn();
      achievementSystem.on('achievementUnlocked', eventSpy);
      
      achievementSystem.unlockAchievement('first-day');
      
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('achievement summary', () => {
    beforeEach(() => {
      achievementSystem.unlockAchievement('first-day');
      achievementSystem.unlockAchievement('first-pound');
    });

    it('should return correct achievement summary', () => {
      const summary = achievementSystem.getAchievementSummary();
      
      expect(summary.totalUnlocked).toBe(2);
      expect(summary.totalAchievements).toBeGreaterThan(10);
      expect(summary.completionPercentage).toBeGreaterThan(0);
      expect(summary.categories).toBeDefined();
    });

    it('should group achievements by category', () => {
      const summary = achievementSystem.getAchievementSummary();
      
      expect(summary.categories.survival).toBeDefined();
      expect(summary.categories.money).toBeDefined();
      expect(summary.categories.survival.unlocked).toBe(1);
      expect(summary.categories.money.unlocked).toBe(1);
    });

    it('should include recent unlocks', () => {
      const summary = achievementSystem.getAchievementSummary();
      
      expect(summary.recentUnlocks).toHaveLength(2);
      expect(summary.recentUnlocks[0].id).toBe('first-day');
      expect(summary.recentUnlocks[1].id).toBe('first-pound');
    });
  });

  describe('achievement categories', () => {
    it('should return achievements by category', () => {
      const survivalAchievements = achievementSystem.getAchievementsByCategory('survival');
      
      expect(survivalAchievements.length).toBeGreaterThan(0);
      expect(survivalAchievements.every(a => a.category === 'survival')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const nonExistentAchievements = achievementSystem.getAchievementsByCategory('non-existent');
      
      expect(nonExistentAchievements).toHaveLength(0);
    });
  });

  describe('menu system', () => {
    it('should toggle achievement menu visibility', () => {
      expect(achievementSystem.showAchievements).toBe(false);
      
      achievementSystem.toggleAchievementMenu();
      expect(achievementSystem.showAchievements).toBe(true);
      
      achievementSystem.toggleAchievementMenu();
      expect(achievementSystem.showAchievements).toBe(false);
    });

    it('should clear new achievements when menu is opened', () => {
      achievementSystem.newAchievements = [achievementSystem.achievements['first-day']];
      
      achievementSystem.toggleAchievementMenu();
      
      expect(achievementSystem.newAchievements).toHaveLength(0);
    });

    it('should emit menu events', () => {
      const openSpy = vi.fn();
      const closeSpy = vi.fn();
      achievementSystem.on('achievementMenuOpened', openSpy);
      achievementSystem.on('achievementMenuClosed', closeSpy);
      
      achievementSystem.toggleAchievementMenu();
      expect(openSpy).toHaveBeenCalled();
      
      achievementSystem.toggleAchievementMenu();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should handle A key for achievement menu', () => {
      const result = achievementSystem.handleKeyPress('KeyA');
      
      expect(result).toBe(true);
      expect(achievementSystem.showAchievements).toBe(true);
    });

    it('should not handle other keys', () => {
      const result = achievementSystem.handleKeyPress('KeyB');
      
      expect(result).toBe(false);
      expect(achievementSystem.showAchievements).toBe(false);
    });
  });

  describe('notifications', () => {
    beforeEach(() => {
      achievementSystem.unlockAchievement('first-day');
    });

    it('should process notification queue during update', () => {
      expect(achievementSystem.notificationQueue).toHaveLength(1);
      
      // Mock old notification (older than 10 seconds)
      achievementSystem.notificationQueue[0].timestamp = Date.now() - 11000;
      
      achievementSystem.update(16.67);
      
      expect(achievementSystem.notificationQueue).toHaveLength(0);
    });

    it('should keep recent notifications', () => {
      expect(achievementSystem.notificationQueue).toHaveLength(1);
      
      achievementSystem.update(16.67);
      
      expect(achievementSystem.notificationQueue).toHaveLength(1);
    });
  });

  describe('console count tracking', () => {
    it('should update console collector achievement during update', () => {
      mockGame.consoles = [{}, {}, {}]; // 3 consoles
      
      achievementSystem.update(16.67);
      
      expect(achievementSystem.achievements['console-collector'].progress).toBe(3);
    });

    it('should unlock console collector when target reached', () => {
      const unlockSpy = vi.spyOn(achievementSystem, 'unlockAchievement');
      mockGame.consoles = new Array(10).fill({}); // 10 consoles
      
      achievementSystem.update(16.67);
      
      expect(unlockSpy).toHaveBeenCalledWith('console-collector');
    });
  });

  describe('persistence', () => {
    it('should save achievement progress', () => {
      achievementSystem.achievements['first-day'].progress = 1;
      achievementSystem.achievements['first-day'].unlocked = true;
      achievementSystem.achievements['first-day'].unlockedAt = Date.now();
      
      achievementSystem.saveAchievementProgress();
      
      expect(mockGameStateManager.saveGameData).toHaveBeenCalledWith({
        achievements: expect.objectContaining({
          'first-day': expect.objectContaining({
            progress: 1,
            unlocked: true,
            unlockedAt: expect.any(Number)
          })
        })
      });
    });

    it('should load achievement progress', () => {
      const saveData = {
        achievements: {
          'first-day': {
            progress: 1,
            unlocked: true,
            unlockedAt: Date.now()
          },
          'money-maker': {
            progress: 500,
            unlocked: false
          }
        }
      };
      mockGameStateManager.gameData = saveData;
      
      achievementSystem.loadAchievementProgress();
      
      expect(achievementSystem.achievements['first-day'].progress).toBe(1);
      expect(achievementSystem.achievements['first-day'].unlocked).toBe(true);
      expect(achievementSystem.achievements['money-maker'].progress).toBe(500);
      expect(achievementSystem.achievements['money-maker'].unlocked).toBe(false);
    });

    it('should handle missing save data gracefully', () => {
      mockGameStateManager.gameData = null;
      
      expect(() => {
        achievementSystem.loadAchievementProgress();
      }).not.toThrow();
    });
  });

  describe('reset functionality', () => {
    beforeEach(() => {
      achievementSystem.unlockAchievement('first-day');
      achievementSystem.achievements['money-maker'].progress = 500;
    });

    it('should reset all achievements', () => {
      const eventSpy = vi.fn();
      achievementSystem.on('achievementsReset', eventSpy);
      
      achievementSystem.resetAchievements();
      
      expect(achievementSystem.achievements['first-day'].unlocked).toBe(false);
      expect(achievementSystem.achievements['first-day'].progress).toBe(0);
      expect(achievementSystem.achievements['first-day'].unlockedAt).toBeNull();
      expect(achievementSystem.achievements['money-maker'].progress).toBe(0);
      expect(achievementSystem.newAchievements).toHaveLength(0);
      expect(achievementSystem.notificationQueue).toHaveLength(0);
      expect(eventSpy).toHaveBeenCalled();
      expect(mockGameStateManager.saveGameData).toHaveBeenCalled();
    });
  });

  describe('specific achievement types', () => {
    it('should handle milestone achievements correctly', () => {
      // Milestone achievements should set progress to the maximum value
      achievementSystem.updateAchievement('first-day', 1);
      expect(achievementSystem.achievements['first-day'].progress).toBe(1);
      
      // Subsequent updates shouldn't increase beyond target
      achievementSystem.updateAchievement('first-day', 2);
      expect(achievementSystem.achievements['first-day'].progress).toBe(1);
    });

    it('should handle cumulative achievements correctly', () => {
      // Cumulative achievements should add to progress
      achievementSystem.updateAchievement('money-maker', 100);
      expect(achievementSystem.achievements['money-maker'].progress).toBe(100);
      
      achievementSystem.updateAchievement('money-maker', 200);
      expect(achievementSystem.achievements['money-maker'].progress).toBe(300);
    });

    it('should handle special achievements correctly', () => {
      // Special achievements work like cumulative but have specific triggers
      achievementSystem.updateAchievement('perfectionist', 1);
      expect(achievementSystem.achievements['perfectionist'].progress).toBe(1);
      expect(achievementSystem.achievements['perfectionist'].unlocked).toBe(true);
    });
  });

  describe('rendering', () => {
    let mockRenderer;

    beforeEach(() => {
      mockRenderer = {
        drawRect: vi.fn(),
        drawText: vi.fn()
      };
    });

    it('should render notifications when present', () => {
      achievementSystem.unlockAchievement('first-day');
      
      achievementSystem.render(mockRenderer);
      
      expect(mockRenderer.drawRect).toHaveBeenCalled();
      expect(mockRenderer.drawText).toHaveBeenCalled();
    });

    it('should render achievement menu when visible', () => {
      achievementSystem.showAchievements = true;
      
      achievementSystem.render(mockRenderer);
      
      expect(mockRenderer.drawRect).toHaveBeenCalled();
      expect(mockRenderer.drawText).toHaveBeenCalled();
    });

    it('should not render menu when hidden', () => {
      achievementSystem.showAchievements = false;
      achievementSystem.notificationQueue = []; // No notifications
      
      achievementSystem.render(mockRenderer);
      
      // Should have minimal or no render calls
      const totalCalls = mockRenderer.drawRect.mock.calls.length + mockRenderer.drawText.mock.calls.length;
      expect(totalCalls).toBe(0);
    });
  });
});