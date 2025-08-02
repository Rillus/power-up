import { Entity } from '../engine/Entity.js';
import { Transform } from '../components/Transform.js';

/**
 * Particle entity for visual effects (coins, sparks, debris, etc.)
 * @class
 * @extends Entity
 */
export class Particle extends Entity {
  /**
   * Create a particle
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels
   * @param {Object} options - Particle configuration
   * @param {string} [options.type='coin'] - Particle type (coin, spark, debris)
   * @param {string} [options.color='#FFD700'] - Particle color
   * @param {number} [options.size=4] - Particle size in pixels
   * @param {number} [options.duration=1000] - Particle lifetime in milliseconds
   * @param {Object} [options.velocity={x: 0, y: -50}] - Initial velocity
   * @param {number} [options.gravity=0] - Gravity acceleration
   * @param {number} [options.friction=0.95] - Velocity friction (0-1)
   * @param {boolean} [options.fadeOut=true] - Whether particle fades out over time
   */
  constructor(x, y, options = {}) {
    super(x, y);
    
    // Add Transform component
    this.addComponent(new Transform(this, x, y));
    
    // Particle properties
    this.type = options.type || 'coin';
    this.color = options.color || '#FFD700';
    this.size = options.size || 4;
    this.duration = options.duration || 1000;
    this.velocity = { ...options.velocity } || { x: 0, y: -50 };
    this.gravity = options.gravity || 0;
    this.friction = options.friction || 0.95;
    this.fadeOut = options.fadeOut !== false;
    
    // Animation state
    this.lifetime = 0;
    this.opacity = 1;
    this.rotation = 0;
    this.scale = 1;
    
    // Type-specific initialization
    this.initializeByType();
  }

  /**
   * Initialize particle properties based on type
   * @private
   */
  initializeByType() {
    switch (this.type) {
      case 'coin':
        this.color = '#FFD700';
        this.size = 6;
        this.gravity = 100;
        this.friction = 0.98;
        this.rotation = Math.random() * Math.PI * 2;
        break;
        
      case 'spark':
        this.color = '#FFA500';
        this.size = 3;
        this.gravity = 0;
        this.friction = 0.92;
        this.duration = 800;
        break;
        
      case 'debris':
        this.color = '#8B4513';
        this.size = 4;
        this.gravity = 200;
        this.friction = 0.9;
        this.duration = 1500;
        break;
        
      case 'repair':
        this.color = '#00FF00';
        this.size = 5;
        this.gravity = -50; // Float upward
        this.friction = 0.95;
        this.duration = 1200;
        break;
        
      case 'damage':
        this.color = '#FF4444';
        this.size = 6;
        this.gravity = 50;
        this.friction = 0.9;
        this.duration = 800;
        break;
    }
  }

