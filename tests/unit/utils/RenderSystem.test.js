import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderSystem } from '../../../src/engine/systems/RenderSystem.js';

// Mock Canvas and Context
const createMockCanvas = () => {
  const mockContext = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    setTransform: vi.fn(),
  };

  const mockCanvas = {
    width: 1200,
    height: 800,
    getContext: vi.fn(() => mockContext),
  };

  return { mockCanvas, mockContext };
};

describe('RenderSystem', () => {
  let renderSystem;
  let mockCanvas;
  let mockContext;

  beforeEach(() => {
    ({ mockCanvas, mockContext } = createMockCanvas());
    renderSystem = new RenderSystem(mockCanvas);
  });

  describe('constructor', () => {
    it('should initialize with canvas and context', () => {
      expect(renderSystem.canvas).toBe(mockCanvas);
      expect(renderSystem.context).toBe(mockContext);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should initialize with default background color', () => {
      expect(renderSystem.backgroundColor).toBe('#f5f5f5');
    });
  });

  describe('clear', () => {
    it('should clear the entire canvas', () => {
      renderSystem.clear();
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 1200, 800);
    });

    it('should fill with background color', () => {
      renderSystem.clear();
      
      expect(mockContext.fillStyle).toBe('#f5f5f5');
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 1200, 800);
    });
  });

  describe('drawRect', () => {
    it('should draw filled rectangle', () => {
      renderSystem.drawRect(10, 20, 100, 50, '#ff0000');
      
      expect(mockContext.fillStyle).toBe('#ff0000');
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 100, 50);
    });

    it('should draw stroked rectangle when stroke is true', () => {
      renderSystem.drawRect(10, 20, 100, 50, '#ff0000', true);
      
      expect(mockContext.strokeStyle).toBe('#ff0000');
      expect(mockContext.strokeRect).toHaveBeenCalledWith(10, 20, 100, 50);
    });
  });

  describe('drawCircle', () => {
    it('should draw filled circle', () => {
      renderSystem.drawCircle(50, 60, 25, '#00ff00');
      
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledWith(50, 60, 25, 0, Math.PI * 2);
      expect(mockContext.fillStyle).toBe('#00ff00');
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should draw stroked circle when stroke is true', () => {
      renderSystem.drawCircle(50, 60, 25, '#00ff00', true);
      
      expect(mockContext.strokeStyle).toBe('#00ff00');
      expect(mockContext.stroke).toHaveBeenCalled();
    });
  });

  describe('drawText', () => {
    it('should draw text with default style', () => {
      renderSystem.drawText('Hello World', 100, 200);
      
      expect(mockContext.font).toBe('16px Arial');
      expect(mockContext.fillStyle).toBe('#000000');
      expect(mockContext.fillText).toHaveBeenCalledWith('Hello World', 100, 200);
    });

    it('should draw text with custom style', () => {
      const style = {
        font: '24px Helvetica',
        color: '#ff0000',
        align: 'center',
        baseline: 'middle'
      };
      
      renderSystem.drawText('Custom Text', 150, 250, style);
      
      expect(mockContext.font).toBe('24px Helvetica');
      expect(mockContext.fillStyle).toBe('#ff0000');
      expect(mockContext.textAlign).toBe('center');
      expect(mockContext.textBaseline).toBe('middle');
    });
  });

  describe('drawSprite', () => {
    it('should draw image sprite', () => {
      const mockImage = { width: 64, height: 64 };
      
      renderSystem.drawSprite(mockImage, 100, 200);
      
      expect(mockContext.drawImage).toHaveBeenCalledWith(mockImage, 100, 200);
    });

    it('should draw sprite with source rectangle', () => {
      const mockImage = { width: 256, height: 256 };
      const sourceRect = { x: 64, y: 64, width: 32, height: 32 };
      
      renderSystem.drawSprite(mockImage, 100, 200, sourceRect);
      
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImage,
        64, 64, 32, 32,  // source rectangle
        100, 200, 32, 32  // destination rectangle
      );
    });
  });

  describe('setTransform', () => {
    it('should apply transformation matrix', () => {
      const transform = {
        x: 100,
        y: 200,
        rotation: Math.PI / 4,
        scaleX: 2,
        scaleY: 1.5
      };
      
      renderSystem.setTransform(transform);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.translate).toHaveBeenCalledWith(100, 200);
      expect(mockContext.rotate).toHaveBeenCalledWith(Math.PI / 4);
      expect(mockContext.scale).toHaveBeenCalledWith(2, 1.5);
    });
  });

  describe('resetTransform', () => {
    it('should restore previous transformation state', () => {
      renderSystem.resetTransform();
      
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });

  describe('setBackgroundColor', () => {
    it('should update background color', () => {
      renderSystem.setBackgroundColor('#0066cc');
      
      expect(renderSystem.backgroundColor).toBe('#0066cc');
    });
  });
});