/**
 * Console Unlock System - Manages progressive console unlocking based on day progression
 * @class ConsoleUnlockSystem
 */
export class ConsoleUnlockSystem {
  /**
   * Create a ConsoleUnlockSystem
   * @param {Object} game - Game instance
   * @param {GameStateManager} gameStateManager - Game state manager
   */
  constructor(game, gameStateManager) {
    this.game = game;
    this.gameStateManager = gameStateManager;
    
    // Console unlock progression
    this.consoleUnlocks = {
      'retro-arcade': {
        name: 'Retro Arcade',
        description: 'Classic arcade games that appeal to casual visitors',
        icon: '🕹️',
        unlockDay: 1,
        cost: 500,
        unlocked: true, // Starting console type
        category: 'basic'
      },
      'classic-home': {
        name: 'Classic Home Console',
        description: 'Home gaming systems that families love',
        icon: '🎮',
        unlockDay: 3,
        cost: 1200,
        unlocked: false,
        category: 'family'
      },
      'modern-gaming': {
        name: 'Modern Gaming',
        description: 'High-end systems for enthusiast gamers',
        icon: '🖥️',
        unlockDay: 7,
        cost: 2500,
        unlocked: false,
        category: 'enthusiast'
      },
      'vr-experience': {
        name: 'VR Experience',
        description: 'Cutting-edge virtual reality stations',
        icon: '🥽',
        unlockDay: 14,
        cost: 5000,
        unlocked: false,
        category: 'premium'
      }
    };
    
    // Unlock achievements
    this.unlockAchievements = {
      'classic-home': {
        id: 'console-family-unlocked',
        name: 'Family Fun Unlocked',
        description: 'Unlocked Classic Home Console',
        icon: '🎮'
      },
      'modern-gaming': {
        id: 'console-modern-unlocked',
        name: 'Modern Marvel',
        description: 'Unlocked Modern Gaming Console',
        icon: '🖥️'
      },
      'vr-experience': {
        id: 'console-vr-unlocked',
        name: 'Future Vision',
        description: 'Unlocked VR Experience Station',
        icon: '🥽'
      }
    };
    
    // UI state
    this.newUnlocks = [];
    this.showUnlockNotification = false;
    this.notificationTimer = 0;
    
    // Event system
    this.eventListeners = {};
    
    // Load saved unlock progress
    this.loadUnlockProgress();
    
    // Set up game event listeners
    this.setupGameEventListeners();
  }

  /**
   * Set up event listeners for game events
   * @private
   */
  setupGameEventListeners() {
    // Listen for day completion
    this.gameStateManager.on('dayCompleted', (data) => {
      this.checkForNewUnlocks(data.day);
    });
    
    // Listen for game start to check initial unlocks
    this.gameStateManager.on('gameStarted', (data) => {
      this.checkForNewUnlocks(data.day);
    });
  }

  /**
   * Check for new console unlocks based on current day
   * @param {number} currentDay - Current day number
   */
  checkForNewUnlocks(currentDay) {
    const newUnlocks = [];
    
    Object.keys(this.consoleUnlocks).forEach(consoleType => {
      const unlock = this.consoleUnlocks[consoleType];
      
      if (!unlock.unlocked && currentDay >= unlock.unlockDay) {
        this.unlockConsole(consoleType);
        newUnlocks.push(unlock);
      }
    });
    
    if (newUnlocks.length > 0) {
      this.showUnlockNotifications(newUnlocks);
    }
  }

  /**
   * Unlock a console type
   * @param {string} consoleType - Console type to unlock
   */
  unlockConsole(consoleType) {
    const unlock = this.consoleUnlocks[consoleType];
    if (!unlock || unlock.unlocked) return;

    unlock.unlocked = true;
    unlock.unlockedAt = Date.now();

    // Add to new unlocks
    this.newUnlocks.push(unlock);

    // Show unlock notification
    this.showUnlockNotifications([unlock]);

    // Play unlock sound
    if (this.game.audioSystem) {
      this.game.audioSystem.playSuccessSound();
    }

    // Create floating text
    if (this.game.createFloatingNumber && this.game.character) {
      const characterPos = this.game.character.getPosition();
      this.game.createFloatingNumber(
        characterPos.x,
        characterPos.y - 60,
        `${unlock.icon} ${unlock.name} Unlocked!`,
        '#00FFFF',
        4000,
        { x: 0, y: -15 }
      );
    }

    // Add unlock achievement if one exists
    if (this.unlockAchievements[consoleType] && this.game.achievementSystem) {
      const achievement = this.unlockAchievements[consoleType];
      // Add temporary achievement
      this.game.achievementSystem.achievements[achievement.id] = {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        type: 'milestone',
        target: 1,
        progress: 0,
        unlocked: false,
        category: 'unlocks'
      };
      this.game.achievementSystem.updateAchievement(achievement.id, 1);
    }

    // Emit console unlocked event
    this.emit('consoleUnlocked', {
      consoleType,
      unlock,
      day: this.gameStateManager.gameData.day
    });

    // Save progress
    this.saveUnlockProgress();

    console.log(`Console unlocked: ${unlock.name} on day ${this.gameStateManager.gameData.day}`);
  }

