/**
 * GameStateManager for handling game state transitions, progression, and persistence
 * @class GameStateManager
 */
export class GameStateManager {
  /**
   * Create a GameStateManager
   * @param {SaveSystem} saveSystem - Save system instance
   * @param {AudioSystem} audioSystem - Audio system instance
   */
  constructor(saveSystem, audioSystem) {
    this.saveSystem = saveSystem;
    this.audioSystem = audioSystem;
    
    // Game state
    this.currentState = 'menu';
    this.validStates = ['menu', 'playing', 'paused', 'gameOver', 'loading'];
    
    // Game data
    this.gameData = this.initializeGameData();
    
    // Daily targets (scale with day)
    this.dailyTargets = this.initializeDailyTargets();
    
    // Timing
    this.gameStartTime = null;
    this.dayStartTime = null;
    this.pauseStartTime = null;
    this.totalPauseTime = 0;
    
    // Game over data
    this.gameOverReason = null;
    this.finalScore = 0;
    
    // Event system
    this.eventListeners = {};
  }

  /**
   * Initialize default game data
   * @returns {Object} Default game data structure
   * @private
   */
  initializeGameData() {
    return {
      // Current session data
      day: 1,
      money: 2000,
      angryGuests: 0,
      consoles: [],
      guests: [],
      
      // Daily tracking
      dailyRevenue: 0,
      guestsServed: 0,
      perfectDays: 0,
      
      // Total statistics
      totalRevenue: 0,
      totalGuests: 0,
      totalDaysPlayed: 0,
      highScore: 0,
      
      // Game over tracking
      gameOverReason: null,
      
      // Achievements
      achievements: [],
      permanentUpgrades: []
    };
  }

  /**
   * Initialize daily targets based on current day
   * @returns {Object} Daily targets
   * @private
   */
  initializeDailyTargets() {
    const day = this.gameData?.day || 1;
    
    return {
      revenue: 500 + (day - 1) * 100, // Increases by £100 per day
      maxAngryGuests: 3, // Consistent failure threshold
      guestsServed: 20 + (day - 1) * 5, // Increases by 5 guests per day
      consolesRequired: Math.min(1 + Math.floor(day / 3), 6) // New console every 3 days, max 6
    };
  }

  // State Management

  /**
   * Set current game state
   * @param {string} newState - New state to set
   */
  setState(newState) {
    if (!this.validStates.includes(newState)) {
      console.warn(`Invalid state: ${newState}`);
      return;
    }

    const previousState = this.currentState;
    this.currentState = newState;

    // Handle state transition logic
    this.handleStateTransition(previousState, newState);

    // Emit state change event
    this.emit('stateChanged', {
      previousState,
      currentState: newState
    });
  }

  /**
   * Get current game state
   * @returns {string} Current state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Handle state transition logic
   * @param {string} from - Previous state
   * @param {string} to - New state
   * @private
   */
  handleStateTransition(from, to) {
    switch (to) {
      case 'playing':
        if (from === 'menu') {
          this.gameStartTime = Date.now();
          this.dayStartTime = Date.now();
        } else if (from === 'paused') {
          this.resumeGame();
        }
        break;
        
      case 'paused':
        if (from === 'playing') {
          this.pauseGame();
        }
        break;
        
      case 'gameOver':
        this.handleGameOverTransition();
        break;
    }
  }

  // Game Lifecycle

  /**
   * Start a new game
   */
  startNewGame() {
    this.gameData = this.initializeGameData();
    this.dailyTargets = this.initializeDailyTargets();
    this.gameStartTime = Date.now();
    this.dayStartTime = Date.now();
    this.totalPauseTime = 0;
    this.gameOverReason = null;
    this.finalScore = 0;
    
    this.setState('playing');
    
    this.emit('gameStarted', {
      day: this.gameData.day,
      money: this.gameData.money,
      targets: this.dailyTargets
    });
  }

  /**
   * Start a new day
   */
  startNewDay() {
    // Advance day
    this.gameData.day++;
    
    // Reset daily counters
    this.gameData.angryGuests = 0;
    this.gameData.dailyRevenue = 0;
    this.gameData.guestsServed = 0;
    
    // Update targets for new day
    this.dailyTargets = this.initializeDailyTargets();
    
    // Reset timing
    this.dayStartTime = Date.now();
    
    // Auto-save progress
    this.saveGameState();
    
    this.emit('dayStarted', {
      day: this.gameData.day,
      targets: this.dailyTargets
    });
  }

