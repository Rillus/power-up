/**
 * SaveSystem for handling game data persistence using localStorage
 * @class SaveSystem
 */
export class SaveSystem {
  /**
   * Create a SaveSystem
   * @param {string} [saveKey='powerup_game_save'] - localStorage key for save data
   */
  constructor(saveKey = 'powerup_game_save') {
    this.saveKey = saveKey;
  }

  /**
   * Get default game data structure
   * @returns {Object} Default game data
   */
  getDefaultGameData() {
    return {
      characterData: {
        name: 'Player',
        position: { x: 400, y: 300 },
        color: '#0066CC',
        speed: 200,
        customization: {}
      },
      gameProgress: {
        day: 1,
        money: 2000,
        angryGuests: 0,
        consoles: [],
        permanentUpgrades: [],
        highScore: 0
      },
      settings: {
        audioVolume: {
          master: 1,
          sfx: 1,
          music: 1
        },
        controls: {
          wasd: true
        },
        graphics: {
          quality: 'high',
          showFPS: false,
          particles: true
        }
      },
      statistics: {
        totalDaysPlayed: 0,
        totalGuests: 0,
        totalRevenue: 0,
        bestStreak: 0,
        totalPlayTime: 0,
        gamesPlayed: 0,
        averageScore: 0
      },
      metadata: {
        version: '1.0.0',
        lastSaved: null,
        created: null
      }
    };
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   * @private
   */
  isLocalStorageAvailable() {
    try {
      return typeof Storage !== 'undefined' && window.localStorage;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate game data structure
   * @param {Object} data - Data to validate
   * @returns {boolean} True if valid
   */
  validateGameData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return false;
    }

    // Allow partial data objects - they will be merged with defaults
    return true;
  }

  /**
   * Merge provided data with default structure
   * @param {Object} data - Partial or complete game data
   * @returns {Object} Merged data with defaults
   */
  mergeWithDefaults(data) {
    const defaults = this.getDefaultGameData();
    
    return this.deepMerge(defaults, data || {});
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   * @private
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * Save game data to localStorage
   * @param {Object} gameData - Game data to save
   * @returns {Object} Result object with success status
   */
  saveGame(gameData) {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'localStorage not available'
        };
      }

      if (!this.validateGameData(gameData)) {
        return {
          success: false,
          error: 'Invalid game data provided'
        };
      }

      // Load existing data to preserve created timestamp
      const existingData = this.loadGameData();
      
      // Merge with defaults and existing data
      const mergedData = this.mergeWithDefaults(gameData);
      
      // Preserve created timestamp if it exists
      if (existingData && existingData.metadata && existingData.metadata.created) {
        mergedData.metadata.created = existingData.metadata.created;
      } else {
        mergedData.metadata.created = Date.now();
      }
      
      // Update last saved timestamp
      mergedData.metadata.lastSaved = Date.now();

      // Save to localStorage
      const jsonString = JSON.stringify(mergedData);
      localStorage.setItem(this.saveKey, jsonString);

      return {
        success: true,
        data: mergedData
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save game: ${error.message}`
      };
    }
  }

  /**
   * Load raw game data from localStorage (internal method)
   * @returns {Object|null} Raw game data or null
   * @private
   */
  loadGameData() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return null;
      }

      const jsonString = localStorage.getItem(this.saveKey);
      if (!jsonString) {
        return null;
      }

      return JSON.parse(jsonString);
    } catch (error) {
      return null;
    }
  }

  /**
   * Load game data from localStorage
   * @returns {Object} Result object with success status and data
   */
  loadGame() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'localStorage not available'
        };
      }

      const jsonString = localStorage.getItem(this.saveKey);
      
      if (!jsonString) {
        // No save exists, return default data
        return {
          success: true,
          data: this.getDefaultGameData(),
          isNewGame: true
        };
      }

      let rawData;
      try {
        rawData = JSON.parse(jsonString);
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse save data: ${parseError.message}`
        };
      }

