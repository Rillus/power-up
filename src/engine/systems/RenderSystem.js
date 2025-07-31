/**
 * Rendering system for drawing to HTML5 Canvas
 * @class
 */
export class RenderSystem {
  /**
   * Create a render system
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.ctx = this.context; // Alias for easier access
    this.backgroundColor = '#f5f5f5';
    
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
   */
  drawSprite(image, x, y, sourceRect = null) {
    if (sourceRect) {
      this.context.drawImage(
        image,
        sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
        x, y, sourceRect.width, sourceRect.height
      );
    } else {
      this.context.drawImage(image, x, y);
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
}