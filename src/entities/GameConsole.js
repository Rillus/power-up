import { Entity } from '../engine/Entity.js';
import { Transform } from '../components/Transform.js';

/**
 * Upgrade tier multipliers (applied to base stats)
 */
const TIER_MULTIPLIERS = {
  1: { // Tier 1 (base)
    revenue: 1.0,
    durability: 1.0,
    repair: 1.0,
    cost: 1.0,
    appeal: 1.0
  },
  2: { // Tier 2 (upgraded)
    revenue: 1.5,
    durability: 1.3,
    repair: 0.8, // Faster repair (80% of original time)
    cost: 2.0, // Upgrade costs 2x base console cost
    appeal: 1.2
  },
  3: { // Tier 3 (premium)
    revenue: 2.0,
    durability: 1.6,
    repair: 0.6, // Much faster repair (60% of original time)
    cost: 3.5, // Upgrade costs 3.5x base console cost
    appeal: 1.5
  }
};

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
    appeal: 3,
    guestTypes: ['casual'], // Primarily appeals to casual guests
    useTime: 8000, // 8 seconds per use
    breakdownChance: 0.15 // 15% chance per use
  },
  'classic-home': {
    cost: 1200,
    revenue: 4, // Higher revenue than retro
    maxDurability: 35,
    repairTime: 4000, // 4 seconds
    capacity: 2, // Can serve 2 guests simultaneously
    appeal: 6, // Higher appeal
    guestTypes: ['casual', 'family'], // Appeals to families and casual guests
    useTime: 12000, // 12 seconds per use (longer sessions)
    breakdownChance: 0.08, // 8% chance per use (more reliable)
    bonusRevenue: 1 // Extra £1 from satisfied families
  },
  'modern-gaming': {
    cost: 2500,
    revenue: 6,
    maxDurability: 50,
    repairTime: 5000, // 5 seconds
    capacity: 2,
    appeal: 8,
    guestTypes: ['casual', 'enthusiast'], // Appeals to enthusiasts primarily
    useTime: 15000, // 15 seconds per use (long sessions)
    breakdownChance: 0.10, // 10% chance per use
    bonusRevenue: 2 // Extra £2 from satisfied enthusiasts
  },
  'vr-experience': {
    cost: 5000,
    revenue: 10,
    maxDurability: 25,
    repairTime: 7000, // 7 seconds
    capacity: 1,
    appeal: 12, // Highest appeal
    guestTypes: ['enthusiast'], // Primarily appeals to enthusiasts
    useTime: 20000, // 20 seconds per use (very long sessions)
    breakdownChance: 0.20, // 20% chance per use (high-tech, fragile)
    bonusRevenue: 4 // Extra £4 from satisfied enthusiasts
  }
};

/**
 * Gaming console entity for the exhibition
 * @class
 * @extends Entity
 */
