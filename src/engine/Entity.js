import { Component } from './Component.js';

/**
 * Base game entity class that can hold components
 * @class
 */
export class Entity {
  static #nextId = 1;

  /**
   * Create a new entity
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {Component[]} [components=[]] - Initial components to add
   */
  constructor(x = 0, y = 0, components = []) {
    this.id = Entity.#nextId++;
    this.x = x;
    this.y = y;
    this.active = true;
    this.components = [];

    // Add initial components
    components.forEach(component => this.addComponent(component));
  }

  /**
   * Add a component to this entity
   * @param {Component} component - The component to add
   * @returns {Entity} This entity for method chaining
   * @throws {Error} If component is not a Component instance
   */
  addComponent(component) {
    if (!(component instanceof Component)) {
      throw new Error('Component must be an instance of Component class');
    }

    component.entity = this;
    this.components.push(component);
    return this;
  }

  /**
   * Get a component by its type name
   * @param {string} type - The component type to find
   * @returns {Component|null} The component if found, null otherwise
   */
  getComponent(type) {
    return this.components.find(component => component.type === type) || null;
  }

  /**
   * Remove a component by its type name
   * @param {string} type - The component type to remove
   * @returns {Component|null} The removed component if found, null otherwise
   */
  removeComponent(type) {
    const index = this.components.findIndex(component => component.type === type);
    if (index === -1) return null;

    return this.components.splice(index, 1)[0];
  }

  /**
   * Check if entity has a component of the given type
   * @param {string} type - The component type to check for
   * @returns {boolean} True if component exists, false otherwise
   */
  hasComponent(type) {
    return this.components.some(component => component.type === type);
  }

  /**
   * Update this entity and all its components
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime) {
    if (!this.active) return;

    this.components.forEach(component => {
      component.update(deltaTime);
    });
  }

  /**
   * Render this entity and all its components
   * @param {object} renderer - The renderer to use for drawing
   */
  render(renderer) {
    if (!this.active) return;

    this.components.forEach(component => {
      component.render(renderer);
    });
  }

  /**
   * Destroy this entity and clean up resources
   */
  destroy() {
    this.active = false;
    this.components = [];
  }
}