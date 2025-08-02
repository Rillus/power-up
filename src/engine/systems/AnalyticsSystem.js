/**
 * Analytics system for collecting game data and player behavior
 * @class AnalyticsSystem
 */
export class AnalyticsSystem {
  /**
   * Create an analytics system
   * @param {Object} [options] - Analytics options
   * @param {boolean} [options.enabled=true] - Whether analytics is enabled
   * @param {string} [options.sessionId] - Unique session identifier
   * @param {Function} [options.onEvent] - Callback for analytics events
   */
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.sessionId = options.sessionId || this.generateSessionId();
    this.onEvent = options.onEvent || this.defaultEventHandler;
    this.events = [];
    this.maxEvents = 1000; // Prevent memory leaks
    
    // Game state tracking
    this.gameStartTime = null;
    this.totalPlayTime = 0;
    this.lastUpdateTime = 0;
    
    // Player behavior tracking
    this.actions = {
      consolePurchases: 0,
      consoleUpgrades: 0,
      repairs: 0,
      powerUpsCollected: 0,
      characterUpgrades: 0,
      angryGuests: 0,
      totalRevenue: 0,
      daysSurvived: 0
    };
    
    // Session tracking
    this.sessionData = {
      startTime: Date.now(),
      events: [],
      performance: {
        fps: [],
        memoryUsage: []
      }
    };
  }

  /**
   * Generate a unique session ID
   * @returns {string} Session ID
   * @private
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track a game event
   * @param {string} eventName - Name of the event
   * @param {Object} [data] - Event data
   * @param {number} [timestamp] - Event timestamp
   */
  trackEvent(eventName, data = {}, timestamp = Date.now()) {
    if (!this.enabled) return;
    
    const event = {
      eventName,
      data,
      timestamp,
      sessionId: this.sessionId,
      playTime: this.totalPlayTime
    };
    
    this.events.push(event);
    this.sessionData.events.push(event);
    
    // Prevent memory leaks
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents / 2);
    }
    
    // Call event handler
    this.onEvent(event);
  }

  /**
   * Track player action
   * @param {string} action - Action name
   * @param {Object} [data] - Action data
   */
  trackAction(action, data = {}) {
    if (!this.enabled) return;
    
    // Update action counters
    if (this.actions.hasOwnProperty(action)) {
      this.actions[action]++;
    }
    
    this.trackEvent('player_action', {
      action,
      ...data,
      actionCount: this.actions[action] || 0
    });
  }

  /**
   * Track game state change
   * @param {string} fromState - Previous state
   * @param {string} toState - New state
   * @param {Object} [data] - Additional data
   */
  trackStateChange(fromState, toState, data = {}) {
    if (!this.enabled) return;
    
    this.trackEvent('state_change', {
      fromState,
      toState,
      ...data
    });
  }

  /**
   * Track performance metrics
   * @param {Object} metrics - Performance metrics
   * @param {number} metrics.fps - Frames per second
   * @param {number} [metrics.memoryUsage] - Memory usage in MB
   * @param {number} [metrics.deltaTime] - Frame delta time
   */
  trackPerformance(metrics) {
    if (!this.enabled) return;
    
    if (metrics.fps !== undefined) {
      this.sessionData.performance.fps.push(metrics.fps);
      // Keep only last 100 FPS readings
      if (this.sessionData.performance.fps.length > 100) {
        this.sessionData.performance.fps = this.sessionData.performance.fps.slice(-100);
      }
    }
    
    if (metrics.memoryUsage !== undefined) {
      this.sessionData.performance.memoryUsage.push(metrics.memoryUsage);
      // Keep only last 50 memory readings
      if (this.sessionData.performance.memoryUsage.length > 50) {
        this.sessionData.performance.memoryUsage = this.sessionData.performance.memoryUsage.slice(-50);
      }
    }
    
    this.trackEvent('performance', metrics);
  }

  /**
   * Track game session start
   * @param {Object} [data] - Session data
   */
  trackSessionStart(data = {}) {
    if (!this.enabled) return;
    
    this.gameStartTime = Date.now();
    this.lastUpdateTime = this.gameStartTime;
    
    this.trackEvent('session_start', {
      sessionId: this.sessionId,
      ...data
    });
  }

  /**
   * Track game session end
   * @param {Object} [data] - Session data
   */
  trackSessionEnd(data = {}) {
    if (!this.enabled) return;
    
    const sessionDuration = Date.now() - this.sessionData.startTime;
    
    this.trackEvent('session_end', {
      sessionId: this.sessionId,
      sessionDuration,
      totalPlayTime: this.totalPlayTime,
      actions: { ...this.actions },
      ...data
    });
  }

  /**
   * Track day progression
   * @param {number} day - Current day
   * @param {Object} [data] - Day data
   */
  trackDayProgress(day, data = {}) {
    if (!this.enabled) return;
    
    this.actions.daysSurvived = day;
    
    this.trackEvent('day_progress', {
      day,
      totalPlayTime: this.totalPlayTime,
      actions: { ...this.actions },
      ...data
    });
  }

  /**
   * Track revenue changes
   * @param {number} amount - Revenue amount
   * @param {string} source - Revenue source
   * @param {Object} [data] - Additional data
   */
  trackRevenue(amount, source, data = {}) {
    if (!this.enabled) return;
    
    this.actions.totalRevenue += amount;
    
    this.trackEvent('revenue', {
      amount,
      source,
      totalRevenue: this.actions.totalRevenue,
      ...data
    });
  }

  /**
   * Track angry guest
   * @param {Object} [data] - Guest data
   */
  trackAngryGuest(data = {}) {
    if (!this.enabled) return;
    
    this.actions.angryGuests++;
    
    this.trackEvent('angry_guest', {
      angryGuestCount: this.actions.angryGuests,
      ...data
    });
  }

  /**
   * Update analytics system
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    if (!this.enabled || !this.gameStartTime) return;
    
    const currentTime = Date.now();
    this.totalPlayTime += (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = currentTime;
  }

  /**
   * Get analytics summary
   * @returns {Object} Analytics summary
   */
  getSummary() {
    const avgFps = this.sessionData.performance.fps.length > 0 
      ? this.sessionData.performance.fps.reduce((a, b) => a + b, 0) / this.sessionData.performance.fps.length 
      : 0;
    
    const avgMemory = this.sessionData.performance.memoryUsage.length > 0
      ? this.sessionData.performance.memoryUsage.reduce((a, b) => a + b, 0) / this.sessionData.performance.memoryUsage.length
      : 0;
    
    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionData.startTime,
      totalPlayTime: this.totalPlayTime,
      eventsCount: this.events.length,
      actions: { ...this.actions },
      performance: {
        avgFps: Math.round(avgFps * 100) / 100,
        avgMemory: Math.round(avgMemory * 100) / 100,
        fpsSamples: this.sessionData.performance.fps.length,
        memorySamples: this.sessionData.performance.memoryUsage.length
      }
    };
  }

  /**
   * Export analytics data
   * @returns {Object} Analytics data for export
   */
  exportData() {
    return {
      sessionId: this.sessionId,
      sessionData: this.sessionData,
      events: this.events,
      actions: this.actions,
      summary: this.getSummary()
    };
  }

  /**
   * Clear analytics data
   */
  clear() {
    this.events = [];
    this.sessionData.events = [];
    this.sessionData.performance.fps = [];
    this.sessionData.performance.memoryUsage = [];
    this.actions = {
      consolePurchases: 0,
      consoleUpgrades: 0,
      repairs: 0,
      powerUpsCollected: 0,
      characterUpgrades: 0,
      angryGuests: 0,
      totalRevenue: 0,
      daysSurvived: 0
    };
  }

  /**
   * Enable or disable analytics
   * @param {boolean} enabled - Whether analytics is enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Default event handler (logs to console in development)
   * @param {Object} event - Analytics event
   * @private
   */
  defaultEventHandler(event) {
    // In development, log events to console
    // Check if we're in a browser environment and if console is available
    if (typeof window !== 'undefined' && typeof console !== 'undefined') {
      console.log('Analytics Event:', event.eventName, event.data);
    }
    
    // In production, this could send to analytics service
    // Example: sendToAnalyticsService(event);
  }

  /**
   * Set custom event handler
   * @param {Function} handler - Event handler function
   */
  setEventHandler(handler) {
    this.onEvent = handler;
  }
} 