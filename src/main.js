import { RenderSystem } from './engine/systems/RenderSystem.js';
import { InputSystem } from './engine/systems/InputSystem.js';
import { AudioSystem } from './engine/systems/AudioSystem.js';
import { Character } from './entities/Character.js';
import { GameConsole } from './entities/GameConsole.js';
import { Guest } from './entities/Guest.js';
import { FloatingNumber } from './entities/FloatingNumber.js';
import { ConsolePurchaseSystem } from './systems/ConsolePurchaseSystem.js';
import { ConsoleUpgradeSystem } from './systems/ConsoleUpgradeSystem.js';
import { StrategicPlacementSystem } from './systems/StrategicPlacementSystem.js';
import { QueueManager } from './systems/QueueManager.js';
import { PowerUpManager } from './systems/PowerUpManager.js';
import { CharacterUpgradeSystem } from './systems/CharacterUpgradeSystem.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { ConsoleUnlockSystem } from './systems/ConsoleUnlockSystem.js';
import { DifficultyScalingSystem } from './systems/DifficultyScalingSystem.js';
import { WallSystem } from './systems/WallSystem.js';
import { GameStateManager } from './systems/GameStateManager.js';
import { SaveSystem } from './utils/SaveSystem.js';
import { TutorialSystem } from './systems/TutorialSystem.js';
import { Pathfinding } from './utils/Pathfinding.js';

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
    
    // Initialize core systems
    this.renderSystem = new RenderSystem(this.canvas);
    this.inputSystem = new InputSystem(document);
    this.audioSystem = new AudioSystem();
    this.saveSystem = new SaveSystem();
    
    // Initialize game systems
    this.gameStateManager = new GameStateManager(this.saveSystem, this.audioSystem);
    this.purchaseSystem = new ConsolePurchaseSystem(this);
    this.upgradeSystem = new ConsoleUpgradeSystem(this);
    this.placementSystem = new StrategicPlacementSystem(this);
    this.queueManager = new QueueManager(this);
    this.powerUpManager = new PowerUpManager(this);
    this.characterUpgradeSystem = new CharacterUpgradeSystem(this, this.gameStateManager);
    this.achievementSystem = new AchievementSystem(this, this.gameStateManager);
    this.consoleUnlockSystem = new ConsoleUnlockSystem(this, this.gameStateManager);
    // Initialize game entities arrays first (needed by systems)
    this.entities = [];
    this.character = null;
    this.consoles = [];
    this.guests = [];
    this.powerUps = [];
    this.floatingNumbers = [];
    
    this.difficultyScalingSystem = new DifficultyScalingSystem(this, this.gameStateManager);
    this.wallSystem = new WallSystem(this);
    this.pathfinding = new Pathfinding(40); // 40px grid for pathfinding
    this.tutorialSystem = new TutorialSystem(this.saveSystem);
    
    // Game timing
    this.running = false;
    this.lastTime = 0;
    this.lastGuestSpawn = 0;
    this.guestSpawnInterval = 8000; // 8 seconds between guests initially
    this.frameCount = 0; // For periodic updates
    
    // Bind event handlers
    this.setupEventHandlers();
    
    this.init();
  }

  /**
   * Setup event handlers for game systems communication
   * @private
   */
  setupEventHandlers() {
    // Game state events
    this.gameStateManager.on('stateChanged', (data) => {
      this.handleStateChange(data);
    });
    
    this.gameStateManager.on('moneyChanged', (data) => {
      this.updateUI();
      
      // Play money sound for positive amounts
      if (data.amount > 0) {
        this.audioSystem.playMoneySound();
      }
    });
    
    this.gameStateManager.on('angryGuest', (data) => {
      this.audioSystem.playWarningSound();
      
      // Update UI counter
      this.updateUI();
      
      // Create visual warning
      this.createFloatingNumber(
        this.canvas.width / 2,
        100,
        `Angry guests: ${data.count}/${data.limit}`,
        '#FF0000',
        3000
      );
    });
    
    this.gameStateManager.on('gameOver', (data) => {
      this.handleGameOver(data);
    });
    
    // Purchase system events
    this.purchaseSystem.on('purchaseComplete', (data) => {
      this.gameStateManager.spendMoney(data.cost);
      this.audioSystem.playClickSound();
      
      // Create the console entity
      this.createConsole(data.x, data.y, data.type);
    });
    
    // Upgrade system events
    this.upgradeSystem.on('upgradeComplete', (data) => {
      this.audioSystem.playClickSound();
      
      // Create upgrade notification
      this.createFloatingNumber(
        data.x,
        data.y - 50,
        `UPGRADED TO T${data.newTier}!`,
        '#FFD700',
        2000
      );
      
      // Update UI to reflect money change
      this.updateUI();
    });
  }

  /**
   * Handle game state changes
   * @param {Object} data - State change data
   * @private
   */
  handleStateChange(data) {
    switch (data.currentState) {
      case 'playing':
        if (data.previousState === 'menu' || data.previousState === 'loading') {
          this.startGame();
        }
        break;
        
      case 'paused':
        this.pauseGame();
        break;
        
      case 'gameOver':
        this.endGame();
        break;
    }
  }

  /**
   * Handle game over
   * @param {Object} data - Game over data
   * @private
   */
  handleGameOver(data) {
    this.running = false;
    
    // Create game over floating text
    this.createFloatingNumber(
      this.canvas.width / 2,
      this.canvas.height / 2 - 40,
      'GAME OVER',
      '#FF0000',
      8000,
      { x: 0, y: 0 }
    );
    
    this.createFloatingNumber(
      this.canvas.width / 2,
      this.canvas.height / 2,
      data.reason,
      '#FF6600',
      8000,
      { x: 0, y: 0 }
    );
    
    this.createFloatingNumber(
      this.canvas.width / 2,
      this.canvas.height / 2 + 40,
      `Final Score: ${data.finalScore}`,
      '#FFFF00',
      8000,
      { x: 0, y: 0 }
    );
    
    if (data.isHighScore) {
      this.createFloatingNumber(
        this.canvas.width / 2,
        this.canvas.height / 2 + 80,
        'NEW HIGH SCORE!',
        '#00FF00',
        8000,
        { x: 0, y: 0 }
      );
    }
  }

  /**
   * Create a new character
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @returns {Character} Created character
   */
  createCharacter(x, y) {
    if (this.character) {
      // Remove existing character
      const index = this.entities.indexOf(this.character);
      if (index > -1) {
        this.entities.splice(index, 1);
      }
    }
    
    this.character = new Character(x, y, {
      name: 'Player',
      color: '#0066CC',
      speed: 200
    });
    
    // Update character boundaries based on wall system
    if (this.wallSystem) {
      this.character.updateBoundaries(this.wallSystem.getPlayableArea());
    }
    
    // Apply any existing character upgrades
    if (this.characterUpgradeSystem) {
      this.characterUpgradeSystem.applyAllUpgrades();
    }
    
    // Alias for test compatibility
    this.player = this.character;
    
    this.entities.push(this.character);
    return this.character;
  }

  /**
   * Create a new console at the specified position
   * @param {number} x - X position
   * @param {number} y - Y position  
   * @param {string} type - Console type
   * @returns {GameConsole} Created console
   */
  createConsole(x, y, type) {
    const console = new GameConsole(x, y, type);
    
    // Listen for repair completion
    console.on('repairCompleted', (data) => {
      this.createFloatingNumber(
        data.x,
        data.y - 30,
        'REPAIRED!',
        '#00FF00',
        2000
      );
      
      this.audioSystem.playRepairSound();
      
      // Update repair achievement
      if (this.achievementSystem) {
        this.achievementSystem.updateAchievement('repair-expert', 1);
      }
    });
    
    this.consoles.push(console);
    this.entities.push(console);
    return console;
  }

  /**
   * Spawn a new guest
   * @returns {Guest} Created guest
   */
  spawnGuest() {
    // Use difficulty-scaled guest type distribution
    const randomType = this.difficultyScalingSystem.getRandomGuestType();
    
    // Spawn at entrance (right side of screen)
    const guest = new Guest(750, 200 + Math.random() * 200, randomType);
    
    // Apply difficulty scaling to guest patience
    const patienceModifier = this.difficultyScalingSystem.getGuestPatienceModifier();
    guest.patience = Math.floor(guest.patience * patienceModifier);
    
    // Set pathfinding reference
    guest.pathfinding = this.pathfinding;
    
    // Set initial target near entrance using pathfinding
    guest.setPathfindingTarget(600, guest.y);
    
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
   * @returns {FloatingNumber} Created floating number
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
    
    // Try to load existing game state
    const loadResult = this.gameStateManager.loadGameState();
    
    if (loadResult.success && !loadResult.isNewGame) {
      // Continue existing game
      console.debug('Loading existing game from saved state');
      this.loadGameEntities();
      this.gameStateManager.setState('playing');
      this.start(); // Start the game loop for loaded games
    } else {
      // New game - check if tutorial should be shown
      if (!this.tutorialSystem.tutorialCompleted) {
        this.showMainMenu();
      } else {
        this.startNewGame();
      }
    }

    // Initialize character upgrade system after everything is loaded
    this.characterUpgradeSystem.initialize();
    
    // Initialize pathfinding grid
    this.pathfinding.initializeGrid(this.canvas.width, this.canvas.height);
    this.updatePathfindingObstacles();
    
    console.debug('Power Up game initialized');
  }

  /**
   * Load game entities from saved state
   * @private
   */
  loadGameEntities() {
    const gameData = this.gameStateManager.gameData;
    
    // Clear existing entities first
    this.entities = [];
    this.consoles = [];
    this.guests = [];
    this.powerUps = [];
    this.floatingNumbers = [];
    this.character = null;
    
    // Create character at canvas center
    this.createCharacter(600, 400);
    
    // Load consoles
    if (gameData.consoles && gameData.consoles.length > 0) {
      gameData.consoles.forEach(consoleData => {
        const console = this.createConsole(consoleData.x, consoleData.y, consoleData.type);
        // Restore console state
        console.durability = consoleData.durability || console.maxDurability;
        console.state = consoleData.state || 'operational';
      });
    } else {
      // Create default starting consoles
      this.createConsole(200, 200, 'retro-arcade');
      this.createConsole(400, 200, 'retro-arcade');
    }
    
    this.updateUI();
  }

  /**
   * Show main menu (for new games)
   * @private
   */
  showMainMenu() {
    this.gameStateManager.setState('menu');
    
    // For now, just start tutorial or new game
    // In a full implementation, this would show a proper menu
    if (this.tutorialSystem.startTutorial()) {
      // Tutorial started
      this.startNewGame();
    } else {
      this.startNewGame();
    }
  }

  /**
   * Start a new game
   */
  startNewGame() {
    // Initialize game state
    this.gameStateManager.startNewGame();
    
    // Clear existing entities
    this.entities = [];
    this.consoles = [];
    this.guests = [];
    this.powerUps = [];
    this.floatingNumbers = [];
    
    // Create character at canvas center
    this.createCharacter(600, 400);
    
    // Create initial consoles
    this.createConsole(200, 200, 'retro-arcade');
    this.createConsole(400, 200, 'retro-arcade');
    
    // Start game loop
    this.start();
  }

  /**
   * Start the game
   * @private
   */
  startGame() {
    this.running = true;
    this.lastGuestSpawn = Date.now();
    this.updateUI();
  }

  /**
   * Pause the game
   * @private
   */
  pauseGame() {
    this.running = false;
  }

  /**
   * End the game
   * @private
   */
  endGame() {
    this.running = false;
  }

  /**
   * Start the game loop
   */
  start() {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  /**
   * Main game loop
   * @param {number} currentTime - Current timestamp
   */
  gameLoop(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Always update floating numbers for visual feedback
    this.updateFloatingNumbers(deltaTime);
    
    // Update game logic only if playing
    if (this.gameStateManager.getState() === 'playing' && this.running) {
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
    // Increment frame counter
    this.frameCount++;
    
    // Handle character input
    this.handleCharacterInput(deltaTime);
    
    // Handle tutorial interactions
    this.handleTutorialInput();
    
    // Handle console purchase interactions
    this.handlePurchaseInput();
    
    // Handle repair interaction
    if (this.inputSystem.isKeyJustPressed('Space')) {
      this.handleRepairInteraction();
    }
    
        // Handle power-up spawning for testing
    if (this.inputSystem.isKeyJustPressed('KeyP')) {
      this.spawnTestPowerUp();
    }

    // Handle wall visibility toggle
    if (this.inputSystem.isKeyJustPressed('KeyV')) {
      this.wallSystem.handleKeyPress('KeyV');
    }

    // Handle wall system info
    if (this.inputSystem.isKeyJustPressed('KeyW')) {
      this.wallSystem.handleKeyPress('KeyW');
    }

    // Handle character upgrade menu
    if (this.inputSystem.isKeyJustPressed('KeyU')) {
      this.characterUpgradeSystem.toggleUpgradeMenu();
    }
    
    // Guest spawning
    this.updateGuestSpawning();
    
    // Guest AI and console interaction
    this.updateGuestAI();
    
    // Process guest payments
    this.processGuestPayments();
    
    // Remove guests that have left
    this.cleanupGuests();
    
    // Update console breakdown simulation
    this.updateConsoleBreakdowns();
    
    // Update strategic placement analysis
    this.placementSystem.update(deltaTime);
    
    // Update queue management
    this.queueManager.update(deltaTime);
    
    // Update power-up system
    this.powerUpManager.update(deltaTime);
    
    // Update character upgrade system
    this.characterUpgradeSystem.update(deltaTime);
    
    // Update achievement system
    this.achievementSystem.update(deltaTime);
    
    // Update console unlock system
    this.consoleUnlockSystem.update(deltaTime);
    
    // Update difficulty scaling system
    this.difficultyScalingSystem.update(deltaTime);
    
    // Update wall system
    this.wallSystem.update(deltaTime);
    
    // Update pathfinding obstacles (every few frames to avoid performance issues)
    if (this.frameCount % 10 === 0) { // Update every 10 frames
      this.updatePathfindingObstacles();
    }
    
    // Update all entities
    this.entities.forEach(entity => {
      entity.update(deltaTime);
    });
    
    // Update input system to clear just pressed/released states
    this.inputSystem.update();
  }

  /**
   * Handle character movement input
   * @param {number} deltaTime - Time elapsed
   * @private
   */
  handleCharacterInput(deltaTime) {
    if (!this.character) return;
    
    const movement = this.inputSystem.getMovementVector();
    
    if (movement.x !== 0 || movement.y !== 0) {
      this.character.setMovementDirection(movement.x, movement.y);
    } else {
      this.character.stopMoving();
    }
  }

  /**
   * Handle tutorial input
   * @private
   */
  handleTutorialInput() {
    if (!this.tutorialSystem.isActive) return;
    
    // Handle mouse clicks for tutorial
    if (this.inputSystem.isMousePressed()) {
      const mousePos = this.inputSystem.getMousePosition();
      this.tutorialSystem.handleClick(mousePos.x, mousePos.y);
    }
    
    // Handle keyboard input for tutorial
    const pressedKeys = this.inputSystem.getJustPressedKeys();
    pressedKeys.forEach(key => {
      this.tutorialSystem.handleKeyPress(key);
      
      // Handle upgrade system keyboard shortcuts
      this.characterUpgradeSystem.handleKeyPress(key);
      
      // Handle achievement system keyboard shortcuts
      this.achievementSystem.handleKeyPress(key);
      
      // Handle console unlock system keyboard shortcuts  
      this.consoleUnlockSystem.handleKeyPress(key);
      
      // Handle difficulty scaling system keyboard shortcuts
      this.difficultyScalingSystem.handleKeyPress(key);
      
      // Handle wall system keyboard shortcuts
      this.wallSystem.handleKeyPress(key);
    });
  }

  /**
   * Handle console purchase input
   * @private
   */
  handlePurchaseInput() {
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
    if (this.purchaseSystem.placementMode && this.character) {
      const characterPos = this.character.getPosition();
      this.purchaseSystem.updatePreviewPosition(characterPos.x, characterPos.y);
      
      // Confirm placement with Enter
      if (this.inputSystem.isKeyJustPressed('Enter')) {
        this.purchaseSystem.confirmPlacement();
      }
      
      // Cancel placement with Escape
      if (this.inputSystem.isKeyJustPressed('Escape')) {
        this.purchaseSystem.cancelPlacement();
      }
    }
  }

  /**
   * Update pathfinding obstacles based on current game state
   */
  updatePathfindingObstacles() {
    if (!this.pathfinding) return;
    
    const obstacles = [];
    
    // Add walls as obstacles
    if (this.wallSystem) {
      const walls = this.wallSystem.getWalls();
      walls.forEach(wall => {
        const transform = wall.getComponent('Transform');
        obstacles.push({
          x: transform.x,
          y: transform.y,
          width: wall.width,
          height: wall.height
        });
      });
    }
    
    // Add consoles as obstacles
    this.consoles.forEach(console => {
      const transform = console.getComponent('Transform');
      obstacles.push({
        x: transform.x - 30, // Console collision area
        y: transform.y - 20,
        width: 60,
        height: 40
      });
    });
    
    // Add other guests as temporary obstacles (to avoid clustering)
    this.guests.forEach(guest => {
      const transform = guest.getComponent('Transform');
      obstacles.push({
        x: transform.x - 15,
        y: transform.y - 15,
        width: 30,
        height: 30
      });
    });
    
    this.pathfinding.updateObstacles(obstacles);
  }

  /**
   * Update guest spawning with difficulty scaling
   * @private
   */
  updateGuestSpawning() {
    const currentTime = Date.now();
    const spawnInterval = this.difficultyScalingSystem.getGuestSpawnInterval();
    
    if (currentTime - this.lastGuestSpawn > spawnInterval && 
        this.difficultyScalingSystem.canSpawnMoreGuests()) {
      this.spawnGuest();
      this.lastGuestSpawn = currentTime;
    }
  }

  /**
   * Update guest AI behavior
   * @private
   */
  updateGuestAI() {
    this.guests.forEach(guest => {
      if (guest.state === 'seeking') {
        // Check if there are any immediately available consoles
        const availableConsole = this.findImmediatelyAvailableConsole(guest);
        
        if (availableConsole) {
          const guestTransform = guest.getComponent('Transform');
          const consoleTransform = availableConsole.getComponent('Transform');
          const distance = guestTransform.distanceTo(consoleTransform);
          
          if (distance < 60) {
            try {
              guest.startUsingConsole(availableConsole);
              console.debug(`Guest started using ${availableConsole.type} console directly`);
            } catch (error) {
              guest.moveToConsole(availableConsole);
            }
          } else {
            guest.moveToConsole(availableConsole);
          }
        }
        // If no immediately available console, queue manager will handle queue joining
      }
    });
  }

  /**
   * Find an immediately available console for a guest (no queue needed)
   * @param {Guest} guest - Guest looking for console
   * @returns {GameConsole|null} Available console or null
   * @private
   */
  findImmediatelyAvailableConsole(guest) {
    const availableConsoles = this.consoles.filter(console => 
      console.isOperational() && 
      !console.isInUse() && 
      console.getQueueLength() === 0
    );
    
    if (availableConsoles.length === 0) return null;
    
    // Use strategic placement to find best available console
    return this.placementSystem.findOptimalConsole(guest, availableConsoles);
  }

  /**
   * Process guest payments
   * @private
   */
  processGuestPayments() {
    this.guests.forEach(guest => {
      if (guest.state === 'leaving' && guest.currentConsole === null && !guest.hasPaid) {
        const lastConsole = this.consoles.find(c => c.type === guest.lastConsoleType);
        if (lastConsole) {
          const payment = guest.calculatePayment(lastConsole);
          this.gameStateManager.addMoney(payment);
          this.gameStateManager.serveGuest();
          
          // Create floating money number
          const guestTransform = guest.getComponent('Transform');
          this.createFloatingNumber(
            guestTransform.x, 
            guestTransform.y - 20, 
            `+£${payment}`, 
            '#00FF00'
          );
          
          guest.hasPaid = true;
        }
      }
    });
  }

  /**
   * Clean up guests that have left
   * @private
   */
  cleanupGuests() {
    this.guests = this.guests.filter(guest => {
      if (guest.shouldRemove()) {
        // Remove from entities array
        const entityIndex = this.entities.indexOf(guest);
        if (entityIndex > -1) {
          this.entities.splice(entityIndex, 1);
        }
        
        // Track angry guests
        if (guest.state === 'angry') {
          this.gameStateManager.addAngryGuest();
          
          // Create floating notification for angry guest
          const guestTransform = guest.getComponent('Transform');
          this.createFloatingNumber(
            guestTransform.x,
            guestTransform.y - 20,
            'ANGRY!',
            '#FF0000',
            2000
          );
        }
        
        return false;
      }
      return true;
    });
  }

  /**
   * Update console breakdowns (simulation)
   * @private
   */
  updateConsoleBreakdowns() {
    // Manual console breaking for testing (B key)
    if (this.inputSystem.isKeyJustPressed('KeyB')) {
      const operationalConsoles = this.consoles.filter(c => c.isOperational());
      if (operationalConsoles.length > 0) {
        const randomConsole = operationalConsoles[Math.floor(Math.random() * operationalConsoles.length)];
        randomConsole.durability = 0;
        randomConsole.state = 'broken';
        
        this.createFloatingNumber(
          randomConsole.getComponent('Transform').x,
          randomConsole.getComponent('Transform').y - 30,
          'BROKEN!',
          '#FF0000',
          1500
        );
      }
    }
    
    // Random console breakdowns for gameplay
    if (Math.random() < 0.0008) { // Adjusted probability
      const operationalConsoles = this.consoles.filter(c => c.isOperational());
      if (operationalConsoles.length > 0) {
        const randomConsole = operationalConsoles[Math.floor(Math.random() * operationalConsoles.length)];
        randomConsole.durability = 0;
        randomConsole.state = 'broken';
        
        this.createFloatingNumber(
          randomConsole.getComponent('Transform').x,
          randomConsole.getComponent('Transform').y - 30,
          'BROKEN!',
          '#FF0000',
          1500
        );
      }
    }
  }

  /**
   * Update floating numbers
   * @param {number} deltaTime - Time elapsed
   * @private
   */
  updateFloatingNumbers(deltaTime) {
    this.floatingNumbers.forEach(fn => fn.update(deltaTime));
    
    this.floatingNumbers = this.floatingNumbers.filter(floatingNumber => {
      if (floatingNumber.shouldRemove()) {
        const entityIndex = this.entities.indexOf(floatingNumber);
        if (entityIndex > -1) {
          this.entities.splice(entityIndex, 1);
        }
        return false;
      }
      return true;
    });
  }

  /**
   * Spawn a test power-up near the character (for testing)
   * @private
   */
  spawnTestPowerUp() {
    if (!this.character) return;
    
    const characterPos = this.character.getPosition();
    const offsetX = (Math.random() - 0.5) * 200;
    const offsetY = (Math.random() - 0.5) * 200;
    
    this.powerUpManager.spawnPowerUp(
      'speed-boost',
      characterPos.x + offsetX,
      characterPos.y + offsetY
    );
  }

  /**
   * Handle repair interaction when SPACE is pressed
   */
  handleRepairInteraction() {
    if (!this.character) return;
    
    const characterPos = this.character.getPosition();
    const repairRange = 80;
    
    // Find broken console within range
    const brokenConsole = this.consoles.find(console => {
      if (console.state !== 'broken') return false;
      
      const consoleTransform = console.getComponent('Transform');
      const distance = Math.sqrt(
        (characterPos.x - consoleTransform.x) ** 2 + 
        (characterPos.y - consoleTransform.y) ** 2
      );
      return distance <= repairRange;
    });
    
    if (brokenConsole) {
      // Apply character repair multiplier (from power-ups) and repair speed bonus (from upgrades)
      const powerUpMultiplier = this.character.repairMultiplier || 1.0;
      const upgradeMultiplier = this.character.baseRepairSpeedBonus || 1.0;
      const totalMultiplier = powerUpMultiplier * upgradeMultiplier;
      
      brokenConsole.startRepair(totalMultiplier);
      this.audioSystem.playRepairSound();
      
      // Create floating repair notification (different for boosted repairs)
      const consoleTransform = brokenConsole.getComponent('Transform');
      if (totalMultiplier > 5.0) {
        this.createFloatingNumber(
          consoleTransform.x, 
          consoleTransform.y - 30, 
          'ULTRA REPAIR!', 
          '#FF00FF',
          2000
        );
      } else if (totalMultiplier > 1.5) {
        this.createFloatingNumber(
          consoleTransform.x, 
          consoleTransform.y - 30, 
          'FAST REPAIR!', 
          '#FFD700',
          2000
        );
      } else {
        this.createFloatingNumber(
          consoleTransform.x, 
          consoleTransform.y - 30, 
          'REPAIRING...', 
          '#FFFF00',
          3000
        );
      }
    }
  }

  /**
   * Render the game
   */
  render() {
    try {
      // Clear canvas
      this.renderSystem.clear();

      // Layer 0: Walls (background) - render first, before grid
      if (this.wallSystem.wallsVisible) {
        this.wallSystem.walls.forEach(wall => {
          try {
            wall.render(this.renderSystem);
          } catch (error) {
            console.error('Error rendering wall:', error, wall);
          }
        });
      }

      // Draw background grid
      this.drawGrid();

      // Render entities in layers (background to foreground)
      
      // Layer 1: Consoles (background)
      this.consoles.forEach(console => {
        try {
          console.render(this.renderSystem);
        } catch (error) {
          console.error('Error rendering console:', error, console);
        }
      });
      
      // Layer 2: Power-ups (mid-ground)
      this.powerUps.forEach(powerUp => {
        try {
          powerUp.render(this.renderSystem);
        } catch (error) {
          console.error('Error rendering power-up:', error, powerUp);
        }
      });
      
      // Layer 3: Character and Guests (foreground)
      if (this.character) {
        try {
          this.character.render(this.renderSystem);
        } catch (error) {
          console.error('Error rendering character:', error, this.character);
        }
      }
      
      this.guests.forEach(guest => {
        try {
          guest.render(this.renderSystem);
        } catch (error) {
          console.error('Error rendering guest:', error, guest);
        }
      });
      
      // Layer 4: Floating numbers (top layer)
      this.floatingNumbers.forEach(floatingNumber => {
        try {
          floatingNumber.render(this.renderSystem);
        } catch (error) {
          console.error('Error rendering floating number:', error, floatingNumber);
        }
      });
    } catch (error) {
      console.error('Error in main render method:', error);
    }

    // Draw console purchase preview
    this.renderPurchasePreview();

    // Draw character interaction hints
    this.renderInteractionHints();

    // Render tutorial overlay (if active)
    if (this.tutorialSystem.isActive) {
      this.tutorialSystem.render(this.renderSystem);
    }

    // Render character upgrade menu (if visible)
    this.characterUpgradeSystem.render(this.renderSystem);

    // Render achievement system (notifications and menu)  
    this.achievementSystem.render(this.renderSystem);
    
    // Render console unlock notifications
    this.consoleUnlockSystem.render(this.renderSystem);

    // Draw UI
    this.renderUI();
  }

  /**
   * Draw a grid for visual reference
   * @private
   */
  drawGrid() {
    const gridSize = 40;
    const color = '#E0E0E0';

    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.renderSystem.drawRect(x, 0, 1, this.canvas.height, color);
    }

    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      this.renderSystem.drawRect(0, y, this.canvas.width, 1, color);
    }
  }

  /**
   * Render console purchase preview
   * @private
   */
  renderPurchasePreview() {
    const previewData = this.purchaseSystem.getPreviewData();
    if (!previewData) return;
    
    const color = previewData.valid ? '#00FF0080' : '#FF000080';
    
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
      { font: '12px Arial', color: previewData.valid ? '#00FF00' : '#FF0000', align: 'left' }
    );
    
    // Show cost
    const consoleInfo = this.purchaseSystem.getConsoleInfo(previewData.type);
    this.renderSystem.drawText(
      `£${consoleInfo.cost}`, 
      previewData.x, 
      previewData.y + 30, 
      { font: '12px Arial', color: previewData.valid ? '#00FF00' : '#FF0000', align: 'center' }
    );
    
    // Show placement instructions
    this.renderSystem.drawText(
      previewData.valid ? 'Press ENTER to place' : 'Invalid position', 
      previewData.x, 
      previewData.y + 45, 
      { font: '10px Arial', color: previewData.valid ? '#00FF00' : '#FF0000', align: 'center' }
    );
  }

  /**
   * Render interaction hints
   * @private
   */
  renderInteractionHints() {
    if (!this.character) return;
    
    const characterPos = this.character.getPosition();
    const repairRange = 80;
    
    // Check for nearby broken console
    const nearbyBrokenConsole = this.consoles.find(console => {
      if (console.state !== 'broken') return false;
      const consoleTransform = console.getComponent('Transform');
      const distance = Math.sqrt(
        (characterPos.x - consoleTransform.x) ** 2 + 
        (characterPos.y - consoleTransform.y) ** 2
      );
      return distance <= repairRange;
    });
    
    if (nearbyBrokenConsole) {
      // Draw repair range circle
      this.renderSystem.drawCircle(
        characterPos.x,
        characterPos.y,
        repairRange,
        '#FFFF00',
        true // stroke only
      );
      
      // Draw repair prompt
      this.renderSystem.drawText(
        'Press SPACE to repair',
        characterPos.x,
        characterPos.y - 30,
        {
          font: '14px Arial',
          color: '#FFFF00',
          align: 'center',
          stroke: true,
          strokeColor: '#000000',
          strokeWidth: 2
        }
      );
    }
  }

  /**
   * Render UI elements
   * @private
   */
  renderUI() {
    // Removed playable area border - walls provide sufficient boundary indication
    
    // Control instructions
    const uiLines = [
      'WASD: Move | SPACE: Repair | 1-4: Buy Consoles | U: Upgrades | A: Achievements',
      'ENTER: Confirm Purchase | ESC: Cancel | P: Spawn Power-up (test) | B: Break Console (test)',
      'Y: Unlock All Consoles (test) | O: Unlock Next Console (test) | D: Show Difficulty (test) | N: Next Day Difficulty (test) | W: Wall Info (test) | V: Toggle Walls'
    ];
    
    if (this.purchaseSystem.placementMode) {
      uiLines.push('Placement Mode: ENTER to confirm | ESCAPE to cancel');
    }
    
    uiLines.forEach((line, index) => {
      this.renderSystem.drawText(
        line, 
        20, 20 + (index * 18), 
        { font: '14px Arial', color: '#333333' }
      );
    });

    // Game progress info
    const gameData = this.gameStateManager.gameData;
    const progress = this.gameStateManager.getDayProgress();
    
    // Progress bars
    const barY = this.canvas.height - 80;
    const barWidth = 200;
    const barHeight = 20;
    
    // Revenue progress
    this.renderSystem.drawRect(20, barY, barWidth, barHeight, '#333333');
    this.renderSystem.drawRect(20, barY, barWidth * progress.revenueProgress, barHeight, '#00FF00');
    this.renderSystem.drawText(
      `Revenue: £${gameData.dailyRevenue}/${this.gameStateManager.dailyTargets.revenue}`,
      25, barY + 14,
      { font: '12px Arial', color: '#FFFFFF' }
    );
    
    // Guests progress
    this.renderSystem.drawRect(250, barY, barWidth, barHeight, '#333333');
    this.renderSystem.drawRect(250, barY, barWidth * progress.guestsProgress, barHeight, '#0066CC');
    this.renderSystem.drawText(
      `Guests: ${gameData.guestsServed}/${this.gameStateManager.dailyTargets.guestsServed}`,
      255, barY + 14,
      { font: '12px Arial', color: '#FFFFFF' }
    );
  }

  /**
   * Update UI elements
   */
  updateUI() {
    const gameData = this.gameStateManager.gameData;
    
    const moneyCounter = document.getElementById('money-counter');
    const dayCounter = document.getElementById('day-counter');
    const angryCounter = document.getElementById('angry-counter');

    if (moneyCounter) moneyCounter.textContent = `£${gameData.money.toLocaleString()}`;
    if (dayCounter) dayCounter.textContent = `Day ${gameData.day}`;
    if (angryCounter) angryCounter.textContent = `${gameData.angryGuests}/${this.gameStateManager.dailyTargets.maxAngryGuests}`;
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.running = false;
  }

  /**
   * Get angry guests count (for test compatibility)
   * @returns {number} Current angry guests count
   */
  get angryGuests() {
    return this.gameStateManager.gameData.angryGuests;
  }

  /**
   * Set angry guests count (for test compatibility)
   * @param {number} value - Angry guests count to set
   */
  set angryGuests(value) {
    this.gameStateManager.gameData.angryGuests = value;
  }

  /**
   * Get current money (for test compatibility)
   * @returns {number} Current money amount
   */
  get money() {
    return this.gameStateManager.gameData.money;
  }

  /**
   * Set current money (for test compatibility)
   * @param {number} value - Money amount to set
   */
  set money(value) {
    this.gameStateManager.gameData.money = value;
  }

  /**
   * Check game over conditions (for test compatibility)
   */
  checkGameOverConditions() {
    if (this.gameStateManager.gameData.angryGuests >= this.gameStateManager.dailyTargets.maxAngryGuests) {
      this.gameStateManager.gameOver('Too many angry guests! Exhibition reputation damaged beyond repair.');
    }
  }

  /**
   * Get comprehensive game state (for test compatibility)
   * @returns {Object} Game state object
   */
  getGameState() {
    const currentState = this.gameStateManager.getState();
    return {
      gameOver: currentState === 'gameOver',
      running: this.running,
      angryGuests: this.gameStateManager.gameData.angryGuests,
      gameOverReason: this.gameStateManager.gameData.gameOverReason || null,
      money: this.gameStateManager.gameData.money,
      currentState: currentState
    };
  }

  /**
   * Get game over status (for test compatibility)
   * @returns {boolean} True if game is over
   */
  get gameOver() {
    return this.gameStateManager.getState() === 'gameOver';
  }

  /**
   * Get game over reason (for test compatibility)
   * @returns {string|null} Reason for game over
   */
  get gameOverReason() {
    return this.gameStateManager.gameData.gameOverReason || null;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    this.inputSystem.destroy();
    this.audioSystem.stopAll();
  }
}

