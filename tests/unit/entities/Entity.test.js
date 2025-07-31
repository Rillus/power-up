import { describe, it, expect, beforeEach } from 'vitest';
import { Entity } from '../../../src/engine/Entity.js';
import { Component } from '../../../src/engine/Component.js';

// Mock component for testing
class MockComponent extends Component {
  constructor(entity) {
    super(entity);
    this.type = 'MockComponent';
    this.updateCalled = false;
    this.renderCalled = false;
  }

  update(deltaTime) {
    this.updateCalled = true;
    this.lastDeltaTime = deltaTime;
  }

  render(renderer) {
    this.renderCalled = true;
    this.lastRenderer = renderer;
  }
}

describe('Entity', () => {
  let entity;

  beforeEach(() => {
    entity = new Entity(100, 200);
  });

  describe('constructor', () => {
    it('should initialize with correct position', () => {
      expect(entity.x).toBe(100);
      expect(entity.y).toBe(200);
    });

    it('should initialize with empty components array', () => {
      expect(entity.components).toEqual([]);
    });

    it('should generate unique id', () => {
      const entity1 = new Entity(0, 0);
      const entity2 = new Entity(0, 0);
      expect(entity1.id).not.toBe(entity2.id);
    });

    it('should initialize as active', () => {
      expect(entity.active).toBe(true);
    });

    it('should accept initial components', () => {
      const component = new MockComponent();
      const entityWithComponents = new Entity(0, 0, [component]);
      expect(entityWithComponents.components).toContain(component);
    });
  });

  describe('addComponent', () => {
    it('should add component to entity', () => {
      const component = new MockComponent(entity);
      entity.addComponent(component);
      
      expect(entity.components).toContain(component);
      expect(component.entity).toBe(entity);
    });

    it('should return the entity for method chaining', () => {
      const component = new MockComponent(entity);
      const result = entity.addComponent(component);
      
      expect(result).toBe(entity);
    });

    it('should throw error if component is not a Component instance', () => {
      expect(() => {
        entity.addComponent({});
      }).toThrow('Component must be an instance of Component class');
    });
  });

  describe('getComponent', () => {
    it('should return component by type', () => {
      const component = new MockComponent(entity);
      entity.addComponent(component);
      
      const retrieved = entity.getComponent('MockComponent');
      expect(retrieved).toBe(component);
    });

    it('should return null if component not found', () => {
      const retrieved = entity.getComponent('NonExistentComponent');
      expect(retrieved).toBeNull();
    });

    it('should return first component if multiple of same type', () => {
      const component1 = new MockComponent(entity);
      const component2 = new MockComponent(entity);
      
      entity.addComponent(component1);
      entity.addComponent(component2);
      
      const retrieved = entity.getComponent('MockComponent');
      expect(retrieved).toBe(component1);
    });
  });

  describe('removeComponent', () => {
    it('should remove component by type', () => {
      const component = new MockComponent(entity);
      entity.addComponent(component);
      
      const removed = entity.removeComponent('MockComponent');
      
      expect(entity.components).not.toContain(component);
      expect(removed).toBe(component);
    });

    it('should return null if component not found', () => {
      const removed = entity.removeComponent('NonExistentComponent');
      expect(removed).toBeNull();
    });
  });

  describe('hasComponent', () => {
    it('should return true if entity has component', () => {
      const component = new MockComponent(entity);
      entity.addComponent(component);
      
      expect(entity.hasComponent('MockComponent')).toBe(true);
    });

    it('should return false if entity does not have component', () => {
      expect(entity.hasComponent('MockComponent')).toBe(false);
    });
  });

  describe('update', () => {
    it('should call update on all components when active', () => {
      const component1 = new MockComponent(entity);
      const component2 = new MockComponent(entity);
      
      entity.addComponent(component1);
      entity.addComponent(component2);
      
      entity.update(16.67);
      
      expect(component1.updateCalled).toBe(true);
      expect(component2.updateCalled).toBe(true);
      expect(component1.lastDeltaTime).toBe(16.67);
    });

    it('should not call update on components when inactive', () => {
      const component = new MockComponent(entity);
      entity.addComponent(component);
      entity.active = false;
      
      entity.update(16.67);
      
      expect(component.updateCalled).toBe(false);
    });
  });

  describe('render', () => {
    it('should call render on all components when active', () => {
      const component1 = new MockComponent(entity);
      const component2 = new MockComponent(entity);
      const mockRenderer = { draw: () => {} };
      
      entity.addComponent(component1);
      entity.addComponent(component2);
      
      entity.render(mockRenderer);
      
      expect(component1.renderCalled).toBe(true);
      expect(component2.renderCalled).toBe(true);
      expect(component1.lastRenderer).toBe(mockRenderer);
    });

    it('should not call render on components when inactive', () => {
      const component = new MockComponent(entity);
      const mockRenderer = { draw: () => {} };
      entity.addComponent(component);
      entity.active = false;
      
      entity.render(mockRenderer);
      
      expect(component.renderCalled).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should set active to false', () => {
      entity.destroy();
      expect(entity.active).toBe(false);
    });

    it('should clear all components', () => {
      const component = new MockComponent(entity);
      entity.addComponent(component);
      
      entity.destroy();
      
      expect(entity.components).toEqual([]);
    });
  });
});