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
    
    // Mouse state
    this.mousePressed = false;
    this.mouseJustPressed = false;
    this.mouseJustReleased = false;
    this.mousePosition = { x: 0, y: 0 };

    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    // Add event listeners
    this.element.addEventListener('keydown', this.handleKeyDown);
    this.element.addEventListener('keyup', this.handleKeyUp);
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('mouseup', this.handleMouseUp);
    this.element.addEventListener('mousemove', this.handleMouseMove);

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
   * Handle mouse down events
   * @private
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseDown(event) {
    this.mousePressed = true;
    this.mouseJustPressed = true;
    this.updateMousePosition(event);
  }

  /**
   * Handle mouse up events
   * @private
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseUp(event) {
    this.mousePressed = false;
    this.mouseJustReleased = true;
    this.updateMousePosition(event);
  }

  /**
   * Handle mouse move events
   * @private
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseMove(event) {
    this.updateMousePosition(event);
  }

  /**
   * Update mouse position from event
   * @private
   * @param {MouseEvent} event - The mouse event
   */
  updateMousePosition(event) {
    const rect = this.element.getBoundingClientRect ? this.element.getBoundingClientRect() : { left: 0, top: 0 };
    this.mousePosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  /**
   * Check if mouse is currently pressed
   * @returns {boolean} True if mouse is pressed
   */
  isMousePressed() {
    return this.mousePressed;
  }

  /**
   * Check if mouse was just pressed this frame
   * @returns {boolean} True if mouse was just pressed
   */
  isMouseJustPressed() {
    return this.mouseJustPressed;
  }

  /**
   * Check if mouse was just released this frame
   * @returns {boolean} True if mouse was just released
   */
  isMouseJustReleased() {
    return this.mouseJustReleased;
  }

  /**
   * Get current mouse position
   * @returns {object} Mouse position with x and y coordinates
   */
  getMousePosition() {
    return { ...this.mousePosition };
  }

  /**
   * Get array of just pressed keys
   * @returns {string[]} Array of key codes that were just pressed
   */
  getJustPressedKeys() {
    return Object.keys(this.justPressed).filter(key => this.justPressed[key]);
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
    
    // Clear mouse just pressed/released states
    this.mouseJustPressed = false;
    this.mouseJustReleased = false;
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element.removeEventListener('keyup', this.handleKeyUp);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
    this.element.removeEventListener('mousemove', this.handleMouseMove);
  }
}