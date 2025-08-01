import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Character } from '../../../src/entities/Character.js';
import { Transform } from '../../../src/components/Transform.js';
import { Movement } from '../../../src/components/Movement.js';

describe('Character', () => {
  let character;
  let mockRenderer;

  beforeEach(() => {
    character = new Character(400, 300);
    mockRenderer = {
      drawCircle: vi.fn(),
      drawText: vi.fn()
    };
  });

  describe('constructor', () => {
    it('should initialize at correct position', () => {
      const transform = character.getComponent('Transform');
      expect(transform.x).toBe(400);
      expect(transform.y).toBe(300);
    });

    it('should have Transform component', () => {
      const transform = character.getComponent('Transform');
      expect(transform).toBeInstanceOf(Transform);
    });

    it('should have Movement component', () => {
      const movement = character.getComponent('Movement');
      expect(movement).toBeInstanceOf(Movement);
    });

    it('should initialize with correct default properties', () => {
      expect(character.radius).toBe(16);
      expect(character.color).toBe('#0066CC');
      expect(character.name).toBe('Player');
    });

    it('should accept customization options', () => {
      const customCharacter = new Character(100, 100, {
        name: 'TestPlayer',
        color: '#FF0000'
      });
      
      expect(customCharacter.name).toBe('TestPlayer');
      expect(customCharacter.color).toBe('#FF0000');
    });

    it('should have correct default speed', () => {
      const movement = character.getComponent('Movement');
      expect(movement.getSpeed()).toBe(200);
    });
  });

  describe('movement methods', () => {
    let movement;

    beforeEach(() => {
      movement = character.getComponent('Movement');
    });

    describe('moveUp', () => {
      it('should set upward movement direction', () => {
        character.moveUp();
        expect(movement.direction.x).toBe(0);
        expect(movement.direction.y).toBe(-1);
      });
    });

    describe('moveDown', () => {
      it('should set downward movement direction', () => {
        character.moveDown();
        expect(movement.direction.x).toBe(0);
        expect(movement.direction.y).toBe(1);
      });
    });

    describe('moveLeft', () => {
      it('should set leftward movement direction', () => {
        character.moveLeft();
        expect(movement.direction.x).toBe(-1);
        expect(movement.direction.y).toBe(0);
      });
    });

    describe('moveRight', () => {
      it('should set rightward movement direction', () => {
        character.moveRight();
        expect(movement.direction.x).toBe(1);
        expect(movement.direction.y).toBe(0);
      });
    });

    describe('stopMoving', () => {
      it('should stop all movement', () => {
        character.moveRight();
        character.stopMoving();
        
        expect(movement.direction.x).toBe(0);
        expect(movement.direction.y).toBe(0);
      });
    });

    describe('setMovementDirection', () => {
      it('should handle diagonal movement', () => {
        character.setMovementDirection(1, 1);
        
        // Should be normalized
        const magnitude = Math.sqrt(movement.direction.x ** 2 + movement.direction.y ** 2);
        expect(magnitude).toBeCloseTo(1, 5);
      });

      it('should handle zero direction', () => {
        character.setMovementDirection(0, 0);
        expect(movement.direction.x).toBe(0);
        expect(movement.direction.y).toBe(0);
      });
    });
  });

  describe('position methods', () => {
    it('should return current position', () => {
      const position = character.getPosition();
      expect(position.x).toBe(400);
      expect(position.y).toBe(300);
    });

    it('should set position', () => {
      character.setPosition(200, 150);
      const transform = character.getComponent('Transform');
      expect(transform.x).toBe(200);
      expect(transform.y).toBe(150);
    });

    it('should clamp position to boundaries', () => {
      character.setPosition(-10, -10);
      const transform = character.getComponent('Transform');
      expect(transform.x).toBe(20); // Minimum boundary
      expect(transform.y).toBe(20);

      character.setPosition(900, 700);
      expect(transform.x).toBe(780); // Maximum boundary
      expect(transform.y).toBe(580);
    });
  });

  describe('speed methods', () => {
    it('should get current speed', () => {
      expect(character.getSpeed()).toBe(200);
    });

    it('should set speed', () => {
      character.setSpeed(300);
      expect(character.getSpeed()).toBe(300);
      
      const movement = character.getComponent('Movement');
      expect(movement.getSpeed()).toBe(300);
    });

    it('should not allow negative speed', () => {
      character.setSpeed(-100);
      expect(character.getSpeed()).toBe(0);
    });
  });

  describe('update', () => {
    it('should call parent update method', () => {
      const updateSpy = vi.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(character)), 'update');
      character.update(1000);
      expect(updateSpy).toHaveBeenCalledWith(1000);
      updateSpy.mockRestore();
    });

    it('should update position when moving', () => {
      character.moveRight();
      character.update(1000); // 1 second
      
      const transform = character.getComponent('Transform');
      expect(transform.x).toBe(600); // 400 + 200
    });
  });

  describe('render', () => {
    it('should draw character circle', () => {
      character.render(mockRenderer);
      
      expect(mockRenderer.drawCircle).toHaveBeenCalledWith(
        400, // x position
        300, // y position  
        16,  // radius
        '#0066CC' // color
      );
    });

    it('should draw character name if debug mode', () => {
      character.debugMode = true;
      character.render(mockRenderer);
      
      expect(mockRenderer.drawText).toHaveBeenCalledWith(
        'Player',
        400,
        285, // y position - 15 pixels above center
        { color: '#FFFFFF', fontSize: 12, textAlign: 'center' }
      );
    });

    it('should not draw name if debug mode is off', () => {
      character.debugMode = false;
      character.render(mockRenderer);
      
      expect(mockRenderer.drawText).not.toHaveBeenCalled();
    });

    it('should use custom color', () => {
      const redCharacter = new Character(100, 100, { color: '#FF0000' });
      redCharacter.render(mockRenderer);
      
      expect(mockRenderer.drawCircle).toHaveBeenCalledWith(
        100,
        100,
        16,
        '#FF0000'
      );
    });
  });

  describe('collision detection', () => {
    it('should detect collision with point', () => {
      // Point inside character
      expect(character.isCollidingWithPoint(405, 305)).toBe(true);
      
      // Point outside character
      expect(character.isCollidingWithPoint(450, 350)).toBe(false);
      
      // Point exactly on edge
      expect(character.isCollidingWithPoint(416, 300)).toBe(true);
    });

    it('should detect collision with circle', () => {
      // Overlapping circles
      expect(character.isCollidingWithCircle(410, 310, 10)).toBe(true);
      
      // Non-overlapping circles
      expect(character.isCollidingWithCircle(500, 400, 10)).toBe(false);
      
      // Touching circles
      expect(character.isCollidingWithCircle(426, 300, 10)).toBe(true);
    });
  });

  describe('customization', () => {
    it('should allow name changes', () => {
      character.setName('NewName');
      expect(character.name).toBe('NewName');
    });

    it('should allow color changes', () => {
      character.setColor('#00FF00');
      expect(character.color).toBe('#00FF00');
    });

    it('should validate color format', () => {
      character.setColor('invalid');
      expect(character.color).toBe('#0066CC'); // Should remain default
      
      character.setColor('#ABC');
      expect(character.color).toBe('#ABC'); // Valid short hex
      
      character.setColor('#123456');
      expect(character.color).toBe('#123456'); // Valid long hex
    });
  });

  describe('state management', () => {
    it('should export state for saving', () => {
      character.setPosition(250, 180);
      character.setSpeed(150);
      character.setName('SavedPlayer');
      character.setColor('#FF00FF');
      
      const state = character.exportState();
      
      expect(state).toEqual({
        position: { x: 250, y: 180 },
        speed: 150,
        name: 'SavedPlayer',
        color: '#FF00FF',
        customization: expect.any(Object)
      });
    });

    it('should import state for loading', () => {
      const state = {
        position: { x: 350, y: 250 },
        speed: 180,
        name: 'LoadedPlayer',
        color: '#00FFFF',
        customization: {}
      };
      
      character.importState(state);
      
      expect(character.getPosition()).toEqual({ x: 350, y: 250 });
      expect(character.getSpeed()).toBe(180);
      expect(character.name).toBe('LoadedPlayer');
      expect(character.color).toBe('#00FFFF');
    });
  });
});