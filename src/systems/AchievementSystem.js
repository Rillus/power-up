/**
 * Achievement System - Manages player achievements and milestones
 * @class AchievementSystem
 */
export class AchievementSystem {
  /**
   * Create an AchievementSystem
   * @param {Object} game - Game instance
   * @param {GameStateManager} gameStateManager - Game state manager
   */
  constructor(game, gameStateManager) {
    this.game = game;
    this.gameStateManager = gameStateManager;
    
    // Achievement definitions
    this.achievements = {
      'first-day': {
        id: 'first-day',
        name: 'Exhibition Rookie',
        description: 'Survive your first day at the exhibition',
        icon: '🎮',
        type: 'milestone',
        target: 1,
        progress: 0,
        unlocked: false,
        category: 'survival'
      },
      'week-survivor': {
        id: 'week-survivor',
        name: 'Week Warrior',
        description: 'Survive 7 days at the exhibition',
        icon: '📅',
        type: 'milestone',
        target: 7,
        progress: 0,
        unlocked: false,
        category: 'survival'
      },
      'exhibition-veteran': {
        id: 'exhibition-veteran',
        name: 'Exhibition Veteran',
        description: 'Survive 30 days at the exhibition',
        icon: '🏆',
        type: 'milestone',
        target: 30,
        progress: 0,
        unlocked: false,
        category: 'survival'
      },
      'first-pound': {
        id: 'first-pound',
        name: 'Pocket Change',
        description: 'Earn your first £1',
        icon: '💰',
        type: 'milestone',
        target: 1,
        progress: 0,
        unlocked: false,
        category: 'money'
      },
      'money-maker': {
        id: 'money-maker',
        name: 'Money Maker',
        description: 'Earn £1,000 total revenue',
        icon: '💸',
        type: 'cumulative',
        target: 1000,
        progress: 0,
        unlocked: false,
        category: 'money'
      },
      'big-earner': {
        id: 'big-earner',
        name: 'Big Earner',
        description: 'Earn £10,000 total revenue',
        icon: '💎',
        type: 'cumulative',
        target: 10000,
        progress: 0,
        unlocked: false,
        category: 'money'
      },
      'crowd-pleaser': {
        id: 'crowd-pleaser',
        name: 'Crowd Pleaser',
        description: 'Serve 100 happy guests',
        icon: '😄',
        type: 'cumulative',
        target: 100,
        progress: 0,
        unlocked: false,
        category: 'guests'
      },
      'people-person': {
        id: 'people-person',
        name: 'People Person',
        description: 'Serve 1,000 guests total',
        icon: '👥',
        type: 'cumulative',
        target: 1000,
        progress: 0,
        unlocked: false,
        category: 'guests'
      },
      'repair-expert': {
        id: 'repair-expert',
        name: 'Repair Expert',
        description: 'Repair 50 broken consoles',
        icon: '🔧',
        type: 'cumulative',
        target: 50,
        progress: 0,
        unlocked: false,
        category: 'maintenance'
      },
      'console-collector': {
        id: 'console-collector',
        name: 'Console Collector',
        description: 'Own 10 consoles simultaneously',
        icon: '🎯',
        type: 'milestone',
        target: 10,
        progress: 0,
        unlocked: false,
        category: 'expansion'
      },
      'upgrade-enthusiast': {
        id: 'upgrade-enthusiast',
        name: 'Upgrade Enthusiast',
        description: 'Purchase 10 character upgrades',
        icon: '⚡',
        type: 'cumulative',
        target: 10,
        progress: 0,
        unlocked: false,
        category: 'progression'
      },
      'power-up-master': {
        id: 'power-up-master',
        name: 'Power-Up Master',
        description: 'Collect 50 power-ups',
        icon: '✨',
        type: 'cumulative',
        target: 50,
        progress: 0,
        unlocked: false,
        category: 'power-ups'
      },
      'perfectionist': {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete a day with 0 angry guests',
        icon: '💯',
        type: 'special',
        target: 1,
        progress: 0,
        unlocked: false,
        category: 'mastery'
      },
      'speed-demon': {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Max out movement speed upgrades',
        icon: '🏃',
        type: 'milestone',
        target: 5,
        progress: 0,
        unlocked: false,
        category: 'progression'
      },
      'master-technician': {
        id: 'master-technician',
        name: 'Master Technician',
        description: 'Max out repair skill upgrades',
        icon: '🛠️',
        type: 'milestone',
        target: 5,
        progress: 0,
        unlocked: false,
        category: 'progression'
      }
    };
    
    // UI state
    this.showAchievements = false;
    this.newAchievements = [];
    this.notificationQueue = [];
    
    // Event system
    this.eventListeners = {};
    
    // Load saved achievement progress
    this.loadAchievementProgress();
    
    // Set up game event listeners
    this.setupGameEventListeners();
  }

