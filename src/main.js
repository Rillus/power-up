import { RenderSystem } from './engine/systems/RenderSystem.js';
import { InputSystem } from './engine/systems/InputSystem.js';
import { Entity } from './engine/Entity.js';
import { Transform } from './components/Transform.js';
import { GameConsole } from './entities/GameConsole.js';
import { Guest } from './entities/Guest.js';
import { FloatingNumber } from './entities/FloatingNumber.js';
import { ConsolePurchaseSystem } from './systems/ConsolePurchaseSystem.js';

/**
 * Main game application
 * @class
 */
class PowerUpGame {
  /**
   * Create the game instance
   */
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderSystem = new RenderSystem(this.canvas);
    this.inputSystem = new InputSystem(document); // Use document for reliable keyboard input
    this.purchaseSystem = new ConsolePurchaseSystem(this);
    
    this.entities = [];
    this.running = false;
    this.lastTime = 0;
    
    // Create player entity
    this.player = new Entity(600, 400);
    this.player.addComponent(new Transform(this.player, 600, 400));
    this.entities.push(this.player);
    
    // Create initial consoles (Phase 1: start with 2 retro arcades)
    this.consoles = [];
    this.createConsole(200, 200, 'retro-arcade');
    this.createConsole(400, 200, 'retro-arcade');
    
    // Guest management
    this.guests = [];
    this.lastGuestSpawn = 0;
    this.guestSpawnInterval = 8000; // 8 seconds between guests initially
    
    // Visual feedback
    this.floatingNumbers = [];
    
    // Game state
    this.money = 2000;
    this.day = 1;
    this.angryGuests = 0;
    this.maxAngryGuests = 3;
    this.gameOver = false;
    this.gameOverReason = null;
    
