import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../../../src/systems/GameStateManager.js';

describe('GameStateManager', () => {
  let gameStateManager;
  let mockSaveSystem;
  let mockAudioSystem;

  beforeEach(() => {
    mockSaveSystem = {
      saveGame: vi.fn(() => ({ success: true })),
      loadGame: vi.fn(() => ({ 
        success: true, 
        data: {
          gameProgress: { day: 1, money: 2000, angryGuests: 0 },
          characterData: { name: 'Player' }
        }
      }))
    };

    mockAudioSystem = {
      playSuccessSound: vi.fn(),
      playGameOverSound: vi.fn(),
      playClickSound: vi.fn()
    };

    gameStateManager = new GameStateManager(mockSaveSystem, mockAudioSystem);
  });

  describe('constructor', () => {
    it('should initialize with default state', () => {
      expect(gameStateManager.currentState).toBe('menu');
      expect(gameStateManager.gameData).toBeDefined();
      expect(gameStateManager.gameStartTime).toBeNull();
      expect(gameStateManager.dayStartTime).toBeNull();
    });

    it('should initialize game data structure', () => {
      const gameData = gameStateManager.gameData;
      expect(gameData.day).toBe(1);
      expect(gameData.money).toBe(2000);
      expect(gameData.angryGuests).toBe(0);
      expect(gameData.consoles).toEqual([]);
      expect(gameData.guests).toEqual([]);
    });

    it('should initialize daily targets', () => {
      const targets = gameStateManager.dailyTargets;
      expect(targets.revenue).toBe(500);
      expect(targets.maxAngryGuests).toBe(3);
      expect(targets.guestsServed).toBe(20);
    });
  });

  describe('state management', () => {
    describe('setState', () => {
      it('should change current state', () => {
        gameStateManager.setState('playing');
        expect(gameStateManager.currentState).toBe('playing');
      });

      it('should emit state change event', () => {
        const mockCallback = vi.fn();
        gameStateManager.on('stateChanged', mockCallback);
        
        gameStateManager.setState('paused');
        
        expect(mockCallback).toHaveBeenCalledWith({
          previousState: 'menu',
          currentState: 'paused'
        });
      });

      it('should handle state transition logic', () => {
        gameStateManager.setState('playing');
        expect(gameStateManager.gameStartTime).toBeTruthy();
        expect(gameStateManager.dayStartTime).toBeTruthy();
      });

      it('should not change to invalid state', () => {
        gameStateManager.setState('invalidState');
        expect(gameStateManager.currentState).toBe('menu'); // Should remain unchanged
      });
    });

    describe('getState', () => {
      it('should return current state', () => {
        gameStateManager.setState('playing');
        expect(gameStateManager.getState()).toBe('playing');
      });
    });

    describe('valid states', () => {
      const validStates = ['menu', 'playing', 'paused', 'gameOver', 'loading'];
      
      validStates.forEach(state => {
        it(`should accept ${state} as valid state`, () => {
          gameStateManager.setState(state);
          expect(gameStateManager.currentState).toBe(state);
        });
      });
    });
  });

  describe('game lifecycle', () => {
    describe('startNewGame', () => {
      it('should initialize new game state', () => {
        gameStateManager.startNewGame();
        
        expect(gameStateManager.currentState).toBe('playing');
        expect(gameStateManager.gameData.day).toBe(1);
        expect(gameStateManager.gameData.money).toBe(2000);
        expect(gameStateManager.gameData.angryGuests).toBe(0);
        expect(gameStateManager.gameStartTime).toBeTruthy();
      });

      it('should reset daily targets', () => {
        gameStateManager.startNewGame();
        
        const targets = gameStateManager.dailyTargets;
        expect(targets.revenue).toBe(500);
        expect(targets.maxAngryGuests).toBe(3);
      });

      it('should clear existing game data', () => {
        gameStateManager.gameData.money = 5000;
        gameStateManager.gameData.day = 10;
        
        gameStateManager.startNewGame();
        
        expect(gameStateManager.gameData.money).toBe(2000);
        expect(gameStateManager.gameData.day).toBe(1);
      });
    });

    describe('startNewDay', () => {
      beforeEach(() => {
        gameStateManager.startNewGame();
      });

      it('should advance to next day', () => {
        gameStateManager.startNewDay();
        
        expect(gameStateManager.gameData.day).toBe(2);
        expect(gameStateManager.dayStartTime).toBeTruthy();
      });

      it('should reset daily counters', () => {
        gameStateManager.gameData.angryGuests = 2;
        gameStateManager.gameData.dailyRevenue = 1000;
        
        gameStateManager.startNewDay();
        
        expect(gameStateManager.gameData.angryGuests).toBe(0);
        expect(gameStateManager.gameData.dailyRevenue).toBe(0);
      });

      it('should update daily targets', () => {
        const initialRevenue = gameStateManager.dailyTargets.revenue;
        
        gameStateManager.startNewDay();
        
        expect(gameStateManager.dailyTargets.revenue).toBeGreaterThan(initialRevenue);
      });

      it('should emit day started event', () => {
        const mockCallback = vi.fn();
        gameStateManager.on('dayStarted', mockCallback);
        
        gameStateManager.startNewDay();
        
        expect(mockCallback).toHaveBeenCalledWith({
          day: 2,
          targets: gameStateManager.dailyTargets
        });
      });

      it('should auto-save progress', () => {
        gameStateManager.startNewDay();
        
        expect(mockSaveSystem.saveGame).toHaveBeenCalled();
      });
    });

    describe('endDay', () => {
      beforeEach(() => {
        gameStateManager.startNewGame();
        gameStateManager.gameData.dailyRevenue = 800;
        gameStateManager.gameData.guestsServed = 25;
      });

      it('should calculate day performance', () => {
        const result = gameStateManager.endDay();
        
        expect(result.dayComplete).toBe(true);
        expect(result.revenue).toBe(800);
        expect(result.guestsServed).toBe(25);
        expect(result.targetsHit).toBeGreaterThan(0);
      });

      it('should update total statistics', () => {
        const initialTotal = gameStateManager.gameData.totalRevenue;
        
        gameStateManager.endDay();
        
        expect(gameStateManager.gameData.totalRevenue).toBe(initialTotal + 800);
        expect(gameStateManager.gameData.totalGuests).toBe(25);
      });

      it('should give bonus for perfect day', () => {
        gameStateManager.gameData.angryGuests = 0;
        gameStateManager.gameData.dailyRevenue = 1000;
        
        const result = gameStateManager.endDay();
        
        expect(result.perfectDayBonus).toBe(500);
        expect(gameStateManager.gameData.money).toBeGreaterThan(2000);
      });

      it('should play success sound for good performance', () => {
        gameStateManager.gameData.dailyRevenue = 1000;
        
        gameStateManager.endDay();
        
        expect(mockAudioSystem.playSuccessSound).toHaveBeenCalled();
      });
    });

    describe('gameOver', () => {
      beforeEach(() => {
        gameStateManager.startNewGame();
      });

      it('should end game and set state', () => {
        const reason = 'Too many angry guests';
        
        gameStateManager.gameOver(reason);
        
        expect(gameStateManager.currentState).toBe('gameOver');
        expect(gameStateManager.gameOverReason).toBe(reason);
      });

      it('should calculate final score', () => {
        gameStateManager.gameData.day = 5;
        gameStateManager.gameData.totalRevenue = 5000;
        
        gameStateManager.gameOver('Test reason');
        
        expect(gameStateManager.finalScore).toBeGreaterThan(0);
      });

      it('should update high score if applicable', () => {
        gameStateManager.gameData.highScore = 1000;
        gameStateManager.gameData.totalRevenue = 3000;
        gameStateManager.gameData.day = 10;
        
        gameStateManager.gameOver('Test');
        
        expect(gameStateManager.gameData.highScore).toBeGreaterThan(1000);
      });

      it('should play game over sound', () => {
        gameStateManager.gameOver('Test reason');
        
        expect(mockAudioSystem.playGameOverSound).toHaveBeenCalled();
      });

      it('should auto-save final state', () => {
        gameStateManager.gameOver('Test reason');
        
        expect(mockSaveSystem.saveGame).toHaveBeenCalled();
      });
    });
  });

  describe('game mechanics', () => {
    beforeEach(() => {
      gameStateManager.startNewGame();
    });

    describe('addMoney', () => {
      it('should add money to current total', () => {
        gameStateManager.addMoney(500);
        
        expect(gameStateManager.gameData.money).toBe(2500);
        expect(gameStateManager.gameData.dailyRevenue).toBe(500);
        expect(gameStateManager.gameData.totalRevenue).toBe(500);
      });

      it('should track daily revenue separately', () => {
        gameStateManager.addMoney(300);
        gameStateManager.addMoney(200);
        
        expect(gameStateManager.gameData.dailyRevenue).toBe(500);
      });

      it('should emit money changed event', () => {
        const mockCallback = vi.fn();
        gameStateManager.on('moneyChanged', mockCallback);
        
        gameStateManager.addMoney(100);
        
        expect(mockCallback).toHaveBeenCalledWith({
          amount: 100,
          total: 2100,
          dailyRevenue: 100
        });
      });
    });

    describe('spendMoney', () => {
      it('should subtract money from current total', () => {
        gameStateManager.spendMoney(500);
        
        expect(gameStateManager.gameData.money).toBe(1500);
      });

      it('should not allow negative money', () => {
        const result = gameStateManager.spendMoney(3000);
        
        expect(result.success).toBe(false);
        expect(gameStateManager.gameData.money).toBe(2000);
      });

      it('should return success for valid purchases', () => {
        const result = gameStateManager.spendMoney(1000);
        
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(1000);
      });
    });

    describe('addAngryGuest', () => {
      it('should increment angry guest counter', () => {
        gameStateManager.addAngryGuest();
        
        expect(gameStateManager.gameData.angryGuests).toBe(1);
      });

      it('should trigger game over at limit', () => {
        const gameOverSpy = vi.spyOn(gameStateManager, 'gameOver');
        
        // Add guests up to limit
        for (let i = 0; i < 3; i++) {
          gameStateManager.addAngryGuest();
        }
        
        expect(gameOverSpy).toHaveBeenCalledWith('Too many angry guests (3/3)');
      });

      it('should emit angry guest event', () => {
        const mockCallback = vi.fn();
        gameStateManager.on('angryGuest', mockCallback);
        
        gameStateManager.addAngryGuest();
        
        expect(mockCallback).toHaveBeenCalledWith({
          count: 1,
          limit: 3
        });
      });
    });

    describe('serveGuest', () => {
      it('should increment guests served counter', () => {
        gameStateManager.serveGuest();
        
        expect(gameStateManager.gameData.guestsServed).toBe(1);
        expect(gameStateManager.gameData.totalGuests).toBe(1);
      });

      it('should emit guest served event', () => {
        const mockCallback = vi.fn();
        gameStateManager.on('guestServed', mockCallback);
        
        gameStateManager.serveGuest();
        
        expect(mockCallback).toHaveBeenCalledWith({
          dailyCount: 1,
          totalCount: 1
        });
      });
    });
  });

  describe('progress tracking', () => {
    beforeEach(() => {
      gameStateManager.startNewGame();
    });

    describe('getDayProgress', () => {
      it('should calculate progress towards daily targets', () => {
        gameStateManager.gameData.dailyRevenue = 250;
        gameStateManager.gameData.guestsServed = 10;
        
        const progress = gameStateManager.getDayProgress();
        
        expect(progress.revenueProgress).toBe(0.5); // 250/500
        expect(progress.guestsProgress).toBe(0.5); // 10/20
        expect(progress.overallProgress).toBeCloseTo(0.5);
      });

      it('should cap progress at 100%', () => {
        gameStateManager.gameData.dailyRevenue = 1000;
        
        const progress = gameStateManager.getDayProgress();
        
        expect(progress.revenueProgress).toBe(1.0);
      });
    });

    describe('getGameStats', () => {
      it('should return comprehensive game statistics', () => {
        gameStateManager.gameData.day = 5;
        gameStateManager.gameData.totalRevenue = 3000;
        gameStateManager.gameData.totalGuests = 100;
        
        const stats = gameStateManager.getGameStats();
        
        expect(stats.day).toBe(5);
        expect(stats.totalRevenue).toBe(3000);
        expect(stats.totalGuests).toBe(100);
        expect(stats.averageRevenuePerDay).toBe(600);
        expect(stats.averageGuestsPerDay).toBe(20);
      });

      it('should include time played', () => {
        gameStateManager.gameStartTime = Date.now() - 60000; // 1 minute ago
        
        const stats = gameStateManager.getGameStats();
        
        expect(stats.timePlayedMs).toBeGreaterThan(50000);
      });
    });
  });

  describe('save/load integration', () => {
    describe('saveGameState', () => {
      it('should save current game state', () => {
        gameStateManager.gameData.money = 3000;
        gameStateManager.gameData.day = 5;
        
        const result = gameStateManager.saveGameState();
        
        expect(result.success).toBe(true);
        expect(mockSaveSystem.saveGame).toHaveBeenCalledWith(
          expect.objectContaining({
            gameProgress: expect.objectContaining({
              money: 3000,
              day: 5
            })
          })
        );
      });
    });

    describe('loadGameState', () => {
      it('should load saved game state', () => {
        mockSaveSystem.loadGame.mockReturnValue({
          success: true,
          data: {
            gameProgress: {
              day: 10,
              money: 8000,
              angryGuests: 1
            }
          }
        });
        
        const result = gameStateManager.loadGameState();
        
        expect(result.success).toBe(true);
        expect(gameStateManager.gameData.day).toBe(10);
        expect(gameStateManager.gameData.money).toBe(8000);
      });

      it('should handle load failures gracefully', () => {
        mockSaveSystem.loadGame.mockReturnValue({
          success: false,
          error: 'Load failed'
        });
        
        const result = gameStateManager.loadGameState();
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Load failed');
      });
    });
  });

  describe('event system', () => {
    it('should allow event registration', () => {
      const mockCallback = vi.fn();
      
      gameStateManager.on('testEvent', mockCallback);
      gameStateManager.emit('testEvent', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should allow event deregistration', () => {
      const mockCallback = vi.fn();
      
      gameStateManager.on('testEvent', mockCallback);
      gameStateManager.off('testEvent', mockCallback);
      gameStateManager.emit('testEvent');
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      gameStateManager.on('testEvent', callback1);
      gameStateManager.on('testEvent', callback2);
      gameStateManager.emit('testEvent');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('pause/resume functionality', () => {
    beforeEach(() => {
      gameStateManager.startNewGame();
    });

    describe('pauseGame', () => {
      it('should pause game and track time', () => {
        gameStateManager.pauseGame();
        
        expect(gameStateManager.currentState).toBe('paused');
        expect(gameStateManager.pauseStartTime).toBeTruthy();
      });
    });

    describe('resumeGame', () => {
      it('should resume game and update played time', () => {
        gameStateManager.pauseGame();
        gameStateManager.pauseStartTime = Date.now() - 5000; // 5 seconds ago
        
        gameStateManager.resumeGame();
        
        expect(gameStateManager.currentState).toBe('playing');
        expect(gameStateManager.totalPauseTime).toBeGreaterThan(0);
      });
    });
  });
});