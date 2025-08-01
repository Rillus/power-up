/**
 * Queue Management System for realistic guest queuing behavior
 * @class
 */
export class QueueManager {
  /**
   * Create queue manager
   * @param {Game} game - Game instance
   */
  constructor(game) {
    this.game = game;
    
    // Queue behavior settings
    this.maxQueueLength = 4; // Maximum guests per queue
    this.queueToleranceTime = 30000; // 30 seconds max wait time before leaving
    this.queueJoinDistance = 100; // Distance within which guests will join queue
  }

  /**
   * Update queue management system
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Process queue joining for seeking guests
    this.processQueueJoining();
    
    // Process queue advancement when consoles become available
    this.processQueueAdvancement();
    
    // Process queue abandonment for impatient guests
    this.processQueueAbandonment();
    
    // Update queue positions and movement
    this.updateQueueMovement();
  }

  /**
   * Process guests joining queues
   * @private
   */
  processQueueJoining() {
    const seekingGuests = this.game.guests.filter(guest => guest.state === 'seeking');
    
    seekingGuests.forEach(guest => {
      const bestConsoleOption = this.findBestQueueOption(guest);
      
      if (bestConsoleOption && this.shouldJoinQueue(guest, bestConsoleOption.console)) {
        // Join the queue for the best console
        bestConsoleOption.console.addToQueue(guest);
        
        console.log(`${guest.type} guest joined queue for ${bestConsoleOption.console.type} (position ${guest.queuePosition})`);
      }
    });
  }

  /**
   * Find the best queue option for a guest
   * @param {Guest} guest - Guest looking for console
   * @returns {Object|null} Object with console and score, or null if no good options
   * @private
   */
  findBestQueueOption(guest) {
    const guestPos = guest.getComponent('Transform');
    let bestOption = null;
    let bestScore = -1;

    this.game.consoles.forEach(gameConsole => {
      if (!gameConsole.isOperational()) return; // Skip broken consoles
      if (gameConsole.getQueueLength() >= this.maxQueueLength) return; // Skip full queues

      const consolePos = gameConsole.getComponent('Transform');
      const distance = guestPos.distanceTo(consolePos);
      
      if (distance > this.queueJoinDistance) return; // Too far away

      // Calculate queue attractiveness score
      const score = this.calculateQueueScore(guest, gameConsole, distance);
      
      if (score > bestScore) {
        bestScore = score;
        bestOption = { console: gameConsole, score };
      }
    });

    return bestOption;
  }

  /**
   * Calculate how attractive a queue is for a guest
   * @param {Guest} guest - Guest considering the queue
   * @param {GameConsole} console - Console with the queue
   * @param {number} distance - Distance to console
   * @returns {number} Attractiveness score (higher is better)
   * @private
   */
  calculateQueueScore(guest, console, distance) {
    let score = 0;
    
    // Base appeal of the console
    score += console.appeal;
    
    // Console type preference bonus
    if (guest.prefersConsoleType(console.type)) {
      score += 5;
    }
    
    // Distance penalty (closer is better)
    score -= distance / 20;
    
    // Queue length penalty (shorter queues are better)
    score -= console.getQueueLength() * 2;
    
    // Console availability bonus (if console is free, big bonus)
    if (!console.isInUse()) {
      score += 8;
    }
    
    // Guest type specific adjustments
    if (guest.type === 'enthusiast') {
      // Enthusiasts prefer high-tech consoles and shorter queues
      if (console.type === 'vr-experience' || console.type === 'modern-gaming') {
        score += 3;
      }
      score -= console.getQueueLength() * 3; // Extra penalty for waiting
    } else if (guest.type === 'family') {
      // Families are more patient and prefer family-friendly consoles
      if (console.type === 'classic-home' || console.type === 'retro-arcade') {
        score += 2;
      }
      score -= console.getQueueLength() * 1; // Less penalty for waiting
    }
    
    return score;
  }

  /**
   * Check if a guest should join a specific queue
   * @param {Guest} guest - Guest considering joining
   * @param {GameConsole} console - Console to potentially queue for
   * @returns {boolean} True if guest should join queue
   * @private
   */
  shouldJoinQueue(guest, console) {
    // Don't join if console is broken
    if (!console.isOperational()) return false;
    
    // Don't join if queue is full
    if (console.getQueueLength() >= this.maxQueueLength) return false;
    
    // Don't join if already in a queue
    if (guest.state === 'waiting') return false;
    
    // Enthusiasts are less likely to join long queues
    if (guest.type === 'enthusiast' && console.getQueueLength() > 1) {
      return Math.random() < 0.3; // 30% chance
    }
    
    // Families are more willing to wait
    if (guest.type === 'family') {
      return Math.random() < 0.8; // 80% chance
    }
    
    // Casual guests have moderate tolerance
    return Math.random() < 0.6; // 60% chance
  }

