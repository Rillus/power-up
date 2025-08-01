import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConsoleUnlockSystem } from '../../../src/systems/ConsoleUnlockSystem.js';

describe('ConsoleUnlockSystem', () => {
  let consoleUnlockSystem;
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
      canvas: { width: 800, height: 600 },
      character: {
        getPosition: () => ({ x: 400, y: 300 })
      },
      audioSystem: {
        playSuccessSound: vi.fn()
      },
      createFloatingNumber: vi.fn(),
      achievementSystem: {
        achievements: {},
        updateAchievement: vi.fn()
      },
      purchaseSystem: {
        updateAvailableConsoles: vi.fn()
      }
    };

    consoleUnlockSystem = new ConsoleUnlockSystem(mockGame, mockGameStateManager);
  });

  describe('initialization', () => {
    it('should initialize with correct console types', () => {
      expect(consoleUnlockSystem.consoleUnlocks).toBeDefined();
      expect(consoleUnlockSystem.consoleUnlocks['retro-arcade']).toBeDefined();
      expect(consoleUnlockSystem.consoleUnlocks['classic-home']).toBeDefined();
      expect(consoleUnlockSystem.consoleUnlocks['modern-gaming']).toBeDefined();
      expect(consoleUnlockSystem.consoleUnlocks['vr-experience']).toBeDefined();
    });

    it('should have retro-arcade unlocked by default', () => {
      expect(consoleUnlockSystem.consoleUnlocks['retro-arcade'].unlocked).toBe(true);
      expect(consoleUnlockSystem.consoleUnlocks['classic-home'].unlocked).toBe(false);
      expect(consoleUnlockSystem.consoleUnlocks['modern-gaming'].unlocked).toBe(false);
      expect(consoleUnlockSystem.consoleUnlocks['vr-experience'].unlocked).toBe(false);
    });

    it('should have correct unlock days', () => {
      expect(consoleUnlockSystem.consoleUnlocks['retro-arcade'].unlockDay).toBe(1);
      expect(consoleUnlockSystem.consoleUnlocks['classic-home'].unlockDay).toBe(3);
      expect(consoleUnlockSystem.consoleUnlocks['modern-gaming'].unlockDay).toBe(7);
      expect(consoleUnlockSystem.consoleUnlocks['vr-experience'].unlockDay).toBe(14);
    });

    it('should set up game event listeners', () => {
      expect(mockGameStateManager.on).toHaveBeenCalledWith('dayCompleted', expect.any(Function));
      expect(mockGameStateManager.on).toHaveBeenCalledWith('gameStarted', expect.any(Function));
    });
  });

  describe('console unlocking', () => {
    it('should unlock console on correct day', () => {
      const unlockSpy = vi.spyOn(consoleUnlockSystem, 'unlockConsole');
      
      consoleUnlockSystem.checkForNewUnlocks(3);
      
      expect(unlockSpy).toHaveBeenCalledWith('classic-home');
    });

    it('should not unlock console before unlock day', () => {
      const unlockSpy = vi.spyOn(consoleUnlockSystem, 'unlockConsole');
      
      consoleUnlockSystem.checkForNewUnlocks(2);
      
      expect(unlockSpy).not.toHaveBeenCalledWith('classic-home');
    });

    it('should unlock multiple consoles on same day if applicable', () => {
      // Set a high day that would unlock multiple consoles
      const unlockSpy = vi.spyOn(consoleUnlockSystem, 'unlockConsole');
      
      consoleUnlockSystem.checkForNewUnlocks(14);
      
      expect(unlockSpy).toHaveBeenCalledWith('classic-home');
      expect(unlockSpy).toHaveBeenCalledWith('modern-gaming');
      expect(unlockSpy).toHaveBeenCalledWith('vr-experience');
    });

    it('should not unlock already unlocked consoles', () => {
      consoleUnlockSystem.consoleUnlocks['classic-home'].unlocked = true;
      const unlockSpy = vi.spyOn(consoleUnlockSystem, 'unlockConsole');
      
      consoleUnlockSystem.checkForNewUnlocks(3);
      
      expect(unlockSpy).not.toHaveBeenCalledWith('classic-home');
    });
  });

  describe('unlock process', () => {
    it('should mark console as unlocked', () => {
      consoleUnlockSystem.unlockConsole('classic-home');
      
      expect(consoleUnlockSystem.consoleUnlocks['classic-home'].unlocked).toBe(true);
      expect(consoleUnlockSystem.consoleUnlocks['classic-home'].unlockedAt).toBeDefined();
    });

    it('should add console to new unlocks list', () => {
      consoleUnlockSystem.unlockConsole('classic-home');
      
      expect(consoleUnlockSystem.newUnlocks).toContain(consoleUnlockSystem.consoleUnlocks['classic-home']);
    });

    it('should play success sound', () => {
      consoleUnlockSystem.unlockConsole('classic-home');
      
      expect(mockGame.audioSystem.playSuccessSound).toHaveBeenCalled();
    });

    it('should create floating text', () => {
      consoleUnlockSystem.unlockConsole('classic-home');
      
      expect(mockGame.createFloatingNumber).toHaveBeenCalledWith(
        400, 240, '🎮 Classic Home Console Unlocked!', '#00FFFF', 4000, { x: 0, y: -15 }
      );
    });

    it('should emit console unlocked event', () => {
      const eventSpy = vi.fn();
      consoleUnlockSystem.on('consoleUnlocked', eventSpy);
      
      consoleUnlockSystem.unlockConsole('classic-home');
      
      expect(eventSpy).toHaveBeenCalledWith({
        consoleType: 'classic-home',
        unlock: consoleUnlockSystem.consoleUnlocks['classic-home'],
        day: 1
      });
    });

    it('should save progress after unlock', () => {
      consoleUnlockSystem.unlockConsole('classic-home');
      
      expect(mockGameStateManager.saveGameData).toHaveBeenCalled();
    });

    it('should not unlock non-existent console type', () => {
      consoleUnlockSystem.unlockConsole('non-existent');
      
      expect(mockGame.audioSystem.playSuccessSound).not.toHaveBeenCalled();
    });

    it('should not unlock already unlocked console', () => {
      consoleUnlockSystem.consoleUnlocks['classic-home'].unlocked = true;
      
      consoleUnlockSystem.unlockConsole('classic-home');
      
      expect(mockGame.audioSystem.playSuccessSound).not.toHaveBeenCalled();
    });
  });

  describe('console unlock queries', () => {
    beforeEach(() => {
      consoleUnlockSystem.unlockConsole('classic-home');
    });

    it('should return unlocked console types', () => {
      const unlockedTypes = consoleUnlockSystem.getUnlockedConsoleTypes();
      
      expect(unlockedTypes).toContain('retro-arcade');
      expect(unlockedTypes).toContain('classic-home');
      expect(unlockedTypes).not.toContain('modern-gaming');
      expect(unlockedTypes).not.toContain('vr-experience');
    });

    it('should check if console is unlocked', () => {
      expect(consoleUnlockSystem.isConsoleUnlocked('retro-arcade')).toBe(true);
      expect(consoleUnlockSystem.isConsoleUnlocked('classic-home')).toBe(true);
      expect(consoleUnlockSystem.isConsoleUnlocked('modern-gaming')).toBe(false);
      expect(consoleUnlockSystem.isConsoleUnlocked('non-existent')).toBe(false);
    });

    it('should return console unlock info', () => {
      const info = consoleUnlockSystem.getConsoleUnlockInfo('classic-home');
      
      expect(info).toBeDefined();
      expect(info.name).toBe('Classic Home Console');
      expect(info.unlockDay).toBe(3);
      expect(info.unlocked).toBe(true);
    });

    it('should return null for non-existent console', () => {
      const info = consoleUnlockSystem.getConsoleUnlockInfo('non-existent');
      
      expect(info).toBeNull();
    });
  });

  describe('next unlock tracking', () => {
    it('should return next unlock when available', () => {
      mockGameStateManager.gameData.day = 2;
      
      const nextUnlock = consoleUnlockSystem.getNextUnlock();
      
      expect(nextUnlock).toBeDefined();
      expect(nextUnlock.name).toBe('Classic Home Console');
      expect(nextUnlock.unlockDay).toBe(3);
    });

    it('should return null when all consoles unlocked', () => {
      consoleUnlockSystem.unlockAllConsoles();
      
      const nextUnlock = consoleUnlockSystem.getNextUnlock();
      
      expect(nextUnlock).toBeNull();
    });

    it('should return null when current day exceeds all unlock days', () => {
      mockGameStateManager.gameData.day = 20;
      
      const nextUnlock = consoleUnlockSystem.getNextUnlock();
      
      expect(nextUnlock).toBeNull();
    });
  });

  describe('unlock summary', () => {
    beforeEach(() => {
      consoleUnlockSystem.unlockConsole('classic-home');
      consoleUnlockSystem.unlockConsole('modern-gaming');
    });

    it('should return correct unlock summary', () => {
      const summary = consoleUnlockSystem.getUnlockSummary();
      
      expect(summary.totalConsoles).toBe(4);
      expect(summary.unlockedConsoles).toBe(3); // retro + classic + modern
      expect(summary.completionPercentage).toBe(75);
      expect(summary.currentDay).toBe(1);
    });

    it('should include recent unlocks', () => {
      const summary = consoleUnlockSystem.getUnlockSummary();
      
      expect(summary.recentUnlocks).toHaveLength(2);
      expect(summary.recentUnlocks.map(u => u.name)).toContain('Classic Home Console');
      expect(summary.recentUnlocks.map(u => u.name)).toContain('Modern Gaming');
    });
  });

  describe('console categories', () => {
    it('should return consoles by category', () => {
      const basicConsoles = consoleUnlockSystem.getConsolesByCategory('basic');
      const familyConsoles = consoleUnlockSystem.getConsolesByCategory('family');
      
      expect(basicConsoles).toHaveLength(1);
      expect(basicConsoles[0].type).toBe('retro-arcade');
      expect(familyConsoles).toHaveLength(1);
      expect(familyConsoles[0].type).toBe('classic-home');
    });

    it('should return empty array for non-existent category', () => {
      const nonExistentConsoles = consoleUnlockSystem.getConsolesByCategory('non-existent');
      
      expect(nonExistentConsoles).toHaveLength(0);
    });
  });

  describe('notifications', () => {
    beforeEach(() => {
      consoleUnlockSystem.unlockConsole('classic-home');
    });

    it('should show unlock notification after unlock', () => {
      expect(consoleUnlockSystem.showUnlockNotification).toBe(true);
      expect(consoleUnlockSystem.notificationTimer).toBeGreaterThan(0);
    });

    it('should hide notification after timer expires', () => {
      consoleUnlockSystem.notificationTimer = 100;
      consoleUnlockSystem.update(200);
      
      expect(consoleUnlockSystem.showUnlockNotification).toBe(false);
    });

    it('should update purchase system when showing notifications', () => {
      consoleUnlockSystem.showUnlockNotifications([consoleUnlockSystem.consoleUnlocks['classic-home']]);
      
      expect(mockGame.purchaseSystem.updateAvailableConsoles).toHaveBeenCalled();
    });
  });

  describe('testing utilities', () => {
    it('should unlock all consoles', () => {
      consoleUnlockSystem.unlockAllConsoles();
      
      expect(consoleUnlockSystem.isConsoleUnlocked('retro-arcade')).toBe(true);
      expect(consoleUnlockSystem.isConsoleUnlocked('classic-home')).toBe(true);
      expect(consoleUnlockSystem.isConsoleUnlocked('modern-gaming')).toBe(true);
      expect(consoleUnlockSystem.isConsoleUnlocked('vr-experience')).toBe(true);
    });

    it('should reset unlocks', () => {
      consoleUnlockSystem.unlockConsole('classic-home');
      const eventSpy = vi.fn();
      consoleUnlockSystem.on('unlocksReset', eventSpy);
      
      consoleUnlockSystem.resetUnlocks();
      
      expect(consoleUnlockSystem.isConsoleUnlocked('retro-arcade')).toBe(true); // Always unlocked
      expect(consoleUnlockSystem.isConsoleUnlocked('classic-home')).toBe(false);
      expect(consoleUnlockSystem.newUnlocks).toHaveLength(0);
      expect(consoleUnlockSystem.showUnlockNotification).toBe(false);
      expect(eventSpy).toHaveBeenCalled();
      expect(mockGameStateManager.saveGameData).toHaveBeenCalled();
    });
  });

  describe('persistence', () => {
    it('should save unlock progress', () => {
      consoleUnlockSystem.consoleUnlocks['classic-home'].unlocked = true;
      consoleUnlockSystem.consoleUnlocks['classic-home'].unlockedAt = Date.now();
      
      consoleUnlockSystem.saveUnlockProgress();
      
      expect(mockGameStateManager.saveGameData).toHaveBeenCalledWith({
        consoleUnlocks: expect.objectContaining({
          'classic-home': expect.objectContaining({
            unlocked: true,
            unlockedAt: expect.any(Number)
          })
        })
      });
    });

    it('should load unlock progress', () => {
      const saveData = {
        consoleUnlocks: {
          'classic-home': {
            unlocked: true,
            unlockedAt: Date.now()
          },
          'modern-gaming': {
            unlocked: false
          }
        }
      };
      mockGameStateManager.gameData = saveData;
      
      consoleUnlockSystem.loadUnlockProgress();
      
      expect(consoleUnlockSystem.consoleUnlocks['classic-home'].unlocked).toBe(true);
      expect(consoleUnlockSystem.consoleUnlocks['modern-gaming'].unlocked).toBe(false);
    });

    it('should handle missing save data gracefully', () => {
      mockGameStateManager.gameData = null;
      
      expect(() => {
        consoleUnlockSystem.loadUnlockProgress();
      }).not.toThrow();
    });

    it('should keep retro-arcade unlocked even if save says otherwise', () => {
      const saveData = {
        consoleUnlocks: {
          'retro-arcade': {
            unlocked: false
          }
        }
      };
      mockGameStateManager.loadGameData.mockReturnValue(saveData);
      
      consoleUnlockSystem.loadUnlockProgress();
      
      expect(consoleUnlockSystem.consoleUnlocks['retro-arcade'].unlocked).toBe(true);
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

    it('should render unlock notification when visible', () => {
      consoleUnlockSystem.unlockConsole('classic-home');
      
      consoleUnlockSystem.render(mockRenderer);
      
      expect(mockRenderer.drawRect).toHaveBeenCalled();
      expect(mockRenderer.drawText).toHaveBeenCalled();
    });

    it('should not render when no notifications', () => {
      consoleUnlockSystem.showUnlockNotification = false;
      consoleUnlockSystem.newUnlocks = [];
      
      consoleUnlockSystem.render(mockRenderer);
      
      expect(mockRenderer.drawRect).not.toHaveBeenCalled();
      expect(mockRenderer.drawText).not.toHaveBeenCalled();
    });

    it('should use correct category colors', () => {
      expect(consoleUnlockSystem.getCategoryColor('basic')).toBe('#90EE90');
      expect(consoleUnlockSystem.getCategoryColor('family')).toBe('#87CEEB');
      expect(consoleUnlockSystem.getCategoryColor('enthusiast')).toBe('#DDA0DD');
      expect(consoleUnlockSystem.getCategoryColor('premium')).toBe('#FFD700');
      expect(consoleUnlockSystem.getCategoryColor('unknown')).toBe('#FFFFFF');
    });
  });
});