export { CONSOLE_TYPES, TIER_MULTIPLIERS };

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
    this.width = 60;  // Console width for rendering
    this.height = 40; // Console height for rendering
    
    // Get base stats from configuration
    const config = CONSOLE_TYPES[type];
    const tierMultiplier = TIER_MULTIPLIERS[tier] || TIER_MULTIPLIERS[1];
    
    // Apply tier multipliers to base stats
    this.baseCost = config.cost;
    this.cost = Math.floor(config.cost * tierMultiplier.cost);
    this.revenue = Math.floor(config.revenue * tierMultiplier.revenue);
    this.maxDurability = Math.floor(config.maxDurability * tierMultiplier.durability);
    this.repairTime = Math.floor(config.repairTime * tierMultiplier.repair);
    this.capacity = config.capacity;
    this.appeal = Math.floor(config.appeal * tierMultiplier.appeal);
    this.guestTypes = config.guestTypes || ['casual'];
    this.useTime = config.useTime || 10000;
    this.breakdownChance = config.breakdownChance || 0.10;
    this.bonusRevenue = config.bonusRevenue || 0;
    
    // Current state
    this.durability = this.maxDurability;
    this.state = 'operational'; // operational, in-use, broken, under-repair
    this.repairStartTime = null;
    this.currentUsers = [];
    
    // Queue management
    this.queue = []; // Array of guests waiting in queue
    
    // Event system
    this.eventListeners = {};
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
   * Add a guest as current user (enforces single user limit)
   * @param {Guest} guest - Guest to add as user
   * @returns {boolean} True if successfully added, false if console is occupied
   */
  addUser(guest) {
    if (this.currentUsers.length >= 1) {
      return false; // Console is already occupied by one guest
    }
    
    if (!this.isOperational()) {
      return false; // Console is not operational
    }
    
    this.currentUsers.push(guest);
    this.state = 'in-use';
    return true;
  }

  /**
   * Remove a guest from current users
   * @param {Guest} guest - Guest to remove
   */
  removeUser(guest) {
    const index = this.currentUsers.indexOf(guest);
    if (index !== -1) {
      this.currentUsers.splice(index, 1);
      
      // If no more users, return to operational state
      if (this.currentUsers.length === 0 && this.durability > 0) {
        this.state = 'operational';
      }
    }
  }

  /**
   * Check if console can accept a new user
   * @returns {boolean} True if console can accept a guest
   */
  canAcceptUser() {
    return this.isOperational() && this.currentUsers.length === 0;
  }

  /**
   * Get current user (since we only allow one)
   * @returns {Guest|null} Current user or null
   */
  getCurrentUser() {
    return this.currentUsers.length > 0 ? this.currentUsers[0] : null;
  }

  /**
   * Check if console is operational (can be used)
   * @returns {boolean} True if console can be used
   */
  isOperational() {
    return this.state === 'operational' || this.state === 'in-use';
  }

  /**
   * Check if console is currently in use
   * @returns {boolean} True if console is being used
   */
  isInUse() {
    return this.state === 'in-use' || this.currentUsers.length > 0;
  }

  /**
   * Start repairing the console
   * @param {number} [repairMultiplier=1.0] - Repair speed multiplier from power-ups
   * @throws {Error} When console is not broken
   */
  startRepair(repairMultiplier = 1.0) {
    if (this.state !== 'broken') {
      throw new Error('Console is not broken');
    }
    
    this.state = 'under-repair';
    this.repairStartTime = Date.now();
    this.effectiveRepairTime = Math.max(100, Math.floor(this.repairTime / repairMultiplier)); // Minimum 100ms repair time
  }

  /**
   * Update repair progress
   */
  updateRepair() {
    if (this.state === 'under-repair' && this.repairStartTime) {
      const repairElapsed = Date.now() - this.repairStartTime;
      const targetRepairTime = this.effectiveRepairTime || this.repairTime;
      
      if (repairElapsed >= targetRepairTime) {
        // Repair complete
        this.state = 'operational';
        this.durability = this.maxDurability;
        this.repairStartTime = null;
        this.effectiveRepairTime = null; // Reset for next repair
        
        // Emit repair completed event
        this.emit('repairCompleted', {
          console: this,
          x: this.x,
          y: this.y
        });
      }
    }
  }

  /**
   * Check if console can be upgraded
   * @returns {boolean} True if console can be upgraded
   */
  canUpgrade() {
    return this.tier < 3; // Maximum tier is 3
  }

  /**
   * Get upgrade cost for next tier
   * @returns {number} Cost to upgrade to next tier, or 0 if max tier
   */
  getUpgradeCost() {
    if (!this.canUpgrade()) return 0;
    
    const nextTier = this.tier + 1;
    const nextTierMultiplier = TIER_MULTIPLIERS[nextTier];
    return Math.floor(this.baseCost * nextTierMultiplier.cost) - this.cost;
  }

  /**
   * Upgrade console to next tier
   * @returns {boolean} True if upgrade was successful
   */
  upgrade() {
    if (!this.canUpgrade()) return false;
    
    const oldTier = this.tier;
    this.tier++;
    
    // Recalculate stats with new tier
    const config = CONSOLE_TYPES[this.type];
    const tierMultiplier = TIER_MULTIPLIERS[this.tier];
    
    const oldMaxDurability = this.maxDurability;
    const durabilityRatio = this.durability / oldMaxDurability;
    
    // Update stats
    this.cost = Math.floor(config.cost * tierMultiplier.cost);
    this.revenue = Math.floor(config.revenue * tierMultiplier.revenue);
    this.maxDurability = Math.floor(config.maxDurability * tierMultiplier.durability);
    this.repairTime = Math.floor(config.repairTime * tierMultiplier.repair);
    this.appeal = Math.floor(config.appeal * tierMultiplier.appeal);
    
    // Maintain durability ratio
    this.durability = Math.floor(this.maxDurability * durabilityRatio);
    
    // Emit upgrade event
    this.emit('upgraded', {
      console: this,
      oldTier,
      newTier: this.tier,
      x: this.x,
      y: this.y
    });
    
    return true;
  }

  /**
   * Get tier display name
   * @returns {string} Human-readable tier name
   */
  getTierName() {
    switch (this.tier) {
      case 1: return 'Basic';
      case 2: return 'Enhanced';
      case 3: return 'Premium';
      default: return 'Unknown';
    }
  }

  /**
   * Check if this console appeals to a specific guest type
   * @param {string} guestType - Guest type to check
   * @returns {boolean} True if console appeals to this guest type
   */
  appealsToGuestType(guestType) {
    return this.guestTypes.includes(guestType);
  }

  /**
   * Get appeal modifier for a specific guest type
   * @param {string} guestType - Guest type to check
   * @returns {number} Appeal multiplier (1.0 = normal, 1.5 = high appeal)
   */
  getAppealModifier(guestType) {
    if (this.appealsToGuestType(guestType)) {
      return 1.5; // 50% bonus appeal for matching guest types
    }
    return 1.0; // Normal appeal for non-matching types
  }

  /**
   * Calculate revenue from guest interaction
   * @param {Object} guest - Guest object with satisfaction property
   * @returns {number} Revenue amount in pounds
   */
  calculateRevenue(guest) {
    let baseRevenue = this.revenue;
    
    if (guest.satisfaction < 0) {
      return 0; // Angry guests pay nothing
    } else if (guest.satisfaction < 5) {
      baseRevenue = Math.floor(this.revenue / 2); // Neutral guests pay half
    }
    // Happy guests pay full revenue
    
    // Apply bonus revenue based on guest type compatibility
    let totalRevenue = baseRevenue;
    if (guest.satisfaction >= 5 && guest.type && this.guestTypes.includes(guest.type)) {
      totalRevenue += this.bonusRevenue;
    }
    
    return totalRevenue;
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
   * Get console type color for visual distinction
   * @returns {string} Color hex code for console type
   */
  getTypeColor() {
    switch (this.type) {
      case 'retro-arcade':
        return '#8B4513'; // Brown (retro look)
      case 'classic-home':
        return '#4682B4'; // Steel blue (classic look)
      case 'modern-gaming':
        return '#2F4F4F'; // Dark slate gray (modern look)
      case 'vr-experience':
        return '#9932CC'; // Dark orchid (futuristic look)
      default:
        return '#666666'; // Gray
    }
  }

  /**
   * Get tier border color for visual distinction
   * @returns {string} Color hex code for tier border
   */
  getTierBorderColor() {
    switch (this.tier) {
      case 1: return '#666666'; // Gray (basic)
      case 2: return '#FFD700'; // Gold (enhanced)
      case 3: return '#FF1493'; // Deep pink (premium)
      default: return '#666666'; // Gray
    }
  }

  /**
   * Draw a star shape for tier indication
   * @param {RenderSystem} renderer - The render system
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} size - Star size
   * @param {string} color - Star color
   */
  drawStar(renderer, x, y, size, color) {
    // Simple star using text character for now (easier than drawing paths)
    renderer.drawText(
      '★',
      x,
      y,
      {
        font: `${size * 2}px Arial`,
        color: color,
        align: 'center',
        stroke: true,
        strokeColor: '#000000',
        strokeWidth: 1
      }
    );
  }

  /**
   * Render the console
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    super.render(renderer);
    
    const transform = this.getComponent('Transform');
    if (!transform) return;
    
    // Try sprite rendering first, then fallback to vector graphics
    let usedSprite = false;
    if (renderer.drawConsole) {
      usedSprite = renderer.drawConsole(this);
    }
    
    if (!usedSprite) {
      // Legacy vector rendering fallback
      const statusColor = this.getStatusColor();
      const typeColor = this.getTypeColor();
      const tierBorderColor = this.getTierBorderColor();
      
      // Draw console base with type-specific color
      renderer.drawRect(
        transform.x - 30,
        transform.y - 20,
        60,
        40,
        typeColor
      );
      
      // Draw status overlay with transparency
      renderer.drawRect(
        transform.x - 30,
        transform.y - 20,
        60,
        40,
        statusColor,
        false
      );
      
      // Draw tier-based border
      const borderWidth = this.tier; // Thicker border for higher tiers
      renderer.drawRect(
        transform.x - 32,
        transform.y - 22,
        64,
        44,
        tierBorderColor,
        true // stroke only
      );
    }
    
    // Draw upgrade stars for tiers 2 and 3
    if (this.tier > 1) {
      for (let i = 0; i < this.tier - 1; i++) {
        const starX = transform.x - 25 + (i * 12);
        const starY = transform.y - 30;
        this.drawStar(renderer, starX, starY, 4, tierBorderColor);
      }
    }
    
    // Draw console type and tier label
    const typeLabel = this.type.split('-')[0].toUpperCase();
    const tierLabel = this.tier > 1 ? ` T${this.tier}` : '';
    const fullLabel = typeLabel + tierLabel;
    
    renderer.drawText(
      fullLabel,
      transform.x,
      transform.y - 5,
      {
        font: '12px Arial',
        color: '#FFFFFF',
        align: 'center',
        stroke: true,
        strokeColor: '#000000',
        strokeWidth: 1
      }
    );
    
    // Draw durability bar
    const barWidth = 50;
    const barHeight = 4;
    const barX = transform.x - barWidth / 2;
    const barY = transform.y + 15;
    
    // Background bar
    renderer.drawRect(barX, barY, barWidth, barHeight, '#333333');
    
    // Durability bar
    const durabilityRatio = this.durability / this.maxDurability;
    const durabilityColor = durabilityRatio > 0.5 ? '#00FF00' : durabilityRatio > 0.2 ? '#FFFF00' : '#FF0000';
    renderer.drawRect(barX, barY, barWidth * durabilityRatio, barHeight, durabilityColor);
    
    // Draw repair progress if under repair
    if (this.state === 'under-repair') {
      const progress = this.getRepairProgress();
      const progressBarY = transform.y + 25;
      
      // Progress background
      renderer.drawRect(barX, progressBarY, barWidth, barHeight, '#333333');
      
      // Progress bar
      renderer.drawRect(barX, progressBarY, barWidth * progress, barHeight, '#00FFFF');
      
      // Progress text
      renderer.drawText(
        'REPAIRING...',
        transform.x,
        transform.y + 35,
        {
          font: '10px Arial',
          color: '#FFFF00',
          align: 'center'
        }
      );
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
    const targetRepairTime = this.effectiveRepairTime || this.repairTime;
    return Math.min(elapsed / targetRepairTime, 1);
  }

  /**
   * Add guest to queue
   * @param {Guest} guest - Guest to add to queue
   * @returns {number} Queue position of the guest
   */
  addToQueue(guest) {
    if (!this.queue.includes(guest)) {
      this.queue.push(guest);
      const position = this.queue.length - 1;
      guest.joinQueue(this, position);
      return position;
    }
    return guest.queuePosition;
  }

  /**
   * Remove guest from queue
   * @param {Guest} guest - Guest to remove from queue
   */
  removeFromQueue(guest) {
    const index = this.queue.indexOf(guest);
    if (index > -1) {
      this.queue.splice(index, 1);
      guest.leaveQueue();
      
      // Update positions for remaining guests in queue
      this.updateQueuePositions();
    }
  }

  /**
   * Update queue positions for all guests after a guest leaves
   */
  updateQueuePositions() {
    this.queue.forEach((guest, index) => {
      guest.updateQueuePosition(index);
    });
  }

  /**
   * Get next guest in queue
   * @returns {Guest|null} Next guest in queue or null if queue is empty
   */
  getNextInQueue() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /**
   * Get queue length
   * @returns {number} Number of guests in queue
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * Check if console has a queue
   * @returns {boolean} True if there are guests waiting
   */
  hasQueue() {
    return this.queue.length > 0;
  }

  /**
   * Get total demand (active users + queue)
   * @returns {number} Total demand for this console
   */
  getTotalDemand() {
    return this.currentUsers.length + this.queue.length;
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