  /**
   * Set up event listeners for game events
   * @private
   */
  setupGameEventListeners() {
    // Listen for day completion
    this.gameStateManager.on('dayCompleted', (data) => {
      this.updateAchievement('first-day', 1);
      this.updateAchievement('week-survivor', 1);
      this.updateAchievement('exhibition-veteran', 1);
      
      // Check perfectionist achievement (0 angry guests)
      if (data.angryGuests === 0) {
        this.updateAchievement('perfectionist', 1);
      }
    });
    
    // Listen for money changes
    this.gameStateManager.on('moneyChanged', (data) => {
      if (data.amount > 0) {
        this.updateAchievement('first-pound', data.amount);
        this.updateAchievement('money-maker', data.amount);
        this.updateAchievement('big-earner', data.amount);
      }
    });
    
    // Listen for guest payments (happy guests)
    this.gameStateManager.on('guestPayment', (data) => {
      if (data.satisfaction >= 5) { // Happy guests (satisfaction 5+)
        this.updateAchievement('crowd-pleaser', 1);
      }
      this.updateAchievement('people-person', 1);
    });
    
    // Listen for console repairs
    if (this.game.consoles) {
      this.game.consoles.forEach(console => {
        console.on('repairCompleted', () => {
          this.updateAchievement('repair-expert', 1);
        });
      });
    }
    
    // Listen for character upgrades
    if (this.game.characterUpgradeSystem) {
      this.game.characterUpgradeSystem.on('upgradesPurchased', (data) => {
        this.updateAchievement('upgrade-enthusiast', 1);
        
        // Check for maxed upgrades
        if (data.type === 'speed' && data.level >= 5) {
          this.updateAchievement('speed-demon', data.level);
        }
        if (data.type === 'repair' && data.level >= 5) {
          this.updateAchievement('master-technician', data.level);
        }
      });
    }
    
    // Listen for power-up collection
    if (this.game.powerUpManager) {
      this.game.powerUpManager.on('powerUpCollected', () => {
        this.updateAchievement('power-up-master', 1);
      });
    }
  }

  /**
   * Update achievement progress
   * @param {string} achievementId - Achievement ID
   * @param {number} increment - Amount to add to progress
   */
  updateAchievement(achievementId, increment = 1) {
    const achievement = this.achievements[achievementId];
    if (!achievement || achievement.unlocked) return;

    const oldProgress = achievement.progress;
    
    if (achievement.type === 'cumulative' || achievement.type === 'special') {
      achievement.progress += increment;
    } else if (achievement.type === 'milestone') {
      achievement.progress = Math.max(achievement.progress, increment);
    }

    // Check if achievement should be unlocked
    if (achievement.progress >= achievement.target && !achievement.unlocked) {
      this.unlockAchievement(achievementId);
    }
    
    // Special case for console collector - check current console count
    if (achievementId === 'console-collector' && this.game.consoles) {
      achievement.progress = this.game.consoles.length;
      if (achievement.progress >= achievement.target && !achievement.unlocked) {
        this.unlockAchievement(achievementId);
      }
    }
  }

  /**
   * Unlock an achievement
   * @param {string} achievementId - Achievement ID to unlock
   */
  unlockAchievement(achievementId) {
    const achievement = this.achievements[achievementId];
    if (!achievement || achievement.unlocked) return;

    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();

    // Add to new achievements list
    this.newAchievements.push(achievement);
    
    // Add to notification queue
    this.notificationQueue.push({
      type: 'achievement',
      achievement: achievement,
      timestamp: Date.now()
    });

    // Play unlock sound
    if (this.game.audioSystem) {
      this.game.audioSystem.playSuccessSound();
    }

    // Create floating text
    if (this.game.createFloatingNumber && this.game.character) {
      const characterPos = this.game.character.getPosition();
      this.game.createFloatingNumber(
        characterPos.x,
        characterPos.y - 50,
        `${achievement.icon} ${achievement.name}!`,
        '#FFD700',
        3000,
        { x: 0, y: -20 }
      );
    }

    // Emit achievement unlocked event
    this.emit('achievementUnlocked', {
      achievement: achievement,
      id: achievementId
    });

    // Save progress
    this.saveAchievementProgress();

    console.log(`Achievement unlocked: ${achievement.name}`);
  }

