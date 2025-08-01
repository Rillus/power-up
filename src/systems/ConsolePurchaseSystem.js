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
    
    // Console types and their costs - sync with GameConsole.js
    this.consoleTypes = {
      'retro-arcade': { 
        cost: 500, 
        name: 'Retro Arcade',
        description: 'Basic console - appeals to casual guests',
        revenue: '£2/use',
        capacity: '1 guest'
      },
      'classic-home': { 
        cost: 1200, 
        name: 'Classic Home',
        description: 'Mid-tier console - appeals to families, serves 2 guests',
        revenue: '£4/use + £1 bonus',
        capacity: '2 guests'
      },
      'modern-gaming': { 
        cost: 2500, 
        name: 'Modern Gaming',
        description: 'High-tier console - appeals to enthusiasts',
        revenue: '£6/use + £2 bonus',
        capacity: '2 guests'
      },
      'vr-experience': { 
        cost: 5000, 
        name: 'VR Experience',
        description: 'Premium console - maximum appeal to enthusiasts',
        revenue: '£10/use + £4 bonus',
        capacity: '1 guest'
      }
    };
    
    // Placement state
    this.placementMode = false;
    this.selectedConsoleType = null;
    this.previewPosition = { x: 0, y: 0 };
    
    // Grid and spacing constants
    this.gridSize = 40;
    this.minSpacing = 120; // Minimum distance between consoles
    this.edgeMargin = 80;   // Minimum distance from canvas edges
    
    // Event system
    this.eventListeners = {};
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
   * Get list of console types player can afford and are unlocked
   * @returns {string[]} Array of affordable and unlocked console types
   */
  getAffordableConsoles() {
    return Object.keys(this.consoleTypes).filter(type => {
      return this.canAfford(type) && this.isConsoleUnlocked(type);
    });
  }

  /**
   * Check if a console type is unlocked
   * @param {string} consoleType - Console type to check
   * @returns {boolean} True if unlocked or no unlock system present
   */
  isConsoleUnlocked(consoleType) {
    if (this.game.consoleUnlockSystem) {
      return this.game.consoleUnlockSystem.isConsoleUnlocked(consoleType);
    }
    // If no unlock system, allow all consoles (backward compatibility)
    return true;
  }
  
  /**
   * Update available consoles (called when unlocks change)
   */
  updateAvailableConsoles() {
    // This method can be used by other systems to trigger UI updates
    // when console availability changes
    this.emit('availableConsolesChanged', {
      availableConsoles: this.getAffordableConsoles()
    });
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
    // Check boundaries using wall system if available
    if (this.game.wallSystem) {
      if (!this.game.wallSystem.isRectangleWithinPlayableArea(x - 30, y - 20, 60, 40, this.edgeMargin)) {
        return false;
      }
    } else {
      // Fallback to canvas boundaries
      if (x < this.edgeMargin || 
          x > 1200 - this.edgeMargin || 
          y < this.edgeMargin || 
          y > 800 - this.edgeMargin) {
        return false;
      }
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
   * Get strategic placement analysis for a position
   * @param {number} x - X position to analyze
   * @param {number} y - Y position to analyze
   * @returns {Object|null} Strategic analysis or null if no placement system
   */
  getStrategicAnalysis(x, y) {
    if (!this.game.placementSystem) return null;
    return this.game.placementSystem.analyzePosition(x, y);
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
    
    // Emit purchase complete event
    this.emit('purchaseComplete', {
      x: x,
      y: y,
      type: this.selectedConsoleType,
      cost: cost
    });
    
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
      description: info.description,
      revenue: info.revenue,
      capacity: info.capacity,
      affordable: this.canAfford(type)
    }));
  }

  /**
   * Get preview rendering data for placement mode
   * @returns {Object|null} Preview data or null if not in placement mode
   */
  getPreviewData() {
    if (!this.placementMode) return null;
    
    const isValid = this.isValidPlacement(this.previewPosition.x, this.previewPosition.y);
    const strategicAnalysis = this.getStrategicAnalysis(this.previewPosition.x, this.previewPosition.y);
    
    return {
      x: this.previewPosition.x,
      y: this.previewPosition.y,
      type: this.selectedConsoleType,
      valid: isValid,
      strategic: strategicAnalysis
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
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}