  /**
   * Show unlock notifications
   * @param {Array} newUnlocks - Array of newly unlocked consoles
   * @private
   */
  showUnlockNotifications(newUnlocks) {
    this.showUnlockNotification = true;
    this.notificationTimer = 6000; // 6 seconds
    
    // Update purchase system to reflect new unlocks
    if (this.game.purchaseSystem) {
      this.game.purchaseSystem.updateAvailableConsoles();
    }
  }

  /**
   * Get all unlocked console types
   * @returns {Array} Array of unlocked console type names
   */
  getUnlockedConsoleTypes() {
    return Object.keys(this.consoleUnlocks).filter(type => 
      this.consoleUnlocks[type].unlocked
    );
  }

  /**
   * Get console unlock information
   * @param {string} consoleType - Console type
   * @returns {Object|null} Unlock information or null
   */
  getConsoleUnlockInfo(consoleType) {
    return this.consoleUnlocks[consoleType] || null;
  }

  /**
   * Check if console type is unlocked
   * @param {string} consoleType - Console type to check
   * @returns {boolean} True if unlocked
   */
  isConsoleUnlocked(consoleType) {
    const unlock = this.consoleUnlocks[consoleType];
    return unlock ? unlock.unlocked : false;
  }

  /**
   * Get next console to unlock
   * @returns {Object|null} Next unlock info or null if all unlocked
   */
  getNextUnlock() {
    const currentDay = this.gameStateManager.gameData.day;
    
    const nextUnlock = Object.values(this.consoleUnlocks)
      .filter(unlock => !unlock.unlocked)
      .sort((a, b) => a.unlockDay - b.unlockDay)
      .find(unlock => unlock.unlockDay > currentDay);
    
    return nextUnlock || null;
  }

  /**
   * Get unlock progress summary
   * @returns {Object} Unlock progress information
   */
  getUnlockSummary() {
    const totalConsoles = Object.keys(this.consoleUnlocks).length;
    const unlockedConsoles = Object.values(this.consoleUnlocks).filter(u => u.unlocked).length;
    const currentDay = this.gameStateManager.gameData.day;
    
    return {
      totalConsoles,
      unlockedConsoles,
      completionPercentage: (unlockedConsoles / totalConsoles) * 100,
      currentDay,
      nextUnlock: this.getNextUnlock(),
      recentUnlocks: this.newUnlocks.slice(-3)
    };
  }

  /**
   * Get consoles by category
   * @param {string} category - Category name
   * @returns {Array} Consoles in the category
   */
  getConsolesByCategory(category) {
    return Object.entries(this.consoleUnlocks)
      .filter(([type, unlock]) => unlock.category === category)
      .map(([type, unlock]) => ({ type, ...unlock }));
  }

  /**
   * Update method called each frame
   * @param {number} deltaTime - Time elapsed in milliseconds
   */
  update(deltaTime) {
    // Update notification timer
    if (this.showUnlockNotification && this.notificationTimer > 0) {
      this.notificationTimer -= deltaTime;
      if (this.notificationTimer <= 0) {
        this.showUnlockNotification = false;
      }
    }
  }

