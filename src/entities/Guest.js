import { Entity } from '../engine/Entity.js';
import { Transform } from '../components/Transform.js';

/**
 * Guest type configuration data
 */
const GUEST_TYPES = {
  'casual': {
    patience: 30000, // 30 seconds
    satisfaction: 5, // Neutral
    money: 5,
    speed: 50, // pixels per second
    useTime: 8000, // 8 seconds using console
    appeal_threshold: 2 // Minimum console appeal to be satisfied
  },
  'enthusiast': {
    patience: 45000, // 45 seconds
    satisfaction: 7, // Positive
    money: 8,
    speed: 60,
    useTime: 12000, // 12 seconds using console
    appeal_threshold: 5 // Higher standards
  },
  'impatient': {
    patience: 15000, // 15 seconds
    satisfaction: 3, // Slightly negative
    money: 3,
    speed: 80,
    useTime: 5000, // 5 seconds using console
    appeal_threshold: 1 // Low standards
  },
  'collector': {
    patience: 60000, // 60 seconds
    satisfaction: 8, // Very positive
    money: 12,
    speed: 40,
    useTime: 20000, // 20 seconds using console
    appeal_threshold: 7 // Very high standards
  }
};

/**
 * Guest entity that visits the gaming exhibition
 * @class
 * @extends Entity
 */
export class Guest extends Entity {
  /**
   * Create a guest
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels
   * @param {string} type - Guest type identifier
   */
  constructor(x, y, type) {
    super(x, y);
    
    // Validate guest type
    if (!GUEST_TYPES[type]) {
      throw new Error(`Invalid guest type: ${type}`);
    }
    
    // Add Transform component
    this.addComponent(new Transform(this, x, y));
    
    // Guest properties
    this.type = type;
    
    // Get base stats from configuration
    const config = GUEST_TYPES[type];
    this.patience = config.patience;
    this.satisfaction = config.satisfaction;
    this.money = config.money;
    this.speed = config.speed;
    this.useTime = config.useTime;
    this.appealThreshold = config.appeal_threshold;
    
    // Current state
    this.state = 'seeking'; // seeking, using, leaving, angry
    this.arrivalTime = Date.now();
    this.currentConsole = null;
    this.useStartTime = null;
    this.lastConsoleType = null;
    this.hasPaid = false;
    
    // Movement
    this.targetX = x;
    this.targetY = y;
  }

  /**
   * Get remaining patience in milliseconds
   * @returns {number} Patience remaining
   */
  getPatienceRemaining() {
    const elapsed = Date.now() - this.arrivalTime;
    return Math.max(0, this.patience - elapsed);
  }

  /**
   * Update patience and satisfaction based on waiting time
   */
  updatePatience() {
    const patienceRemaining = this.getPatienceRemaining();
    
    if (patienceRemaining <= 0) {
      // Guest becomes angry
      this.state = 'angry';
      this.satisfaction = -5;
      this.targetX = 0; // Move towards exit
      this.targetY = 400; // Exit position
    } else {
      // Decrease satisfaction as patience runs out
      const patienceRatio = patienceRemaining / this.patience;
      const baseConfig = GUEST_TYPES[this.type];
      
      if (patienceRatio < 0.3) { // Less than 30% patience remaining
        this.satisfaction = Math.max(-3, baseConfig.satisfaction - 3);
      } else if (patienceRatio < 0.6) { // Less than 60% patience remaining
        this.satisfaction = Math.max(1, baseConfig.satisfaction - 2);
      }
    }
  }

  /**
   * Start using a console
   * @param {Object} console - Console object to use
   * @throws {Error} When guest is not seeking
   */
  startUsingConsole(console) {
    if (this.state !== 'seeking') {
      throw new Error('Guest is not seeking a console');
    }
    
    this.state = 'using';
    this.currentConsole = console;
    this.useStartTime = Date.now();
    
    // Increase satisfaction based on console appeal
    if (console.appeal >= this.appealThreshold) {
      this.satisfaction += Math.min(3, console.appeal - this.appealThreshold + 1);
    }
    
    // Use the console
    console.use();
  }