  /**
   * Process guests advancing in queues when consoles become available
   * @private
   */
  processQueueAdvancement() {
    this.game.consoles.forEach(gameConsole => {
      if (gameConsole.hasQueue() && !gameConsole.isInUse() && gameConsole.isOperational()) {
        const nextGuest = gameConsole.getNextInQueue();
        
        if (nextGuest && nextGuest.canStartUsingConsole()) {
          // Remove from queue and start using console
          gameConsole.removeFromQueue(nextGuest);
          
          try {
            nextGuest.startUsingConsole(gameConsole);
            console.log(`Guest advanced from queue to use ${gameConsole.type} console`);
          } catch (error) {
            console.log(`Failed to advance guest from queue: ${error.message}`);
          }
        }
      }
    });
  }

  /**
   * Process guests abandoning queues due to impatience
   * @private
   */
  processQueueAbandonment() {
    this.game.guests.forEach(guest => {
      if (guest.state === 'waiting') {
        const waitingTime = guest.getWaitingTime();
        const shouldAbandon = this.shouldAbandonQueue(guest, waitingTime);
        
        if (shouldAbandon) {
          // Remove from queue and either seek elsewhere or leave angry
          if (guest.queuedConsole) {
            guest.queuedConsole.removeFromQueue(guest);
          }
          
          // Reduce satisfaction due to long wait
          guest.satisfaction -= 2;
          
          if (guest.satisfaction <= 0) {
            guest.state = 'angry';
            guest.targetX = 0;
            guest.targetY = 400;
            console.log(`${guest.type} guest became angry after abandoning queue`);
          } else {
            guest.state = 'seeking';
            console.log(`${guest.type} guest abandoned queue, seeking elsewhere`);
          }
        }
      }
    });
  }

  /**
   * Check if a guest should abandon their current queue
   * @param {Guest} guest - Guest in queue
   * @param {number} waitingTime - Time spent waiting in milliseconds
   * @returns {boolean} True if guest should abandon queue
   * @private
   */
  shouldAbandonQueue(guest, waitingTime) {
    // Base tolerance varies by guest type
    let toleranceTime = this.queueToleranceTime;
    
    if (guest.type === 'enthusiast') {
      toleranceTime = 15000; // 15 seconds - very impatient
    } else if (guest.type === 'family') {
      toleranceTime = 45000; // 45 seconds - very patient
    } else if (guest.type === 'tourist') {
      toleranceTime = 25000; // 25 seconds - moderate patience
    }
    
    // Check if waiting time exceeds tolerance
    if (waitingTime > toleranceTime) {
      return true;
    }
    
    // Random chance to abandon based on guest type and queue position
    const abandonChance = this.getAbandonChance(guest);
    return Math.random() < abandonChance;
  }

  /**
   * Get the chance a guest will abandon their queue per update
   * @param {Guest} guest - Guest in queue
   * @returns {number} Abandon chance (0-1)
   * @private
   */
  getAbandonChance(guest) {
    let baseChance = 0.0005; // 0.05% chance per update
    
    // Increase chance based on queue position (back of queue more likely to leave)
    baseChance += guest.queuePosition * 0.0002;
    
    // Increase chance based on waiting time
    const waitingTime = guest.getWaitingTime();
    baseChance += waitingTime / 200000; // Increases over time more slowly
    
    // Guest type modifiers
    if (guest.type === 'enthusiast') {
      baseChance *= 2.5; // Much more likely to abandon
    } else if (guest.type === 'family') {
      baseChance *= 0.6; // Less likely to abandon
    }
    
    return Math.min(baseChance, 0.015); // Cap at 1.5% chance per update
  }

  /**
   * Update queue movement for visual smoothness
   * @private
   */
  updateQueueMovement() {
    this.game.guests.forEach(guest => {
      if (guest.state === 'waiting') {
        // Ensure guests move smoothly to their queue positions
        guest.moveToQueuePosition();
      }
    });
  }

  /**
   * Get queue visualization data for debugging
   * @returns {Object} Queue visualization data
   */
  getVisualizationData() {
    const queueData = {};
    
    this.game.consoles.forEach((gameConsole, index) => {
      const consolePos = gameConsole.getComponent('Transform');
      queueData[`console_${index}`] = {
        position: { x: consolePos.x, y: consolePos.y },
        type: gameConsole.type,
        queueLength: gameConsole.getQueueLength(),
        queue: gameConsole.queue.map(guest => ({
          type: guest.type,
          queuePosition: guest.queuePosition,
          waitingTime: guest.getWaitingTime(),
          satisfaction: guest.satisfaction
        }))
      };
    });
    
    return queueData;
  }
}