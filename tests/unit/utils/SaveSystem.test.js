import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveSystem } from '../../../src/utils/SaveSystem.js';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock global localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('SaveSystem', () => {
  let saveSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    mockLocalStorage.clear.mockImplementation(() => {});
    saveSystem = new SaveSystem();
  });

  describe('constructor', () => {
    it('should initialize with correct save key', () => {
      expect(saveSystem.saveKey).toBe('powerup_game_save');
    });

    it('should accept custom save key', () => {
      const customSaveSystem = new SaveSystem('custom_key');
      expect(customSaveSystem.saveKey).toBe('custom_key');
    });

    it('should initialize default game data structure', () => {
      const defaultData = saveSystem.getDefaultGameData();
      
      expect(defaultData).toHaveProperty('characterData');
      expect(defaultData).toHaveProperty('gameProgress');
      expect(defaultData).toHaveProperty('settings');
      expect(defaultData).toHaveProperty('statistics');
      expect(defaultData).toHaveProperty('metadata');
    });
  });

  describe('default data structure', () => {
    it('should have correct character data defaults', () => {
      const data = saveSystem.getDefaultGameData();
      
      expect(data.characterData.name).toBe('Player');
      expect(data.characterData.position).toEqual({ x: 400, y: 300 });
      expect(data.characterData.color).toBe('#0066CC');
      expect(data.characterData.speed).toBe(200);
    });

    it('should have correct game progress defaults', () => {
      const data = saveSystem.getDefaultGameData();
      
      expect(data.gameProgress.day).toBe(1);
      expect(data.gameProgress.money).toBe(2000);
      expect(data.gameProgress.angryGuests).toBe(0);
      expect(data.gameProgress.consoles).toEqual([]);
      expect(data.gameProgress.permanentUpgrades).toEqual([]);
    });

    it('should have correct settings defaults', () => {
      const data = saveSystem.getDefaultGameData();
      
      expect(data.settings.audioVolume.master).toBe(1);
      expect(data.settings.audioVolume.sfx).toBe(1);
      expect(data.settings.audioVolume.music).toBe(1);
      expect(data.settings.controls.wasd).toBe(true);
    });

    it('should have correct statistics defaults', () => {
      const data = saveSystem.getDefaultGameData();
      
      expect(data.statistics.totalDaysPlayed).toBe(0);
      expect(data.statistics.totalGuests).toBe(0);
      expect(data.statistics.totalRevenue).toBe(0);
      expect(data.statistics.bestStreak).toBe(0);
      expect(data.statistics.totalPlayTime).toBe(0);
    });

    it('should have correct metadata', () => {
      const data = saveSystem.getDefaultGameData();
      
      expect(data.metadata.version).toBe('1.0.0');
      expect(data.metadata.lastSaved).toBeNull();
      expect(data.metadata.created).toBeNull();
    });
  });

  describe('saveGame', () => {
    it('should save game data to localStorage', () => {
      const gameData = {
        characterData: { name: 'TestPlayer' },
        gameProgress: { day: 5, money: 3000 }
      };
      
      const result = saveSystem.saveGame(gameData);
      
      expect(result.success).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'powerup_game_save',
        expect.any(String)
      );
    });

    it('should merge with default data', () => {
      const partialData = {
        gameProgress: { day: 3, money: 1500 }
      };
      
      saveSystem.saveGame(partialData);
      
      const savedCall = mockLocalStorage.setItem.mock.calls[0];
      const savedData = JSON.parse(savedCall[1]);
      
      // Should have merged partial data with defaults
      expect(savedData.gameProgress.day).toBe(3);
      expect(savedData.gameProgress.money).toBe(1500);
      expect(savedData.characterData.name).toBe('Player'); // Default value
    });

    it('should update lastSaved timestamp', () => {
      const gameData = { gameProgress: { day: 2 } };
      
      saveSystem.saveGame(gameData);
      
      const savedCall = mockLocalStorage.setItem.mock.calls[0];
      const savedData = JSON.parse(savedCall[1]);
      
      expect(savedData.metadata.lastSaved).toBeTruthy();
      expect(typeof savedData.metadata.lastSaved).toBe('number');
    });

    it('should set created timestamp on first save', () => {
      mockLocalStorage.getItem.mockReturnValue(null); // No existing save
      
      const gameData = { gameProgress: { day: 1 } };
      saveSystem.saveGame(gameData);
      
      const savedCall = mockLocalStorage.setItem.mock.calls[0];
      const savedData = JSON.parse(savedCall[1]);
      
      expect(savedData.metadata.created).toBeTruthy();
    });

    it('should preserve created timestamp on subsequent saves', () => {
      const existingData = {
        metadata: { created: 1000000 }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));
      
      const gameData = { gameProgress: { day: 2 } };
      saveSystem.saveGame(gameData);
      
      const savedCall = mockLocalStorage.setItem.mock.calls[0];
      const savedData = JSON.parse(savedCall[1]);
      
      expect(savedData.metadata.created).toBe(1000000);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const result = saveSystem.saveGame({ gameProgress: { day: 1 } });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
    });

    it('should validate data before saving', () => {
      const invalidData = null;
      
      const result = saveSystem.saveGame(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid game data');
    });
  });

  describe('loadGame', () => {
    it('should load game data from localStorage', () => {
      const savedData = {
        characterData: { name: 'SavedPlayer' },
        gameProgress: { day: 7, money: 5000 }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));
      
      const result = saveSystem.loadGame();
      
      expect(result.success).toBe(true);
      expect(result.data.characterData.name).toBe('SavedPlayer');
      expect(result.data.gameProgress.day).toBe(7);
    });

    it('should return default data if no save exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = saveSystem.loadGame();
      
      expect(result.success).toBe(true);
      expect(result.data.characterData.name).toBe('Player');
      expect(result.data.gameProgress.day).toBe(1);
      expect(result.isNewGame).toBe(true);
    });

    it('should merge loaded data with defaults', () => {
      const partialSavedData = {
        gameProgress: { day: 5 }
        // Missing characterData, settings, etc.
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(partialSavedData));
      
      const result = saveSystem.loadGame();
      
      expect(result.success).toBe(true);
      expect(result.data.gameProgress.day).toBe(5);
      expect(result.data.characterData.name).toBe('Player'); // Default
    });

    it('should handle corrupted save data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json{');
      
      const result = saveSystem.loadGame();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse save data');
    });

    it('should handle localStorage errors', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      
      const result = saveSystem.loadGame();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage access denied');
    });
  });

  describe('deleteSave', () => {
    it('should remove save data from localStorage', () => {
      const result = saveSystem.deleteSave();
      
      expect(result.success).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('powerup_game_save');
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Access denied');
      });
      
      const result = saveSystem.deleteSave();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });
  });

  describe('hasSave', () => {
    it('should return true if save exists', () => {
      mockLocalStorage.getItem.mockReturnValue('{"gameProgress":{"day":1}}');
      
      expect(saveSystem.hasSave()).toBe(true);
    });

    it('should return false if no save exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      expect(saveSystem.hasSave()).toBe(false);
    });

    it('should return false if save is corrupted', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      expect(saveSystem.hasSave()).toBe(false);
    });
  });

  describe('getSaveInfo', () => {
    it('should return save metadata', () => {
      const saveData = {
        metadata: {
          version: '1.0.0',
          lastSaved: 1234567890,
          created: 1234560000
        },
        gameProgress: {
          day: 10,
          money: 8000
        }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(saveData));
      
      const info = saveSystem.getSaveInfo();
      
      expect(info.exists).toBe(true);
      expect(info.version).toBe('1.0.0');
      expect(info.lastSaved).toBe(1234567890);
      expect(info.created).toBe(1234560000);
      expect(info.day).toBe(10);
      expect(info.money).toBe(8000);
    });

    it('should return null info if no save exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const info = saveSystem.getSaveInfo();
      
      expect(info.exists).toBe(false);
      expect(info.version).toBeNull();
      expect(info.lastSaved).toBeNull();
    });
  });

  describe('exportSave', () => {
    it('should return save data as JSON string', () => {
      const saveData = { gameProgress: { day: 5 } };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(saveData));
      
      const exported = saveSystem.exportSave();
      
      expect(exported).toBe(JSON.stringify(saveData, null, 2));
    });

    it('should return null if no save exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const exported = saveSystem.exportSave();
      
      expect(exported).toBeNull();
    });
  });

  describe('importSave', () => {
    it('should import and save valid JSON data', () => {
      const importData = { gameProgress: { day: 15, money: 12000 } };
      const jsonString = JSON.stringify(importData);
      
      const result = saveSystem.importSave(jsonString);
      
      expect(result.success).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should reject invalid JSON', () => {
      const result = saveSystem.importSave('invalid json{');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should validate imported data structure', () => {
      const invalidData = { invalidField: 'test' };
      const jsonString = JSON.stringify(invalidData);
      
      const result = saveSystem.importSave(jsonString);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid save data format');
    });
  });

  describe('data validation', () => {
    describe('validateGameData', () => {
      it('should accept valid complete data', () => {
        const validData = saveSystem.getDefaultGameData();
        
        expect(saveSystem.validateGameData(validData)).toBe(true);
      });

      it('should accept partial valid data', () => {
        const partialData = {
          gameProgress: { day: 5, money: 3000 }
        };
        
        expect(saveSystem.validateGameData(partialData)).toBe(true);
      });

      it('should reject null/undefined data', () => {
        expect(saveSystem.validateGameData(null)).toBe(false);
        expect(saveSystem.validateGameData(undefined)).toBe(false);
      });

      it('should reject non-object data', () => {
        expect(saveSystem.validateGameData('string')).toBe(false);
        expect(saveSystem.validateGameData(123)).toBe(false);
        expect(saveSystem.validateGameData([])).toBe(false);
      });
    });

    describe('mergeWithDefaults', () => {
      it('should merge partial data with defaults', () => {
        const partialData = {
          gameProgress: { day: 8 }
        };
        
        const merged = saveSystem.mergeWithDefaults(partialData);
        
        expect(merged.gameProgress.day).toBe(8);
        expect(merged.gameProgress.money).toBe(2000); // Default
        expect(merged.characterData.name).toBe('Player'); // Default
      });

      it('should preserve nested properties', () => {
        const partialData = {
          settings: {
            audioVolume: { master: 0.5 }
            // Missing sfx and music volumes
          }
        };
        
        const merged = saveSystem.mergeWithDefaults(partialData);
        
        expect(merged.settings.audioVolume.master).toBe(0.5);
        expect(merged.settings.audioVolume.sfx).toBe(1); // Default
        expect(merged.settings.audioVolume.music).toBe(1); // Default
      });
    });
  });

  describe('localStorage availability', () => {
    it('should handle localStorage unavailable', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = window.localStorage;
      delete window.localStorage;
      
      const fallbackSaveSystem = new SaveSystem();
      const result = fallbackSaveSystem.saveGame({ gameProgress: { day: 1 } });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('localStorage not available');
      
      // Restore localStorage
      window.localStorage = originalLocalStorage;
    });
  });
});