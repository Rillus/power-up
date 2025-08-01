import { PowerUp } from '../entities/PowerUp.js';

/**
 * Power-Up Management System for spawning and managing power-up effects
 * @class
 */
export class PowerUpManager {
  /**
   * Create power-up manager
   * @param {Game} game - Game instance
   */
  constructor(game) {
    this.game = game;
    
    // Spawning settings
    this.spawnInterval = 45000; // 45 seconds between spawns
    this.lastSpawnTime = Date.now();
    this.maxPowerUps = 2; // Maximum power-ups on screen at once
    
    // Active effects tracking
    this.activeEffects = new Map(); // type -> { startTime, duration, multiplier }
    
    // Event system
    this.eventListeners = {};
  }
  
  /**
   * Update power-up system
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Handle power-up spawning
    this.updateSpawning();
    
    // Handle power-up collection
    this.updateCollection();
    
    // Update active effects
    this.updateActiveEffects();
    
    // Clean up expired power-ups
    this.cleanupPowerUps();
  }
  
  /**
   * Update power-up spawning
   * @private
   */
  updateSpawning() {
    const currentTime = Date.now();
    
    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      if (this.game.powerUps.length < this.maxPowerUps) {
        this.spawnRandomPowerUp();
        this.lastSpawnTime = currentTime;
      }
    }
  }
  
  /**
   * Spawn a random power-up at a strategic location
   * @private
   */
  spawnRandomPowerUp() {
    const type = PowerUp.getRandomType();
    const position = this.findGoodSpawnPosition();
    
    const powerUp = new PowerUp(position.x, position.y, type);
    
    // Listen for collection events
    powerUp.on('collected', (data) => {
      this.handlePowerUpCollection(data);
    });
    
    this.game.powerUps.push(powerUp);
    this.game.entities.push(powerUp);
    
    console.log(`Spawned ${type} power-up at (${position.x}, ${position.y})`);
    
    // Emit spawn event
    this.emit('powerUpSpawned', {
      powerUp: powerUp,
      type: type,
      position: position
    });
  }
  
  /**
   * Find a good position to spawn power-up (away from consoles and character)
   * @returns {Object} Position with x and y coordinates
   * @private
   */
  findGoodSpawnPosition() {
    const minDistance = 100; // Minimum distance from consoles and character
    
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      // Use wall system for proper bounds if available
      let x, y;
      if (this.game.wallSystem) {
        const position = this.game.wallSystem.getRandomPlayablePosition(100);
        x = position.x;
        y = position.y;
      } else {
        // Fallback to canvas bounds
        const gameWidth = this.game.canvas.width;
        const gameHeight = this.game.canvas.height;
        x = 100 + Math.random() * (gameWidth - 200);
        y = 100 + Math.random() * (gameHeight - 200);
      }
      
      let validPosition = true;
      
      // Check distance from consoles
      for (const console of this.game.consoles) {
        const consoleTransform = console.getComponent('Transform');
        const distance = Math.sqrt(
          (x - consoleTransform.x) ** 2 + (y - consoleTransform.y) ** 2
        );
        if (distance < minDistance) {
          validPosition = false;
          break;
        }
      }
      
      // Check distance from character
      if (validPosition && this.game.character) {
        const characterTransform = this.game.character.getComponent('Transform');
        const distance = Math.sqrt(
          (x - characterTransform.x) ** 2 + (y - characterTransform.y) ** 2
        );
        if (distance < minDistance) {
          validPosition = false;
        }
      }
      
      // Check distance from other power-ups
      if (validPosition) {
        for (const existingPowerUp of this.game.powerUps) {
          const powerUpTransform = existingPowerUp.getComponent('Transform');
          const distance = Math.sqrt(
            (x - powerUpTransform.x) ** 2 + (y - powerUpTransform.y) ** 2
          );
          if (distance < minDistance / 2) {
            validPosition = false;
            break;
          }
        }
      }
      
      if (validPosition) {
        return { x, y };
      }
      
      attempts++;
    }
    
    // Fallback to center-ish area if no good position found
    return {
      x: gameWidth * 0.3 + Math.random() * gameWidth * 0.4,
      y: gameHeight * 0.3 + Math.random() * gameHeight * 0.4
    };
  }
  
  /**
   * Update power-up collection detection
   * @private
   */
  updateCollection() {
    if (!this.game.character) return;
    
    this.game.powerUps.forEach(powerUp => {
      if (powerUp.canBeCollectedBy(this.game.character)) {
        powerUp.collect(this.game.character);
      }
    });
  }
  
  /**
   * Handle power-up collection
   * @param {Object} data - Collection event data
   * @private
   */
  handlePowerUpCollection(data) {
    const { powerUp, character, type, config } = data;
    
    // Activate the power-up effect
    this.activateEffect(type, config);
    
    // Create visual feedback
    const powerUpTransform = powerUp.getComponent('Transform');
    this.game.createFloatingNumber(
      powerUpTransform.x,
      powerUpTransform.y - 20,
      `${config.name.toUpperCase()}!`,
      config.color,
      2000
    );
    
    // Play collection sound
    if (this.game.audioSystem) {
      this.game.audioSystem.playPowerUpSound();
    }
    
    console.log(`${character.name || 'Character'} collected ${config.name} power-up`);
    
    // Emit collection event
    this.emit('powerUpCollected', {
      powerUp: powerUp,
      character: character,
      type: type,
      config: config
    });
  }
  
  /**
   * Activate a power-up effect
   * @param {string} type - Power-up type
   * @param {Object} config - Power-up configuration
   * @private
   */
  activateEffect(type, config) {
    const currentTime = Date.now();
    
    // Check if effect is on cooldown
    if (this.activeEffects.has(type)) {
      const existingEffect = this.activeEffects.get(type);
      if (currentTime - existingEffect.startTime < config.cooldown) {
        console.log(`${config.name} is on cooldown`);
        return;
      }
    }
    
    // Activate the effect
    this.activeEffects.set(type, {
      startTime: currentTime,
      duration: config.duration,
      multiplier: config.multiplier,
      config: config
    });
    
    console.log(`Activated ${config.name} for ${config.duration / 1000} seconds`);
    
    // Apply immediate effects based on type
    this.applyEffectToCharacter(type, config, true);
    
    // Emit activation event
    this.emit('effectActivated', {
      type: type,
      config: config,
      duration: config.duration
    });
  }
  
  /**
   * Update active power-up effects
   * @private
   */
  updateActiveEffects() {
    const currentTime = Date.now();
    const expiredEffects = [];
    
    for (const [type, effect] of this.activeEffects.entries()) {
      const elapsed = currentTime - effect.startTime;
      
      if (elapsed >= effect.duration) {
        // Effect has expired
        expiredEffects.push(type);
        this.applyEffectToCharacter(type, effect.config, false);
        
        console.log(`${effect.config.name} effect expired`);
        
        // Emit expiration event
        this.emit('effectExpired', {
          type: type,
          config: effect.config
        });
      }
    }
    
    // Remove expired effects
    expiredEffects.forEach(type => {
      this.activeEffects.delete(type);
    });
  }
  
  /**
   * Apply or remove effect from character
   * @param {string} type - Power-up type
   * @param {Object} config - Power-up configuration
   * @param {boolean} activate - True to activate, false to deactivate
   * @private
   */
  applyEffectToCharacter(type, config, activate) {
    if (!this.game.character) return;
    
    switch (config.effect) {
      case 'speed':
        if (activate) {
          this.game.character.speedMultiplier = config.multiplier;
          this.game.character.hasSpeedBoost = true;
        } else {
          this.game.character.speedMultiplier = 1.0;
          this.game.character.hasSpeedBoost = false;
        }
        break;
        
      case 'repair':
        if (activate) {
          this.game.character.repairMultiplier = config.multiplier;
          this.game.character.hasRepairBoost = true;
        } else {
          this.game.character.repairMultiplier = 1.0;
          this.game.character.hasRepairBoost = false;
        }
        break;
    }
  }
  
  /**
   * Clean up expired or collected power-ups
   * @private
   */
  cleanupPowerUps() {
    this.game.powerUps = this.game.powerUps.filter(powerUp => {
      if (powerUp.shouldRemove()) {
        // Remove from entities array
        const entityIndex = this.game.entities.indexOf(powerUp);
        if (entityIndex > -1) {
          this.game.entities.splice(entityIndex, 1);
        }
        return false;
      }
      return true;
    });
  }
  
  /**
   * Get currently active effects
   * @returns {Map} Map of active effects
   */
  getActiveEffects() {
    return new Map(this.activeEffects);
  }
  
  /**
   * Check if a specific effect is active
   * @param {string} type - Power-up type to check
   * @returns {boolean} True if effect is active
   */
  isEffectActive(type) {
    return this.activeEffects.has(type);
  }
  
  /**
   * Get remaining time for an active effect
   * @param {string} type - Power-up type
   * @returns {number} Remaining time in milliseconds, or 0 if not active
   */
  getEffectRemainingTime(type) {
    if (!this.activeEffects.has(type)) return 0;
    
    const effect = this.activeEffects.get(type);
    const elapsed = Date.now() - effect.startTime;
    return Math.max(0, effect.duration - elapsed);
  }
  
  /**
   * Force spawn a power-up (for testing/debugging)
   * @param {string} type - Power-up type to spawn
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  spawnPowerUp(type, x, y) {
    const powerUp = new PowerUp(x, y, type);
    
    powerUp.on('collected', (data) => {
      this.handlePowerUpCollection(data);
    });
    
    this.game.powerUps.push(powerUp);
    this.game.entities.push(powerUp);
    
    // Emit power-up spawned event
    this.emit('powerUpSpawned', {
      powerUp,
      type,
      x,
      y
    });
    
    return powerUp;
  }
  
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
          console.error(`Error in power-up manager event listener for ${event}:`, error);
        }
      });
    }
  }
}