    this.init();
  }

  /**
   * Create a new console at the specified position
   * @param {number} x - X position
   * @param {number} y - Y position  
   * @param {string} type - Console type
   */
  createConsole(x, y, type) {
    const console = new GameConsole(x, y, type);
    this.consoles.push(console);
    this.entities.push(console);
    return console;
  }

  /**
   * Spawn a new guest
   */
  spawnGuest() {
    const guestTypes = ['casual', 'enthusiast', 'impatient', 'collector'];
    const randomType = guestTypes[Math.floor(Math.random() * guestTypes.length)];
    
    // Spawn at entrance (right side of screen)
    const guest = new Guest(1200, 300 + Math.random() * 200, randomType);
    
    // Set initial target near entrance
    guest.targetX = 1000;
    guest.targetY = guest.y;
    
    this.guests.push(guest);
    this.entities.push(guest);
    
    return guest;
  }

  /**
   * Create a floating number for visual feedback
   * @param {number} x - X position
   * @param {number} y - Y position  
   * @param {string} text - Text to display
   * @param {string} color - Color of the text
   * @param {number} [duration] - Duration in milliseconds
   * @param {Object} [velocity] - Movement velocity
   */
  createFloatingNumber(x, y, text, color, duration, velocity) {
    const floatingNumber = new FloatingNumber(x, y, text, color, duration, velocity);
    this.floatingNumbers.push(floatingNumber);
    this.entities.push(floatingNumber);
    return floatingNumber;
  }

  /**
   * Initialize the game
   */
  init() {
    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }

    // Make canvas focusable and focus it
    this.canvas.focus();

    console.debug('Power Up game initialized');
    this.start();
  }

  /**
   * Start the game loop
   */
  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  /**
   * Main game loop
   * @param {number} currentTime - Current timestamp
   */
  gameLoop(currentTime) {
    if (!this.running && !this.gameOver) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Continue updating floating numbers and visual effects even when game over
    if (this.gameOver) {
      // Only update floating numbers and render when game over
      this.floatingNumbers.forEach(fn => fn.update(deltaTime));
      this.floatingNumbers = this.floatingNumbers.filter(fn => {
        if (fn.shouldRemove()) {
          const entityIndex = this.entities.indexOf(fn);
          if (entityIndex > -1) {
            this.entities.splice(entityIndex, 1);
          }
          return false;
        }
        return true;
      });
    } else {
      this.update(deltaTime);
    }
    
    this.render();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * Update game logic
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Test player movement
    const movement = this.inputSystem.getMovementVector();
    const playerTransform = this.player.getComponent('Transform');
    
    if (movement.x !== 0 || movement.y !== 0) {
      const speed = 200; // pixels per second
      const moveX = movement.x * speed * (deltaTime / 1000);
      const moveY = movement.y * speed * (deltaTime / 1000);
      
      // Keep player within bounds
      const newX = Math.max(20, Math.min(1180, playerTransform.x + moveX));
      const newY = Math.max(20, Math.min(780, playerTransform.y + moveY));
      
      playerTransform.setPosition(newX, newY);
    }

    // Handle repair interaction
    if (this.inputSystem.isKeyJustPressed('Space')) {
      this.handleRepairInteraction();
    }
    
    // Handle console purchase shortcuts
    if (this.inputSystem.isKeyJustPressed('Digit1')) {
      this.purchaseSystem.startPlacement('retro-arcade');
    }
    if (this.inputSystem.isKeyJustPressed('Digit2')) {
      this.purchaseSystem.startPlacement('classic-home');
    }
    if (this.inputSystem.isKeyJustPressed('Digit3')) {
      this.purchaseSystem.startPlacement('modern-gaming');
    }
    if (this.inputSystem.isKeyJustPressed('Digit4')) {
      this.purchaseSystem.startPlacement('vr-experience');
    }
    
    // Handle purchase system interactions
    if (this.purchaseSystem.placementMode) {
      // Update preview position based on mouse or player position
      const playerTransform = this.player.getComponent('Transform');
      this.purchaseSystem.updatePreviewPosition(playerTransform.x, playerTransform.y);
      
      // Confirm placement with Enter
      if (this.inputSystem.isKeyJustPressed('Enter')) {
        this.purchaseSystem.confirmPlacement();
      }
      
      // Cancel placement with Escape
      if (this.inputSystem.isKeyJustPressed('Escape')) {
        this.purchaseSystem.cancelPlacement();
      }
    }
    
    // Guest spawning
    const currentTime = Date.now();
    if (currentTime - this.lastGuestSpawn > this.guestSpawnInterval) {
      this.spawnGuest();
      this.lastGuestSpawn = currentTime;
    }
    
    // Guest AI and console interaction
    this.updateGuestAI();
    
    // Process guest payments for those leaving (not angry)
    this.guests.forEach(guest => {
      if (guest.state === 'leaving' && guest.currentConsole === null) {
        // Guest just finished using a console and is about to leave
        // This check prevents double payment
        if (!guest.hasPaid) {
          const lastConsole = this.consoles.find(c => c.type === guest.lastConsoleType);
          if (lastConsole) {
            const payment = guest.calculatePayment(lastConsole);
            this.money += payment;
            
            // Create floating money number
            const guestTransform = guest.getComponent('Transform');
            this.createFloatingNumber(
              guestTransform.x, 
              guestTransform.y - 20, 
              `+£${payment}`, 
              '#00ff00'
            );
            
            console.debug(`Guest paid £${payment}, total: £${this.money}`);
            guest.hasPaid = true;
          }
        }
      }
    });
    
    // Remove guests that have left
    this.guests = this.guests.filter(guest => {
      if (guest.shouldRemove()) {
        // Remove from entities array
        const entityIndex = this.entities.indexOf(guest);
        if (entityIndex > -1) {
          this.entities.splice(entityIndex, 1);
        }
        
        // Track angry guests for game over condition
        if (guest.state === 'angry') {
          this.angryGuests++;
          
          // Create floating notification for angry guest
          const guestTransform = guest.getComponent('Transform');
          this.createFloatingNumber(
            guestTransform.x,
            guestTransform.y - 20,
            'ANGRY!',
            '#ff0000',
            2000
          );
        }
        
        return false;
      }
      return true;
    });

    // Remove expired floating numbers
    this.floatingNumbers = this.floatingNumbers.filter(floatingNumber => {
      if (floatingNumber.shouldRemove()) {
        // Remove from entities array
        const entityIndex = this.entities.indexOf(floatingNumber);
        if (entityIndex > -1) {
          this.entities.splice(entityIndex, 1);
        }
        return false;
      }
      return true;
    });
    
    // Handle manual console breaking for testing (B key)
    if (this.inputSystem.isKeyJustPressed('KeyB')) {
      const operationalConsoles = this.consoles.filter(c => c.isOperational());
      if (operationalConsoles.length > 0) {
        const randomConsole = operationalConsoles[Math.floor(Math.random() * operationalConsoles.length)];
        randomConsole.durability = 0;
        randomConsole.state = 'broken';
        
        // Create floating notification
        const consoleTransform = randomConsole.getComponent('Transform');
        this.createFloatingNumber(
          consoleTransform.x,
          consoleTransform.y - 30,
          'BROKEN!',
          '#ff0000',
          1500
        );
      }
    }
    
    // Randomly break consoles for testing (temporary) - increased frequency
    if (Math.random() < 0.001) { // Slightly higher chance each frame
      const operationalConsoles = this.consoles.filter(c => c.isOperational());
      if (operationalConsoles.length > 0) {
        const randomConsole = operationalConsoles[Math.floor(Math.random() * operationalConsoles.length)];
        randomConsole.durability = 0;
        randomConsole.state = 'broken';
        
        // Create floating notification
        const consoleTransform = randomConsole.getComponent('Transform');
        this.createFloatingNumber(
          consoleTransform.x,
          consoleTransform.y - 30,
          'BROKEN!',
          '#ff0000',
          1500
        );
      }
    }

    // Track console states for floating number notifications
    const consolesBeforeUpdate = this.consoles.map(console => ({
      console: console,
      wasBroken: console.state === 'broken',
      wasUnderRepair: console.state === 'under-repair'
    }));
    
    // Update all entities
    this.entities.forEach(entity => {
      entity.update(deltaTime);
    });
    
    // Check for console repair completions
    consolesBeforeUpdate.forEach(({ console, wasUnderRepair }) => {
      if (wasUnderRepair && console.state === 'operational') {
        // Console just finished repairing
        const consoleTransform = console.getComponent('Transform');
        this.createFloatingNumber(
          consoleTransform.x,
          consoleTransform.y - 30,
          'REPAIRED!',
          '#00ff00',
          1500
        );
      }
    });
    
    // Check for game over conditions
    this.checkGameOverConditions();
    
    // Update input system at the end to clear just pressed/released states
    this.inputSystem.update();
  }

  /**
   * Check if game over conditions are met
   */
  checkGameOverConditions() {
    if (this.gameOver) return;
    
    if (this.angryGuests >= this.maxAngryGuests) {
      this.gameOver = true;
      this.gameOverReason = `Too many angry guests (${this.angryGuests}/${this.maxAngryGuests})`;
      this.endGame();
    }
  }

  /**
   * End the game and show game over state
   */
  endGame() {
    this.running = false;
    
    // Create game over floating text
    this.createFloatingNumber(
      this.canvas.width / 2,
      this.canvas.height / 2,
      'GAME OVER',
      '#ff0000',
      5000,
      { x: 0, y: 0 } // No movement
    );
    
    this.createFloatingNumber(
      this.canvas.width / 2,
      this.canvas.height / 2 + 40,
      this.gameOverReason,
      '#ff6600',
      5000,
      { x: 0, y: 0 }
    );
    
    this.createFloatingNumber(
      this.canvas.width / 2,
      this.canvas.height / 2 + 80,
      `Survived: Day ${this.day}`,
      '#ffff00',
      5000,
      { x: 0, y: 0 }
    );
    
    console.log('Game Over:', this.gameOverReason);
  }

  /**
   * Render the game
   */
  render() {
    // Clear canvas
    this.renderSystem.clear();

    // Draw test grid
    this.drawGrid();

    // Draw consoles
    this.consoles.forEach(console => {
      const transform = console.getComponent('Transform');
      const statusColor = console.getStatusColor();
      
      // Draw console as rectangle
      this.renderSystem.drawRect(
        transform.x - 30, 
        transform.y - 20, 
        60, 40, 
        '#666666'
      );
      
      // Draw status indicator
      this.renderSystem.drawCircle(
        transform.x + 25, 
        transform.y - 15, 
        8, 
        statusColor
      );
      
      // Draw console type label
      this.renderSystem.drawText(
        console.type.split('-')[0].toUpperCase(), 
        transform.x - 25, 
        transform.y - 5, 
        { font: '12px Arial', color: '#fff', align: 'left' }
      );
      
      // Draw durability bar
      const durabilityRatio = console.durability / console.maxDurability;
      const barWidth = 50;
      const barHeight = 4;
      
      // Background
      this.renderSystem.drawRect(
        transform.x - 25, 
        transform.y + 15, 
        barWidth, barHeight, 
        '#333'
      );
      
      // Durability fill
      this.renderSystem.drawRect(
        transform.x - 25, 
        transform.y + 15, 
        barWidth * durabilityRatio, barHeight, 
        durabilityRatio > 0.5 ? '#00ff00' : durabilityRatio > 0.25 ? '#ffff00' : '#ff0000'
      );
      
      // Draw repair progress if under repair
      if (console.state === 'under-repair') {
        const repairProgress = console.getRepairProgress();
        this.renderSystem.drawRect(
          transform.x - 25, 
          transform.y + 25, 
          barWidth * repairProgress, 6, 
          '#00aaff'
        );
        
        this.renderSystem.drawText(
          'REPAIRING...', 
          transform.x, 
          transform.y + 35, 
          { font: '10px Arial', color: '#00aaff', align: 'center' }
        );
      }
    });

    // Draw guests
    this.guests.forEach(guest => {
      const transform = guest.getComponent('Transform');
      const statusColor = guest.getStatusColor();
      
      // Draw guest as circle
      this.renderSystem.drawCircle(
        transform.x, 
        transform.y, 
        12, 
        statusColor
      );
      
      // Draw guest type label
      this.renderSystem.drawText(
        guest.type.charAt(0).toUpperCase(), 
        transform.x - 4, 
        transform.y + 3, 
        { font: '10px Arial', color: '#fff', align: 'center' }
      );
      
      // Draw patience meter
      if (guest.state === 'seeking') {
        const patienceRatio = guest.getPatienceRemaining() / guest.patience;
        const barWidth = 20;
        const barHeight = 3;
        
        // Background
        this.renderSystem.drawRect(
          transform.x - 10, 
          transform.y - 20, 
          barWidth, barHeight, 
          '#333'
        );
        
        // Patience fill
        const fillColor = patienceRatio > 0.6 ? '#00ff00' : patienceRatio > 0.3 ? '#ffff00' : '#ff0000';
        this.renderSystem.drawRect(
          transform.x - 10, 
          transform.y - 20, 
          barWidth * patienceRatio, barHeight, 
          fillColor
        );
      }
    });

    // Draw floating numbers
    this.floatingNumbers.forEach(floatingNumber => {
      const renderData = floatingNumber.getRenderData();
      
      // Set opacity for rendering
      const originalGlobalAlpha = this.renderSystem.ctx.globalAlpha;
      this.renderSystem.ctx.globalAlpha = renderData.opacity;
      
      this.renderSystem.drawText(
        renderData.text,
        renderData.x,
        renderData.y,
        { 
          font: `${renderData.fontSize}px Arial`, 
          color: renderData.color, 
          align: 'center',
          stroke: true,
          strokeColor: '#000000',
          strokeWidth: 2
        }
      );
      
      // Restore original alpha
      this.renderSystem.ctx.globalAlpha = originalGlobalAlpha;
    });

    // Draw player as a blue circle
    const playerTransform = this.player.getComponent('Transform');
    this.renderSystem.drawCircle(
      playerTransform.x, 
      playerTransform.y, 
      15, 
      '#0066cc'
    );
    
    // Draw repair range indicator if near a broken console
    const repairRange = 80;
    const nearbyBrokenConsole = this.consoles.find(console => {
      if (console.state !== 'broken') return false;
      const consoleTransform = console.getComponent('Transform');
      const distance = playerTransform.distanceTo(consoleTransform);
      return distance <= repairRange;
    });
    
    if (nearbyBrokenConsole) {
      // Draw repair range circle
      this.renderSystem.drawCircle(
        playerTransform.x,
        playerTransform.y,
        repairRange,
        '#ffff00',
        true // stroke only
      );
      
      // Draw repair prompt
      this.renderSystem.drawText(
        'Press SPACE to repair',
        playerTransform.x,
        playerTransform.y - 30,
        {
          font: '14px Arial',
          color: '#ffff00',
          align: 'center',
          stroke: true,
          strokeColor: '#000000',
          strokeWidth: 2
        }
      );
    }

    // Draw console purchase preview
    const previewData = this.purchaseSystem.getPreviewData();
    if (previewData) {
      const color = previewData.valid ? '#00ff0080' : '#ff000080';
      
      // Draw preview console as semi-transparent rectangle
      this.renderSystem.ctx.save();
      this.renderSystem.ctx.globalAlpha = 0.5;
      
      this.renderSystem.drawRect(
        previewData.x - 30, 
        previewData.y - 20, 
        60, 40, 
        color
      );
      
      this.renderSystem.ctx.restore();
      
      // Draw console type label
      this.renderSystem.drawText(
        previewData.type.split('-')[0].toUpperCase(), 
        previewData.x - 25, 
        previewData.y - 5, 
        { font: '12px Arial', color: previewData.valid ? '#00ff00' : '#ff0000', align: 'left' }
      );
      
      // Show cost
      const consoleInfo = this.purchaseSystem.getConsoleInfo(previewData.type);
      this.renderSystem.drawText(
        `£${consoleInfo.cost}`, 
        previewData.x, 
        previewData.y + 30, 
        { font: '12px Arial', color: previewData.valid ? '#00ff00' : '#ff0000', align: 'center' }
      );
      
      // Show placement instructions
      this.renderSystem.drawText(
        previewData.valid ? 'Press ENTER to place' : 'Invalid position', 
        previewData.x, 
        previewData.y + 45, 
        { font: '10px Arial', color: previewData.valid ? '#00ff00' : '#ff0000', align: 'center' }
      );
    }

    // Draw UI
    const uiLines = [
      'Use WASD to move | SPACE near broken console to repair | Press B to break a console',
      'Console Purchase: 1=Retro (£500) | 2=Classic (£1200) | 3=Modern (£2500) | 4=VR (£5000)'
    ];
    
    if (this.purchaseSystem.placementMode) {
      uiLines.push('Placement Mode: ENTER to confirm | ESCAPE to cancel');
    }
    
    uiLines.forEach((line, index) => {
      this.renderSystem.drawText(
        line, 
        20, 20 + (index * 20), 
        { font: '16px Arial', color: '#333' }
      );
    });

    // Update UI elements
    this.updateUI();
  }

  /**
   * Draw a grid for visual reference
   */
  drawGrid() {
    const gridSize = 40;
    const color = '#e0e0e0';

    // Vertical lines
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.renderSystem.drawRect(x, 0, 1, this.canvas.height, color);
    }

    // Horizontal lines
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      this.renderSystem.drawRect(0, y, this.canvas.width, 1, color);
    }
  }

  /**
   * Update guest AI behavior
   */
  updateGuestAI() {
    this.guests.forEach(guest => {
      if (guest.state === 'seeking') {
        const nearestConsole = guest.findNearestConsole(this.consoles);
        
        if (nearestConsole) {
          // Check if guest is close enough to use console
          const guestTransform = guest.getComponent('Transform');
          const consoleTransform = nearestConsole.getComponent('Transform');
          const distance = guestTransform.distanceTo(consoleTransform);
          
          if (distance < 60) { // Close enough to use
            try {
              guest.startUsingConsole(nearestConsole);
              console.debug(`Guest started using ${nearestConsole.type} console`);
            } catch (error) {
              // Console might have been taken by another guest
              guest.moveToConsole(nearestConsole);
            }
          } else {
            // Move towards console
            guest.moveToConsole(nearestConsole);
          }
        }
      }
    });
  }

  /**
   * Handle repair interaction when SPACE is pressed
   */
  handleRepairInteraction() {
    const playerTransform = this.player.getComponent('Transform');
    const repairRange = 80; // Distance within which player can repair
    
    // Find broken console within range
    const brokenConsole = this.consoles.find(console => {
      if (console.state !== 'broken') return false;
      
      const consoleTransform = console.getComponent('Transform');
      const distance = playerTransform.distanceTo(consoleTransform);
      return distance <= repairRange;
    });
    
    if (brokenConsole) {
      brokenConsole.startRepair();
      
      // Create floating repair notification
      const consoleTransform = brokenConsole.getComponent('Transform');
      this.createFloatingNumber(
        consoleTransform.x, 
        consoleTransform.y - 30, 
        'REPAIRING...', 
        '#ffff00',
        3000 // Match repair time
      );
    }
  }

  /**
   * Update UI elements
   */
  updateUI() {
    const moneyCounter = document.getElementById('money-counter');
    const dayCounter = document.getElementById('day-counter');
    const angryCounter = document.getElementById('angry-counter');

    if (moneyCounter) moneyCounter.textContent = `£${this.money.toLocaleString()}`;
    if (dayCounter) dayCounter.textContent = `Day ${this.day}`;
    if (angryCounter) angryCounter.textContent = `${this.angryGuests}/3`;
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.running = false;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    this.inputSystem.destroy();
  }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Expose game instance to window for testing
  window.game = new PowerUpGame();
});

export { PowerUpGame };