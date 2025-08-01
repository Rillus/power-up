import { Entity } from '../engine/Entity.js';
import { Transform } from '../components/Transform.js';

/**
 * Wall entity that provides visual boundaries and collision detection
 * @class
 * @extends Entity
 */
export class Wall extends Entity {
  /**
   * Create a wall
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Wall width
   * @param {number} height - Wall height
   * @param {string} [color='#8B4513'] - Wall color (brown by default)
   */
  constructor(x, y, width, height, color = '#8B4513') {
    super(x, y);
    
    // Add Transform component
    this.addComponent(new Transform(this, x, y));
    
    // Wall properties
    this.width = width;
    this.height = height;
    this.color = color;
    this.thickness = 20; // Wall thickness for visual appeal
    
    // Wall type for identification
    this.type = 'wall';
    this.solid = true; // Walls are solid objects
  }

  /**
   * Check if a point is inside this wall
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if point is inside wall
   */
  containsPoint(x, y) {
    const transform = this.getComponent('Transform');
    return x >= transform.x && x <= transform.x + this.width &&
           y >= transform.y && y <= transform.y + this.height;
  }

  /**
   * Check if a rectangle overlaps with this wall
   * @param {number} x - Rectangle X position
   * @param {number} y - Rectangle Y position
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @returns {boolean} True if rectangle overlaps wall
   */
  overlapsRectangle(x, y, width, height) {
    const transform = this.getComponent('Transform');
    return x < transform.x + this.width &&
           x + width > transform.x &&
           y < transform.y + this.height &&
           y + height > transform.y;
  }

  /**
   * Get wall bounds
   * @returns {Object} Bounds with left, right, top, bottom
   */
  getBounds() {
    const transform = this.getComponent('Transform');
    return {
      left: transform.x,
      right: transform.x + this.width,
      top: transform.y,
      bottom: transform.y + this.height
    };
  }

  /**
   * Update wall (walls are static, so minimal update needed)
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    super.update(deltaTime);
    // Walls are static objects, no update logic needed
  }

  /**
   * Render the wall
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    super.render(renderer);
    
    const transform = this.getComponent('Transform');
    if (!transform) return;
    
    // Draw main wall body
    renderer.drawRect(
      transform.x,
      transform.y,
      this.width,
      this.height,
      this.color,
      true // filled
    );
    
    // Draw darker border for 3D effect
    const borderColor = this.darkenColor(this.color, 0.5);
    renderer.drawRect(
      transform.x,
      transform.y,
      this.width,
      this.height,
      borderColor,
      false, // stroke only
      1.0, // alpha
      5 // increased line width for better visibility
    );
    
    // Add highlight on top and left edges for 3D effect
    const highlightColor = this.lightenColor(this.color, 0.4);
    
    // Top highlight
    renderer.drawRect(
      transform.x,
      transform.y,
      this.width,
      5,
      highlightColor,
      true
    );
    
    // Left highlight
    renderer.drawRect(
      transform.x,
      transform.y,
      5,
      this.height,
      highlightColor,
      true
    );
    
    // Add subtle pattern for museum wall texture
    this.drawWallPattern(renderer, transform.x, transform.y, this.width, this.height);
  }
  
  /**
   * Draw subtle wall pattern for texture
   * @param {RenderSystem} renderer - The render system
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Wall width
   * @param {number} height - Wall height
   * @private
   */
  drawWallPattern(renderer, x, y, width, height) {
    const patternColor = this.darkenColor(this.color, 0.1);
    const spacing = 8;
    
    // Draw subtle vertical lines for brick effect
    for (let i = spacing; i < width; i += spacing) {
      renderer.drawRect(
        x + i,
        y,
        1,
        height,
        patternColor,
        true
      );
    }
    
    // Draw subtle horizontal lines for brick effect
    for (let i = spacing; i < height; i += spacing) {
      renderer.drawRect(
        x,
        y + i,
        width,
        1,
        patternColor,
        true
      );
    }
  }

  /**
   * Darken a color by a factor
   * @param {string} color - Hex color string
   * @param {number} factor - Darkening factor (0-1)
   * @returns {string} Darkened color
   * @private
   */
  darkenColor(color, factor) {
    // Simple color darkening for borders
    if (color === '#654321') return '#3D2B1F'; // Dark brown -> Very dark brown
    if (color === '#8B4513') return '#654321'; // Brown -> Dark brown
    if (color === '#A0A0A0') return '#606060'; // Gray -> Dark gray
    return '#444444'; // Default dark color
  }

  /**
   * Lighten a color by a factor
   * @param {string} color - Hex color string
   * @param {number} factor - Lightening factor (0-1)
   * @returns {string} Lightened color
   * @private
   */
  lightenColor(color, factor) {
    // Simple color lightening for highlights
    if (color === '#654321') return '#8B4513'; // Dark brown -> Brown
    if (color === '#8B4513') return '#CD853F'; // Brown -> Sandy brown
    if (color === '#A0A0A0') return '#C0C0C0'; // Gray -> Light gray
    return '#888888'; // Default light color
  }
}