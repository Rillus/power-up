/**
 * Character Upgrade System - Manages character stat improvements
 * @class CharacterUpgradeSystem
 */
export class CharacterUpgradeSystem {
  /**
   * Create a CharacterUpgradeSystem
   * @param {Object} game - Game instance
   * @param {GameStateManager} gameStateManager - Game state manager
   */
  constructor(game, gameStateManager) {
    this.game = game;
    this.gameStateManager = gameStateManager;
    
    // Character upgrade tiers and costs
    this.upgrades = {
      speed: {
        name: 'Movement Speed',
        description: 'Increase character movement speed',
        icon: '🏃',
        maxLevel: 5,
        baseCost: 200,
        costMultiplier: 1.5,
        baseImprovement: 40, // +40 pixels per second per level
        currentLevel: 0
      },
      repair: {
        name: 'Repair Skill',
        description: 'Reduce console repair time',
        icon: '🔧',
        maxLevel: 5,
        baseCost: 300,
        costMultiplier: 1.6,
        baseImprovement: 0.15, // -15% repair time per level
        currentLevel: 0
      },
      efficiency: {
        name: 'Work Efficiency',
        description: 'Increase admission processing speed',
        icon: '⚡',
        maxLevel: 5,
        baseCost: 250,
        costMultiplier: 1.4,
        baseImprovement: 0.2, // +20% processing speed per level
        currentLevel: 0
      }
    };
    
    // UI state
    this.showUpgradeMenu = false;
    this.selectedUpgrade = null;
    
    // Event system
    this.eventListeners = {};
    
    // Load saved upgrade levels (defer if game state manager not ready)
    this.upgradesLoaded = false;
  }

  /**
   * Get upgrade cost for next level
   * @param {string} upgradeType - Type of upgrade
   * @returns {number} Cost for next upgrade level
   */
  getUpgradeCost(upgradeType) {
    const upgrade = this.upgrades[upgradeType];
    if (!upgrade || upgrade.currentLevel >= upgrade.maxLevel) {
      return 0;
    }
    
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
  }

  /**
   * Check if upgrade is available
   * @param {string} upgradeType - Type of upgrade
   * @returns {boolean} True if upgrade can be purchased
   */
  canUpgrade(upgradeType) {
    const upgrade = this.upgrades[upgradeType];
    if (!upgrade || upgrade.currentLevel >= upgrade.maxLevel) {
      return false;
    }
    
    const cost = this.getUpgradeCost(upgradeType);
    return this.gameStateManager.gameData.money >= cost;
  }

  /**
   * Purchase an upgrade
   * @param {string} upgradeType - Type of upgrade to purchase
   * @returns {Object} Result with success status and details
   */
  purchaseUpgrade(upgradeType) {
    if (!this.canUpgrade(upgradeType)) {
      return {
        success: false,
        error: 'Cannot afford upgrade or already at max level'
      };
    }

    const upgrade = this.upgrades[upgradeType];
    const cost = this.getUpgradeCost(upgradeType);
    
    // Spend the money
    const spendResult = this.gameStateManager.spendMoney(cost);
    if (!spendResult.success) {
      return spendResult;
    }

    // Apply the upgrade
    upgrade.currentLevel++;
    this.applyUpgrade(upgradeType);
    
    // Save progress
    this.saveUpgradeProgress();
    
    // Emit upgrade event
    this.emit('upgradesPurchased', {
      type: upgradeType,
      level: upgrade.currentLevel,
      cost: cost,
      name: upgrade.name
    });

    // Play upgrade sound
    if (this.game.audioSystem) {
      this.game.audioSystem.playSuccessSound();
    }

    // Create floating text
    if (this.game.createFloatingNumber && this.game.character) {
      const characterPos = this.game.character.getPosition();
      this.game.createFloatingNumber(
        characterPos.x,
        characterPos.y - 40,
        `${upgrade.name} +1!`,
        '#00FF00',
        2000,
        { x: 0, y: -30 }
      );
    }

    return {
      success: true,
      upgradeType,
      newLevel: upgrade.currentLevel,
      cost,
      remaining: spendResult.remaining
    };
  }