  /**
   * End current day and calculate performance
   * @returns {Object} Day summary
   */
  endDay() {
    const dayDuration = Date.now() - this.dayStartTime;
    
    // Store original values before bonuses
    const originalRevenue = this.gameData.dailyRevenue;
    const originalTotalRevenue = this.gameData.totalRevenue;
    
    // Calculate performance
    const revenueTarget = this.dailyTargets.revenue;
    const guestsTarget = this.dailyTargets.guestsServed;
    
    const revenueHit = this.gameData.dailyRevenue >= revenueTarget;
    const guestsHit = this.gameData.guestsServed >= guestsTarget;
    const perfectDay = this.gameData.angryGuests === 0;
    
    let targetsHit = 0;
    if (revenueHit) targetsHit++;
    if (guestsHit) targetsHit++;
    if (perfectDay) targetsHit++;
    
    // Calculate bonuses
    let bonus = 0;
    if (perfectDay) {
      bonus += 500; // Perfect day bonus
      this.gameData.perfectDays++;
    }
    
    if (targetsHit >= 2) {
      bonus += 200; // Good performance bonus
    }
    
    // Apply bonus (don't count as revenue from guests)
    if (bonus > 0) {
      this.gameData.money += bonus;
    }
    
    // Update totals with revenue from guests (not including bonuses)
    this.gameData.totalRevenue += originalRevenue;
    this.gameData.totalGuests += this.gameData.guestsServed;
    this.gameData.totalDaysPlayed++;
    
    // Play appropriate sound
    if (targetsHit >= 2) {
      this.audioSystem?.playSuccessSound();
    }
    
    const daySummary = {
      dayComplete: true,
      day: this.gameData.day,
      revenue: originalRevenue, // Return revenue before bonuses
      revenueTarget,
      revenueHit,
      guestsServed: this.gameData.guestsServed,
      guestsTarget,
      guestsHit,
      angryGuests: this.gameData.angryGuests,
      perfectDay,
      targetsHit,
      bonus,
      perfectDayBonus: perfectDay ? 500 : 0,
      duration: dayDuration
    };
    
    this.emit('dayEnded', daySummary);
    
    return daySummary;
  }

  /**
   * End game with specified reason
   * @param {string} reason - Reason for game over
   */
  gameOver(reason) {
    this.gameOverReason = reason;
    this.gameData.gameOverReason = reason;
    
    // Calculate final score
    this.finalScore = this.calculateFinalScore();
    
    // Update high score if applicable
    if (this.finalScore > this.gameData.highScore) {
      this.gameData.highScore = this.finalScore;
    }
    
    // Play game over sound
    this.audioSystem?.playGameOverSound();
    
    // Auto-save final state
    this.saveGameState();
    
    this.setState('gameOver');
    
    this.emit('gameOver', {
      reason,
      finalScore: this.finalScore,
      isHighScore: this.finalScore > this.gameData.highScore,
      stats: this.getGameStats()
    });
  }

  /**
   * Calculate final score based on performance
   * @returns {number} Final score
   * @private
   */
  calculateFinalScore() {
    const baseScore = this.gameData.day * 100;
    const revenueScore = Math.floor(this.gameData.totalRevenue / 10);
    const guestScore = this.gameData.totalGuests * 5;
    const perfectDayBonus = this.gameData.perfectDays * 500;
    
    return baseScore + revenueScore + guestScore + perfectDayBonus;
  }

  /**
   * Handle game over state transition
   * @private
   */
  handleGameOverTransition() {
    // Stop any ongoing processes
    // Clean up temporary data
  }

  // Game Mechanics

  /**
   * Add money to game data
   * @param {number} amount - Amount to add
   */
  addMoney(amount) {
    this.gameData.money += amount;
    this.gameData.dailyRevenue += amount;
    this.gameData.totalRevenue += amount;
    
    this.emit('moneyChanged', {
      amount,
      total: this.gameData.money,
      dailyRevenue: this.gameData.dailyRevenue
    });
  }

  /**
   * Spend money (if available)
   * @param {number} amount - Amount to spend
   * @returns {Object} Result with success status
   */
  spendMoney(amount) {
    if (this.gameData.money >= amount) {
      this.gameData.money -= amount;
      
      this.emit('moneyChanged', {
        amount: -amount,
        total: this.gameData.money,
        dailyRevenue: this.gameData.dailyRevenue
      });
      
      return {
        success: true,
        remaining: this.gameData.money
      };
    }
    
    return {
      success: false,
      error: 'Insufficient funds',
      required: amount,
      available: this.gameData.money
    };
  }

  /**
   * Add an angry guest
   */
  addAngryGuest() {
    this.gameData.angryGuests++;
    
    this.emit('angryGuest', {
      count: this.gameData.angryGuests,
      limit: this.dailyTargets.maxAngryGuests
    });
    
    // Check for game over condition
    if (this.gameData.angryGuests >= this.dailyTargets.maxAngryGuests) {
      this.gameOver(`Too many angry guests (${this.gameData.angryGuests}/${this.dailyTargets.maxAngryGuests})`);
    }
  }

  /**
   * Record a served guest
   */
  serveGuest() {
    this.gameData.guestsServed++;
    this.gameData.totalGuests++;
    
    this.emit('guestServed', {
      dailyCount: this.gameData.guestsServed,
      totalCount: this.gameData.totalGuests
    });
  }

  // Progress Tracking

