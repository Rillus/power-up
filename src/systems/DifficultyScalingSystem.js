/**
 * Difficulty Scaling System - Manages progressive difficulty increases based on day progression
 * @class DifficultyScalingSystem
 */
export class DifficultyScalingSystem {
  /**
   * Create a DifficultyScalingSystem
   * @param {Object} game - Game instance
   * @param {GameStateManager} gameStateManager - Game state manager
   */
  constructor(game, gameStateManager) {
    this.game = game;
    this.gameStateManager = gameStateManager;
    
    // Base difficulty settings
    this.baseDifficulty = {
      guestSpawnInterval: 8000, // 8 seconds base interval
      maxSimultaneousGuests: 8, // Maximum guests at once
      guestPatienceModifier: 1.0, // Base patience multiplier
      consoleBreakdownRate: 0.15, // Base breakdown chance
      guestTypeDistribution: {
        family: 0.40,      // 40% family guests
        enthusiast: 0.30,  // 30% enthusiasts
        casual: 0.20,      // 20% casual
        tourist: 0.10      // 10% tourists
      }
    };
    
    // Difficulty scaling parameters
    this.scalingFactors = {
      // Guest spawning gets faster each day
      spawnIntervalReduction: 300, // Reduce by 300ms per day (min 3s)
      minSpawnInterval: 3000, // Minimum 3 seconds between guests
      
      // More guests allowed simultaneously
      maxGuestsIncrease: 1, // +1 max guest every 2 days
      maxGuestsLimit: 16,   // Absolute maximum guests
      
      // Guest patience decreases over time
      patienceDecline: 0.05, // -5% patience per day
      minPatience: 0.5,      // Minimum 50% patience
      
      // Console breakdown rates increase
      breakdownIncrease: 0.02, // +2% breakdown chance per day
      maxBreakdownRate: 0.35,  // Maximum 35% breakdown chance
      
      // Guest type distribution shifts toward more challenging types
      enthusiastIncrease: 0.02, // +2% enthusiasts per day
      familyDecrease: 0.015,    // -1.5% families per day
      maxEnthusiastRatio: 0.60  // Max 60% enthusiasts
    };
    
    // Current scaled difficulty
    this.currentDifficulty = { ...this.baseDifficulty };
    
    // Event system
    this.eventListeners = {};
    
    // Set up game event listeners
    this.setupGameEventListeners();
    
    // Initialize difficulty for current day
    this.updateDifficultyForDay(this.gameStateManager.gameData.day);
  }

  /**
   * Set up event listeners for game events
   * @private
   */
  setupGameEventListeners() {
    // Listen for day changes
    this.gameStateManager.on('dayStarted', (data) => {
      this.updateDifficultyForDay(data.day);
    });
    
    // Listen for game start to set initial difficulty
    this.gameStateManager.on('gameStarted', (data) => {
      this.updateDifficultyForDay(data.day);
    });
  }

