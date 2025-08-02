import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TouchControlSystem } from '../../../src/systems/TouchControlSystem.js';

describe('TouchControlSystem', () => {
  let touchControlSystem;
  let mockCanvas;
  let mockInputSystem;

  beforeEach(() => {
    // Mock canvas
    mockCanvas = {
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600
      })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    // Mock input system
    mockInputSystem = {
      simulateKeyPress: vi.fn(),
      simulateKeyRelease: vi.fn()
    };

    // Mock navigator and window for mobile detection
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true
    });
    Object.defineProperty(window, 'ontouchstart', {
      value: {},
      configurable: true
    });
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true
    });

    touchControlSystem = new TouchControlSystem(mockCanvas, mockInputSystem);
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      expect(touchControlSystem.canvas).toBe(mockCanvas);
      expect(touchControlSystem.inputSystem).toBe(mockInputSystem);
      expect(touchControlSystem.isMobile).toBe(true);
      expect(touchControlSystem.isEnabled).toBe(true); // Should auto-enable on mobile
    });

    it('should detect mobile device correctly', () => {
      expect(touchControlSystem.detectMobile()).toBe(true);
    });

    it('should set up joystick and action buttons with correct initial positions', () => {
      expect(touchControlSystem.joystick).toBeDefined();
      expect(touchControlSystem.joystick.radius).toBe(50);
      expect(touchControlSystem.joystick.deadZone).toBe(10);
      expect(touchControlSystem.actionButtons.repair).toBeDefined();
      expect(touchControlSystem.actionButtons.menu).toBeDefined();
    });
  });

  describe('mobile detection', () => {
    it('should detect mobile user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });
      
      const system = new TouchControlSystem(mockCanvas, mockInputSystem);
      expect(system.detectMobile()).toBe(true);
    });

    it('should detect desktop user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true
      });
      
      const system = new TouchControlSystem(mockCanvas, mockInputSystem);
      expect(system.detectMobile()).toBe(false);
    });
  });

  describe('enable/disable', () => {
    it('should enable touch controls', () => {
      touchControlSystem.disable();
      expect(touchControlSystem.isEnabled).toBe(false);
      
      touchControlSystem.enable();
      expect(touchControlSystem.isEnabled).toBe(true);
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
    });

    it('should disable touch controls', () => {
      touchControlSystem.enable();
      expect(touchControlSystem.isEnabled).toBe(true);
      
      touchControlSystem.disable();
      expect(touchControlSystem.isEnabled).toBe(false);
    });

    it('should toggle touch controls', () => {
      const initialState = touchControlSystem.isEnabled;
      touchControlSystem.toggle();
      expect(touchControlSystem.isEnabled).toBe(!initialState);
    });
  });

  describe('layout updates', () => {
    it('should update layout based on canvas size', () => {
      touchControlSystem.updateLayout();
      
      // Check joystick position (bottom-left)
      expect(touchControlSystem.joystick.centerX).toBe(70); // radius + padding
      expect(touchControlSystem.joystick.centerY).toBe(530); // height - radius - padding
      
      // Check repair button position (bottom-right)
      expect(touchControlSystem.actionButtons.repair.x).toBe(750); // width - radius - padding
      expect(touchControlSystem.actionButtons.repair.y).toBe(550); // height - radius - padding
    });
  });

  describe('touch point detection', () => {
    beforeEach(() => {
      touchControlSystem.updateLayout();
    });

    it('should detect point in joystick area', () => {
      // Point near joystick center
      expect(touchControlSystem.isPointInJoystickArea(70, 530)).toBe(true);
      
      // Point outside joystick area
      expect(touchControlSystem.isPointInJoystickArea(200, 200)).toBe(false);
    });

    it('should detect point in action button', () => {
      const repairButton = touchControlSystem.actionButtons.repair;
      
      // Point in button
      expect(touchControlSystem.isPointInButton(750, 550, repairButton)).toBe(true);
      
      // Point outside button
      expect(touchControlSystem.isPointInButton(100, 100, repairButton)).toBe(false);
    });
  });

  describe('joystick input', () => {
    beforeEach(() => {
      touchControlSystem.updateLayout();
    });

    it('should activate joystick and simulate movement input', () => {
      // Activate joystick
      touchControlSystem.activateJoystick(1, 100, 530); // Move right
      
      expect(touchControlSystem.joystick.active).toBe(true);
      expect(touchControlSystem.joystick.touchId).toBe(1);
      expect(mockInputSystem.simulateKeyPress).toHaveBeenCalledWith('KeyD');
    });

    it('should apply dead zone correctly', () => {
      // Small movement within dead zone
      touchControlSystem.activateJoystick(1, 75, 535); // Small movement
      
      // Should not trigger movement
      expect(mockInputSystem.simulateKeyPress).not.toHaveBeenCalled();
    });

    it('should clamp joystick to max distance', () => {
      // Large movement beyond max distance
      touchControlSystem.activateJoystick(1, 200, 530);
      
      // Current position should be clamped
      const dx = touchControlSystem.joystick.currentX - touchControlSystem.joystick.centerX;
      const distance = Math.abs(dx);
      expect(distance).toBeLessThanOrEqual(touchControlSystem.joystick.maxDistance);
    });

    it('should release joystick and clear input', () => {
      touchControlSystem.activateJoystick(1, 100, 530);
      touchControlSystem.releaseJoystick();
      
      expect(touchControlSystem.joystick.active).toBe(false);
      expect(touchControlSystem.joystick.touchId).toBe(null);
      expect(mockInputSystem.simulateKeyRelease).toHaveBeenCalledWith('KeyW');
      expect(mockInputSystem.simulateKeyRelease).toHaveBeenCalledWith('KeyA');
      expect(mockInputSystem.simulateKeyRelease).toHaveBeenCalledWith('KeyS');
      expect(mockInputSystem.simulateKeyRelease).toHaveBeenCalledWith('KeyD');
    });
  });

  describe('action buttons', () => {
    it('should activate and release action buttons', () => {
      // Activate repair button
      touchControlSystem.activateButton('repair', 1);
      
      expect(touchControlSystem.actionButtons.repair.active).toBe(true);
      expect(touchControlSystem.actionButtons.repair.touchId).toBe(1);
      expect(mockInputSystem.simulateKeyPress).toHaveBeenCalledWith('KeyR');
      
      // Release repair button
      touchControlSystem.releaseButton('repair');
      
      expect(touchControlSystem.actionButtons.repair.active).toBe(false);
      expect(touchControlSystem.actionButtons.repair.touchId).toBe(null);
      expect(mockInputSystem.simulateKeyRelease).toHaveBeenCalledWith('KeyR');
    });
  });

  describe('touch event handling', () => {
    let mockTouchEvent;

    beforeEach(() => {
      touchControlSystem.updateLayout();
      
      mockTouchEvent = {
        preventDefault: vi.fn(),
        changedTouches: [
          {
            identifier: 1,
            clientX: 70,
            clientY: 530
          }
        ]
      };
    });

    it('should handle touch start in joystick area', () => {
      touchControlSystem.handleTouchStart(mockTouchEvent);
      
      expect(mockTouchEvent.preventDefault).toHaveBeenCalled();
      expect(touchControlSystem.joystick.active).toBe(true);
    });

    it('should handle touch move for active joystick', () => {
      // First activate joystick
      touchControlSystem.handleTouchStart(mockTouchEvent);
      
      // Then move
      mockTouchEvent.changedTouches[0].clientX = 100;
      touchControlSystem.handleTouchMove(mockTouchEvent);
      
      expect(touchControlSystem.joystick.currentX).toBeGreaterThan(70);
    });

    it('should handle touch end to release joystick', () => {
      // Activate then release
      touchControlSystem.handleTouchStart(mockTouchEvent);
      touchControlSystem.handleTouchEnd(mockTouchEvent);
      
      expect(touchControlSystem.joystick.active).toBe(false);
    });
  });

  describe('status reporting', () => {
    it('should return correct status information', () => {
      const status = touchControlSystem.getStatus();
      
      expect(status).toEqual({
        enabled: touchControlSystem.isEnabled,
        isMobile: touchControlSystem.isMobile,
        joystickActive: touchControlSystem.joystick.active,
        activeButtons: []
      });
    });

    it('should report active buttons in status', () => {
      touchControlSystem.activateButton('repair', 1);
      const status = touchControlSystem.getStatus();
      
      expect(status.activeButtons).toContain('repair');
    });
  });

  describe('rendering', () => {
    let mockRenderer;

    beforeEach(() => {
      mockRenderer = {
        context: {
          save: vi.fn(),
          restore: vi.fn(),
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 0,
          font: '',
          textAlign: '',
          textBaseline: '',
          beginPath: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          fillText: vi.fn()
        }
      };
    });

    it('should not render when disabled', () => {
      touchControlSystem.disable();
      touchControlSystem.render(mockRenderer);
      
      expect(mockRenderer.context.save).not.toHaveBeenCalled();
    });

    it('should render joystick and buttons when enabled', () => {
      touchControlSystem.enable();
      touchControlSystem.render(mockRenderer);
      
      expect(mockRenderer.context.save).toHaveBeenCalled();
      expect(mockRenderer.context.restore).toHaveBeenCalled();
      expect(mockRenderer.context.arc).toHaveBeenCalled();
      expect(mockRenderer.context.fillText).toHaveBeenCalled();
    });
  });
});