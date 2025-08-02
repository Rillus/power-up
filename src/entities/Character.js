import { Entity } from '../engine/Entity.js';
import { Transform } from '../components/Transform.js';
import { Movement } from '../components/Movement.js';

/**
 * Character entity representing the player's character
 * @class Character
 * @extends Entity
 */
export class Character extends Entity {
  /**
   * Create a Character entity
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {Object} customization - Character customization options
   * @param {string} [customization.name='Player'] - Character name
   * @param {string} [customization.color='#0066CC'] - Character color
   * @param {number} [customization.speed=200] - Movement speed
   */
  constructor(x, y, customization = {}) {
    super(x, y);
    
    // Initialize components
    this.addComponent(new Transform(x, y));
    this.addComponent(new Movement(customization.speed || 200));
    
    // Character properties
    this.radius = 16; // 32px diameter as specified in GDD
    this.name = customization.name || 'Player';
    this.color = this.validateColor(customization.color) || '#0066CC';
    this.customization = { ...customization };
    
    // Power-up effects
    this.speedMultiplier = 1.0;
    this.repairMultiplier = 1.0;
    this.hasSpeedBoost = false;
    this.hasRepairBoost = false;
    
    // Debug mode for showing additional info
    this.debugMode = false;
    
    // Last facing direction for sprite animation
    this.lastDirection = 'down';
    
    // Collision boundaries (will be updated by game when wall system is available)
    this.boundaries = {
      left: 20,
      right: 1180, // 1200 - 20
      top: 20,
      bottom: 780  // 800 - 20
    };
  }

  /**
   * Validate hex color format
   * @param {string} color - Color string to validate
   * @returns {string|null} Valid color or null
   * @private
   */
  validateColor(color) {
    if (!color) return null;
    
    // Check for valid hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color) ? color : null;
  }

  // Movement Methods

  /**
   * Move character up
   */
  moveUp() {
    const movement = this.getComponent('Movement');
    movement.setDirection(0, -1);
    this.lastDirection = 'up';
  }

  /**
   * Move character down
   */
  moveDown() {
    const movement = this.getComponent('Movement');
    movement.setDirection(0, 1);
    this.lastDirection = 'down';
  }

  /**
   * Move character left
   */
  moveLeft() {
    const movement = this.getComponent('Movement');
    movement.setDirection(-1, 0);
    this.lastDirection = 'left';
  }

  /**
   * Move character right
   */
  moveRight() {
    const movement = this.getComponent('Movement');
    movement.setDirection(1, 0);
    this.lastDirection = 'right';
  }

  /**
   * Stop character movement
   */
  stopMoving() {
    const movement = this.getComponent('Movement');
    movement.stop();
  }

  /**
   * Set movement direction (normalized automatically)
   * @param {number} x - X direction component
   * @param {number} y - Y direction component
   */
  setMovementDirection(x, y) {
    const movement = this.getComponent('Movement');
    movement.setDirection(x, y);
    
    // Update last direction based on movement vector
    if (x !== 0 || y !== 0) {
      if (Math.abs(y) > Math.abs(x)) {
        this.lastDirection = y > 0 ? 'down' : 'up';
      } else {
        this.lastDirection = x > 0 ? 'right' : 'left';
      }
    }
  }

  // Position Methods

  /**
   * Get current position
   * @returns {Object} Position object with x, y properties
   */
  getPosition() {
    const transform = this.getComponent('Transform');
    return { x: transform.x, y: transform.y };
  }

  /**
   * Update boundaries from wall system
   * @param {Object} playableArea - Playable area bounds from wall system
   */
  updateBoundaries(playableArea) {
    this.boundaries = {
      left: playableArea.left + this.radius,
      right: playableArea.right - this.radius,
      top: playableArea.top + this.radius,
      bottom: playableArea.bottom - this.radius
    };
  }

  /**
   * Set character position (with boundary clamping)
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  setPosition(x, y) {
    const transform = this.getComponent('Transform');
    
    // Clamp to boundaries
    transform.x = Math.max(this.boundaries.left, 
                          Math.min(this.boundaries.right, x));
    transform.y = Math.max(this.boundaries.top, 
                          Math.min(this.boundaries.bottom, y));
  }

  // Speed Methods

  /**
   * Get current movement speed
   * @returns {number} Speed in pixels per second
   */
  getSpeed() {
    const movement = this.getComponent('Movement');
    return movement.getSpeed();
  }

  /**
   * Set movement speed
   * @param {number} speed - New speed in pixels per second
   */
  setSpeed(speed) {
    const movement = this.getComponent('Movement');
    movement.setSpeed(speed);
  }

  // Collision Methods