  /**
   * Get current day progress
   * @returns {Object} Progress information
   */
  getDayProgress() {
    const revenueProgress = Math.min(
      this.gameData.dailyRevenue / this.dailyTargets.revenue,
      1.0
    );
    
    const guestsProgress = Math.min(
      this.gameData.guestsServed / this.dailyTargets.guestsServed,
      1.0
    );
    
    const angryGuestRatio = this.gameData.angryGuests / this.dailyTargets.maxAngryGuests;
    
    const overallProgress = (revenueProgress + guestsProgress) / 2;
    
    return {
      revenueProgress,
      guestsProgress,
      overallProgress,
      angryGuestRatio,
      dayTimeElapsed: this.dayStartTime ? Date.now() - this.dayStartTime : 0
    };
  }

  /**
   * Get comprehensive game statistics
   * @returns {Object} Game statistics
   */
  getGameStats() {
    const timePlayedMs = this.gameStartTime 
      ? Date.now() - this.gameStartTime - this.totalPauseTime 
      : 0;
    
    return {
      day: this.gameData.day,
      money: this.gameData.money,
      totalRevenue: this.gameData.totalRevenue,
      totalGuests: this.gameData.totalGuests,
      totalDaysPlayed: this.gameData.totalDaysPlayed,
      perfectDays: this.gameData.perfectDays,
      highScore: this.gameData.highScore,
      currentScore: this.finalScore || this.calculateFinalScore(),
      timePlayedMs,
      averageRevenuePerDay: this.gameData.day > 0 
        ? this.gameData.totalRevenue / this.gameData.day
        : 0,
      averageGuestsPerDay: this.gameData.day > 0 
        ? this.gameData.totalGuests / this.gameData.day
        : 0
    };
  }

  // Pause/Resume

  /**
   * Pause the game
   */
  pauseGame() {
    if (this.currentState === 'playing') {
      this.pauseStartTime = Date.now();
      this.setState('paused');
    }
  }

  /**
   * Resume the game
   */
  resumeGame() {
    if (this.currentState === 'paused' && this.pauseStartTime) {
      this.totalPauseTime += Date.now() - this.pauseStartTime;
      this.pauseStartTime = null;
      this.setState('playing');
    }
  }

  // Save/Load Integration

  /**
   * Save current game state
   * @returns {Object} Save result
   */
  saveGameState() {
    if (!this.saveSystem) {
      return { success: false, error: 'No save system available' };
    }

    const saveData = {
      gameProgress: {
        day: this.gameData.day,
        money: this.gameData.money,
        angryGuests: this.gameData.angryGuests,
        consoles: this.gameData.consoles,
        dailyRevenue: this.gameData.dailyRevenue,
        guestsServed: this.gameData.guestsServed,
        totalRevenue: this.gameData.totalRevenue,
        totalGuests: this.gameData.totalGuests,
        totalDaysPlayed: this.gameData.totalDaysPlayed,
        perfectDays: this.gameData.perfectDays,
        highScore: this.gameData.highScore,
        achievements: this.gameData.achievements,
        permanentUpgrades: this.gameData.permanentUpgrades
      },
      metadata: {
        lastSaved: Date.now(),
        gameStartTime: this.gameStartTime,
        totalPauseTime: this.totalPauseTime
      }
    };

    return this.saveSystem.saveGame(saveData);
  }

  /**
   * Load game state
   * @returns {Object} Load result
   */
  loadGameState() {
    if (!this.saveSystem) {
      return { success: false, error: 'No save system available' };
    }

    const loadResult = this.saveSystem.loadGame();
    
    if (!loadResult.success) {
      return loadResult;
    }

    // Apply loaded data
    if (loadResult.data.gameProgress) {
      const progress = loadResult.data.gameProgress;
      
      Object.assign(this.gameData, {
        day: progress.day || 1,
        money: progress.money || 2000,
        angryGuests: progress.angryGuests || 0,
        consoles: progress.consoles || [],
        dailyRevenue: progress.dailyRevenue || 0,
        guestsServed: progress.guestsServed || 0,
        totalRevenue: progress.totalRevenue || 0,
        totalGuests: progress.totalGuests || 0,
        totalDaysPlayed: progress.totalDaysPlayed || 0,
        perfectDays: progress.perfectDays || 0,
        highScore: progress.highScore || 0,
        achievements: progress.achievements || [],
        permanentUpgrades: progress.permanentUpgrades || []
      });
      
      // Update daily targets for loaded day
      this.dailyTargets = this.initializeDailyTargets();
    }

    // Restore timing data if available
    if (loadResult.data.metadata) {
      this.gameStartTime = loadResult.data.metadata.gameStartTime || Date.now();
      this.totalPauseTime = loadResult.data.metadata.totalPauseTime || 0;
    }

    return {
      success: true,
      isNewGame: loadResult.isNewGame
    };
  }

  // Event System

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
   * @param {Function} callback - Callback function to remove
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
   * @param {*} data - Event data
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