  /**
   * Update difficulty settings for a specific day
   * @param {number} day - Current day number
   */
  updateDifficultyForDay(day) {
    this.currentDay = day;
    const daysSinceStart = Math.max(0, day - 1);
    
    // Calculate scaled guest spawn interval (faster spawning)
    const intervalReduction = daysSinceStart * this.scalingFactors.spawnIntervalReduction;
    this.currentDifficulty.guestSpawnInterval = Math.max(
      this.scalingFactors.minSpawnInterval,
      this.baseDifficulty.guestSpawnInterval - intervalReduction
    );
    
    // Calculate max simultaneous guests (more guests over time)
    const guestIncrease = Math.floor(daysSinceStart / 2) * this.scalingFactors.maxGuestsIncrease;
    this.currentDifficulty.maxSimultaneousGuests = Math.min(
      this.scalingFactors.maxGuestsLimit,
      this.baseDifficulty.maxSimultaneousGuests + guestIncrease
    );
    
    // Calculate guest patience (less patient over time)
    const patienceReduction = daysSinceStart * this.scalingFactors.patienceDecline;
    this.currentDifficulty.guestPatienceModifier = Math.max(
      this.scalingFactors.minPatience,
      this.baseDifficulty.guestPatienceModifier - patienceReduction
    );
    
    // Calculate console breakdown rate (more frequent breakdowns)
    const breakdownIncrease = daysSinceStart * this.scalingFactors.breakdownIncrease;
    this.currentDifficulty.consoleBreakdownRate = Math.min(
      this.scalingFactors.maxBreakdownRate,
      this.baseDifficulty.consoleBreakdownRate + breakdownIncrease
    );
    
    // Calculate guest type distribution (shift toward more challenging types)
    const enthusiastIncrease = Math.min(
      daysSinceStart * this.scalingFactors.enthusiastIncrease,
      this.scalingFactors.maxEnthusiastRatio - this.baseDifficulty.guestTypeDistribution.enthusiast
    );
    
    const familyDecrease = Math.min(
      daysSinceStart * this.scalingFactors.familyDecrease,
      this.baseDifficulty.guestTypeDistribution.family * 0.5 // Don't reduce below 50% of original
    );
    
    this.currentDifficulty.guestTypeDistribution = {
      family: Math.max(0.15, this.baseDifficulty.guestTypeDistribution.family - familyDecrease),
      enthusiast: Math.min(this.scalingFactors.maxEnthusiastRatio, 
                          this.baseDifficulty.guestTypeDistribution.enthusiast + enthusiastIncrease),
      casual: this.baseDifficulty.guestTypeDistribution.casual,
      tourist: this.baseDifficulty.guestTypeDistribution.tourist
    };
    
    // Normalize distribution to ensure it adds up to 1.0
    this.normalizeDifficultyDistribution();
    
    // Apply difficulty changes to game systems
    this.applyDifficultyToGame();
    
    // Emit difficulty changed event
    this.emit('difficultyChanged', {
      day,
      difficulty: this.currentDifficulty,
      scaling: this.getDifficultyScalingSummary()
    });
    
    console.log(`Difficulty updated for day ${day}:`, this.getDifficultyScalingSummary());
  }

  /**
   * Normalize guest type distribution to ensure percentages add up to 1.0
   * @private
   */
  normalizeDifficultyDistribution() {
    const distribution = this.currentDifficulty.guestTypeDistribution;
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    
    if (total !== 1.0) {
      Object.keys(distribution).forEach(type => {
        distribution[type] = distribution[type] / total;
      });
    }
  }

  /**
   * Apply current difficulty settings to game systems
   * @private
   */
  applyDifficultyToGame() {
    // Update guest spawn interval in main game
    this.game.guestSpawnInterval = this.currentDifficulty.guestSpawnInterval;
    
    // Update console breakdown rates (only if consoles exist)
    if (this.game.consoles && this.game.consoles.length > 0) {
      this.game.consoles.forEach(console => {
        console.breakdownChance = this.currentDifficulty.consoleBreakdownRate;
      });
    }
  }

  /**
   * Get guest spawn interval for current difficulty
   * @returns {number} Spawn interval in milliseconds
   */
  getGuestSpawnInterval() {
    return this.currentDifficulty.guestSpawnInterval;
  }

  /**
   * Get maximum simultaneous guests for current difficulty
   * @returns {number} Maximum number of guests
   */
  getMaxSimultaneousGuests() {
    return this.currentDifficulty.maxSimultaneousGuests;
  }

  /**
   * Get guest patience modifier for current difficulty
   * @returns {number} Patience multiplier (1.0 = normal, 0.5 = half patience)
   */
  getGuestPatienceModifier() {
    return this.currentDifficulty.guestPatienceModifier;
  }

  /**
   * Get console breakdown rate for current difficulty
   * @returns {number} Breakdown chance (0.0 to 1.0)
   */
  getConsoleBreakdownRate() {
    return this.currentDifficulty.consoleBreakdownRate;
  }

  /**
   * Get guest type for spawning based on current difficulty distribution
   * @returns {string} Guest type ('family', 'enthusiast', 'casual', 'tourist')
   */
  getRandomGuestType() {
    const rand = Math.random();
    const dist = this.currentDifficulty.guestTypeDistribution;
    
    let cumulative = 0;
    for (const [type, probability] of Object.entries(dist)) {
      cumulative += probability;
      if (rand < cumulative) {
        return type;
      }
    }
    
    // Fallback to casual if something goes wrong
    return 'casual';
  }

