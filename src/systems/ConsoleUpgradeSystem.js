import { CONSOLE_TYPES, TIER_MULTIPLIERS } from '../entities/GameConsole.js';

/**
 * Console Upgrade System for upgrading existing consoles
 * @class
 */
export class ConsoleUpgradeSystem {
  /**
   * Create a console upgrade system
   * @param {Object} game - Reference to the main game instance
   */
  constructor(game) {
    this.game = game;
    
    // Upgrade state
    this.selectedConsole = null;
    this.upgradeMode = false;
    
    // Event system
    this.eventListeners = {};
  }

  /**
   * Check if player can afford to upgrade a console
   * @param {GameConsole} console - Console to check
   * @returns {boolean} True if affordable
   */
  canAffordUpgrade(console) {
    if (!console || !console.canUpgrade()) return false;
    
    const upgradeCost = console.getUpgradeCost();
    return this.game.money >= upgradeCost;
  }

  /**
   * Get list of consoles that can be upgraded
   * @returns {GameConsole[]} Array of upgradeable consoles
   */
  getUpgradeableConsoles() {
    return this.game.consoles.filter(console => 
      console.canUpgrade() && this.canAffordUpgrade(console)
    );
  }

  /**
   * Select a console for upgrade
   * @param {GameConsole} console - Console to select
   * @returns {boolean} True if console was selected successfully
   */
  selectConsole(console) {
    if (!console || !console.canUpgrade()) {
      return false;
    }
    
    this.selectedConsole = console;
    return true;
  }

  /**
   * Deselect the currently selected console
   */
  deselectConsole() {
    this.selectedConsole = null;
  }

  /**
   * Confirm upgrade for selected console
   * @returns {boolean} True if upgrade was successful
   */
  confirmUpgrade() {
    if (!this.selectedConsole) return false;
    
    const console = this.selectedConsole;
    const upgradeCost = console.getUpgradeCost();
    
    // Check affordability again
    if (!this.canAffordUpgrade(console)) {
      return false;
    }
    
    // Perform upgrade
    const oldTier = console.tier;
    const upgradeSuccess = console.upgrade();
    
    if (upgradeSuccess) {
      // Deduct money
      this.game.money -= upgradeCost;
      
      // Emit upgrade complete event
      this.emit('upgradeComplete', {
        console: console,
        oldTier: oldTier,
        newTier: console.tier,
        cost: upgradeCost,
        x: console.x,
        y: console.y
      });
      
      // Deselect console
      this.deselectConsole();
      
      return true;
    }
    
    return false;
  }

  /**
   * Get upgrade information for a console
   * @param {GameConsole} console - Console to get info for
   * @returns {Object|null} Upgrade information or null if can't upgrade
   */
  getUpgradeInfo(console) {
    if (!console || !console.canUpgrade()) return null;
    
    const upgradeCost = console.getUpgradeCost();
    const currentTier = console.tier;
    const nextTier = currentTier + 1;
    
    return {
      currentTier: currentTier,
      nextTier: nextTier,
      currentTierName: console.getTierName(),
      nextTierName: this.getTierName(nextTier),
      cost: upgradeCost,
      affordable: this.canAffordUpgrade(console),
      benefits: this.getUpgradeBenefits(console)
    };
  }

  /**
   * Get tier display name
   * @param {number} tier - Tier number
   * @returns {string} Human-readable tier name
   */
  getTierName(tier) {
    switch (tier) {
      case 1: return 'Basic';
      case 2: return 'Enhanced';
      case 3: return 'Premium';
      default: return 'Unknown';
    }
  }

  /**
   * Get upgrade benefits for a console
   * @param {GameConsole} console - Console to analyze
   * @returns {Object} Upgrade benefits
   */
  getUpgradeBenefits(console) {
    if (!console.canUpgrade()) return {};
    
    const currentRevenue = console.revenue;
    const currentDurability = console.maxDurability;
    const currentRepairTime = console.repairTime;
    const currentAppeal = console.appeal;
    
    // Simulate what stats would be after upgrade
    const nextTier = console.tier + 1;
    const config = CONSOLE_TYPES[console.type] || {};
    const tierMultiplier = TIER_MULTIPLIERS[nextTier] || {};
    
    if (!config.revenue || !tierMultiplier.revenue) return {};
    
    const newRevenue = Math.floor(config.revenue * tierMultiplier.revenue);
    const newDurability = Math.floor(config.maxDurability * tierMultiplier.durability);
    const newRepairTime = Math.floor(config.repairTime * tierMultiplier.repair);
    const newAppeal = Math.floor(config.appeal * tierMultiplier.appeal);
    
    return {
      revenueIncrease: newRevenue - currentRevenue,
      durabilityIncrease: newDurability - currentDurability,
      repairTimeDecrease: currentRepairTime - newRepairTime,
      appealIncrease: newAppeal - currentAppeal
    };
  }

  /**
   * Get upgrade menu data for UI
   * @returns {Array} Array of upgrade options
   */
  getUpgradeMenu() {
    return this.game.consoles.map(console => {
      const info = this.getUpgradeInfo(console);
      return {
        console: console,
        canUpgrade: console.canUpgrade(),
        upgradeInfo: info,
        selected: this.selectedConsole === console
      };
    }).filter(item => item.canUpgrade);
  }

  /**
   * Find console at position (for click detection)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {GameConsole|null} Console at position or null
   */
  findConsoleAtPosition(x, y) {
    for (const console of this.game.consoles) {
      if (!console.canUpgrade()) continue;
      
      const transform = console.getComponent('Transform');
      if (!transform) continue;
      
      // Check if click is within console bounds
      const dx = Math.abs(transform.x - x);
      const dy = Math.abs(transform.y - y);
      
      if (dx <= 32 && dy <= 22) { // Console is 64x44 pixels
        return console;
      }
    }
    
    return null;
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