  /**
   * Update particle animation and physics
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime) {
    super.update(deltaTime);
    
    const deltaSeconds = deltaTime / 1000;
    const transform = this.getComponent('Transform');
    
    // Update lifetime
    this.lifetime += deltaTime;
    
    // Mark for removal when expired
    if (this.lifetime >= this.duration) {
      this.active = false;
      return;
    }
    
    // Update physics
    this.velocity.y += this.gravity * deltaSeconds;
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    
    // Update position
    transform.x += this.velocity.x * deltaSeconds;
    transform.y += this.velocity.y * deltaSeconds;
    
    // Update visual properties
    const lifeRatio = this.lifetime / this.duration;
    
    if (this.fadeOut) {
      this.opacity = 1 - lifeRatio;
    }
    
    // Type-specific animations
    switch (this.type) {
      case 'coin':
        this.rotation += deltaTime * 0.01; // Spinning coin
        this.scale = 1 + Math.sin(this.lifetime * 0.01) * 0.1; // Slight pulsing
        break;
        
      case 'spark':
        this.size = Math.max(1, this.size * (1 - lifeRatio * 0.5)); // Shrink over time
        break;
        
      case 'repair':
        this.scale = 1 + lifeRatio * 0.5; // Grow over time
        break;
    }
  }

  /**
   * Render the particle
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    const transform = this.getComponent('Transform');
    
    // Set opacity
    const prevAlpha = renderer.context.globalAlpha;
    renderer.context.globalAlpha = this.opacity;
    
    // Apply transformations
    renderer.context.save();
    renderer.context.translate(transform.x, transform.y);
    renderer.context.rotate(this.rotation);
    renderer.context.scale(this.scale, this.scale);
    
    // Draw particle based on type
    switch (this.type) {
      case 'coin':
        this.drawCoin(renderer);
        break;
        
      case 'spark':
      case 'debris':
      case 'repair':
      case 'damage':
        this.drawCircle(renderer);
        break;
        
      default:
        this.drawCircle(renderer);
    }
    
    renderer.context.restore();
    renderer.context.globalAlpha = prevAlpha;
  }

  /**
   * Draw a coin-shaped particle
   * @param {RenderSystem} renderer - The render system
   * @private
   */
  drawCoin(renderer) {
    // Draw coin with metallic appearance
    const gradient = renderer.context.createRadialGradient(0, 0, 0, 0, 0, this.size);
    gradient.addColorStop(0, '#FFFF99');
    gradient.addColorStop(0.7, this.color);
    gradient.addColorStop(1, '#B8860B');
    
    renderer.context.fillStyle = gradient;
    renderer.context.beginPath();
    renderer.context.arc(0, 0, this.size, 0, Math.PI * 2);
    renderer.context.fill();
    
    // Add shine effect
    renderer.context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    renderer.context.beginPath();
    renderer.context.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.4, 0, Math.PI * 2);
    renderer.context.fill();
  }

  /**
   * Draw a simple circle particle
   * @param {RenderSystem} renderer - The render system
   * @private
   */
  drawCircle(renderer) {
    renderer.context.fillStyle = this.color;
    renderer.context.beginPath();
    renderer.context.arc(0, 0, this.size, 0, Math.PI * 2);
    renderer.context.fill();
  }
}

/**
 * Particle System for managing multiple particles
 * @class
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  /**
   * Create coin particles for money collection effect
   * @param {number} x - Source X position
   * @param {number} y - Source Y position
   * @param {number} amount - Money amount (affects particle count)
   */
  createCoinBurst(x, y, amount) {
    const particleCount = Math.min(Math.max(3, Math.floor(amount / 2)), 8);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 80 + Math.random() * 40;
      
      const particle = new Particle(x, y, {
        type: 'coin',
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 30
        },
        duration: 1200 + Math.random() * 400
      });
      
      this.particles.push(particle);
    }
  }

  /**
   * Create spark particles for console breakdown effect
   * @param {number} x - Source X position
   * @param {number} y - Source Y position
   */
  createSparkBurst(x, y) {
    const particleCount = 6;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 50;
      
      const particle = new Particle(x, y, {
        type: 'spark',
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        duration: 600 + Math.random() * 200
      });
      
      this.particles.push(particle);
    }
  }

  /**
   * Create repair particles for console repair effect
   * @param {number} x - Source X position
   * @param {number} y - Source Y position
   */
  createRepairEffect(x, y) {
    const particleCount = 4;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 20;
      
      const particle = new Particle(x, y, {
        type: 'repair',
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        duration: 1000 + Math.random() * 500
      });
      
      this.particles.push(particle);
    }
  }

  /**
   * Update all particles
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Update all particles
    this.particles.forEach(particle => particle.update(deltaTime));
    
    // Remove inactive particles
    this.particles = this.particles.filter(particle => particle.active);
  }

  /**
   * Render all particles
   * @param {RenderSystem} renderer - The render system
   */
  render(renderer) {
    this.particles.forEach(particle => particle.render(renderer));
  }

  /**
   * Get number of active particles
   * @returns {number} Active particle count
   */
  getParticleCount() {
    return this.particles.length;
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
  }
}