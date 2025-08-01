import { Wall } from '../entities/Wall.js';

/**
 * Wall System - Manages game area boundaries and wall entities
 * @class WallSystem
 */
export class WallSystem {
  /**
   * Create a WallSystem
   * @param {Object} game - Game instance
   */
  constructor(game) {
    this.game = game;
    this.walls = [];
    
    // Wall configuration
    this.wallThickness = 30; // Increased thickness for better visibility
    this.wallColor = '#8B4513'; // Lighter brown color for better visibility
    
    // Visibility settings
    this.wallsVisible = true; // Toggle for wall visibility
    
    // Playable area configuration (with walls)
    this.playableArea = {
      left: this.wallThickness,
      right: this.game.canvas.width - this.wallThickness,
      top: this.wallThickness,
      bottom: this.game.canvas.height - this.wallThickness
    };
    
    // Create boundary walls
    this.createBoundaryWalls();
  }

  /**
   * Create the boundary walls around the game area
   * @private
   */
  createBoundaryWalls() {
    const canvasWidth = this.game.canvas.width;
    const canvasHeight = this.game.canvas.height;
    
    // Top wall
    const topWall = new Wall(0, 0, canvasWidth, this.wallThickness, this.wallColor);
    this.walls.push(topWall);
    this.game.entities.push(topWall);
    
    // Bottom wall
    const bottomWall = new Wall(0, canvasHeight - this.wallThickness, canvasWidth, this.wallThickness, this.wallColor);
    this.walls.push(bottomWall);
    this.game.entities.push(bottomWall);
    
    // Left wall
    const leftWall = new Wall(0, 0, this.wallThickness, canvasHeight, this.wallColor);
    this.walls.push(leftWall);
    this.game.entities.push(leftWall);
    
    // Right wall
    const rightWall = new Wall(canvasWidth - this.wallThickness, 0, this.wallThickness, canvasHeight, this.wallColor);
    this.walls.push(rightWall);
    this.game.entities.push(rightWall);
    
    console.log(`Created ${this.walls.length} boundary walls for ${canvasWidth}x${canvasHeight} canvas`);
  }

  /**
   * Get the playable area bounds (area inside walls)
   * @returns {Object} Bounds with left, right, top, bottom
   */
  getPlayableArea() {
    return { ...this.playableArea };
  }

  /**
   * Check if a position is within the playable area
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} [margin=0] - Additional margin from walls
   * @returns {boolean} True if position is within playable area
   */
  isWithinPlayableArea(x, y, margin = 0) {
    return x >= this.playableArea.left + margin &&
           x <= this.playableArea.right - margin &&
           y >= this.playableArea.top + margin &&
           y <= this.playableArea.bottom - margin;
  }

  /**
   * Clamp a position to the playable area
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} [margin=0] - Additional margin from walls
   * @returns {Object} Clamped position with x, y
   */
  clampToPlayableArea(x, y, margin = 0) {
    return {
      x: Math.max(this.playableArea.left + margin, 
                  Math.min(this.playableArea.right - margin, x)),
      y: Math.max(this.playableArea.top + margin, 
                  Math.min(this.playableArea.bottom - margin, y))
    };
  }

  /**
   * Get a random position within the playable area
   * @param {number} [margin=50] - Margin from walls
   * @returns {Object} Random position with x, y
   */
  getRandomPlayablePosition(margin = 50) {
    const minX = this.playableArea.left + margin;
    const maxX = this.playableArea.right - margin;
    const minY = this.playableArea.top + margin;
    const maxY = this.playableArea.bottom - margin;
    
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY)
    };
  }

  /**
   * Check if a rectangle would be valid within playable area
   * @param {number} x - Rectangle X position
   * @param {number} y - Rectangle Y position
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {number} [margin=0] - Additional margin from walls
   * @returns {boolean} True if rectangle fits within playable area
   */
  isRectangleWithinPlayableArea(x, y, width, height, margin = 0) {
    return x >= this.playableArea.left + margin &&
           x + width <= this.playableArea.right - margin &&
           y >= this.playableArea.top + margin &&
           y + height <= this.playableArea.bottom - margin;
  }

  /**
   * Get playable area dimensions
   * @returns {Object} Dimensions with width, height
   */
  getPlayableAreaDimensions() {
    return {
      width: this.playableArea.right - this.playableArea.left,
      height: this.playableArea.bottom - this.playableArea.top
    };
  }

  /**
   * Check collision between a point and any wall
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Wall|null} Colliding wall or null
   */
  checkPointCollision(x, y) {
    for (const wall of this.walls) {
      if (wall.containsPoint(x, y)) {
        return wall;
      }
    }
    return null;
  }

  /**
   * Check collision between a rectangle and any wall
   * @param {number} x - Rectangle X position
   * @param {number} y - Rectangle Y position
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @returns {Wall|null} Colliding wall or null
   */
  checkRectangleCollision(x, y, width, height) {
    for (const wall of this.walls) {
      if (wall.overlapsRectangle(x, y, width, height)) {
        return wall;
      }
    }
    return null;
  }

  /**
   * Get all walls
   * @returns {Wall[]} Array of wall entities
   */
  getWalls() {
    return [...this.walls];
  }

  /**
   * Update wall system (walls are static, minimal update needed)
   * @param {number} deltaTime - Time elapsed in milliseconds
   */
  update(deltaTime) {
    // Walls are static, no updates needed
    // This method exists for consistency with other systems
  }

  /**
   * Get wall system information for debugging
   * @returns {Object} Wall system info
   */
  getSystemInfo() {
    return {
      wallCount: this.walls.length,
      wallThickness: this.wallThickness,
      playableArea: this.playableArea,
      playableDimensions: this.getPlayableAreaDimensions()
    };
  }

  /**
   * Handle keyboard input for debugging
   * @param {string} key - Key code
   * @returns {boolean} True if key was handled
   */
  handleKeyPress(key) {
    switch (key) {
      case 'KeyW':
        // Show wall system info
        console.log('Wall System Info:', this.getSystemInfo());
        return true;
      case 'KeyV':
        // Toggle wall visibility
        this.wallsVisible = !this.wallsVisible;
        console.log(`Walls ${this.wallsVisible ? 'visible' : 'hidden'}`);
        return true;
      default:
        return false;
    }
  }
}