      // Merge loaded data with defaults to handle version updates
      const mergedData = this.mergeWithDefaults(rawData);

      return {
        success: true,
        data: mergedData,
        isNewGame: false
      };
    } catch (error) {
      // This catches localStorage access errors
      if (error.name === 'SecurityError' || error.message.includes('access denied')) {
        return {
          success: false,
          error: 'Storage access denied'
        };
      }
      return {
        success: false,
        error: `Failed to load game: ${error.message}`
      };
    }
  }

  /**
   * Delete save data
   * @returns {Object} Result object with success status
   */
  deleteSave() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'localStorage not available'
        };
      }

      localStorage.removeItem(this.saveKey);
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete save: ${error.message}`
      };
    }
  }

  /**
   * Check if a save file exists
   * @returns {boolean} True if save exists
   */
  hasSave() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return false;
      }

      const data = localStorage.getItem(this.saveKey);
      if (!data) return false;

      // Try to parse to verify it's valid
      JSON.parse(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get save file information without loading full data
   * @returns {Object} Save file metadata
   */
  getSaveInfo() {
    try {
      const rawData = this.loadGameData();
      
      if (!rawData) {
        return {
          exists: false,
          version: null,
          lastSaved: null,
          created: null,
          day: null,
          money: null
        };
      }

      return {
        exists: true,
        version: rawData.metadata?.version || 'unknown',
        lastSaved: rawData.metadata?.lastSaved || null,
        created: rawData.metadata?.created || null,
        day: rawData.gameProgress?.day || 1,
        money: rawData.gameProgress?.money || 2000
      };
    } catch (error) {
      return {
        exists: false,
        version: null,
        lastSaved: null,
        created: null,
        day: null,
        money: null,
        error: error.message
      };
    }
  }

  /**
   * Export save data as JSON string
   * @returns {string|null} JSON string or null if no save exists
   */
  exportSave() {
    const rawData = this.loadGameData();
    
    if (!rawData) {
      return null;
    }

    return JSON.stringify(rawData, null, 2);
  }

  /**
   * Import save data from JSON string
   * @param {string} jsonString - JSON string containing save data
   * @returns {Object} Result object with success status
   */
  importSave(jsonString) {
    try {
      if (typeof jsonString !== 'string') {
        return {
          success: false,
          error: 'Import data must be a string'
        };
      }

      // Parse JSON
      let importedData;
      try {
        importedData = JSON.parse(jsonString);
      } catch (parseError) {
        return {
          success: false,
          error: `Invalid JSON: ${parseError.message}`
        };
      }

      // Basic validation of imported data
      if (!importedData || typeof importedData !== 'object') {
        return {
          success: false,
          error: 'Invalid save data format'
        };
      }

      // Check for required structure (at least one expected property)
      if (!importedData.gameProgress && !importedData.characterData && !importedData.settings) {
        return {
          success: false,
          error: 'Invalid save data format'
        };
      }

      // Save the imported data
      const saveResult = this.saveGame(importedData);
      
      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        data: saveResult.data
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import save: ${error.message}`
      };
    }
  }

  /**
   * Clear all localStorage data (for debugging/testing)
   * @returns {Object} Result object with success status
   */
  clearAllData() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'localStorage not available'
        };
      }

      localStorage.clear();
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear data: ${error.message}`
      };
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  getStorageInfo() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          available: false,
          error: 'localStorage not available'
        };
      }

      const saveData = localStorage.getItem(this.saveKey);
      const saveSize = saveData ? new Blob([saveData]).size : 0;
      
      // Estimate total localStorage usage
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }

      return {
        available: true,
        saveExists: !!saveData,
        saveSize: saveSize,
        totalStorageUsed: totalSize,
        // Most browsers have 5-10MB localStorage limit
        estimatedLimit: 5 * 1024 * 1024, // 5MB
        usagePercentage: (totalSize / (5 * 1024 * 1024)) * 100
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }
}