  /**
   * Apply upgrade effects to character
   * @param {string} upgradeType - Type of upgrade to apply
   * @private
   */
  applyUpgrade(upgradeType) {
    if (!this.game.character) return;

    const upgrade = this.upgrades[upgradeType];
    
    switch (upgradeType) {
      case 'speed':
        // Increase movement speed
        const movement = this.game.character.getComponent('Movement');
        if (movement) {
          const newSpeed = 200 + (upgrade.currentLevel * upgrade.baseImprovement);
          movement.setSpeed(newSpeed);
        }
        break;
        
      case 'repair':
        // Apply repair speed bonus (this will be used by repair interactions)
        this.game.character.baseRepairSpeedBonus = 1 + (upgrade.currentLevel * upgrade.baseImprovement);
        break;
        
      case 'efficiency':
        // Apply work efficiency bonus (for future admission processing)
        this.game.character.workEfficiencyBonus = 1 + (upgrade.currentLevel * upgrade.baseImprovement);
        break;
    }
    
    console.log(`Applied ${upgradeType} upgrade level ${upgrade.currentLevel}`);
  }

  /**
   * Apply all current upgrades to character (called on game load)
   */
  applyAllUpgrades() {
    // Ensure upgrades are loaded first
    this.initialize();
    
    Object.keys(this.upgrades).forEach(upgradeType => {
      if (this.upgrades[upgradeType].currentLevel > 0) {
        this.applyUpgrade(upgradeType);
      }
    });
  }

  /**
   * Get upgrade information for UI
   * @param {string} upgradeType - Type of upgrade
   * @returns {Object} Upgrade display information
   */
  getUpgradeInfo(upgradeType) {
    const upgrade = this.upgrades[upgradeType];
    if (!upgrade) return null;

    return {
      name: upgrade.name,
      description: upgrade.description,
      icon: upgrade.icon,
      currentLevel: upgrade.currentLevel,
      maxLevel: upgrade.maxLevel,
      nextCost: this.getUpgradeCost(upgradeType),
      canAfford: this.canUpgrade(upgradeType),
      isMaxLevel: upgrade.currentLevel >= upgrade.maxLevel,
      currentBonus: this.getCurrentBonus(upgradeType),
      nextBonus: this.getNextBonus(upgradeType)
    };
  }

  /**
   * Get current bonus for upgrade type
   * @param {string} upgradeType - Type of upgrade
   * @returns {string} Formatted bonus description
   * @private
   */
  getCurrentBonus(upgradeType) {
    const upgrade = this.upgrades[upgradeType];
    if (upgrade.currentLevel === 0) return 'None';

    switch (upgradeType) {
      case 'speed':
        return `+${upgrade.currentLevel * upgrade.baseImprovement} px/s`;
      case 'repair':
        return `-${(upgrade.currentLevel * upgrade.baseImprovement * 100).toFixed(0)}% repair time`;
      case 'efficiency':
        return `+${(upgrade.currentLevel * upgrade.baseImprovement * 100).toFixed(0)}% work speed`;
      default:
        return `Level ${upgrade.currentLevel}`;
    }
  }

  /**
   * Get next level bonus for upgrade type
   * @param {string} upgradeType - Type of upgrade
   * @returns {string} Formatted next bonus description
   * @private
   */
  getNextBonus(upgradeType) {
    const upgrade = this.upgrades[upgradeType];
    if (upgrade.currentLevel >= upgrade.maxLevel) return 'MAX';

    const nextLevel = upgrade.currentLevel + 1;
    switch (upgradeType) {
      case 'speed':
        return `+${nextLevel * upgrade.baseImprovement} px/s`;
      case 'repair':
        return `-${(nextLevel * upgrade.baseImprovement * 100).toFixed(0)}% repair time`;
      case 'efficiency':
        return `+${(nextLevel * upgrade.baseImprovement * 100).toFixed(0)}% work speed`;
      default:
        return `Level ${nextLevel}`;
    }
  }

  /**
   * Toggle upgrade menu visibility
   */
  toggleUpgradeMenu() {
    this.showUpgradeMenu = !this.showUpgradeMenu;
    
    if (this.showUpgradeMenu) {
      this.emit('upgradeMenuOpened', {});
    } else {
      this.emit('upgradeMenuClosed', {});
    }
  }

