import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputSystem } from '../../../src/engine/systems/InputSystem.js';

// Mock DOM events
const createKeyboardEvent = (type, code, key) => ({
  type,
  code,
  key,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn()
});

describe('InputSystem', () => {
  let inputSystem;
  let mockElement;

  beforeEach(() => {
    // Mock DOM element
    mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      focus: vi.fn(),
      tabIndex: 0
    };
    
    // Mock document if no element provided
    global.document = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    inputSystem = new InputSystem(mockElement);
  });

  describe('constructor', () => {
    it('should initialize with provided element', () => {
      expect(inputSystem.element).toBe(mockElement);
      expect(mockElement.addEventListener).toHaveBeenCalledTimes(5);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    });

    it('should use document if no element provided', () => {
      new InputSystem();
      expect(global.document.addEventListener).toHaveBeenCalled();
    });

    it('should initialize with empty key states', () => {
      expect(inputSystem.keys).toEqual({});
      expect(inputSystem.justPressed).toEqual({});
      expect(inputSystem.justReleased).toEqual({});
    });
  });

  describe('key handling', () => {
    let keyDownHandler;
    let keyUpHandler;

    beforeEach(() => {
      // Extract the event handlers
      keyDownHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1];
      keyUpHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'keyup'
      )?.[1];
    });

    it('should handle keydown events', () => {
      const event = createKeyboardEvent('keydown', 'KeyW', 'w');
      
      keyDownHandler(event);
      
      expect(inputSystem.keys.KeyW).toBe(true);
      expect(inputSystem.justPressed.KeyW).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle keyup events', () => {
      // First press the key
      const downEvent = createKeyboardEvent('keydown', 'KeyW', 'w');
      keyDownHandler(downEvent);
      
      // Then release it
      const upEvent = createKeyboardEvent('keyup', 'KeyW', 'w');
      keyUpHandler(upEvent);
      
      expect(inputSystem.keys.KeyW).toBe(false);
      expect(inputSystem.justReleased.KeyW).toBe(true);
    });

    it('should not set justPressed if key is already down', () => {
      const event1 = createKeyboardEvent('keydown', 'KeyW', 'w');
      const event2 = createKeyboardEvent('keydown', 'KeyW', 'w');
      
      keyDownHandler(event1);
      inputSystem.update(); // Clear justPressed
      keyDownHandler(event2);
      
      expect(inputSystem.keys.KeyW).toBe(true);
      expect(inputSystem.justPressed.KeyW).toBe(false);
    });
  });

  describe('isKeyDown', () => {
    it('should return true for pressed keys', () => {
      inputSystem.keys.KeyW = true;
      expect(inputSystem.isKeyDown('KeyW')).toBe(true);
    });

    it('should return false for released keys', () => {
      expect(inputSystem.isKeyDown('KeyW')).toBe(false);
    });
  });

  describe('isKeyJustPressed', () => {
    it('should return true for just pressed keys', () => {
      inputSystem.justPressed.KeyW = true;
      expect(inputSystem.isKeyJustPressed('KeyW')).toBe(true);
    });

    it('should return false for not just pressed keys', () => {
      expect(inputSystem.isKeyJustPressed('KeyW')).toBe(false);
    });
  });

  describe('isKeyJustReleased', () => {
    it('should return true for just released keys', () => {
      inputSystem.justReleased.KeyW = true;
      expect(inputSystem.isKeyJustReleased('KeyW')).toBe(true);
    });

    it('should return false for not just released keys', () => {
      expect(inputSystem.isKeyJustReleased('KeyW')).toBe(false);
    });
  });

  describe('update', () => {
    it('should clear justPressed and justReleased states', () => {
      inputSystem.justPressed.KeyW = true;
      inputSystem.justReleased.KeyS = true;
      
      inputSystem.update();
      
      expect(inputSystem.justPressed.KeyW).toBe(false);
      expect(inputSystem.justReleased.KeyS).toBe(false);
    });
  });

  describe('getMovementVector', () => {
    it('should return movement vector for WASD keys', () => {
      inputSystem.keys.KeyW = true;
      inputSystem.keys.KeyD = true;
      
      const movement = inputSystem.getMovementVector();
      
      expect(movement.x).toBeCloseTo(0.707, 2); // normalized diagonal
      expect(movement.y).toBeCloseTo(-0.707, 2);
    });

    it('should return zero vector when no movement keys pressed', () => {
      const movement = inputSystem.getMovementVector();
      
      expect(movement.x).toBe(0);
      expect(movement.y).toBe(0);
    });

    it('should handle arrow keys as alternative', () => {
      inputSystem.keys.ArrowUp = true;
      inputSystem.keys.ArrowRight = true;
      
      const movement = inputSystem.getMovementVector();
      
      expect(movement.x).toBeCloseTo(0.707, 2);
      expect(movement.y).toBeCloseTo(-0.707, 2);
    });
  });

  describe('destroy', () => {
    it('should remove event listeners', () => {
      inputSystem.destroy();
      
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    });
  });
});