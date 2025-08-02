/**
 * Statistics System for displaying comprehensive game statistics
 * @class
 */
export class StatisticsSystem {
  constructor(game, gameStateManager) {
    this.game = game;
    this.gameStateManager = gameStateManager;
    this.isVisible = false;
    this.achievementSystem = game.achievementSystem;
    
    // Statistics categories
    this.categories = [
      'overview',
      'performance',
      'achievements',
      'records'
    ];
    this.currentCategory = 'overview';
  }

  /**
   * Toggle statistics panel visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
    console.log(`Statistics panel ${this.isVisible ? 'opened' : 'closed'}`);
  }

  /**
   * Handle keyboard input for statistics panel
   * @param {string} key - Key that was pressed
   */
  handleKeyInput(key) {
    if (!this.isVisible) return;

    switch (key) {
      case 'Digit1':
        this.currentCategory = 'overview';
        break;
      case 'Digit2':
        this.currentCategory = 'performance';
        break;
      case 'Digit3':
        this.currentCategory = 'achievements';
        break;
      case 'Digit4':
        this.currentCategory = 'records';
        break;
      case 'Tab':
        // Cycle through categories
        const currentIndex = this.categories.indexOf(this.currentCategory);
        const nextIndex = (currentIndex + 1) % this.categories.length;
        this.currentCategory = this.categories[nextIndex];
        break;
    }
  }

  /**
   * Get formatted statistics for display
   * @returns {Object} Formatted statistics by category
   */
  getFormattedStatistics() {
    const stats = this.gameStateManager.getGameStats();
    const gameData = this.gameStateManager.gameData;
    
    return {
      overview: {
        'Current Day': stats.day,
        'Money': `£${stats.money.toLocaleString()}`,
        'Total Revenue': `£${stats.totalRevenue.toLocaleString()}`,
        'Total Guests': stats.totalGuests.toLocaleString(),
        'Current Score': stats.currentScore.toLocaleString(),
        'Time Played': this.formatTime(stats.timePlayedMs)
      },
      
      performance: {
        'Average Revenue/Day': `£${Math.round(stats.averageRevenuePerDay).toLocaleString()}`,
        'Average Guests/Day': Math.round(stats.averageGuestsPerDay).toLocaleString(),
        'Perfect Days': gameData.perfectDays || 0,
        'High Score': stats.highScore.toLocaleString(),
        'Efficiency Rating': this.calculateEfficiencyRating(stats),
        'Success Rate': this.calculateSuccessRate(stats)
      },
      
      achievements: {
        'Unlocked': this.achievementSystem.getUnlockedCount(),
        'Total Available': this.achievementSystem.getTotalCount(),
        'Completion': `${Math.round(this.achievementSystem.getCompletionPercentage())}%`,
        'Recent Achievement': this.achievementSystem.getMostRecentAchievement()?.name || 'None',
        'Points Earned': this.achievementSystem.getTotalPoints(),
        'Next Milestone': this.getNextAchievementMilestone()
      },
      
      records: {
        'Best Single Day Revenue': `£${gameData.bestDayRevenue || 0}`,
        'Most Guests in One Day': gameData.mostGuestsInDay || 0,
        'Longest Streak': `${gameData.longestPerfectStreak || 0} days`,
        'Fastest Day Completion': this.formatTime(gameData.fastestDay || 0),
        'Total Days Played': gameData.totalDaysPlayed || 0,
        'Consoles Repaired': gameData.consolesRepaired || 0
      }
    };
  }

  /**
   * Calculate efficiency rating based on performance
   * @param {Object} stats - Game statistics
   * @returns {string} Efficiency rating
   */
  calculateEfficiencyRating(stats) {
    if (stats.day === 0) return 'N/A';
    
    const revenuePerDay = stats.averageRevenuePerDay;
    const guestsPerDay = stats.averageGuestsPerDay;
    
    if (revenuePerDay > 500 && guestsPerDay > 50) return 'Excellent';
    if (revenuePerDay > 300 && guestsPerDay > 30) return 'Good';
    if (revenuePerDay > 150 && guestsPerDay > 15) return 'Average';
    return 'Needs Improvement';
  }

