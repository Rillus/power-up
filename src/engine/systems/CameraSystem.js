/**
 * Camera system for smooth camera follow with slight lag for dynamism
 * @class CameraSystem
 */
export class CameraSystem {
  /**
   * Create a camera system
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   * @param {Object} [options] - Camera options
   * @param {number} [options.followSpeed=0.1] - How quickly camera follows target (0-1)
   * @param {number} [options.lookAheadDistance=50] - Distance to look ahead of target
   * @param {number} [options.maxLookAhead=100] - Maximum look ahead distance
   * @param {boolean} [options.enabled=true] - Whether camera follow is enabled
   */
  constructor(canvasWidth, canvasHeight, options = {}) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Camera options
    this.followSpeed = options.followSpeed || 0.1;
    this.lookAheadDistance = options.lookAheadDistance || 50;
    this.maxLookAhead = options.maxLookAhead || 100;
    this.enabled = options.enabled !== false;
    
    // Camera state
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    
    // World bounds (to prevent camera from going outside playable area)
    this.worldBounds = {
      left: 0,
      right: canvasWidth,
      top: 0,
      bottom: canvasHeight
    };
    
    // Screen shake effect
    this.shakeIntensity = 0;
    this.shakeDecay = 0.95;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  /**
   * Set the target position for the camera to follow
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   * @param {Object} [velocity] - Target velocity for look-ahead
   * @param {number} [velocity.x=0] - X velocity
   * @param {number} [velocity.y=0] - Y velocity
   */
  setTarget(x, y, velocity = { x: 0, y: 0 }) {
    if (!this.enabled) return;
    
    // Calculate look-ahead based on velocity
    const lookAheadX = Math.min(Math.abs(velocity.x) * this.lookAheadDistance / 200, this.maxLookAhead);
    const lookAheadY = Math.min(Math.abs(velocity.y) * this.lookAheadDistance / 200, this.maxLookAhead);
    
    // Apply look-ahead in the direction of movement
    this.targetX = x + (velocity.x > 0 ? lookAheadX : velocity.x < 0 ? -lookAheadX : 0);
    this.targetY = y + (velocity.y > 0 ? lookAheadY : velocity.y < 0 ? -lookAheadY : 0);
    
    // Center the target on screen
    this.targetX -= this.canvasWidth / 2;
    this.targetY -= this.canvasHeight / 2;
  }

  /**
   * Update camera position with smooth follow
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    if (!this.enabled) return;
    
    // Smooth follow with lerp
    const lerpFactor = Math.min(this.followSpeed * deltaTime * 60, 1);
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;
    
    // Clamp to world bounds
    this.x = Math.max(this.worldBounds.left, Math.min(this.worldBounds.right - this.canvasWidth, this.x));
    this.y = Math.max(this.worldBounds.top, Math.min(this.worldBounds.bottom - this.canvasHeight, this.y));
    
    // Update screen shake
    this.updateShake(deltaTime);
  }

  /**
   * Update screen shake effect
   * @param {number} deltaTime - Time since last update in seconds
   * @private
   */
  updateShake(deltaTime) {
    if (this.shakeIntensity > 0.1) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
      
      // Set to 0 when it gets very low to avoid floating point precision issues
      if (this.shakeIntensity < 0.05) {
        this.shakeIntensity = 0;
      }
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeIntensity = 0;
    }
  }

  /**
   * Add screen shake effect
   * @param {number} intensity - Shake intensity
   * @param {number} [decay=0.95] - How quickly shake decays
   */
  addShake(intensity, decay = 0.95) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDecay = decay;
  }

  /**
   * Get the current camera transform matrix
   * @returns {DOMMatrix} Camera transform matrix
   */
  getTransform() {
    // Handle test environment where DOMMatrix might not be available
    if (typeof DOMMatrix === 'undefined') {
      // Return a mock matrix for testing
      return {
        a: 1, b: 0, c: 0, d: 1,
        e: -this.x + this.shakeOffsetX,
        f: -this.y + this.shakeOffsetY
      };
    }
    
    const matrix = new DOMMatrix();
    matrix.translateSelf(-this.x + this.shakeOffsetX, -this.y + this.shakeOffsetY);
    return matrix;
  }

  /**
   * Get camera position
   * @returns {Object} Camera position {x, y}
   */
  getPosition() {
    return {
      x: this.x,
      y: this.y
    };
  }

  /**
   * Set world bounds for camera clamping
   * @param {Object} bounds - World bounds
   * @param {number} bounds.left - Left boundary
   * @param {number} bounds.right - Right boundary
   * @param {number} bounds.top - Top boundary
   * @param {number} bounds.bottom - Bottom boundary
   */
  setWorldBounds(bounds) {
    this.worldBounds = { ...bounds };
  }

  /**
   * Enable or disable camera follow
   * @param {boolean} enabled - Whether camera follow is enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Set camera follow speed
   * @param {number} speed - Follow speed (0-1)
   */
  setFollowSpeed(speed) {
    this.followSpeed = Math.max(0, Math.min(1, speed));
  }

  /**
   * Set look-ahead distance
   * @param {number} distance - Look-ahead distance
   */
  setLookAheadDistance(distance) {
    this.lookAheadDistance = Math.max(0, distance);
  }

  /**
   * Reset camera to origin
   */
  reset() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  /**
   * Export camera state for save/load
   * @returns {Object} Camera state
   */
  exportState() {
    return {
      x: this.x,
      y: this.y,
      targetX: this.targetX,
      targetY: this.targetY,
      enabled: this.enabled,
      followSpeed: this.followSpeed,
      lookAheadDistance: this.lookAheadDistance,
      worldBounds: { ...this.worldBounds }
    };
  }

  /**
   * Import camera state from save/load
   * @param {Object} state - Camera state
   */
  importState(state) {
    if (state.x !== undefined) this.x = state.x;
    if (state.y !== undefined) this.y = state.y;
    if (state.targetX !== undefined) this.targetX = state.targetX;
    if (state.targetY !== undefined) this.targetY = state.targetY;
    if (state.enabled !== undefined) this.enabled = state.enabled;
    if (state.followSpeed !== undefined) this.followSpeed = state.followSpeed;
    if (state.lookAheadDistance !== undefined) this.lookAheadDistance = state.lookAheadDistance;
    if (state.worldBounds) this.worldBounds = { ...state.worldBounds };
  }
} 