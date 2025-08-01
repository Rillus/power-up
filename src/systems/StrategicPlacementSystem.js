/**
 * Strategic Placement System for optimizing console layout and guest flow
 * @class
 */
export class StrategicPlacementSystem {
  /**
   * Create a strategic placement system
   * @param {Object} game - Reference to the main game instance
   */
  constructor(game) {
    this.game = game;
    
    // Placement zones (areas with different strategic values)
    this.zones = {
      entrance: { x: 0, y: 200, width: 200, height: 400, multiplier: 1.3 }, // High traffic
      center: { x: 200, y: 200, width: 800, height: 400, multiplier: 1.0 }, // Neutral
      corner: { x: 1000, y: 100, width: 200, height: 200, multiplier: 0.8 }, // Low traffic
      premium: { x: 400, y: 300, width: 400, height: 200, multiplier: 1.2 } // Premium spot
    };
    
    // Console clustering parameters
    this.clusterRadius = 150; // Radius for console clusters
    this.clusterBonus = 0.3; // 30% appeal bonus for clustered consoles
    this.maxClusterSize = 4; // Maximum consoles in a cluster for bonus
    
    // Guest flow parameters
    this.appealRadius = 120; // Radius where console appeal affects guests
    this.congestionPenalty = 0.1; // 10% appeal reduction per extra guest in area
    
    // Event system
    this.eventListeners = {};
  }

  /**
   * Get strategic value of a position for console placement
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Object} Strategic analysis of the position
   */
  analyzePosition(x, y) {
    const zoneMultiplier = this.getZoneMultiplier(x, y);
    const clusterInfo = this.analyzeClusterPotential(x, y);
    const congestionLevel = this.getCongestionLevel(x, y);
    
    return {
      zoneMultiplier,
      clusterBonus: clusterInfo.bonus,
      nearbyConsoles: clusterInfo.count,
      congestionLevel,
      overallScore: zoneMultiplier + clusterInfo.bonus - (congestionLevel * this.congestionPenalty),
      recommendation: this.getPlacementRecommendation(zoneMultiplier, clusterInfo, congestionLevel)
    };
  }

  /**
   * Get zone multiplier for a position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {number} Zone multiplier (0.8 to 1.3)
   */
  getZoneMultiplier(x, y) {
    for (const [zoneName, zone] of Object.entries(this.zones)) {
      if (x >= zone.x && x <= zone.x + zone.width &&
          y >= zone.y && y <= zone.y + zone.height) {
        return zone.multiplier;
      }
    }
    return 1.0; // Default neutral zone
  }

  /**
   * Analyze cluster potential at a position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Object} Cluster analysis
   */
  analyzeClusterPotential(x, y) {
    const nearbyConsoles = this.getConsolesInRadius(x, y, this.clusterRadius);
    const count = nearbyConsoles.length;
    
    let bonus = 0;
    if (count > 0 && count <= this.maxClusterSize) {
      bonus = Math.min(count * (this.clusterBonus / this.maxClusterSize), this.clusterBonus);
    }
    
    return {
      count,
      bonus,
      consoles: nearbyConsoles
    };
  }

  /**
   * Get congestion level at a position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {number} Number of guests in the area
   */
  getCongestionLevel(x, y) {
    return this.game.guests.filter(guest => {
      const transform = guest.getComponent('Transform');
      if (!transform) return false;
      
      const dx = transform.x - x;
      const dy = transform.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance <= this.appealRadius;
    }).length;
  }

  /**
   * Get consoles within radius of a position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} radius - Search radius
   * @returns {Array} Consoles within radius
   */
  getConsolesInRadius(x, y, radius) {
    return this.game.consoles.filter(console => {
      const transform = console.getComponent('Transform');
      if (!transform) return false;
      
      const dx = transform.x - x;
      const dy = transform.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance <= radius;
    });
  }

  /**
   * Get placement recommendation text
   * @param {number} zoneMultiplier - Zone multiplier
   * @param {Object} clusterInfo - Cluster information
   * @param {number} congestionLevel - Congestion level
   * @returns {string} Recommendation text
   */
  getPlacementRecommendation(zoneMultiplier, clusterInfo, congestionLevel) {
    if (zoneMultiplier >= 1.2 && clusterInfo.bonus > 0.1) {
      return 'Excellent - High traffic zone with cluster bonus';
    } else if (zoneMultiplier >= 1.2) {
      return 'Good - High traffic zone';
    } else if (clusterInfo.bonus > 0.2) {
      return 'Good - Strong cluster synergy';
    } else if (congestionLevel > 3) {
      return 'Poor - High congestion area';
    } else if (zoneMultiplier < 0.9) {
      return 'Poor - Low traffic zone';
    } else {
      return 'Average - Standard placement';
    }
  }

