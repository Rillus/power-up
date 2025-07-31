import { Component } from '../engine/Component.js';

/**
 * Transform component for handling entity position, rotation, and scale
 * @class
 * @extends Component
 */
export class Transform extends Component {
  /**
   * Create a transform component
   * @param {Entity} entity - The entity this component belongs to
   * @param {number} [x=0] - Initial x position
   * @param {number} [y=0] - Initial y position
   */
  constructor(entity, x = 0, y = 0) {
    super(entity);
    this.type = 'Transform';
    
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;

    // Keep entity position in sync
    this.entity.x = x;
    this.entity.y = y;
  }

  /**
   * Set the position of this transform
   * @param {number} x - New x position
   * @param {number} y - New y position
   * @returns {Transform} This transform for method chaining
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    
    // Keep entity position in sync
    this.entity.x = x;
    this.entity.y = y;
    
    return this;
  }

  /**
   * Move this transform by the given offset
   * @param {number} deltaX - Amount to move in x direction
   * @param {number} deltaY - Amount to move in y direction
   * @returns {Transform} This transform for method chaining
   */
  translate(deltaX, deltaY) {
    return this.setPosition(this.x + deltaX, this.y + deltaY);
  }

  /**
   * Set the rotation of this transform
   * @param {number} radians - Rotation in radians
   * @returns {Transform} This transform for method chaining
   */
  setRotation(radians) {
    // Normalize rotation to 0-2π range
    this.rotation = ((radians % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
    return this;
  }

  /**
   * Set the scale of this transform
   * @param {number} scaleX - Scale factor for x axis
   * @param {number} [scaleY] - Scale factor for y axis (defaults to scaleX for uniform scaling)
   * @returns {Transform} This transform for method chaining
   */
  setScale(scaleX, scaleY = scaleX) {
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    return this;
  }

  /**
   * Get transformation matrix for rendering
   * @returns {object} Object containing transformation properties
   */
  getWorldMatrix() {
    return {
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
    };
  }

  /**
   * Calculate distance to another transform
   * @param {Transform} otherTransform - The other transform to measure distance to
   * @returns {number} Distance in pixels
   */
  distanceTo(otherTransform) {
    const deltaX = otherTransform.x - this.x;
    const deltaY = otherTransform.y - this.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }
}