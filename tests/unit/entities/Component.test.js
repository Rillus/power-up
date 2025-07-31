import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '../../../src/engine/Component.js';
import { Entity } from '../../../src/engine/Entity.js';

// Concrete component implementation for testing
class TestComponent extends Component {
  constructor(entity) {
    super(entity);
    this.type = 'TestComponent';
  }

  update(deltaTime) {
    this.lastUpdateDelta = deltaTime;
  }

  render(renderer) {
    this.lastRenderer = renderer;
  }
}

describe('Component', () => {
  let entity;
  let component;

  beforeEach(() => {
    entity = new Entity(100, 200);
    component = new TestComponent(entity);
  });

  describe('constructor', () => {
    it('should store reference to entity', () => {
      expect(component.entity).toBe(entity);
    });

    it('should have a type property', () => {
      expect(component.type).toBe('TestComponent');
    });
  });

  describe('update', () => {
    it('should be callable with deltaTime', () => {
      expect(() => {
        component.update(16.67);
      }).not.toThrow();
      
      expect(component.lastUpdateDelta).toBe(16.67);
    });
  });

  describe('render', () => {
    it('should be callable with renderer', () => {
      const mockRenderer = { draw: () => {} };
      
      expect(() => {
        component.render(mockRenderer);
      }).not.toThrow();
      
      expect(component.lastRenderer).toBe(mockRenderer);
    });
  });
});