  /**
   * Get achievement progress information
   * @returns {Object} Achievement progress summary
   */
  getAchievementSummary() {
    const categories = {};
    let totalUnlocked = 0;
    let totalAchievements = 0;

    Object.values(this.achievements).forEach(achievement => {
      totalAchievements++;
      if (achievement.unlocked) totalUnlocked++;

      if (!categories[achievement.category]) {
        categories[achievement.category] = {
          total: 0,
          unlocked: 0,
          achievements: []
        };
      }

      categories[achievement.category].total++;
      if (achievement.unlocked) {
        categories[achievement.category].unlocked++;
      }
      categories[achievement.category].achievements.push(achievement);
    });

    return {
      totalUnlocked,
      totalAchievements,
      completionPercentage: (totalUnlocked / totalAchievements) * 100,
      categories,
      recentUnlocks: this.newAchievements.slice(-5)
    };
  }

  /**
   * Get achievements by category
   * @param {string} category - Category name
   * @returns {Array} Achievements in the category
   */
  getAchievementsByCategory(category) {
    return Object.values(this.achievements).filter(achievement => 
      achievement.category === category
    );
  }

  /**
   * Toggle achievement menu visibility
   */
  toggleAchievementMenu() {
    this.showAchievements = !this.showAchievements;
    
    if (this.showAchievements) {
      // Clear new achievements when menu is opened
      this.newAchievements = [];
      this.emit('achievementMenuOpened', {});
    } else {
      this.emit('achievementMenuClosed', {});
    }
  }

  /**
   * Handle keyboard shortcut for achievement menu
   * @param {string} key - Key that was pressed
   * @returns {boolean} True if key was handled
   */
  handleKeyPress(key) {
    if (key === 'KeyA') {
      this.toggleAchievementMenu();
      return true;
    }
    return false;
  }

  /**
   * Update method called each frame
   * @param {number} deltaTime - Time elapsed in milliseconds
   */
  update(deltaTime) {
    // Update console count achievement
    if (this.game.consoles) {
      this.updateAchievement('console-collector', this.game.consoles.length);
    }
    
    // Process notification queue
    this.processNotifications(deltaTime);
  }

  /**
   * Process notification queue
   * @param {number} deltaTime - Time elapsed in milliseconds
   * @private
   */
  processNotifications(deltaTime) {
    // Remove old notifications (older than 10 seconds)
    const now = Date.now();
    this.notificationQueue = this.notificationQueue.filter(notification => 
      now - notification.timestamp < 10000
    );
  }

  /**
   * Render achievement menu and notifications
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    // Render achievement notifications
    this.renderNotifications(renderer);
    
    // Render achievement menu if visible
    if (this.showAchievements) {
      this.renderAchievementMenu(renderer);
    }
  }

  /**
   * Render achievement notifications
   * @param {RenderSystem} renderer - The render system
   * @private
   */
  renderNotifications(renderer) {
    if (this.notificationQueue.length === 0) return;

    const notification = this.notificationQueue[0];
    if (notification.type === 'achievement') {
      const achievement = notification.achievement;
      const elapsed = Date.now() - notification.timestamp;
      const duration = 5000; // 5 seconds
      
      if (elapsed < duration) {
        const opacity = Math.max(0, 1 - (elapsed / duration));
        const y = 50 + Math.sin((elapsed / 1000) * 2) * 5; // Gentle floating animation
        
        // Background
        renderer.drawRect(
          this.game.canvas.width - 320,
          y,
          300,
          60,
          '#1a1a1a',
          true,
          opacity * 0.9
        );
        
        // Border
        renderer.drawRect(
          this.game.canvas.width - 320,
          y,
          300,
          60,
          '#FFD700',
          false,
          2,
          opacity
        );
        
        // Achievement unlocked text
        renderer.drawText(
          'Achievement Unlocked!',
          this.game.canvas.width - 170,
          y + 15,
          {
            font: '12px Arial',
            color: '#FFD700',
            align: 'center',
            alpha: opacity
          }
        );
        
        // Achievement details
        renderer.drawText(
          `${achievement.icon} ${achievement.name}`,
          this.game.canvas.width - 170,
          y + 35,
          {
            font: '14px Arial',
            color: '#FFFFFF',
            align: 'center',
            alpha: opacity
          }
        );
      }
    }
  }

  /**
   * Render achievement menu
   * @param {RenderSystem} renderer - The render system
   * @private
   */
  renderAchievementMenu(renderer) {
    const centerX = this.game.canvas.width / 2;
    const centerY = this.game.canvas.height / 2;
    const menuWidth = 500;
    const menuHeight = 400;

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
      '#FFD700',
      false,
      2
    );

