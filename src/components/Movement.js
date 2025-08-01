import { Component } from '../engine/Component.js';

/**
 * Movement component for handling entity movement and collision detection
 * @class Movement
 * @extends Component
 */
export class Movement extends Component {
  /**
   * Create a Movement component
   * @param {number} speed - Movement speed in pixels per second
   */
  constructor(speed = 100) {
    super();
    this.type = 'Movement';
    this.speed = Math.max(0, speed); // Ensure non-negative speed
    
    // Direction vector (normalized)
    this.direction = { x: 0, y: 0 };
    
    // Current velocity
    this.velocity = { x: 0, y: 0 };
    
    // Collision boundaries (800x600 game area with 20px entity radius)
    this.boundaries = {
      left: 20,
      right: 780,
      top: 20,
      bottom: 580
    };
  }

  /**
   * Set movement direction (will be normalized)
   * @param {number} x - X direction component
   * @param {number} y - Y direction component
   */
  setDirection(x, y) {
    // Calculate magnitude for normalization
    const magnitude = Math.sqrt(x * x + y * y);
    
    if (magnitude === 0) {
      this.direction.x = 0;
      this.direction.y = 0;
    } else {
      // Normalize direction vector
      this.direction.x = x / magnitude;
      this.direction.y = y / magnitude;
    }
    
    // Update velocity immediately
    this.updateVelocity();
  }

  /**
   * Stop all movement
   */
  stop() {
    this.direction.x = 0;
    this.direction.y = 0;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }

  /**
   * Get current speed
   * @returns {number} Current speed in pixels per second
   */
  getSpeed() {
    return this.speed;
  }

  /**
   * Set movement speed
   * @param {number} speed - New speed in pixels per second
   */
  setSpeed(speed) {
    this.speed = Math.max(0, speed); // Ensure non-negative
    this.updateVelocity();
  }

  /**
   * Update velocity based on current direction and speed
   * @private
   */
  updateVelocity() {
    // Get speed multiplier from parent entity if available
    const speedMultiplier = this.entity?.speedMultiplier || 1.0;
    const effectiveSpeed = this.speed * speedMultiplier;
    
    this.velocity.x = this.direction.x * effectiveSpeed;
    this.velocity.y = this.direction.y * effectiveSpeed;
  }

  /**
   * Update movement and apply collision detection
   * @param {number} deltaTime - Time elapsed in milliseconds
   */
  update(deltaTime) {
    if (!this.entity) return;

    const transform = this.entity.getComponent('Transform');
    if (!transform) return;

    // Convert deltaTime from milliseconds to seconds
    const deltaSeconds = deltaTime / 1000;

    // Calculate new position
    const newX = transform.x + (this.velocity.x * deltaSeconds);
    const newY = transform.y + (this.velocity.y * deltaSeconds);

    // Apply collision detection
    const clampedX = Math.max(this.boundaries.left, 
                             Math.min(this.boundaries.right, newX));
    const clampedY = Math.max(this.boundaries.top, 
                             Math.min(this.boundaries.bottom, newY));

    // Update transform position
    transform.x = clampedX;
    transform.y = clampedY;
  }

  /**
   * Render method (Movement components don't render)
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    // Movement components don't have visual representation
  }
}