  /**
   * Calculate success rate percentage
   * @param {Object} stats - Game statistics
   * @returns {string} Success rate percentage
   */
  calculateSuccessRate(stats) {
    const gameData = this.gameStateManager.gameData;
    const perfectDays = gameData.perfectDays || 0;
    const totalDays = gameData.totalDaysPlayed || 0;
    
    if (totalDays === 0) return '0%';
    return `${Math.round((perfectDays / totalDays) * 100)}%`;
  }

  /**
   * Get next achievement milestone
   * @returns {string} Next milestone description
   */
  getNextAchievementMilestone() {
    const unlocked = this.achievementSystem.getUnlockedCount();
    const total = this.achievementSystem.getTotalCount();
    
    const milestones = [5, 10, 15, 20, total];
    const nextMilestone = milestones.find(m => m > unlocked);
    
    return nextMilestone ? `${nextMilestone} achievements` : 'All unlocked!';
  }

  /**
   * Format milliseconds to readable time
   * @param {number} ms - Milliseconds
   * @returns {string} Formatted time string
   */
  formatTime(ms) {
    if (!ms || ms === 0) return '0m 0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Render the statistics panel
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    if (!this.isVisible) return;

    const canvas = renderer.canvas;
    const ctx = renderer.context;
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Main panel background
    const panelWidth = 600;
    const panelHeight = 500;
    const panelX = (canvas.width - panelWidth) / 2;
    const panelY = (canvas.height - panelHeight) / 2;
    
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Panel border
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Title
    renderer.drawText(
      'GAME STATISTICS',
      panelX + panelWidth / 2,
      panelY + 30,
      {
        font: 'bold 24px Arial',
        color: '#ecf0f1',
        align: 'center'
      }
    );
    
    // Category tabs
    this.renderTabs(renderer, panelX, panelY + 60, panelWidth);
    
    // Statistics content
    this.renderStatistics(renderer, panelX + 20, panelY + 120, panelWidth - 40);
    
    // Controls hint
    renderer.drawText(
      'Controls: 1-4 (Categories) | TAB (Next) | S (Close)',
      panelX + panelWidth / 2,
      panelY + panelHeight - 20,
      {
        font: '12px Arial',
        color: '#95a5a6',
        align: 'center'
      }
    );
  }

  /**
   * Render category tabs
   * @param {RenderSystem} renderer - Render system
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Total width
   */
  renderTabs(renderer, x, y, width) {
    const tabWidth = width / this.categories.length;
    
    this.categories.forEach((category, index) => {
      const tabX = x + index * tabWidth;
      const isActive = category === this.currentCategory;
      
      // Tab background
      renderer.context.fillStyle = isActive ? '#3498db' : '#34495e';
      renderer.context.fillRect(tabX, y, tabWidth, 40);
      
      // Tab border
      renderer.context.strokeStyle = '#2c3e50';
      renderer.context.lineWidth = 1;
      renderer.context.strokeRect(tabX, y, tabWidth, 40);
      
      // Tab text
      renderer.drawText(
        category.toUpperCase(),
        tabX + tabWidth / 2,
        y + 25,
        {
          font: isActive ? 'bold 14px Arial' : '12px Arial',
          color: isActive ? '#ffffff' : '#bdc3c7',
          align: 'center'
        }
      );
    });
  }

  /**
   * Render statistics for current category
   * @param {RenderSystem} renderer - Render system
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   */
  renderStatistics(renderer, x, y, width) {
    const stats = this.getFormattedStatistics();
    const categoryStats = stats[this.currentCategory];
    
    let currentY = y;
    const lineHeight = 35;
    const leftColumnWidth = width * 0.6;
    
    Object.entries(categoryStats).forEach(([label, value]) => {
      // Label
      renderer.drawText(
        label + ':',
        x,
        currentY,
        {
          font: '16px Arial',
          color: '#bdc3c7',
          align: 'left'
        }
      );
      
      // Value
      renderer.drawText(
        value.toString(),
        x + leftColumnWidth,
        currentY,
        {
          font: 'bold 16px Arial',
          color: '#ecf0f1',
          align: 'left'
        }
      );
      
      currentY += lineHeight;
    });
  }
}