  /**
   * Update console usage
   */
  updateConsoleUse() {
    if (this.state === 'using' && this.useStartTime) {
      const useElapsed = Date.now() - this.useStartTime;
      
      if (useElapsed >= this.useTime) {
        // Finish using console
        if (this.currentConsole) {
          this.lastConsoleType = this.currentConsole.type;
          this.currentConsole.finishUse();
        }
        
        this.state = 'leaving';
        this.currentConsole = null;
        this.useStartTime = null;
        
        // Set exit target
        this.targetX = 0;
        this.targetY = 400;
      }
    }
  }

  /**
   * Calculate payment based on satisfaction
   * @param {Object} console - Console that was used
   * @returns {number} Payment amount
   */
  calculatePayment(console) {
    // Use console's revenue calculation method if available
    if (console && console.calculateRevenue) {
      return console.calculateRevenue(this);
    }
    
    // Fallback calculation
    if (this.satisfaction < 0) {
      return 0; // Angry guests pay nothing
    } else if (this.satisfaction < 5) {
      return Math.floor(this.money / 2); // Neutral guests pay half
    } else {
      return this.money; // Happy guests pay full
    }
  }

  /**
   * Update movement towards target
   * @param {number} deltaTime - Time elapsed in milliseconds
   */
  updateMovement(deltaTime) {
    const transform = this.getComponent('Transform');
    const dx = this.targetX - transform.x;
    const dy = this.targetY - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) { // Moving threshold
      const moveDistance = this.speed * (deltaTime / 1000);
      const moveRatio = Math.min(moveDistance / distance, 1);
      
      const newX = transform.x + dx * moveRatio;
      const newY = transform.y + dy * moveRatio;
      
      transform.setPosition(newX, newY);
    }
  }

  /**
   * Check if guest is currently moving
   * @returns {boolean} True if moving towards target
   */
  isMoving() {
    const transform = this.getComponent('Transform');
    const dx = this.targetX - transform.x;
    const dy = this.targetY - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance > 5;
  }

  /**
   * Find nearest available console
   * @param {Array} consoles - Array of console objects
   * @returns {Object|null} Nearest operational console or null
   */
  findNearestConsole(consoles) {
    const transform = this.getComponent('Transform');
    const availableConsoles = consoles.filter(console => console.isOperational());
    
    if (availableConsoles.length === 0) {
      return null;
    }
    
    let nearest = null;
    let nearestDistance = Infinity;
    
    for (const console of availableConsoles) {
      const consoleTransform = console.getComponent('Transform');
      const dx = consoleTransform.x - transform.x;
      const dy = consoleTransform.y - transform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < nearestDistance) {
        nearest = console;
        nearestDistance = distance;
      }
    }
    
    return nearest;
  }

  /**
   * Set movement target to a console
   * @param {Object} console - Console to move towards
   */
  moveToConsole(console) {
    const consoleTransform = console.getComponent('Transform');
    this.targetX = consoleTransform.x + 50; // Stand beside console
    this.targetY = consoleTransform.y;
  }

  /**
   * Get status color for visual indicators
   * @returns {string} Color hex code
   */
  getStatusColor() {
    switch (this.state) {
      case 'seeking':
        return '#00ff00'; // Green
      case 'using':
        return '#0066ff'; // Blue
      case 'leaving':
        return '#888888'; // Gray
      case 'angry':
        return '#ff0000'; // Red
      default:
        return '#ffffff'; // White
    }
  }

  /**
   * Update guest state
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    super.update(deltaTime);
    
    // Update based on current state
    switch (this.state) {
      case 'seeking':
        this.updatePatience();
        this.updateMovement(deltaTime);
        break;
        
      case 'using':
        this.updateConsoleUse();
        break;
        
      case 'leaving':
      case 'angry':
        this.updateMovement(deltaTime);
        break;
    }
  }

  /**
   * Check if guest should be removed from the game
   * @returns {boolean} True if guest has left the building
   */
  shouldRemove() {
    const transform = this.getComponent('Transform');
    return (this.state === 'leaving' || this.state === 'angry') && transform.x <= 0;
  }
}