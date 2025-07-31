import { Entity } from '../engine/Entity.js';
import { Transform } from '../components/Transform.js';

/**
 * Console configuration data
 */
const CONSOLE_TYPES = {
  'retro-arcade': {
    cost: 500,
    revenue: 2,
    maxDurability: 20,
    repairTime: 3000, // 3 seconds
    capacity: 1,
    appeal: 3
  },
  'classic-home': {
    cost: 1200,
    revenue: 3,
    maxDurability: 35,
    repairTime: 4000, // 4 seconds
    capacity: 2,
    appeal: 5
  },
  'modern-gaming': {
    cost: 2500,
    revenue: 5,
    maxDurability: 50,
    repairTime: 5000, // 5 seconds
    capacity: 2,
    appeal: 8
  },
  'vr-experience': {
    cost: 5000,
    revenue: 8,
    maxDurability: 25,
    repairTime: 7000, // 7 seconds
    capacity: 1,
    appeal: 10
  }
};

/**
 * Gaming console entity for the exhibition
 * @class
 * @extends Entity
 */
export class GameConsole extends Entity {
  /**
   * Create a gaming console
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels
   * @param {string} type - Console type identifier
   * @param {number} [tier=1] - Upgrade tier (1-3)
   */
  constructor(x, y, type, tier = 1) {
    super(x, y);
    
    // Validate console type
    if (!CONSOLE_TYPES[type]) {
      throw new Error(`Invalid console type: ${type}`);
    }
    
    // Add Transform component
    this.addComponent(new Transform(this, x, y));
    
    // Console properties
    this.type = type;
    this.tier = tier;
    
    // Get base stats from configuration
    const config = CONSOLE_TYPES[type];
    this.cost = config.cost;
    this.revenue = config.revenue;
    this.maxDurability = config.maxDurability;
    this.repairTime = config.repairTime;
    this.capacity = config.capacity;
    this.appeal = config.appeal;
    
    // Current state
    this.durability = this.maxDurability;
    this.state = 'operational'; // operational, in-use, broken, under-repair
    this.repairStartTime = null;
    this.currentUsers = [];
  }

  /**
   * Use the console (decreases durability)
   * @throws {Error} When console is broken
   */
  use() {
    if (!this.isOperational()) {
      throw new Error('Cannot use broken console');
    }
    
    this.durability--;
    this.state = 'in-use';
    
    // Check if console breaks
    if (this.durability <= 0) {
      this.state = 'broken';
    }
  }

  /**
   * Finish using the console (return to operational state)
   */
  finishUse() {
    if (this.state === 'in-use' && this.durability > 0) {
      this.state = 'operational';
    }
  }

  /**
   * Check if console is operational (can be used)
   * @returns {boolean} True if console can be used
   */
  isOperational() {
    return this.state === 'operational' || this.state === 'in-use';
  }

  /**
   * Start repairing the console
   * @throws {Error} When console is not broken
   */
  startRepair() {
    if (this.state !== 'broken') {
      throw new Error('Console is not broken');
    }
    
    this.state = 'under-repair';
    this.repairStartTime = Date.now();
  }

  /**
   * Update repair progress
   */
  updateRepair() {
    if (this.state === 'under-repair' && this.repairStartTime) {
      const repairElapsed = Date.now() - this.repairStartTime;
      
      if (repairElapsed >= this.repairTime) {
        // Repair complete
        this.state = 'operational';
        this.durability = this.maxDurability;
        this.repairStartTime = null;
      }
    }
  }

  /**
   * Calculate revenue from guest interaction
   * @param {Object} guest - Guest object with satisfaction property
   * @returns {number} Revenue amount in pounds
   */
  calculateRevenue(guest) {
    if (guest.satisfaction < 0) {
      return 0; // Angry guests pay nothing
    } else if (guest.satisfaction < 5) {
      return Math.floor(this.revenue / 2); // Neutral guests pay half
    } else {
      return this.revenue; // Happy guests pay full
    }
  }

  /**
   * Get status color for visual indicators
   * @returns {string} Color hex code
   */
  getStatusColor() {
    switch (this.state) {
      case 'operational':
        return '#00ff00'; // Green
      case 'in-use':
        return '#0066ff'; // Blue
      case 'broken':
        return '#ff0000'; // Red
      case 'under-repair':
        return '#ffff00'; // Yellow
      default:
        return '#ffffff'; // White
    }
  }

  /**
   * Update console state
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    super.update(deltaTime);
    
    // Update repair progress if under repair
    if (this.state === 'under-repair') {
      this.updateRepair();
    }
  }

  /**
   * Get repair progress as percentage
   * @returns {number} Progress from 0 to 1, or 0 if not repairing
   */
  getRepairProgress() {
    if (this.state !== 'under-repair' || !this.repairStartTime) {
      return 0;
    }
    
    const elapsed = Date.now() - this.repairStartTime;
    return Math.min(elapsed / this.repairTime, 1);
  }
}