  /**
   * Calculate effective appeal for a console considering its strategic placement
   * @param {GameConsole} console - Console to analyze
   * @returns {number} Effective appeal considering placement
   */
  getEffectiveAppeal(console) {
    const transform = console.getComponent('Transform');
    if (!transform) return console.appeal;
    
    const analysis = this.analyzePosition(transform.x, transform.y);
    const baseAppeal = console.appeal;
    
    // Apply strategic modifiers
    let effectiveAppeal = baseAppeal * analysis.zoneMultiplier;
    effectiveAppeal += baseAppeal * analysis.clusterBonus;
    effectiveAppeal *= (1 - (analysis.congestionLevel * this.congestionPenalty));
    
    return Math.max(1, Math.floor(effectiveAppeal)); // Minimum appeal of 1
  }

  /**
   * Find optimal console for a guest based on strategic placement
   * @param {Guest} guest - Guest looking for console
   * @param {Array} consoles - Available consoles
   * @returns {Object|null} Best console considering appeal and distance
   */
  findOptimalConsole(guest, consoles) {
    const guestTransform = guest.getComponent('Transform');
    if (!guestTransform) return null;
    
    const availableConsoles = consoles.filter(console => console.isOperational());
    if (availableConsoles.length === 0) return null;
    
    let bestConsole = null;
    let bestScore = -1;
    
    for (const console of availableConsoles) {
      const consoleTransform = console.getComponent('Transform');
      if (!consoleTransform) continue;
      
      // Calculate distance factor (closer is better)
      const dx = consoleTransform.x - guestTransform.x;
      const dy = consoleTransform.y - guestTransform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const distanceFactor = Math.max(0.1, 1 - (distance / 400)); // Normalize to 0.1-1.0
      
      // Get effective appeal including strategic placement
      const effectiveAppeal = this.getEffectiveAppeal(console);
      const appealFactor = effectiveAppeal / 12; // Normalize appeal (max ~12)
      
      // Check if console appeals to guest type
      const typeBonus = console.appealsToGuestType(guest.type) ? 1.5 : 1.0;
      
      // Calculate combined score (appeal weighted higher than distance)
      const score = (appealFactor * 0.6 + distanceFactor * 0.4) * typeBonus;
      
      if (score > bestScore) {
        bestScore = score;
        bestConsole = console;
      }
    }
    
    return bestConsole;
  }

  /**
   * Get strategic placement visualization data for debug/UI
   * @returns {Object} Visualization data
   */
  getVisualizationData() {
    const heatmap = [];
    const gridSize = 50;
    
    // Generate heatmap of strategic values
    for (let x = 0; x < 1200; x += gridSize) {
      for (let y = 0; y < 800; y += gridSize) {
        const analysis = this.analyzePosition(x, y);
        heatmap.push({
          x, y,
          score: analysis.overallScore,
          zone: this.getZoneMultiplier(x, y),
          cluster: analysis.clusterBonus,
          congestion: analysis.congestionLevel
        });
      }
    }
    
    return {
      heatmap,
      zones: this.zones,
      consoleAnalysis: this.game.consoles.map(console => {
        const transform = console.getComponent('Transform');
        return {
          console,
          x: transform.x,
          y: transform.y,
          effectiveAppeal: this.getEffectiveAppeal(console),
          analysis: this.analyzePosition(transform.x, transform.y)
        };
      })
    };
  }

  /**
   * Update strategic placement analysis (called each frame)
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Update congestion levels and emit events if needed
    for (const console of this.game.consoles) {
      const transform = console.getComponent('Transform');
      if (!transform) continue;
      
      const congestion = this.getCongestionLevel(transform.x, transform.y);
      const effectiveAppeal = this.getEffectiveAppeal(console);
      
      // Store strategic data on console for use by other systems
      console.strategicData = {
        effectiveAppeal,
        congestion,
        zoneMultiplier: this.getZoneMultiplier(transform.x, transform.y)
      };
    }
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