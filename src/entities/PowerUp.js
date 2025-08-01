import { Entity } from '../engine/Entity.js';
import { Transform } from '../components/Transform.js';

/**
 * Power-up types configuration
 */
const POWERUP_TYPES = {
  'speed-boost': {
    name: 'Speed Boost',
    description: 'Doubles movement speed for 10 seconds',
    duration: 10000, // 10 seconds
    effect: 'speed',
    multiplier: 2.0,
    color: '#00FF00', // Bright green
    icon: '⚡', // Lightning bolt
    rarity: 0.7, // 70% chance when spawning power-ups
    cooldown: 30000 // 30 seconds before can be used again
  },
  'repair-master': {
    name: 'Repair Master',
    description: 'Instant repairs for 15 seconds',
    duration: 15000, // 15 seconds
    effect: 'repair',
    multiplier: 10.0, // 10x faster repairs (essentially instant)
    color: '#FFD700', // Gold
    icon: '🔧', // Wrench
    rarity: 0.3, // 30% chance when spawning power-ups
    cooldown: 45000 // 45 seconds before can be used again
  }
};

/**
 * PowerUp entity for temporary player enhancements
 * @class
 * @extends Entity
 */
export class PowerUp extends Entity {
  /**
   * Create a power-up
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels
   * @param {string} type - Power-up type identifier
   */
  constructor(x, y, type) {
    super(x, y);
    
    // Validate power-up type
    if (!POWERUP_TYPES[type]) {
      throw new Error(`Invalid power-up type: ${type}`);
    }
    
    // Add Transform component
    this.addComponent(new Transform(this, x, y));
    
    // Power-up properties
    this.type = type;
    this.config = POWERUP_TYPES[type];
    
    // State
    this.collected = false;
    this.spawnTime = Date.now();
    this.lifespan = 30000; // 30 seconds before despawning
    
    // Visual effects
    this.pulseTime = 0;
    this.bobOffset = Math.random() * Math.PI * 2; // Random bob offset
    
    // Event system
    this.eventListeners = {};
  }
  
  /**
   * Check if power-up should be removed (collected or expired)
   * @returns {boolean} True if should be removed
   */
  shouldRemove() {
    return this.collected || (Date.now() - this.spawnTime > this.lifespan);
  }
  
  /**
   * Collect the power-up
   * @param {Character} character - Character collecting the power-up
   */
  collect(character) {
    if (this.collected) return;
    
    this.collected = true;
    
    // Emit collection event
    this.emit('collected', {
      powerUp: this,
      character: character,
      type: this.type,
      config: this.config
    });
  }
  
  /**
   * Check if character is close enough to collect
   * @param {Character} character - Character to check distance to
   * @returns {boolean} True if within collection range
   */
  canBeCollectedBy(character) {
    if (this.collected) return false;
    
    const transform = this.getComponent('Transform');
    const characterTransform = character.getComponent('Transform');
    
    if (!transform || !characterTransform) return false;
    
    const distance = transform.distanceTo(characterTransform);
    return distance < 30; // 30 pixel collection radius
  }
  
  /**
   * Update power-up state
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    super.update(deltaTime);
    
    if (this.collected) return;
    
    // Update visual effects timing
    this.pulseTime += deltaTime;
  }
  
  /**
   * Render the power-up
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    super.render(renderer);
    
    if (this.collected) return;
    
    const transform = this.getComponent('Transform');
    if (!transform) return;
    
    // Calculate visual effects
    const pulseScale = 1 + Math.sin(this.pulseTime * 0.008) * 0.1; // Gentle pulsing
    const bobOffset = Math.sin(this.pulseTime * 0.005 + this.bobOffset) * 3; // Vertical bobbing
    
    const renderX = transform.x;
    const renderY = transform.y + bobOffset;
    
    // Draw power-up background circle
    const radius = 16 * pulseScale;
    renderer.drawCircle(
      renderX,
      renderY,
      radius,
      this.config.color,
      false,
      0.3 // 30% opacity background
    );
    
    // Draw power-up border
    renderer.drawCircle(
      renderX,
      renderY,
      radius,
      this.config.color,
      true, // stroke only
      1.0,
      2 // border width
    );
    
    // Draw power-up icon
    renderer.drawText(
      this.config.icon,
      renderX,
      renderY,
      {
        font: '16px Arial',
        color: '#FFFFFF',
        align: 'center',
        stroke: true,
        strokeColor: '#000000',
        strokeWidth: 1
      }
    );
    
    // Draw power-up name below
    renderer.drawText(
      this.config.name,
      renderX,
      renderY + 25,
      {
        font: '10px Arial',
        color: this.config.color,
        align: 'center',
        stroke: true,
        strokeColor: '#000000',
        strokeWidth: 1
      }
    );
    
    // Draw remaining time indicator
    const remainingTime = this.lifespan - (Date.now() - this.spawnTime);
    const timeRatio = remainingTime / this.lifespan;
    
    if (timeRatio < 0.5) { // Show urgency in last 50% of lifetime
      renderer.drawText(
        `${Math.ceil(remainingTime / 1000)}s`,
        renderX,
        renderY - 25,
        {
          font: '8px Arial',
          color: timeRatio < 0.2 ? '#FF0000' : '#FFFF00',
          align: 'center'
        }
      );
    }
  }
  
  /**
   * Get power-up display information
   * @returns {Object} Display information for UI
   */
  getDisplayInfo() {
    return {
      name: this.config.name,
      description: this.config.description,
      duration: this.config.duration,
      icon: this.config.icon,
      color: this.config.color,
      timeRemaining: this.lifespan - (Date.now() - this.spawnTime)
    };
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
          console.error(`Error in power-up event listener for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Get all available power-up types
   * @returns {Object} Power-up types configuration
   * @static
   */
  static getTypes() {
    return POWERUP_TYPES;
  }
  
  /**
   * Get random power-up type based on rarity
   * @returns {string} Random power-up type
   * @static
   */
  static getRandomType() {
    const rand = Math.random();
    
    // Check rarities in order
    for (const [type, config] of Object.entries(POWERUP_TYPES)) {
      if (rand < config.rarity) {
        return type;
      }
    }
    
    // Fallback to first type
    return Object.keys(POWERUP_TYPES)[0];
  }
}