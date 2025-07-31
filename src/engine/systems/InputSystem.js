/**
 * Input system for handling keyboard and mouse input
 * @class
 */
export class InputSystem {
  /**
   * Create an input system
   * @param {HTMLElement} [element=document] - Element to attach event listeners to
   */
  constructor(element = document) {
    this.element = element;
    this.keys = {};
    this.justPressed = {};
    this.justReleased = {};

    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    // Add event listeners
    this.element.addEventListener('keydown', this.handleKeyDown);
    this.element.addEventListener('keyup', this.handleKeyUp);

    // Make element focusable if it's not the document
    if (this.element !== document && this.element.tabIndex === undefined) {
      this.element.tabIndex = 0;
    }
  }

  /**
   * Handle keydown events
   * @private
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyDown(event) {
    event.preventDefault();
    
    const { code } = event;
    const wasPressed = this.keys[code];
    
    this.keys[code] = true;
    
    // Only set justPressed if the key wasn't already down
    if (!wasPressed) {
      this.justPressed[code] = true;
    }
  }

  /**
   * Handle keyup events
   * @private
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyUp(event) {
    event.preventDefault();
    
    const { code } = event;
    
    this.keys[code] = false;
    this.justReleased[code] = true;
  }

  /**
   * Check if a key is currently being held down
   * @param {string} keyCode - The key code to check (e.g., 'KeyW', 'Space')
   * @returns {boolean} True if key is down, false otherwise
   */
  isKeyDown(keyCode) {
    return !!this.keys[keyCode];
  }

  /**
   * Check if a key was just pressed this frame
   * @param {string} keyCode - The key code to check
   * @returns {boolean} True if key was just pressed, false otherwise
   */
  isKeyJustPressed(keyCode) {
    return !!this.justPressed[keyCode];
  }

  /**
   * Check if a key was just released this frame
   * @param {string} keyCode - The key code to check
   * @returns {boolean} True if key was just released, false otherwise
   */
  isKeyJustReleased(keyCode) {
    return !!this.justReleased[keyCode];
  }

  /**
   * Get normalized movement vector based on WASD or arrow key input
   * @returns {object} Movement vector with x and y components (-1 to 1)
   */
  getMovementVector() {
    let x = 0;
    let y = 0;

    // WASD keys
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) x -= 1;
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) x += 1;
    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) y -= 1;
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) y += 1;

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      x /= length;
      y /= length;
    }

    return { x, y };
  }

  /**
   * Update the input system (call once per frame)
   * Clears just pressed/released states
   */
  update() {
    // Clear just pressed/released states
    Object.keys(this.justPressed).forEach(key => {
      this.justPressed[key] = false;
    });
    
    Object.keys(this.justReleased).forEach(key => {
      this.justReleased[key] = false;
    });
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element.removeEventListener('keyup', this.handleKeyUp);
  }
}