/**
 * Reset game function - clears all data and restarts
 */
window.resetGame = function() {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Stop current game if it exists
    if (window.game) {
      window.game.destroy();
      window.game = null;
    }
    
    // Hide error message if visible
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }
    
    // Show loading message
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('hidden');
      loading.textContent = 'Resetting game...';
    }
    
    // Restart game after a brief delay
    setTimeout(() => {
      try {
        console.log('Attempting to create new game after reset...');
        window.game = new PowerUpGame();
        console.log('Game reset successfully');
      } catch (error) {
        console.error('Failed to restart game after reset:', error);
        console.error('Reset error stack:', error.stack);
        showErrorMessage('Failed to restart game after reset. Please reload the page.');
      }
    }, 500);
    
  } catch (error) {
    console.error('Reset failed:', error);
    // Force page reload as last resort
    location.reload();
  }
};

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    const errorText = errorMessage.querySelector('p');
    if (errorText) {
      errorText.textContent = message;
    }
    errorMessage.style.display = 'block';
  }
  
  // Hide loading screen
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Starting game initialization...');
    // Expose game instance to window for testing and debugging
    window.game = new PowerUpGame();
    console.log('Game initialized successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    console.error('Error stack:', error.stack);
    showErrorMessage('Game failed to initialize. This might be due to corrupted save data.');
  }
});

export { PowerUpGame };