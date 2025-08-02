import { Entity } from '../engine/Entity.js';
import { Transform } from '../components/Transform.js';

/**
 * Guest type configuration data
 */
const GUEST_TYPES = {
  'casual': {
    patience: 25000, // 25 seconds - baseline
    satisfaction: 5, // Neutral starting point
    money: 4, // Base spending
    speed: 50, // Normal walking speed
    useTime: 8000, // 8 seconds using console
    appeal_threshold: 2, // Easy to please
    groupSize: 1, // Solo visitors
    preferredConsoles: ['retro-arcade'], // Prefers simple games
    description: 'Solo visitors who enjoy simple games'
  },
  'family': {
    patience: 45000, // 45 seconds - VERY patient (Phase 2 requirement)
    satisfaction: 6, // Slightly positive starting mood
    money: 6, // Moderate spending (Phase 2 requirement)
    speed: 35, // Slower (families with kids move slower)
    useTime: 15000, // 15 seconds - longer sessions (families spend more time)
    appeal_threshold: 3, // Moderate standards
    groupSize: 3, // Families come in groups of 3
    preferredConsoles: ['classic-home', 'retro-arcade'], // Family-friendly consoles
    description: 'Patient families with moderate spending who prefer family-friendly games'
  },
  'enthusiast': {
    patience: 15000, // 15 seconds - IMPATIENT (Phase 2 requirement)
    satisfaction: 4, // Lower starting satisfaction (high expectations)
    money: 12, // HIGH spending (Phase 2 requirement)  
    speed: 75, // Fast movement (enthusiasts are eager)
    useTime: 20000, // 20 seconds - very long sessions (deep engagement)
    appeal_threshold: 6, // High standards for console quality
    groupSize: 1, // Usually solo, focused visitors
    preferredConsoles: ['modern-gaming', 'vr-experience'], // High-tech consoles
    description: 'Impatient gaming enthusiasts with high spending and expectations'
  },
  'tourist': {
    patience: 35000, // 35 seconds - moderate patience
    satisfaction: 5, // Neutral, here for the experience
    money: 3, // Low spending (budget conscious)
    speed: 40, // Slow, looking around
    useTime: 6000, // 6 seconds - quick try and move on
    appeal_threshold: 1, // Low standards, just want to try things
    groupSize: 2, // Small tourist groups
    preferredConsoles: ['retro-arcade'], // Nostalgic appeal
    description: 'Budget-conscious tourists looking for a quick gaming experience'
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
    this.radius = 8; // Guest radius for collision and fallback rendering
    
    // Get base stats from configuration
    const config = GUEST_TYPES[type];
    this.patience = config.patience;
    this.satisfaction = config.satisfaction;
    this.money = config.money;
    this.speed = config.speed;
    this.useTime = config.useTime;
    this.appealThreshold = config.appeal_threshold;
    this.groupSize = config.groupSize || 1;
    this.preferredConsoles = config.preferredConsoles || [];
    this.description = config.description;
    
    // Current state
    this.state = 'seeking'; // seeking, waiting, using, leaving, angry
    this.arrivalTime = Date.now();
    this.currentConsole = null;
    this.useStartTime = null;
    this.lastConsoleType = null;
    this.hasPaid = false;
    
    // Queue behavior
    this.queuePosition = -1; // Position in queue (-1 = not in queue)
    this.queuedConsole = null; // Console this guest is queuing for
    this.waitStartTime = null; // When guest started waiting in queue
    
    // Movement
    this.targetX = x;
    this.targetY = y;
    
    // Pathfinding
    this.pathfinding = null; // Will be set by game when pathfinding is available
    this.currentPath = null; // Current path being followed
    this.currentWaypointIndex = 0; // Current waypoint in path
    this.pathfindingTarget = null; // Final destination for pathfinding
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
      this.setPathfindingTarget(0, 400); // Move towards exit
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
   * @throws {Error} When guest is not seeking or console is occupied
   */
  startUsingConsole(console) {
    if (this.state !== 'seeking') {
      throw new Error('Guest is not seeking a console');
    }
    
    // Try to add this guest as a user of the console
    if (!console.addUser(this)) {
      throw new Error('Console is already occupied or not operational');
    }
    
    this.state = 'using';
    this.currentConsole = console;
    this.useStartTime = Date.now();
    
    // Apply satisfaction modifier based on console compatibility and guest type
    const compatibilityModifier = this.getConsoleCompatibilityModifier(console);
    this.satisfaction += compatibilityModifier;
    
    // Ensure satisfaction stays within bounds
    this.satisfaction = Math.max(-5, Math.min(10, this.satisfaction));
    
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
          this.currentConsole.removeUser(this); // Remove guest from console
          this.currentConsole.finishUse();
        }
        
        this.state = 'leaving';
        this.currentConsole = null;
        this.useStartTime = null;
        
        // Set exit target
        this.setPathfindingTarget(0, 400);
      }
    }
  }



  /**
   * Update movement towards target with collision avoidance
   * @param {number} deltaTime - Time elapsed in milliseconds
   */
  updateMovement(deltaTime) {
    // Update pathfinding waypoints first
    this.updatePathfinding();
    
    const transform = this.getComponent('Transform');
    let dx = this.targetX - transform.x;
    let dy = this.targetY - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) { // Moving threshold
      // Normalize direction
      let directionX = dx / distance;
      let directionY = dy / distance;
      
      // Apply collision avoidance with nearby guests
      if (this.nearbyGuests && this.nearbyGuests.length > 0) {
        const avoidanceForce = this.calculateAvoidanceForce();
        directionX += avoidanceForce.x * 0.4; // Weight avoidance at 40% of movement
        directionY += avoidanceForce.y * 0.4;
        
        // Normalize direction after adding avoidance
        const normalizedLength = Math.sqrt(directionX * directionX + directionY * directionY);
        if (normalizedLength > 0) {
          directionX /= normalizedLength;
          directionY /= normalizedLength;
        }
      }
      
      const moveDistance = this.speed * (deltaTime / 1000);
      const newX = transform.x + directionX * moveDistance;
      const newY = transform.y + directionY * moveDistance;
      
      transform.setPosition(newX, newY);
    }
  }

  /**
   * Calculate avoidance force to prevent overlapping with nearby guests
   * @returns {Object} Avoidance force vector {x, y}
   */
  calculateAvoidanceForce() {
    if (!this.nearbyGuests || this.nearbyGuests.length === 0) {
      return { x: 0, y: 0 };
    }

    const transform = this.getComponent('Transform');
    let avoidX = 0;
    let avoidY = 0;
    const avoidanceRadius = 30; // Minimum distance to maintain from other guests

    this.nearbyGuests.forEach(otherGuest => {
      if (otherGuest === this || otherGuest.state === 'using') return; // Don't avoid guests using consoles

      const otherTransform = otherGuest.getComponent('Transform');
      const dx = transform.x - otherTransform.x;
      const dy = transform.y - otherTransform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < avoidanceRadius && distance > 0) {
        // Calculate repulsion force (stronger when closer)
        const force = (avoidanceRadius - distance) / avoidanceRadius;
        avoidX += (dx / distance) * force;
        avoidY += (dy / distance) * force;
      }
    });

    return { x: avoidX, y: avoidY };
  }

  /**
   * Set nearby guests for collision avoidance
   * @param {Array} guests - Array of nearby guest entities
   */
  setNearbyGuests(guests) {
    this.nearbyGuests = guests;
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
   * Set pathfinding target (uses pathfinding if available, otherwise direct movement)
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   */
  setPathfindingTarget(x, y) {
    this.pathfindingTarget = { x, y };
    
    if (this.pathfinding) {
      const transform = this.getComponent('Transform');
      const path = this.pathfinding.findPath(transform.x, transform.y, x, y);
      
      if (path && path.length > 1) {
        // Use pathfinding - simplify the path and start following it
        this.currentPath = this.pathfinding.simplifyPath(path);
        this.currentWaypointIndex = 1; // Skip first waypoint (current position)
        
        // Set immediate target to next waypoint
        if (this.currentWaypointIndex < this.currentPath.length) {
          const nextWaypoint = this.currentPath[this.currentWaypointIndex];
          this.targetX = nextWaypoint.x;
          this.targetY = nextWaypoint.y;
        }
      } else {
        // Pathfinding failed, fall back to direct movement
        this.currentPath = null;
        this.targetX = x;
        this.targetY = y;
      }
    } else {
      // No pathfinding available, use direct movement
      this.currentPath = null;
      this.targetX = x;
      this.targetY = y;
    }
  }

  /**
   * Update pathfinding waypoint progression
   * @private
   */
  updatePathfinding() {
    if (!this.currentPath || this.currentWaypointIndex >= this.currentPath.length) {
      return;
    }

    const transform = this.getComponent('Transform');
    const currentWaypoint = this.currentPath[this.currentWaypointIndex];
    const dx = currentWaypoint.x - transform.x;
    const dy = currentWaypoint.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If we're close to the current waypoint, move to the next one
    if (distance < 15) {
      this.currentWaypointIndex++;
      
      if (this.currentWaypointIndex < this.currentPath.length) {
        const nextWaypoint = this.currentPath[this.currentWaypointIndex];
        this.targetX = nextWaypoint.x;
        this.targetY = nextWaypoint.y;
      } else {
        // Reached final destination
        this.currentPath = null;
        this.currentWaypointIndex = 0;
        
        // Set final target if we have one
        if (this.pathfindingTarget) {
          this.targetX = this.pathfindingTarget.x;
          this.targetY = this.pathfindingTarget.y;
        }
      }
    }
  }

  /**
   * Check if guest prefers a specific console type
   * @param {string} consoleType - Console type to check
   * @returns {boolean} True if guest prefers this console type
   */
  prefersConsoleType(consoleType) {
    return this.preferredConsoles.includes(consoleType);
  }

  /**
   * Get satisfaction modifier based on console compatibility
   * @param {Object} console - Console object
   * @returns {number} Satisfaction modifier (-2 to +3)
   */
  getConsoleCompatibilityModifier(console) {
    let modifier = 0;
    
    // Prefer specific console types
    if (this.prefersConsoleType(console.type)) {
      modifier += 2; // +2 satisfaction for preferred console
    }
    
    // Check console appeal vs threshold
    if (console.appeal >= this.appealThreshold + 3) {
      modifier += 1; // +1 for high-quality console
    } else if (console.appeal < this.appealThreshold) {
      modifier -= 2; // -2 for low-quality console
    }
    
    // Family bonus for multi-capacity consoles
    if (this.type === 'family' && console.capacity >= 2) {
      modifier += 1; // Families like consoles that accommodate groups
    }
    
    // Enthusiast penalty for basic consoles
    if (this.type === 'enthusiast' && console.appeal < 5) {
      modifier -= 1; // Enthusiasts are disappointed by basic consoles
    }
    
    return modifier;
  }

  /**
   * Calculate payment based on satisfaction and guest type
   * @param {Object} console - Console that was used
   * @returns {number} Payment amount
   */
  calculatePayment(console) {
    if (this.state === 'angry' || this.satisfaction < 0) {
      return 0; // Angry guests pay nothing
    }
    
    let payment = this.money;
    
    // Apply satisfaction multiplier
    if (this.satisfaction >= 8) {
      payment = Math.floor(payment * 1.5); // Very happy: 150% payment
    } else if (this.satisfaction >= 6) {
      payment = Math.floor(payment * 1.2); // Happy: 120% payment
    } else if (this.satisfaction < 4) {
      payment = Math.floor(payment * 0.5); // Unhappy: 50% payment
    }
    // Neutral satisfaction (4-5): normal payment
    
    // Group size multiplier for families
    if (this.type === 'family') {
      payment = Math.floor(payment * this.groupSize * 0.8); // Families pay per person but get small discount
    }
    
    return Math.max(1, payment); // Minimum payment of £1
  }

  /**
   * Get guest type display name
   * @returns {string} Human-readable guest type name
   */
  getDisplayName() {
    switch (this.type) {
      case 'casual': return 'Casual Visitor';
      case 'family': return 'Family Group';
      case 'enthusiast': return 'Gaming Enthusiast';
      case 'tourist': return 'Tourist';
      default: return 'Guest';
    }
  }

  /**
   * Get current emotion state based on satisfaction and patience
   * @returns {string} Emotion state: 'very-happy', 'happy', 'neutral', 'unhappy', 'angry'
   */
  getEmotionState() {
    // Angry state overrides everything
    if (this.state === 'angry') {
      return 'angry';
    }
    
    // Check patience levels for additional stress
    const patienceRatio = this.getPatienceRemaining() / this.patience;
    let emotion;
    
    // Base emotion on satisfaction
    if (this.satisfaction >= 8) {
      emotion = 'very-happy';
    } else if (this.satisfaction >= 6) {
      emotion = 'happy';
    } else if (this.satisfaction >= 4) {
      emotion = 'neutral';
    } else if (this.satisfaction >= 2) {
      emotion = 'unhappy';
    } else {
      emotion = 'angry';
    }
    
    // Modify emotion based on patience (low patience makes guests more stressed)
    if (patienceRatio < 0.3) {
      // Very low patience - downgrade emotion
      if (emotion === 'very-happy') emotion = 'happy';
      else if (emotion === 'happy') emotion = 'neutral';
      else if (emotion === 'neutral') emotion = 'unhappy';
      else if (emotion === 'unhappy') emotion = 'angry';
    } else if (patienceRatio < 0.6) {
      // Moderate patience stress - slight downgrade
      if (emotion === 'very-happy') emotion = 'happy';
      else if (emotion === 'happy') emotion = 'neutral';
    }
    
    return emotion;
  }

  /**
   * Get emotion face icon for current state
   * @returns {string} Unicode emoji or ASCII face
   */
  getEmotionIcon() {
    const emotion = this.getEmotionState();
    
    switch (emotion) {
      case 'very-happy': return '😄'; // Very happy face
      case 'happy': return '😊'; // Happy face
      case 'neutral': return '😐'; // Neutral face
      case 'unhappy': return '😕'; // Unhappy face
      case 'angry': return '😠'; // Angry face
      default: return '😐';
    }
  }

  /**
   * Get emotion color for visual indicators
   * @returns {string} Color hex code for current emotion
   */
  getEmotionColor() {
    const emotion = this.getEmotionState();
    
    switch (emotion) {
      case 'very-happy': return '#00FF00'; // Bright green
      case 'happy': return '#90EE90'; // Light green
      case 'neutral': return '#FFFF00'; // Yellow
      case 'unhappy': return '#FFA500'; // Orange
      case 'angry': return '#FF0000'; // Red
      default: return '#FFFF00';
    }
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
    this.setPathfindingTarget(consoleTransform.x + 50, consoleTransform.y); // Stand beside console
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
        
      case 'waiting':
        this.updatePatience();
        this.updateMovement(deltaTime);
        // Queue advancement is handled by QueueManager
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
   * Join a queue for a specific console
   * @param {Object} console - Console to queue for
   * @param {number} position - Position in queue (0 = front)
   */
  joinQueue(console, position) {
    this.state = 'waiting';
    this.queuedConsole = console;
    this.queuePosition = position;
    this.waitStartTime = Date.now();
    
    // Move to queue position
    this.moveToQueuePosition();
  }
  
  /**
   * Leave the current queue
   */
  leaveQueue() {
    if (this.state === 'waiting') {
      this.state = 'seeking';
      this.queuedConsole = null;
      this.queuePosition = -1;
      this.waitStartTime = null;
    }
  }
  
  /**
   * Update queue position when other guests leave
   * @param {number} newPosition - New position in queue
   */
  updateQueuePosition(newPosition) {
    if (this.state === 'waiting' && this.queuePosition !== -1) {
      this.queuePosition = newPosition;
      this.moveToQueuePosition();
    }
  }
  
  /**
   * Calculate queue position coordinates
   * @returns {Object} Object with x and y coordinates for queue position
   */
  getQueuePositionCoords() {
    if (!this.queuedConsole || this.queuePosition === -1) {
      return null;
    }
    
    const consoleTransform = this.queuedConsole.getComponent('Transform');
    const queueSpacing = 40; // Distance between guests in queue
    const queueOffset = 80; // Distance from console to start of queue
    
    // Queue forms to the left of the console
    const queueX = consoleTransform.x - queueOffset - (this.queuePosition * queueSpacing);
    const queueY = consoleTransform.y;
    
    return { x: queueX, y: queueY };
  }
  
  /**
   * Move to appropriate queue position
   */
  moveToQueuePosition() {
    const queueCoords = this.getQueuePositionCoords();
    if (queueCoords) {
      this.setPathfindingTarget(queueCoords.x, queueCoords.y);
    }
  }
  
  /**
   * Check if guest is at the front of the queue and console is available
   * @returns {boolean} True if guest can start using console
   */
  canStartUsingConsole() {
    return this.state === 'waiting' && 
           this.queuePosition === 0 && 
           this.queuedConsole && 
           this.queuedConsole.isOperational() &&
           !this.queuedConsole.isInUse();
  }
  
  /**
   * Get waiting time in queue
   * @returns {number} Time spent waiting in milliseconds
   */
  getWaitingTime() {
    if (this.waitStartTime) {
      return Date.now() - this.waitStartTime;
    }
    return 0;
  }

  /**
   * Check if guest should be removed from the game
   * @returns {boolean} True if guest has left the building
   */
  shouldRemove() {
    const transform = this.getComponent('Transform');
    return (this.state === 'leaving' || this.state === 'angry') && transform.x <= 0;
  }

  /**
   * Render the guest
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    super.render(renderer);
    
    const transform = this.getComponent('Transform');
    if (!transform) return;
    
    // Try sprite rendering first, then fallback to vector graphics
    let usedSprite = false;
    if (renderer.drawGuest) {
      usedSprite = renderer.drawGuest(this);
    }
    
    // Always draw emotion overlay on top of sprite or fallback
    if (usedSprite) {
      // Draw emotion overlay on sprite
      const emotionIcon = this.getEmotionIcon();
      const emotionColor = this.getEmotionColor();
      
      // Draw colored background circle for the emotion
      renderer.drawCircle(
        transform.x,
        transform.y - 10, // Adjust position for sprite
        7,
        emotionColor,
        false
      );
      
      // Draw the smiley face ON TOP
      renderer.drawText(
        emotionIcon,
        transform.x,
        transform.y - 10,
        {
          font: '14px Arial',
          color: '#000000',
          align: 'center',
          stroke: true,
          strokeColor: '#FFFFFF',
          strokeWidth: 1
        }
      );
    } else {
      // Legacy vector rendering fallback
      const colors = this.getGuestColors();
      
      // Draw guest body (rectangle)
      renderer.drawRect(
        transform.x - 8,
        transform.y - 12,
        16,
        24,
        colors.body
      );
      
      // Draw guest head (circle) - this will be the background for the face
      renderer.drawCircle(
        transform.x,
        transform.y - 16,
        6,
        colors.head
      );
      
      // Draw emotion face icon ON the head (as the face)
      const emotionIcon = this.getEmotionIcon();
      const emotionColor = this.getEmotionColor();
      
      // Draw colored background circle for the emotion (slightly larger than head)
      renderer.drawCircle(
        transform.x,
        transform.y - 16,
        7,
        emotionColor,
        false
      );
      
      // Draw the smiley face ON TOP of the head
      renderer.drawText(
        emotionIcon,
        transform.x,
        transform.y - 16,
        {
          font: '14px Arial',
          color: '#000000', // Black face
          align: 'center',
          stroke: true,
          strokeColor: '#FFFFFF',
          strokeWidth: 1
        }
      );
    }
    
    // Draw patience bar for seeking/waiting guests (not using/leaving)
    if (this.state === 'seeking' || this.state === 'waiting') {
      const patienceRatio = this.getPatienceRemaining() / this.patience;
      const barWidth = 12;
      const barHeight = 2;
      const barX = transform.x - barWidth / 2;
      const barY = transform.y - 35;
      
      // Background bar
      renderer.drawRect(barX, barY, barWidth, barHeight, '#333333');
      
      // Patience bar (color based on patience level)
      const patienceColor = patienceRatio > 0.5 ? '#00FF00' : 
                           patienceRatio > 0.2 ? '#FFFF00' : '#FF0000';
      renderer.drawRect(barX, barY, barWidth * patienceRatio, barHeight, patienceColor);
    }
    
    // Draw guest type indicator (small text)
    renderer.drawText(
      this.type[0].toUpperCase(),
      transform.x,
      transform.y + 15,
      {
        font: '8px Arial',
        color: '#666666',
        align: 'center'
      }
    );
  }

  /**
   * Get colors for guest rendering based on type and state
   * @returns {Object} Object with body and head colors
   * @private
   */
  getGuestColors() {
    // Base colors by guest type
    const typeColors = {
      'casual': { body: '#4CAF50', head: '#FFC107' },      // Green body, yellow head
      'enthusiast': { body: '#2196F3', head: '#FF9800' },  // Blue body, orange head
      'impatient': { body: '#FF5722', head: '#FFEB3B' },   // Red body, bright yellow head
      'collector': { body: '#9C27B0', head: '#E91E63' }    // Purple body, pink head
    };
    
    let colors = typeColors[this.type] || typeColors['casual'];
    
    // Modify colors based on state
    if (this.state === 'angry') {
      colors = { body: '#B71C1C', head: '#D32F2F' }; // Dark red when angry
    } else if (this.state === 'using') {
      // Slightly brighter when using console
      colors = {
        body: this.lightenColor(colors.body),
        head: colors.head
      };
    }
    
    return colors;
  }

  /**
   * Lighten a hex color
   * @param {string} color - Hex color string
   * @returns {string} Lightened hex color
   * @private
   */
  lightenColor(color) {
    // Simple color lightening - could be more sophisticated
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + 30);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + 30);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + 30);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

}