  /**
   * Render unlock notifications
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    if (!this.showUnlockNotification || this.newUnlocks.length === 0) return;

    const latestUnlock = this.newUnlocks[this.newUnlocks.length - 1];
    const opacity = Math.max(0, this.notificationTimer / 6000);
    
    // Calculate position with gentle floating animation
    const time = Date.now() * 0.003;
    const baseY = 150;
    const floatY = baseY + Math.sin(time) * 8;
    
    // Background
    renderer.drawRect(
      this.game.canvas.width / 2 - 200,
      floatY,
      400,
      80,
      '#1a1a1a',
      true,
      opacity * 0.95
    );
    
    // Border with unlock category color
    const borderColor = this.getCategoryColor(latestUnlock.category);
    renderer.drawRect(
      this.game.canvas.width / 2 - 200,
      floatY,
      400,
      80,
      borderColor,
      false,
      3,
      opacity
    );
    
    // "New Console Unlocked!" text
    renderer.drawText(
      'NEW CONSOLE UNLOCKED!',
      this.game.canvas.width / 2,
      floatY + 20,
      {
        font: '16px Arial',
        color: borderColor,
        align: 'center',
        alpha: opacity
      }
    );
    
    // Console details
    renderer.drawText(
      `${latestUnlock.icon} ${latestUnlock.name}`,
      this.game.canvas.width / 2,
      floatY + 40,
      {
        font: '18px Arial',
        color: '#FFFFFF',
        align: 'center',
        alpha: opacity
      }
    );
    
    // Description
    renderer.drawText(
      latestUnlock.description,
      this.game.canvas.width / 2,
      floatY + 60,
      {
        font: '12px Arial',
        color: '#CCCCCC',
        align: 'center',
        alpha: opacity
      }
    );
  }

  /**
   * Get category color for visual distinction
   * @param {string} category - Category name
   * @returns {string} Color hex code
   * @private
   */
  getCategoryColor(category) {
    switch (category) {
      case 'basic': return '#90EE90'; // Light green
      case 'family': return '#87CEEB'; // Sky blue
      case 'enthusiast': return '#DDA0DD'; // Plum
      case 'premium': return '#FFD700'; // Gold
      default: return '#FFFFFF';
    }
  }

  /**
   * Force unlock all consoles (for testing)
   */
  unlockAllConsoles() {
    Object.keys(this.consoleUnlocks).forEach(consoleType => {
      if (!this.consoleUnlocks[consoleType].unlocked) {
        this.unlockConsole(consoleType);
      }
    });
  }

  /**
   * Handle keyboard input for testing features
   * @param {string} key - Key code (e.g., 'KeyU')
   * @returns {boolean} True if key was handled
   */
  handleKeyPress(key) {
    switch (key) {
      case 'KeyO':
        // Force unlock next console for testing
        const nextUnlock = this.getNextUnlock();
        if (nextUnlock) {
          const consoleType = Object.keys(this.consoleUnlocks).find(
            type => this.consoleUnlocks[type] === nextUnlock
          );
          if (consoleType) {
            this.unlockConsole(consoleType);
          }
        }
        return true;
      
      case 'KeyY':
        // Unlock all consoles for testing
        this.unlockAllConsoles();
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Reset all unlocks (for testing or new game+)
   */
  resetUnlocks() {
    Object.values(this.consoleUnlocks).forEach(unlock => {
      if (unlock.unlockDay > 1) { // Keep retro-arcade unlocked
        unlock.unlocked = false;
        unlock.unlockedAt = null;
      }
    });
    this.newUnlocks = [];
    this.showUnlockNotification = false;
    this.saveUnlockProgress();
    this.emit('unlocksReset', {});
  }

  /**
   * Save unlock progress to game state
   * @private
   */
  saveUnlockProgress() {
    try {
      const unlockData = {};
      Object.keys(this.consoleUnlocks).forEach(type => {
        const unlock = this.consoleUnlocks[type];
        unlockData[type] = {
          unlocked: unlock.unlocked,
          unlockedAt: unlock.unlockedAt
        };
      });
      
      this.gameStateManager.saveGameData({
        consoleUnlocks: unlockData
      });
    } catch (error) {
      console.warn('Failed to save console unlocks:', error);
    }
  }

  /**
   * Load unlock progress from game state
   * @private
   */
  loadUnlockProgress() {
    try {
      const saveData = this.gameStateManager.gameData;
      if (saveData && saveData.consoleUnlocks) {
        Object.keys(saveData.consoleUnlocks).forEach(type => {
          if (this.consoleUnlocks[type]) {
            const savedUnlock = saveData.consoleUnlocks[type];
            this.consoleUnlocks[type].unlocked = savedUnlock.unlocked || (type === 'retro-arcade');
            this.consoleUnlocks[type].unlockedAt = savedUnlock.unlockedAt;
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load console unlocks:', error);
    }
  }

  // Event system methods
  
  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  /**
   * Unregister event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(callback);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}