    // Draw title
    renderer.drawText(
      'ACHIEVEMENTS',
      centerX,
      centerY - menuHeight/2 + 30,
      {
        font: '20px Arial',
        color: '#FFFFFF',
        align: 'center'
      }
    );

    // Draw progress summary
    const summary = this.getAchievementSummary();
    renderer.drawText(
      `${summary.totalUnlocked}/${summary.totalAchievements} (${summary.completionPercentage.toFixed(1)}%)`,
      centerX,
      centerY - menuHeight/2 + 55,
      {
        font: '14px Arial',
        color: '#FFD700',
        align: 'center'
      }
    );

    // Draw achievements in a grid
    const achievements = Object.values(this.achievements);
    const startY = centerY - menuHeight/2 + 80;
    const columns = 2;
    const itemWidth = (menuWidth - 60) / columns;
    const itemHeight = 40;

    achievements.forEach((achievement, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = centerX - menuWidth/2 + 30 + (col * itemWidth);
      const y = startY + (row * itemHeight);

      // Skip if outside visible area
      if (y > centerY + menuHeight/2 - 80) return;

      this.renderAchievementItem(renderer, achievement, x, y, itemWidth - 10);
    });

    // Draw instructions
    renderer.drawText(
      'Press A to close',
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
   * Render individual achievement item
   * @param {RenderSystem} renderer - The render system
   * @param {Object} achievement - Achievement object
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width of item
   * @private
   */
  renderAchievementItem(renderer, achievement, x, y, width) {
    const height = 35;
    
    // Background color based on unlock status
    const bgColor = achievement.unlocked ? '#004400' : '#333333';
    const textColor = achievement.unlocked ? '#FFFFFF' : '#888888';
    
    // Draw item background
    renderer.drawRect(x, y, width, height, bgColor, true);
    
    // Draw item border
    renderer.drawRect(x, y, width, height, '#666666', false, 1);

    // Draw achievement icon and name
    const iconText = achievement.unlocked ? achievement.icon : '🔒';
    renderer.drawText(
      `${iconText} ${achievement.name}`,
      x + 5,
      y + 12,
      {
        font: '12px Arial',
        color: textColor,
        align: 'left'
      }
    );

    // Draw progress
    if (!achievement.unlocked) {
      const progressText = `${achievement.progress}/${achievement.target}`;
      renderer.drawText(
        progressText,
        x + width - 5,
        y + 12,
        {
          font: '10px Arial',
          color: '#CCCCCC',
          align: 'right'
        }
      );
      
      // Progress bar
      const progressWidth = 40;
      const progressHeight = 4;
      const progressX = x + width - progressWidth - 5;
      const progressY = y + 20;
      
      renderer.drawRect(progressX, progressY, progressWidth, progressHeight, '#444444', true);
      const fillWidth = (achievement.progress / achievement.target) * progressWidth;
      renderer.drawRect(progressX, progressY, fillWidth, progressHeight, '#00FF00', true);
    }
  }

  /**
   * Save achievement progress to game state
   * @private
   */
  saveAchievementProgress() {
    try {
      const achievementData = {};
      Object.keys(this.achievements).forEach(id => {
        const achievement = this.achievements[id];
        achievementData[id] = {
          progress: achievement.progress,
          unlocked: achievement.unlocked,
          unlockedAt: achievement.unlockedAt
        };
      });
      
      this.gameStateManager.saveGameData({
        achievements: achievementData
      });
    } catch (error) {
      console.warn('Failed to save achievements:', error);
    }
  }

  /**
   * Load achievement progress from game state
   * @private
   */
  loadAchievementProgress() {
    try {
      const saveData = this.gameStateManager.gameData;
      if (saveData && saveData.achievements) {
        Object.keys(saveData.achievements).forEach(id => {
          if (this.achievements[id]) {
            const savedAchievement = saveData.achievements[id];
            this.achievements[id].progress = savedAchievement.progress || 0;
            this.achievements[id].unlocked = savedAchievement.unlocked || false;
            this.achievements[id].unlockedAt = savedAchievement.unlockedAt;
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load achievements:', error);
    }
  }

  /**
   * Reset all achievements (for testing or new game+)
   */
  resetAchievements() {
    Object.values(this.achievements).forEach(achievement => {
      achievement.progress = 0;
      achievement.unlocked = false;
      achievement.unlockedAt = null;
    });
    this.newAchievements = [];
    this.notificationQueue = [];
    this.saveAchievementProgress();
    this.emit('achievementsReset', {});
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