  /**
   * Save upgrade progress to game state
   * @private
   */
  saveUpgradeProgress() {
    try {
      const upgradeData = {};
      Object.keys(this.upgrades).forEach(type => {
        upgradeData[type] = this.upgrades[type].currentLevel;
      });
      
      this.gameStateManager.saveGameData({
        characterUpgrades: upgradeData
      });
    } catch (error) {
      console.warn('Failed to save character upgrades:', error);
    }
  }

  /**
   * Initialize upgrades (call after game is fully loaded)
   */
  initialize() {
    if (!this.upgradesLoaded) {
      this.loadUpgradeProgress();
      this.upgradesLoaded = true;
    }
  }

  /**
   * Load upgrade progress from game state
   * @private
   */
  loadUpgradeProgress() {
    try {
      const saveData = this.gameStateManager.gameData;
      if (saveData && saveData.characterUpgrades) {
        Object.keys(saveData.characterUpgrades).forEach(type => {
          if (this.upgrades[type]) {
            this.upgrades[type].currentLevel = saveData.characterUpgrades[type] || 0;
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load character upgrades:', error);
    }
  }

  /**
   * Get total upgrade investment
   * @returns {number} Total money spent on upgrades
   */
  getTotalInvestment() {
    let total = 0;
    Object.keys(this.upgrades).forEach(type => {
      const upgrade = this.upgrades[type];
      for (let level = 0; level < upgrade.currentLevel; level++) {
        total += Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
      }
    });
    return total;
  }

  /**
   * Reset all upgrades (for testing or new game+)
   */
  resetUpgrades() {
    Object.keys(this.upgrades).forEach(type => {
      this.upgrades[type].currentLevel = 0;
    });
    this.saveUpgradeProgress();
    this.emit('upgradesReset', {});
  }

  /**
   * Update method called each frame
   * @param {number} deltaTime - Time elapsed in milliseconds
   */
  update(deltaTime) {
    // Update logic can be added here if needed
    // For now, the upgrade system is event-driven
  }

  /**
   * Render upgrade menu if visible
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    if (!this.showUpgradeMenu) return;

    const centerX = this.game.canvas.width / 2;
    const centerY = this.game.canvas.height / 2;
    const menuWidth = 400;
    const menuHeight = 300;

    // Draw menu background
    renderer.drawRect(
      centerX - menuWidth/2,
      centerY - menuHeight/2,
      menuWidth,
      menuHeight,
      '#1a1a1a',
      true
    );
    
    // Draw menu border
    renderer.drawRect(
      centerX - menuWidth/2,
      centerY - menuHeight/2,
      menuWidth,
      menuHeight,
      '#0066CC',
      false,
      2
    );

    // Draw title
    renderer.drawText(
      'CHARACTER UPGRADES',
      centerX,
      centerY - menuHeight/2 + 30,
      {
        font: '18px Arial',
        color: '#FFFFFF',
        align: 'center'
      }
    );

    // Draw current money
    renderer.drawText(
      `Money: £${this.gameStateManager.gameData.money}`,
      centerX,
      centerY - menuHeight/2 + 55,
      {
        font: '14px Arial',
        color: '#FFD700',
        align: 'center'
      }
    );

    // Draw upgrade options
    const upgradeTypes = Object.keys(this.upgrades);
    const startY = centerY - menuHeight/2 + 80;
    const rowHeight = 50;

    upgradeTypes.forEach((type, index) => {
      const y = startY + (index * rowHeight);
      this.renderUpgradeOption(renderer, type, centerX, y, menuWidth - 40, index + 1);
    });

    // Draw instructions
    renderer.drawText(
      'Press U to close • Press 1,2,3 to purchase upgrades',
      centerX,
      centerY + menuHeight/2 - 20,
      {
        font: '12px Arial',
        color: '#CCCCCC',
        align: 'center'
      }
    );
  }

  /**
   * Render individual upgrade option
   * @param {RenderSystem} renderer - The render system
   * @param {string} upgradeType - Type of upgrade
   * @param {number} centerX - Center X position
   * @param {number} y - Y position
   * @param {number} width - Width of option
   * @param {number} shortcutNumber - Keyboard shortcut number (1, 2, 3)
   * @private
   */
  renderUpgradeOption(renderer, upgradeType, centerX, y, width, shortcutNumber) {
    const info = this.getUpgradeInfo(upgradeType);
    if (!info) return;

    const x = centerX - width/2;
    
    // Background color based on affordability
    let bgColor = info.canAfford ? '#004400' : '#440000';
    if (info.isMaxLevel) bgColor = '#444444';
    
    // Draw option background
    renderer.drawRect(x, y - 15, width, 40, bgColor, true);
    
    // Draw option border
    renderer.drawRect(x, y - 15, width, 40, '#666666', false, 1);

    // Draw shortcut number
    renderer.drawText(
      `[${shortcutNumber}]`,
      x + 10,
      y - 5,
      {
        font: '12px Arial',
        color: '#FFD700',
        align: 'left'
      }
    );

    // Draw upgrade icon and name
    renderer.drawText(
      `${info.icon} ${info.name}`,
      x + 40,
      y - 5,
      {
        font: '14px Arial',
        color: '#FFFFFF',
        align: 'left'
      }
    );

    // Draw level info
    renderer.drawText(
      `Level ${info.currentLevel}/${info.maxLevel}`,
      x + 40,
      y + 10,
      {
        font: '12px Arial',
        color: '#CCCCCC',
        align: 'left'
      }
    );

    // Draw cost and bonus info
    if (info.isMaxLevel) {
      renderer.drawText(
        'MAX LEVEL',
        x + width - 10,
        y,
        {
          font: '12px Arial',
          color: '#FFD700',
          align: 'right'
        }
      );
    } else {
      renderer.drawText(
        `£${info.nextCost}`,
        x + width - 10,
        y - 5,
        {
          font: '12px Arial',
          color: info.canAfford ? '#00FF00' : '#FF0000',
          align: 'right'
        }
      );
      
      renderer.drawText(
        info.nextBonus,
        x + width - 10,
        y + 8,
        {
          font: '10px Arial',
          color: '#CCCCCC',
          align: 'right'
        }
      );
    }
  }

  /**
   * Handle keyboard shortcut for purchasing upgrades
   * @param {string} key - Key that was pressed
   * @returns {boolean} True if key was handled
   */
  handleKeyPress(key) {
    if (!this.showUpgradeMenu) return false;

    const upgradeTypes = Object.keys(this.upgrades);
    let upgradeIndex = -1;

    switch (key) {
      case 'Digit1':
        upgradeIndex = 0;
        break;
      case 'Digit2':
        upgradeIndex = 1;
        break;
      case 'Digit3':
        upgradeIndex = 2;
        break;
      default:
        return false;
    }

    if (upgradeIndex >= 0 && upgradeIndex < upgradeTypes.length) {
      const upgradeType = upgradeTypes[upgradeIndex];
      if (this.canUpgrade(upgradeType)) {
        this.purchaseUpgrade(upgradeType);
      }
      return true;
    }

    return false;
  }

  /**
   * Handle click on upgrade menu
   * @param {number} x - Click X position
   * @param {number} y - Click Y position
   * @returns {boolean} True if click was handled
   */
  handleClick(x, y) {
    if (!this.showUpgradeMenu) return false;

    const centerX = this.game.canvas.width / 2;
    const centerY = this.game.canvas.height / 2;
    const menuWidth = 400;
    const menuHeight = 300;
    
    // Check if click is within menu bounds
    if (x < centerX - menuWidth/2 || x > centerX + menuWidth/2 ||
        y < centerY - menuHeight/2 || y > centerY + menuHeight/2) {
      return false;
    }

    // Check upgrade option clicks
    const upgradeTypes = Object.keys(this.upgrades);
    const startY = centerY - menuHeight/2 + 80;
    const rowHeight = 50;

    for (let i = 0; i < upgradeTypes.length; i++) {
      const optionY = startY + (i * rowHeight);
      if (y >= optionY - 15 && y <= optionY + 25) {
        const upgradeType = upgradeTypes[i];
        if (this.canUpgrade(upgradeType)) {
          this.purchaseUpgrade(upgradeType);
        }
        return true;
      }
    }

    return true; // Click was within menu, consume it
  }

  // Event system methods
  
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
   * @param {Function} callback - Callback function
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
   * @param {Object} data - Event data
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