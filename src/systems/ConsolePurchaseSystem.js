/**
 * Console Purchase System for buying and placing new consoles
 * @class
 */
export class ConsolePurchaseSystem {
  /**
   * Create a console purchase system
   * @param {Object} game - Reference to the main game instance
   */
  constructor(game) {
    this.game = game;
    
    // Console types and their costs
    this.consoleTypes = {
      'retro-arcade': { cost: 500, name: 'Retro Arcade' },
      'classic-home': { cost: 1200, name: 'Classic Home' },
      'modern-gaming': { cost: 2500, name: 'Modern Gaming' },
      'vr-experience': { cost: 5000, name: 'VR Experience' }
    };
    
    // Placement state
    this.placementMode = false;
    this.selectedConsoleType = null;
    this.previewPosition = { x: 0, y: 0 };
    
    // Grid and spacing constants
    this.gridSize = 40;
    this.minSpacing = 120; // Minimum distance between consoles
    this.edgeMargin = 80;   // Minimum distance from canvas edges
  }

  /**
   * Check if player can afford a console type
   * @param {string} consoleType - Console type to check
   * @returns {boolean} True if affordable
   */
  canAfford(consoleType) {
    const consoleInfo = this.consoleTypes[consoleType];
    if (!consoleInfo) return false;
    
    return this.game.money >= consoleInfo.cost;
  }

  /**
   * Get list of console types player can afford
   * @returns {string[]} Array of affordable console types
   */
  getAffordableConsoles() {
    return Object.keys(this.consoleTypes).filter(type => this.canAfford(type));
  }

  /**
   * Start console placement mode
   * @param {string} consoleType - Type of console to place
   * @returns {boolean} True if placement mode started successfully
   */
  startPlacement(consoleType) {
    if (!this.canAfford(consoleType)) {
      return false;
    }
    
    if (!this.consoleTypes[consoleType]) {
      return false;
    }
    
    this.placementMode = true;
    this.selectedConsoleType = consoleType;
    this.previewPosition = { x: 0, y: 0 };
    
    return true;
  }

  /**
   * Update the preview position for console placement
   * @param {number} x - Mouse/cursor X position
   * @param {number} y - Mouse/cursor Y position
   */
  updatePreviewPosition(x, y) {
    if (!this.placementMode) return;
    
    // Snap to grid
    const snappedX = Math.round(x / this.gridSize) * this.gridSize;
    const snappedY = Math.round(y / this.gridSize) * this.gridSize;
    
    this.previewPosition = { x: snappedX, y: snappedY };
  }

  /**
   * Check if a position is valid for console placement
   * @param {number} x - X position to check
   * @param {number} y - Y position to check
   * @returns {boolean} True if position is valid
   */
  isValidPlacement(x, y) {
    // Check canvas boundaries
    if (x < this.edgeMargin || 
        x > 1200 - this.edgeMargin || 
        y < this.edgeMargin || 
        y > 800 - this.edgeMargin) {
      return false;
    }
    
    // Check distance from existing consoles
    for (const existingConsole of this.game.consoles) {
      const dx = existingConsole.x - x;
      const dy = existingConsole.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.minSpacing) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Confirm console placement at current preview position
   * @returns {boolean} True if console was placed successfully
   */
  confirmPlacement() {
    if (!this.placementMode || !this.selectedConsoleType) {
      return false;
    }
    
    const { x, y } = this.previewPosition;
    
    // Validate placement
    if (!this.isValidPlacement(x, y)) {
      return false;
    }
    
    // Check affordability again (in case money changed)
    if (!this.canAfford(this.selectedConsoleType)) {
      return false;
    }
    
    // Get console cost
    const cost = this.consoleTypes[this.selectedConsoleType].cost;
    
    // Create the console
    this.game.createConsole(x, y, this.selectedConsoleType);
    
    // Deduct money
    this.game.money -= cost;
    
    // Create floating number for cost
    this.game.createFloatingNumber(
      x, 
      y - 30, 
      `-£${cost}`, 
      '#ff9900'
    );
    
    // Exit placement mode
    this.placementMode = false;
    this.selectedConsoleType = null;
    this.previewPosition = { x: 0, y: 0 };
    
    return true;
  }

  /**
   * Cancel console placement mode
   */
  cancelPlacement() {
    this.placementMode = false;
    this.selectedConsoleType = null;
    this.previewPosition = { x: 0, y: 0 };
  }

  /**
   * Get information about a console type
   * @param {string} consoleType - Console type to get info for
   * @returns {Object|null} Console information or null if invalid
   */
  getConsoleInfo(consoleType) {
    return this.consoleTypes[consoleType] || null;
  }

  /**
   * Get purchase menu data with affordability information
   * @returns {Array} Array of console options with affordability
   */
  getPurchaseMenu() {
    return Object.entries(this.consoleTypes).map(([type, info]) => ({
      type,
      name: info.name,
      cost: info.cost,
      affordable: this.canAfford(type)
    }));
  }

  /**
   * Get preview rendering data for placement mode
   * @returns {Object|null} Preview data or null if not in placement mode
   */
  getPreviewData() {
    if (!this.placementMode) return null;
    
    return {
      x: this.previewPosition.x,
      y: this.previewPosition.y,
      type: this.selectedConsoleType,
      valid: this.isValidPlacement(this.previewPosition.x, this.previewPosition.y)
    };
  }
}