  /**
   * Check if we can spawn more guests based on current limits
   * @returns {boolean} True if more guests can be spawned
   */
  canSpawnMoreGuests() {
    return this.game.guests.length < this.currentDifficulty.maxSimultaneousGuests;
  }

  /**
   * Get difficulty scaling summary for display/debugging
   * @returns {Object} Summary of current difficulty scaling
   */
  getDifficultyScalingSummary() {
    const day = this.currentDay || this.gameStateManager.gameData.day;
    
    return {
      day: day,
      spawnInterval: `${(this.currentDifficulty.guestSpawnInterval / 1000).toFixed(1)}s`,
      maxGuests: this.currentDifficulty.maxSimultaneousGuests,
      patience: `${Math.round(this.currentDifficulty.guestPatienceModifier * 100)}%`,
      breakdownRate: `${Math.round(this.currentDifficulty.consoleBreakdownRate * 100)}%`,
      guestTypes: {
        family: `${Math.round(this.currentDifficulty.guestTypeDistribution.family * 100)}%`,
        enthusiast: `${Math.round(this.currentDifficulty.guestTypeDistribution.enthusiast * 100)}%`,
        casual: `${Math.round(this.currentDifficulty.guestTypeDistribution.casual * 100)}%`,
        tourist: `${Math.round(this.currentDifficulty.guestTypeDistribution.tourist * 100)}%`
      }
    };
  }

  /**
   * Get difficulty progression preview for next days
   * @param {number} [daysAhead=5] - How many days ahead to preview
   * @returns {Array} Array of difficulty summaries for upcoming days
   */
  getDifficultyPreview(daysAhead = 5) {
    const currentDay = this.currentDay || this.gameStateManager.gameData.day;
    const preview = [];
    
    for (let i = 1; i <= daysAhead; i++) {
      const futureDay = currentDay + i;
      
      // Calculate what difficulty would be on that day
      const daysSinceStart = Math.max(0, futureDay - 1);
      
      const futureSpawnInterval = Math.max(
        this.scalingFactors.minSpawnInterval,
        this.baseDifficulty.guestSpawnInterval - (daysSinceStart * this.scalingFactors.spawnIntervalReduction)
      );
      
      const futureMaxGuests = Math.min(
        this.scalingFactors.maxGuestsLimit,
        this.baseDifficulty.maxSimultaneousGuests + Math.floor(daysSinceStart / 2) * this.scalingFactors.maxGuestsIncrease
      );
      
      preview.push({
        day: futureDay,
        spawnInterval: `${(futureSpawnInterval / 1000).toFixed(1)}s`,
        maxGuests: futureMaxGuests
      });
    }
    
    return preview;
  }

  /**
   * Update method called each frame
   * @param {number} deltaTime - Time elapsed in milliseconds
   */
  update(deltaTime) {
    // The system primarily responds to events, but we could add
    // real-time difficulty adjustments here if needed
  }

  /**
   * Handle keyboard input for testing features
   * @param {string} key - Key code (e.g., 'KeyD')
   * @returns {boolean} True if key was handled
   */
  handleKeyPress(key) {
    switch (key) {
      case 'KeyD':
        // Show difficulty information in console
        console.log('Current Difficulty:', this.getDifficultyScalingSummary());
        console.log('Next 5 Days Preview:', this.getDifficultyPreview());
        return true;
        
      case 'KeyN':
        // Simulate next day difficulty (for testing)
        const nextDay = this.gameStateManager.gameData.day + 1;
        this.updateDifficultyForDay(nextDay);
        console.log(`Simulated difficulty for day ${nextDay}`);
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Reset difficulty to base settings (for testing or new game+)
   */
  resetDifficulty() {
    this.currentDifficulty = { ...this.baseDifficulty };
    this.applyDifficultyToGame();
    this.emit('difficultyReset', {});
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