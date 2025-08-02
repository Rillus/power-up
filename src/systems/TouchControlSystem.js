/**
 * Touch Control System for mobile devices
 * Provides virtual joystick and touch buttons for mobile gameplay
 * @class TouchControlSystem
 */
export class TouchControlSystem {
  constructor(canvas, inputSystem) {
    this.canvas = canvas;
    this.inputSystem = inputSystem;
    
    // Touch control state
    this.isEnabled = false;
    this.isMobile = this.detectMobile();
    
    // Virtual joystick
    this.joystick = {
      active: false,
      centerX: 0,
      centerY: 0,
      currentX: 0,
      currentY: 0,
      radius: 50,
      deadZone: 10,
      maxDistance: 40,
      touchId: null
    };
    
    // Action buttons
    this.actionButtons = {
      repair: {
        x: 0,
        y: 0,
        radius: 30,
        active: false,
        touchId: null,
        label: 'R',
        action: 'KeyR'
      },
      menu: {
        x: 0,
        y: 0,
        radius: 25,
        active: false,
        touchId: null,
        label: '☰',
        action: 'Escape'
      }
    };
    
    // Touch tracking
    this.activeTouches = new Map();
    
    // Visual styling
    this.style = {
      joystickBase: {
        fillStyle: 'rgba(255, 255, 255, 0.3)',
        strokeStyle: 'rgba(255, 255, 255, 0.6)',
        lineWidth: 2
      },
      joystickKnob: {
        fillStyle: 'rgba(255, 255, 255, 0.8)',
        strokeStyle: 'rgba(0, 0, 0, 0.3)',
        lineWidth: 1
      },
      actionButton: {
        fillStyle: 'rgba(255, 255, 255, 0.4)',
        strokeStyle: 'rgba(255, 255, 255, 0.7)',
        lineWidth: 2,
        font: '16px Arial',
        textColor: 'rgba(255, 255, 255, 0.9)'
      },
      activeButton: {
        fillStyle: 'rgba(0, 150, 255, 0.6)',
        strokeStyle: 'rgba(0, 150, 255, 0.9)'
      }
    };
    
    // Initialize if mobile
    if (this.isMobile) {
      this.enable();
    }
  }

  /**
   * Detect if running on mobile device
   * @returns {boolean} True if mobile device detected
   */
  detectMobile() {
    // Check for touch capability and mobile user agents
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const smallScreen = window.innerWidth <= 768;
    
    return hasTouchScreen && (mobileUA || smallScreen);
  }

  /**
   * Enable touch controls
   */
  enable() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.updateLayout();
    this.bindEvents();
    