  /**
   * Check collision with a point
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @returns {boolean} True if colliding
   */
  isCollidingWithPoint(x, y) {
    const transform = this.getComponent('Transform');
    const distance = Math.sqrt(
      (x - transform.x) ** 2 + (y - transform.y) ** 2
    );
    return distance <= this.radius;
  }

  /**
   * Check collision with a circle
   * @param {number} x - Circle center X
   * @param {number} y - Circle center Y
   * @param {number} radius - Circle radius
   * @returns {boolean} True if colliding
   */
  isCollidingWithCircle(x, y, radius) {
    const transform = this.getComponent('Transform');
    const distance = Math.sqrt(
      (x - transform.x) ** 2 + (y - transform.y) ** 2
    );
    return distance <= (this.radius + radius);
  }

  // Customization Methods

  /**
   * Set character name
   * @param {string} name - New character name
   */
  setName(name) {
    this.name = name;
  }

  /**
   * Set character color
   * @param {string} color - New character color (hex format)
   */
  setColor(color) {
    const validColor = this.validateColor(color);
    if (validColor) {
      this.color = validColor;
    }
  }

  /**
   * Toggle debug mode
   * @param {boolean} enabled - Enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  // State Management

  /**
   * Export character state for saving
   * @returns {Object} Character state object
   */
  exportState() {
    const position = this.getPosition();
    return {
      position,
      speed: this.getSpeed(),
      name: this.name,
      color: this.color,
      customization: { ...this.customization }
    };
  }

  /**
   * Import character state for loading
   * @param {Object} state - Character state object
   */
  importState(state) {
    if (state.position) {
      this.setPosition(state.position.x, state.position.y);
    }
    if (state.speed) {
      this.setSpeed(state.speed);
    }
    if (state.name) {
      this.setName(state.name);
    }
    if (state.color) {
      this.setColor(state.color);
    }
    if (state.customization) {
      this.customization = { ...state.customization };
    }
  }

  /**
   * Update character (calls parent update for components)
   * @param {number} deltaTime - Time elapsed in milliseconds
   */
  update(deltaTime) {
    super.update(deltaTime);
    
    // Character-specific update logic can go here
    // (e.g., animation state updates, special effects)
  }

  /**
   * Render character
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    const transform = this.getComponent('Transform');
    
    // Draw power-up effect auras
    if (this.hasSpeedBoost) {
      // Speed boost - green glowing effect
      renderer.drawCircle(
        transform.x,
        transform.y,
        this.radius + 8,
        '#00FF00',
        false
      );
      
      // Animated speed lines
      const time = Date.now() * 0.01;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + time;
        const lineX = transform.x + Math.cos(angle) * (this.radius + 12);
        const lineY = transform.y + Math.sin(angle) * (this.radius + 12);
        const endX = lineX + Math.cos(angle) * 8;
        const endY = lineY + Math.sin(angle) * 8;
        
        renderer.drawLine(lineX, lineY, endX, endY, '#00FF00', 2);
      }
    }
    
    if (this.hasRepairBoost) {
      // Repair boost - gold glowing effect
      renderer.drawCircle(
        transform.x,
        transform.y,
        this.radius + 6,
        '#FFD700',
        false
      );
      
      // Tool icons around character
      const tools = ['🔧', '⚙️', '🔨'];
      const time = Date.now() * 0.005;
      for (let i = 0; i < tools.length; i++) {
        const angle = (i / tools.length) * Math.PI * 2 + time;
        const iconX = transform.x + Math.cos(angle) * (this.radius + 20);
        const iconY = transform.y + Math.sin(angle) * (this.radius + 20);
        
        renderer.drawText(
          tools[i],
          iconX,
          iconY,
          {
            font: '12px Arial',
            color: '#FFD700',
            align: 'center'
          }
        );
      }
    }
    
    // Draw the character (sprite or fallback)
    if (renderer.drawCharacter) {
      renderer.drawCharacter(this);
    } else {
      // Legacy fallback if renderer doesn't have sprite support
      let characterColor = this.color;
      if (this.hasSpeedBoost) {
        characterColor = '#66FF66'; // Tinted green during speed boost
      } else if (this.hasRepairBoost) {
        characterColor = '#FFFF66'; // Tinted yellow during repair boost
      }
      
      renderer.drawCircle(
        transform.x,
        transform.y,
        this.radius,
        characterColor
      );
    }
    
    // Draw character name in debug mode
    if (this.debugMode) {
      renderer.drawText(
        this.name,
        transform.x,
        transform.y - 30, // Above character (adjusted for sprite height)
        {
          color: '#FFFFFF',
          font: '12px Arial',
          align: 'center'
        }
      );
    }
  }
}