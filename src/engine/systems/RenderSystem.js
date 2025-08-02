/**
 * Rendering system for drawing to HTML5 Canvas
 * @class
 */
export class RenderSystem {
  /**
   * Create a render system
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   * @param {SpriteLoader} [spriteLoader] - Optional sprite loader for sprite rendering
   */
  constructor(canvas, spriteLoader = null) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.ctx = this.context; // Alias for easier access
    this.backgroundColor = '#f5f5f5';
    this.spriteLoader = spriteLoader;
    
    // Enable image smoothing for better sprite rendering
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
  }

  /**
   * Clear the canvas and fill with background color
   */
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw a rectangle
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {string} color - Fill or stroke color
   * @param {boolean} [stroke=false] - Whether to stroke instead of fill
   */
  drawRect(x, y, width, height, color, stroke = false) {
    if (stroke) {
      this.context.strokeStyle = color;
      this.context.strokeRect(x, y, width, height);
    } else {
      this.context.fillStyle = color;
      this.context.fillRect(x, y, width, height);
    }
  }

  /**
   * Draw a circle
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   * @param {number} radius - Circle radius
   * @param {string} color - Fill or stroke color
   * @param {boolean} [stroke=false] - Whether to stroke instead of fill
   */
  drawCircle(x, y, radius, color, stroke = false) {
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, Math.PI * 2);
    
    if (stroke) {
      this.context.strokeStyle = color;
      this.context.stroke();
    } else {
      this.context.fillStyle = color;
      this.context.fill();
    }
  }

  /**
   * Draw a line
   * @param {number} x1 - Start X position
   * @param {number} y1 - Start Y position
   * @param {number} x2 - End X position
   * @param {number} y2 - End Y position
   * @param {string} color - Line color
   * @param {number} [width=1] - Line width
   */
  drawLine(x1, y1, x2, y2, color, width = 1) {
    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.strokeStyle = color;
    this.context.lineWidth = width;
    this.context.stroke();
  }

  /**
   * Draw text
   * @param {string} text - Text to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {object} [style] - Text style options
   * @param {string} [style.font='16px Arial'] - Font specification
   * @param {string} [style.color='#000000'] - Text color
   * @param {string} [style.align='left'] - Text alignment
   * @param {string} [style.baseline='top'] - Text baseline
   * @param {boolean} [style.stroke=false] - Whether to add stroke outline
   * @param {string} [style.strokeColor='#000000'] - Stroke color
   * @param {number} [style.strokeWidth=1] - Stroke width
   */
  drawText(text, x, y, style = {}) {
    const {
      font = '16px Arial',
      color = '#000000',
      align = 'left',
      baseline = 'top',
      stroke = false,
      strokeColor = '#000000',
      strokeWidth = 1
    } = style;

    this.context.font = font;
    this.context.textAlign = align;
    this.context.textBaseline = baseline;
    
    // Draw stroke first if requested
    if (stroke) {
      this.context.strokeStyle = strokeColor;
      this.context.lineWidth = strokeWidth;
      this.context.strokeText(text, x, y);
    }
    
    // Draw fill text
    this.context.fillStyle = color;
    this.context.fillText(text, x, y);
  }

  /**
   * Draw a sprite (image)
   * @param {HTMLImageElement} image - The image to draw
   * @param {number} x - Destination X position
   * @param {number} y - Destination Y position
   * @param {object} [sourceRect] - Source rectangle for sprite sheet
   * @param {number} sourceRect.x - Source X position
   * @param {number} sourceRect.y - Source Y position
   * @param {number} sourceRect.width - Source width
   * @param {number} sourceRect.height - Source height
   * @param {number} [destWidth] - Destination width (for scaling)
   * @param {number} [destHeight] - Destination height (for scaling)
   */
  drawSprite(image, x, y, sourceRect = null, destWidth = null, destHeight = null) {
    if (sourceRect) {
      const dWidth = destWidth || sourceRect.width;
      const dHeight = destHeight || sourceRect.height;
      this.context.drawImage(
        image,
        sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
        x, y, dWidth, dHeight
      );
    } else {
      const dWidth = destWidth || image.width;
      const dHeight = destHeight || image.height;
      this.context.drawImage(image, x, y, dWidth, dHeight);
    }
  }

  /**
   * Apply transformation matrix for rendering
   * @param {object} transform - Transformation properties
   * @param {number} transform.x - Translation X
   * @param {number} transform.y - Translation Y
   * @param {number} [transform.rotation=0] - Rotation in radians
   * @param {number} [transform.scaleX=1] - Scale factor X
   * @param {number} [transform.scaleY=1] - Scale factor Y
   */
  setTransform(transform) {
    const { x, y, rotation = 0, scaleX = 1, scaleY = 1 } = transform;
    
    this.context.save();
    this.context.translate(x, y);
    if (rotation !== 0) {
      this.context.rotate(rotation);
    }
    if (scaleX !== 1 || scaleY !== 1) {
      this.context.scale(scaleX, scaleY);
    }
  }

  /**
   * Reset transformation matrix to previous state
   */
  resetTransform() {
    this.context.restore();
  }

  /**
   * Set the background color
   * @param {string} color - Background color
   */
  setBackgroundColor(color) {
    this.backgroundColor = color;
  }

  /**
   * Draw entity with sprite if available, fallback to vector shape
   * @param {string} entityType - Type of entity (character, console, guest)
   * @param {string} spriteId - Sprite identifier
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Function} fallbackRenderer - Function to render fallback shape
   * @param {Object} [options] - Additional rendering options
   * @param {number} [options.width] - Override sprite width
   * @param {number} [options.height] - Override sprite height
   * @param {number} [options.offsetX=0] - X offset for centering
   * @param {number} [options.offsetY=0] - Y offset for centering
   */
  drawEntityWithSprite(entityType, spriteId, x, y, fallbackRenderer, options = {}) {
    const { width, height, offsetX = 0, offsetY = 0 } = options;
    
    // Try to use sprite if sprite loader is available and sprite is loaded
    if (this.spriteLoader && this.spriteLoader.isLoaded(entityType, spriteId)) {
      const sprite = this.spriteLoader.getSprite(entityType, spriteId);
      if (sprite) {
        const spriteWidth = width || sprite.width;
        const spriteHeight = height || sprite.height;
        
        // Draw sprite centered at position with scaling
        this.drawSprite(
          sprite, 
          x - spriteWidth / 2 + offsetX, 
          y - spriteHeight / 2 + offsetY,
          null, // no source rect
          spriteWidth, // destination width
          spriteHeight // destination height
        );
        return true; // Sprite was drawn
      }
    }
    
    // Fallback to vector rendering
    if (fallbackRenderer) {
      fallbackRenderer();
    }
    return false; // Sprite was not drawn, used fallback
  }

  /**
   * Draw character entity (sprite with fallback)
   * @param {Object} character - Character entity
   */
  drawCharacter(character) {
    const transform = character.getComponent('Transform');
    const movement = character.getComponent('Movement');
    
    // Determine character facing direction and sprite
    let direction = this.getCharacterDirection(movement, character);
    let spriteId = this.getCharacterSprite(movement, direction);
    
    // Try sprite first, fallback to vector circle
    this.drawEntityWithSprite(
      'character', 
      spriteId,
      transform.x,
      transform.y,
      () => {
        // Fallback: Draw as colored circle (existing implementation)
        let characterColor = character.color;
        if (character.hasSpeedBoost) {
          characterColor = '#66FF66';
        } else if (character.hasRepairBoost) {
          characterColor = '#FFFF66';
        }
        
        this.drawCircle(
          transform.x,
          transform.y,
          character.radius,
          characterColor
        );
      },
      { width: 48, height: 72 } // Scale up for better visibility
    );
  }

  /**
   * Determine character facing direction based on movement
   * @param {Movement} movement - Movement component
   * @param {Character} character - Character entity
   * @returns {string} Direction: 'down', 'up', 'left', 'right'
   */
  getCharacterDirection(movement, character) {
    if (!movement || (movement.direction.x === 0 && movement.direction.y === 0)) {
      // No movement - use last facing direction or default to down
      return character.lastDirection || 'down';
    }

    // Determine primary direction based on movement vector
    const { x, y } = movement.direction;
    
    // Prioritize vertical movement over horizontal for cleaner animation
    if (Math.abs(y) > Math.abs(x)) {
      return y > 0 ? 'down' : 'up';
    } else {
      return x > 0 ? 'right' : 'left';
    }
  }

  /**
   * Get appropriate sprite ID for character based on movement and direction
   * @param {Movement} movement - Movement component
   * @param {string} direction - Character facing direction
   * @returns {string} Sprite ID
   */
  getCharacterSprite(movement, direction) {
    const isMoving = movement && (movement.direction.x !== 0 || movement.direction.y !== 0);
    
    if (!isMoving) {
      // Idle sprite for current direction
      return `volunteer_idle_${direction}`;
    } else {
      // Walking animation - alternate between frames
      const animFrame = Math.floor(Date.now() / 250) % 2; // 250ms per frame (4 FPS)
      const frameNumber = animFrame === 0 ? '01' : '02';
      return `volunteer_walk_${direction}_${frameNumber}`;
    }
  }

  /**
   * Darken a hex color by a given factor
   * @param {string} color - Hex color (e.g., '#FF6B6B')
   * @param {number} factor - Darkening factor (0-1, where 1 is black)
   * @returns {string} Darkened hex color
   */
  darkenColor(color, factor) {
    // Remove # if present
    const hex = color.replace('#', '');
    
    // Parse RGB components
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Apply darkening
    const newR = Math.floor(r * (1 - factor));
    const newG = Math.floor(g * (1 - factor));
    const newB = Math.floor(b * (1 - factor));
    
    // Convert back to hex
    return '#' + 
      newR.toString(16).padStart(2, '0') +
      newG.toString(16).padStart(2, '0') +
      newB.toString(16).padStart(2, '0');
  }

  /**
   * Draw console entity (sprite with fallback)
   * @param {Object} console - Console entity
   */
  drawConsole(console) {
    const transform = console.getComponent('Transform');
    
    // Determine sprite based on console type, tier, and state
    let spriteId = `${console.type.replace('-', '_')}_tier${console.tier}`;
    if (console.state === 'broken') {
      spriteId += '_broken';
    }
    
    // Try sprite first, fallback to vector rectangle
    return this.drawEntityWithSprite(
      'consoles',
      spriteId,
      transform.x,
      transform.y,
      () => {
        // Fallback: Draw as colored rectangle (existing implementation)
        let color = '#666666'; // Default gray
        
        // Color based on console type
        switch (console.type) {
          case 'retro-arcade':
            color = '#FF6B6B'; // Red
            break;
          case 'classic-home':
            color = '#4ECDC4'; // Teal
            break;
          case 'modern-gaming':
            color = '#45B7D1'; // Blue
            break;
          case 'vr-experience':
            color = '#96CEB4'; // Green
            break;
        }
        
        // Darken color if broken
        if (console.state === 'broken') {
          color = this.darkenColor(color, 0.4);
        }
        
        // Draw console body
        this.drawRect(
          transform.x - console.width / 2,
          transform.y - console.height / 2,
          console.width,
          console.height,
          color
        );
        
        // Draw screen - red if broken, black if working
        let screenColor = '#000000';
        if (console.state === 'broken') {
          screenColor = '#330000'; // Dark red for broken
        }
        
        this.drawRect(
          transform.x - console.width / 2 + 4,
          transform.y - console.height / 2 + 4,
          console.width - 8,
          console.height / 2 - 4,
          screenColor
        );
        
        // Draw broken indicator
        if (console.state === 'broken') {
          this.drawText(
            '!',
            transform.x + console.width / 2 - 8,
            transform.y - console.height / 2 + 12,
            {
              font: 'bold 16px Arial',
              color: '#FF0000',
              align: 'center'
            }
          );
        }
      },
      { width: 80, height: 80 } // Scale up for better visibility
    );
  }

  /**
   * Draw guest entity (sprite with fallback)
   * @param {Object} guest - Guest entity
   */
  drawGuest(guest) {
    const transform = guest.getComponent('Transform');
    
    // Determine sprite based on guest type
    let spriteId;
    switch (guest.type) {
      case 'casual':
      case 'family':
        spriteId = 'casual_family_01';
        break;
      case 'enthusiast':
        spriteId = 'enthusiast_gamer';
        break;
      case 'tourist':
        spriteId = 'school_group'; // Using school group sprite for tourists
        break;
      default:
        spriteId = 'casual_family_01';
    }
    
    // Try sprite first, fallback to vector shape
    return this.drawEntityWithSprite(
      'guests',
      spriteId,
      transform.x,
      transform.y,
      () => {
        // Fallback: Draw as colored circle (existing implementation)
        let color = '#8B4513'; // Brown default
        
        // Color based on guest type
        switch (guest.type) {
          case 'casual':
            color = '#32CD32'; // Green
            break;
          case 'family':
            color = '#FFB347'; // Orange
            break;
          case 'enthusiast':
            color = '#9370DB'; // Purple
            break;
          case 'tourist':
            color = '#20B2AA'; // Teal
            break;
        }
        
        this.drawCircle(
          transform.x,
          transform.y,
          guest.radius || 8,
          color
        );
      },
      { width: 36, height: 48 } // Scale up for better visibility
    );
  }

  /**
   * Set sprite loader for the render system
   * @param {SpriteLoader} spriteLoader - Sprite loader instance
   */
  setSpriteLoader(spriteLoader) {
    this.spriteLoader = spriteLoader;
  }
}