    console.log('Touch controls enabled');
  }

  /**
   * Disable touch controls
   */
  disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    this.unbindEvents();
    this.resetControls();
    
    console.log('Touch controls disabled');
  }

  /**
   * Update control layout based on canvas size
   */
  updateLayout() {
    const rect = this.canvas.getBoundingClientRect();
    const padding = 20;
    
    // Position joystick in bottom-left
    this.joystick.centerX = this.joystick.radius + padding;
    this.joystick.centerY = rect.height - this.joystick.radius - padding;
    
    // Position action buttons in bottom-right
    const buttonSpacing = 70;
    this.actionButtons.repair.x = rect.width - this.actionButtons.repair.radius - padding;
    this.actionButtons.repair.y = rect.height - this.actionButtons.repair.radius - padding;
    
    this.actionButtons.menu.x = rect.width - this.actionButtons.menu.radius - padding;
    this.actionButtons.menu.y = rect.height - this.actionButtons.menu.radius - padding - buttonSpacing;
  }

  /**
   * Bind touch event listeners
   */
  bindEvents() {
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
    
    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Update layout on resize
    window.addEventListener('resize', this.updateLayout.bind(this));
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateLayout(), 100);
    });
  }

  /**
   * Unbind touch event listeners
   */
  unbindEvents() {
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
    
    window.removeEventListener('resize', this.updateLayout.bind(this));
  }

  /**
   * Handle touch start events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    event.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    
    for (let touch of event.changedTouches) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Check joystick area
      if (this.isPointInJoystickArea(x, y) && !this.joystick.active) {
        this.activateJoystick(touch.identifier, x, y);
        continue;
      }
      
      // Check action buttons
      for (let [buttonName, button] of Object.entries(this.actionButtons)) {
        if (this.isPointInButton(x, y, button) && !button.active) {
          this.activateButton(buttonName, touch.identifier);
          break;
        }
      }
    }
  }

  /**
   * Handle touch move events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    event.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    
    for (let touch of event.changedTouches) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Update joystick if this touch is controlling it
      if (this.joystick.active && this.joystick.touchId === touch.identifier) {
        this.updateJoystick(x, y);
      }
    }
  }

  /**
   * Handle touch end events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    event.preventDefault();
    
    for (let touch of event.changedTouches) {
      // Release joystick if this touch was controlling it
      if (this.joystick.active && this.joystick.touchId === touch.identifier) {
        this.releaseJoystick();
      }
      
      // Release action buttons
      for (let [buttonName, button] of Object.entries(this.actionButtons)) {
        if (button.active && button.touchId === touch.identifier) {
          this.releaseButton(buttonName);
        }
      }
    }
  }

  /**
   * Check if point is in joystick area
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if point is in joystick area
   */
  isPointInJoystickArea(x, y) {
    const dx = x - this.joystick.centerX;
    const dy = y - this.joystick.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.joystick.radius * 1.5; // Larger touch area for easier use
  }

  /**
   * Check if point is in button
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} button - Button object
   * @returns {boolean} True if point is in button
   */
  isPointInButton(x, y, button) {
    const dx = x - button.x;
    const dy = y - button.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= button.radius;
  }

  /**
   * Activate joystick
   * @param {number} touchId - Touch identifier
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  activateJoystick(touchId, x, y) {
    this.joystick.active = true;
    this.joystick.touchId = touchId;
    this.updateJoystick(x, y);
  }

  /**
   * Update joystick position and input
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updateJoystick(x, y) {
    const dx = x - this.joystick.centerX;
    const dy = y - this.joystick.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Clamp to max distance
    if (distance > this.joystick.maxDistance) {
      const angle = Math.atan2(dy, dx);
      this.joystick.currentX = this.joystick.centerX + Math.cos(angle) * this.joystick.maxDistance;
      this.joystick.currentY = this.joystick.centerY + Math.sin(angle) * this.joystick.maxDistance;
    } else {
      this.joystick.currentX = x;
      this.joystick.currentY = y;
    }
    
    // Calculate input values
    this.updateMovementInput();
  }

  /**
   * Release joystick
   */
  releaseJoystick() {
    this.joystick.active = false;
    this.joystick.touchId = null;
    this.joystick.currentX = this.joystick.centerX;
    this.joystick.currentY = this.joystick.centerY;
    
    // Clear movement input
    this.clearMovementInput();
  }

  /**
   * Activate action button
   * @param {string} buttonName - Button name
   * @param {number} touchId - Touch identifier
   */
  activateButton(buttonName, touchId) {
    const button = this.actionButtons[buttonName];
    button.active = true;
    button.touchId = touchId;
    
    // Send key press to input system
    if (this.inputSystem) {
      this.inputSystem.simulateKeyPress(button.action);
    }
  }

  /**
   * Release action button
   * @param {string} buttonName - Button name
   */
  releaseButton(buttonName) {
    const button = this.actionButtons[buttonName];
    button.active = false;
    button.touchId = null;
    
    // Send key release to input system
    if (this.inputSystem) {
      this.inputSystem.simulateKeyRelease(button.action);
    }
  }

  /**
   * Update movement input based on joystick position
   */
  updateMovementInput() {
    const dx = this.joystick.currentX - this.joystick.centerX;
    const dy = this.joystick.currentY - this.joystick.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Clear previous movement
    this.clearMovementInput();
    
    // Apply dead zone
    if (distance < this.joystick.deadZone) {
      return;
    }
    
    // Normalize to direction
    const normalizedX = dx / this.joystick.maxDistance;
    const normalizedY = dy / this.joystick.maxDistance;
    
    // Convert to WASD inputs
    if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
      // Horizontal movement dominant
      if (normalizedX > 0.3) {
        this.inputSystem.simulateKeyPress('KeyD'); // Right
      } else if (normalizedX < -0.3) {
        this.inputSystem.simulateKeyPress('KeyA'); // Left
      }
    } else {
      // Vertical movement dominant
      if (normalizedY > 0.3) {
        this.inputSystem.simulateKeyPress('KeyS'); // Down
      } else if (normalizedY < -0.3) {
        this.inputSystem.simulateKeyPress('KeyW'); // Up
      }
    }
  }

  /**
   * Clear all movement input
   */
  clearMovementInput() {
    if (this.inputSystem) {
      this.inputSystem.simulateKeyRelease('KeyW');
      this.inputSystem.simulateKeyRelease('KeyA');
      this.inputSystem.simulateKeyRelease('KeyS');
      this.inputSystem.simulateKeyRelease('KeyD');
    }
  }

  /**
   * Reset all controls
   */
  resetControls() {
    this.releaseJoystick();
    
    for (let buttonName of Object.keys(this.actionButtons)) {
      this.releaseButton(buttonName);
    }
  }

  /**
   * Update system (called each frame)
   * @param {number} deltaTime - Time elapsed since last frame
   */
  update(deltaTime) {
    // Update layout if canvas size changed
    if (this.shouldUpdateLayout()) {
      this.updateLayout();
    }
  }

  /**
   * Check if layout should be updated
   * @returns {boolean} True if layout needs updating
   */
  shouldUpdateLayout() {
    const rect = this.canvas.getBoundingClientRect();
    return (
      this.joystick.centerY !== rect.height - this.joystick.radius - 20 ||
      this.actionButtons.repair.x !== rect.width - this.actionButtons.repair.radius - 20
    );
  }

  /**
   * Render touch controls
   * @param {RenderSystem} renderer - Render system
   */
  render(renderer) {
    if (!this.isEnabled) return;
    
    const ctx = renderer.context;
    ctx.save();
    
    // Render joystick
    this.renderJoystick(ctx);
    
    // Render action buttons
    this.renderActionButtons(ctx);
    
    ctx.restore();
  }

  /**
   * Render virtual joystick
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderJoystick(ctx) {
    // Draw base circle
    ctx.fillStyle = this.style.joystickBase.fillStyle;
    ctx.strokeStyle = this.style.joystickBase.strokeStyle;
    ctx.lineWidth = this.style.joystickBase.lineWidth;
    
    ctx.beginPath();
    ctx.arc(this.joystick.centerX, this.joystick.centerY, this.joystick.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw knob
    ctx.fillStyle = this.style.joystickKnob.fillStyle;
    ctx.strokeStyle = this.style.joystickKnob.strokeStyle;
    ctx.lineWidth = this.style.joystickKnob.lineWidth;
    
    const knobRadius = 15;
    ctx.beginPath();
    ctx.arc(this.joystick.currentX, this.joystick.currentY, knobRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Render action buttons
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderActionButtons(ctx) {
    for (let [buttonName, button] of Object.entries(this.actionButtons)) {
      const style = button.active ? this.style.activeButton : this.style.actionButton;
      
      // Draw button circle
      ctx.fillStyle = style.fillStyle;
      ctx.strokeStyle = style.strokeStyle;
      ctx.lineWidth = this.style.actionButton.lineWidth;
      
      ctx.beginPath();
      ctx.arc(button.x, button.y, button.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Draw button label
      ctx.fillStyle = this.style.actionButton.textColor;
      ctx.font = this.style.actionButton.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(button.label, button.x, button.y);
    }
  }

  /**
   * Toggle touch controls on/off
   */
  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Get current touch control status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      isMobile: this.isMobile,
      joystickActive: this.joystick.active,
      activeButtons: Object.keys(this.actionButtons).filter(
        name => this.actionButtons[name].active
      )
    };
  }
}