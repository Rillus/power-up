/**
 * Base component class for entity-component system
 * @class
 */
export class Component {
  /**
   * Create a new component
   * @param {Entity} entity - The entity this component belongs to
   */
  constructor(entity) {
    this.entity = entity;
    this.type = 'Component';
  }

  /**
   * Update component logic
   * @param {number} _deltaTime - Time elapsed since last update in milliseconds
   */
  update(_deltaTime) {
    // Base implementation - override in subclasses
  }

  /**
   * Render component visuals
   * @param {object} _renderer - The renderer to use for drawing
   */
  render(_renderer) {
    // Base implementation - override in subclasses
  }
}