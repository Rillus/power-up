import { Entity } from '../engine/Entity.js';
import { Transform } from '../components/Transform.js';

/**
 * Floating number entity for visual feedback (money, damage, etc.)
 * @class
 * @extends Entity
 */
export class FloatingNumber extends Entity {
  /**
   * Create a floating number
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels
   * @param {string} text - Text to display
   * @param {string} color - Color of the text
   * @param {number} [duration=2000] - How long the number should exist in milliseconds
   * @param {Object} [velocity={x: 0, y: -30}] - Movement velocity per second
   * @param {boolean} [gravity=false] - Whether to apply gravity effect
   */
  constructor(x, y, text, color, duration = 2000, velocity = { x: 0, y: -30 }, gravity = false) {
    super(x, y);
    
    // Add Transform component
    this.addComponent(new Transform(this, x, y));
    
    // Visual properties
    this.text = text;
    this.color = color;
    this.fontSize = 16;
    this.opacity = 1;
    
    // Animation properties
    this.duration = duration;
    this.lifetime = 0;
    this.velocity = { ...velocity };
    this.gravity = gravity;
    this.gravityAcceleration = 50; // pixels per second squared
  }

  /**
   * Update the floating number animation
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime) {
    super.update(deltaTime);
    
    this.lifetime = Math.min(this.lifetime + deltaTime, this.duration);
    
    // Update position based on velocity
    const deltaSeconds = deltaTime / 1000;
    const transform = this.getComponent('Transform');
    
    // Apply gravity if enabled
    if (this.gravity) {
      this.velocity.y += this.gravityAcceleration * deltaSeconds;
    }
    
    // Move based on velocity
    const newX = transform.x + this.velocity.x * deltaSeconds;
    const newY = transform.y + this.velocity.y * deltaSeconds;
    transform.setPosition(newX, newY);
    
    // Update opacity based on lifetime
    this.opacity = this.calculateOpacity();
  }

  /**
   * Calculate current opacity based on lifetime
   * @returns {number} Opacity value from 0 to 1
   * @private
   */
  calculateOpacity() {
    const progress = this.lifetime / this.duration;
    
    if (progress >= 1) {
      return 0;
    }
    
    // Fade out over time with easing - ensure minimum opacity for partial fade
    const opacity = 1 - progress;
    return Math.max(0, Math.min(1, opacity));
  }

  /**
   * Get current opacity value
   * @returns {number} Current opacity (0-1)
   */
  getOpacity() {
    return this.opacity;
  }

  /**
   * Check if the floating number should be removed
   * @returns {boolean} True if lifetime has been exceeded
   */
  shouldRemove() {
    return this.lifetime >= this.duration;
  }

  /**
   * Get rendering data for the floating number
   * @returns {Object} Render data object
   */
  getRenderData() {
    const transform = this.getComponent('Transform');
    
    return {
      text: this.text,
      x: transform.x,
      y: transform.y,
      color: this.color,
      opacity: this.opacity,
      fontSize: this.fontSize
    };
  }

  /**
   * Create a money gain floating number
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} amount - Money amount
   * @returns {FloatingNumber} New floating number instance
   */
  static createMoneyGain(x, y, amount) {
    return new FloatingNumber(
      x, y, 
      `+£${amount}`, 
      '#00ff00', 
      2000, 
      { x: Math.random() * 20 - 10, y: -40 } // Random horizontal spread
    );
  }

  /**
   * Create a repair notification floating number
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {FloatingNumber} New floating number instance
   */
  static createRepairNotification(x, y) {
    return new FloatingNumber(
      x, y,
      'REPAIRED!',
      '#ffff00',
      1500,
      { x: 0, y: -25 }
    );
  }

  /**
   * Create a breakdown notification floating number
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {FloatingNumber} New floating number instance
   */
  static createBreakdownNotification(x, y) {
    return new FloatingNumber(
      x, y,
      'BROKEN!',
      '#ff0000',
      1500,
      { x: 0, y: -30 }
    );
  }

  /**
   * Create a guest satisfaction floating number
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} satisfaction - Satisfaction change
   * @returns {FloatingNumber} New floating number instance
   */
  static createSatisfactionChange(x, y, satisfaction) {
    const isPositive = satisfaction > 0;
    const text = isPositive ? `+${satisfaction} HAPPY` : `${satisfaction} SAD`;
    const color = isPositive ? '#0066ff' : '#ff6600';
    
    return new FloatingNumber(
      x, y,
      text,
      color,
      1800,
      { x: Math.random() * 15 - 7.5, y: -35 }
    );
  }

  /**
   * Create a repair cost floating number
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} cost - Repair cost (if any)
   * @returns {FloatingNumber} New floating number instance
   */
  static createRepairCost(x, y, cost = 0) {
    if (cost > 0) {
      return new FloatingNumber(
        x, y,
        `-£${cost}`,
        '#ff9900',
        1500,
        { x: 0, y: -20 }
      );
    } else {
      return new FloatingNumber(
        x, y,
        'FREE REPAIR',
        '#00aaff',
        1500,
        { x: 0, y: -20 }
      );
    }
  }
}