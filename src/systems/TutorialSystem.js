/**
 * TutorialSystem for guiding new players through game mechanics
 * @class TutorialSystem
 */
export class TutorialSystem {
  /**
   * Create a TutorialSystem
   * @param {SaveSystem} saveSystem - Save system for persistence
   */
  constructor(saveSystem) {
    this.saveSystem = saveSystem;
    
    // Tutorial state
    this.isActive = false;
    this.currentStep = 0;
    this.tutorialCompleted = false;
    
    // Load tutorial completion status
    this.loadTutorialStatus();
    
    // Define tutorial steps
    this.steps = this.initializeTutorialSteps();
    
    // UI positioning
    this.overlayAlpha = 0.8;
    this.panelWidth = 400;
    this.panelHeight = 250;
    this.panelX = 200;
    this.panelY = 175;
    
    // Button dimensions
    this.buttonWidth = 80;
    this.buttonHeight = 30;
    this.buttonSpacing = 10;
  }

  /**
   * Load tutorial completion status from save system
   * @private
   */
  loadTutorialStatus() {
    if (!this.saveSystem) return;
    
    const loadResult = this.saveSystem.loadGame();
    if (loadResult.success && loadResult.data.settings) {
      this.tutorialCompleted = loadResult.data.settings.tutorialCompleted || false;
    }
  }

  /**
   * Save tutorial completion status
   * @private
   */
  saveTutorialStatus() {
    if (!this.saveSystem) return;
    
    this.saveSystem.saveGame({
      settings: {
        tutorialCompleted: this.tutorialCompleted
      }
    });
  }

  /**
   * Initialize tutorial steps
   * @returns {Array} Array of tutorial step objects
   * @private
   */
  initializeTutorialSteps() {
    return [
      {
        id: 'movement',
        title: 'Character Movement',
        description: 'Use WASD keys or arrow keys to move your character around the museum floor. Try moving in different directions!',
        highlight: {
          type: 'character',
          x: 400,
          y: 300,
          radius: 30
        },
        keyInstructions: 'Press WASD to move'
      },
      {
        id: 'purchase',
        title: 'Console Purchase',
        description: 'Use keys 1-4 or click on empty console slots (gray rectangles) to purchase gaming consoles. Each console type has different costs and revenue potential.',
        highlight: {
          type: 'areas',
          areas: [
            { x: 100, y: 100, width: 64, height: 64 },
            { x: 200, y: 100, width: 64, height: 64 }
          ]
        },
        keyInstructions: 'Click empty slots to buy consoles'
      },
      {
        id: 'guests',
        title: 'Guest Management',
        description: 'Guests will arrive and queue for consoles. Keep them happy by providing working consoles and avoiding long wait times.',
        highlight: {
          type: 'area',
          x: 50,
          y: 50,
          width: 150,
          height: 100
        },
        keyInstructions: 'Watch guest satisfaction levels'
      },
      {
        id: 'repair',
        title: 'Console Repair',
        description: 'Consoles will break down with use (red indicator). Move near a broken console and press SPACE to repair it.',
        highlight: {
          type: 'instruction',
          text: 'SPACE'
        },
        keyInstructions: 'Press SPACE near broken consoles'
      },
      {
        id: 'objective',
        title: 'Daily Objectives',
        description: 'Each day has revenue and guest targets. Avoid getting too many angry guests (3 max) or the game ends!',
        highlight: {
          type: 'ui',
          areas: [
            { x: 10, y: 10, width: 200, height: 30 }, // Money counter
            { x: 600, y: 10, width: 150, height: 30 }  // Angry counter
          ]
        },
        keyInstructions: 'Keep guests happy and earn money'
      }
    ];
  }

  /**
   * Start the tutorial
   * @param {boolean} [force=false] - Force start even if completed
   * @returns {boolean} True if tutorial started
   */
  startTutorial(force = false) {
    if (this.tutorialCompleted && !force) {
      return false;
    }
    
    this.isActive = true;
    this.currentStep = 0;
    
    return true;
  }

  /**
   * Move to next tutorial step
   */
  nextStep() {
    if (!this.isActive) return;
    
    this.currentStep++;
    
    // Check if tutorial is complete
    if (this.currentStep >= this.steps.length) {
      this.completeTutorial();
    }
  }

  /**
   * Move to previous tutorial step
   */
  previousStep() {
    if (!this.isActive || this.currentStep <= 0) return;
    
    this.currentStep--;
  }

  /**
   * Skip the tutorial
   */
  skipTutorial() {
    this.completeTutorial();
  }

  /**
   * Complete the tutorial
   * @private
   */
  completeTutorial() {
    this.isActive = false;
    this.tutorialCompleted = true;
    this.saveTutorialStatus();
  }

  /**
   * Reset tutorial (for testing or replay)
   */
  resetTutorial() {
    this.isActive = false;
    this.currentStep = 0;
    this.tutorialCompleted = false;
    this.saveTutorialStatus();
  }

  /**
   * Get current tutorial step
   * @returns {Object|null} Current step object or null if inactive
   */
  getCurrentStep() {
    if (!this.isActive || this.currentStep >= this.steps.length) {
      return null;
    }
    
    return this.steps[this.currentStep];
  }

  /**
   * Find step index by ID
   * @param {string} stepId - Step identifier
   * @returns {number} Step index or -1 if not found
   */
  findStepIndex(stepId) {
    return this.steps.findIndex(step => step.id === stepId);
  }

  /**
   * Check if on first step
   * @returns {boolean} True if on first step
   */
  isFirstStep() {
    return this.currentStep === 0;
  }

  /**
   * Check if on last step
   * @returns {boolean} True if on last step
   */
  isLastStep() {
    return this.currentStep === this.steps.length - 1;
  }

  /**
   * Get tutorial progress percentage
   * @returns {number} Progress percentage (0-100)
   */
  getProgress() {
    if (!this.isActive) return 0;
    
    return (this.currentStep / this.steps.length) * 100;
  }

  /**
   * Get remaining steps count
   * @returns {number} Number of remaining steps
   */
  getRemainingSteps() {
    if (!this.isActive) return 0;
    
    return this.steps.length - this.currentStep - 1;
  }

  /**
   * Handle click events
   * @param {number} x - Click X coordinate
   * @param {number} y - Click Y coordinate
   * @returns {boolean} True if click was handled
   */
  handleClick(x, y) {
    if (!this.isActive) return false;
    
    // Check button clicks
    const nextButton = this.getButtonBounds('next');
    if (this.isPointInButton(x, y, nextButton)) {
      this.nextStep();
      return true;
    }
    
    const prevButton = this.getButtonBounds('previous');
    if (!this.isFirstStep() && this.isPointInButton(x, y, prevButton)) {
      this.previousStep();
      return true;
    }
    
    const skipButton = this.getButtonBounds('skip');
    if (this.isPointInButton(x, y, skipButton)) {
      this.skipTutorial();
      return true;
    }
    
    return false;
  }

  /**
   * Handle keyboard input
   * @param {string} key - Key pressed
   * @returns {boolean} True if key was handled
   */
  handleKeyPress(key) {
    if (!this.isActive) return false;
    
    switch (key) {
      case 'Enter':
        this.nextStep();
        return true;
        
      case 'Backspace':
        if (!this.isFirstStep()) {
          this.previousStep();
        }
        return true;
        
      case 'Escape':
        this.skipTutorial();
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Check if point is inside button bounds
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @param {Object} button - Button bounds object
   * @returns {boolean} True if point is inside button
   */
  isPointInButton(x, y, button) {
    if (!button) return false;
    
    return x >= button.x && 
           x <= button.x + button.width &&
           y >= button.y && 
           y <= button.y + button.height;
  }

  /**
   * Get button bounds for specified button type
   * @param {string} buttonType - Button type ('next', 'previous', 'skip')
   * @returns {Object|null} Button bounds or null
   */
  getButtonBounds(buttonType) {
    const baseY = this.panelY + this.panelHeight - 50;
    
    switch (buttonType) {
      case 'next':
        return {
          x: this.panelX + this.panelWidth - this.buttonWidth - 20,
          y: baseY,
          width: this.buttonWidth,
          height: this.buttonHeight
        };
        
      case 'previous':
        return {
          x: this.panelX + 20,
          y: baseY,
          width: this.buttonWidth,
          height: this.buttonHeight
        };
        
      case 'skip':
        return {
          x: this.panelX + this.panelWidth - this.buttonWidth - 20,
          y: this.panelY + 10,
          width: this.buttonWidth,
          height: this.buttonHeight
        };
        
      default:
        return null;
    }
  }

  /**
   * Render tutorial overlay
   * @param {RenderSystem} renderer - Render system instance
   */
  render(renderer) {
    if (!this.isActive) return;
    
    const currentStep = this.getCurrentStep();
    if (!currentStep) return;
    
    // Draw semi-transparent overlay
    renderer.drawRect(0, 0, 800, 600, `rgba(0, 0, 0, ${this.overlayAlpha})`);
    
    // Draw tutorial panel background
    renderer.drawRect(
      this.panelX, 
      this.panelY, 
      this.panelWidth, 
      this.panelHeight, 
      '#FFFFFF'
    );
    
    // Draw panel border
    renderer.drawRect(
      this.panelX - 2, 
      this.panelY - 2, 
      this.panelWidth + 4, 
      this.panelHeight + 4, 
      '#0066CC'
    );
    
    // Draw step counter
    const stepText = `Step ${this.currentStep + 1} of ${this.steps.length}`;
    renderer.drawText(
      stepText,
      this.panelX + 20,
      this.panelY + 25,
      {
        color: '#666666',
        fontSize: 14,
        fontFamily: 'Arial'
      }
    );
    
    // Draw step title
    renderer.drawText(
      currentStep.title,
      this.panelX + 20,
      this.panelY + 50,
      {
        color: '#0066CC',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Arial'
      }
    );
    
    // Draw step description (word wrap)
    this.drawWrappedText(
      renderer,
      currentStep.description,
      this.panelX + 20,
      this.panelY + 80,
      this.panelWidth - 40,
      {
        color: '#333333',
        fontSize: 14,
        lineHeight: 20,
        fontFamily: 'Arial'
      }
    );
    
    // Draw key instructions
    renderer.drawText(
      currentStep.keyInstructions,
      this.panelX + 20,
      this.panelY + 160,
      {
        color: '#0066CC',
        fontSize: 12,
        fontStyle: 'italic',
        fontFamily: 'Arial'
      }
    );
    
    // Draw buttons
    this.drawButtons(renderer);
    
    // Draw highlights
    this.drawHighlights(renderer, currentStep);
  }

  /**
   * Draw wrapped text
   * @param {RenderSystem} renderer - Render system
   * @param {string} text - Text to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} maxWidth - Maximum width for wrapping
   * @param {Object} style - Text style
   * @private
   */
  drawWrappedText(renderer, text, x, y, maxWidth, style) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      
      // Estimate text width (rough approximation)
      const estimatedWidth = testLine.length * (style.fontSize * 0.6);
      
      if (estimatedWidth > maxWidth && line !== '') {
        renderer.drawText(line.trim(), x, currentY, style);
        line = words[i] + ' ';
        currentY += style.lineHeight || style.fontSize + 4;
      } else {
        line = testLine;
      }
    }
    
    if (line.trim()) {
      renderer.drawText(line.trim(), x, currentY, style);
    }
  }

  /**
   * Draw tutorial navigation buttons
   * @param {RenderSystem} renderer - Render system
   * @private
   */
  drawButtons(renderer) {
    // Next button
    const nextButton = this.getButtonBounds('next');
    renderer.drawRect(
      nextButton.x, 
      nextButton.y, 
      nextButton.width, 
      nextButton.height, 
      '#0066CC'
    );
    renderer.drawText(
      this.isLastStep() ? 'Finish' : 'Next',
      nextButton.x + nextButton.width / 2,
      nextButton.y + nextButton.height / 2 + 4,
      {
        color: '#FFFFFF',
        fontSize: 12,
        textAlign: 'center',
        fontFamily: 'Arial'
      }
    );
    
    // Previous button (if not first step)
    if (!this.isFirstStep()) {
      const prevButton = this.getButtonBounds('previous');
      renderer.drawRect(
        prevButton.x, 
        prevButton.y, 
        prevButton.width, 
        prevButton.height, 
        '#CCCCCC'
      );
      renderer.drawText(
        'Previous',
        prevButton.x + prevButton.width / 2,
        prevButton.y + prevButton.height / 2 + 4,
        {
          color: '#333333',
          fontSize: 12,
          textAlign: 'center',
          fontFamily: 'Arial'
        }
      );
    }
    
    // Skip button
    const skipButton = this.getButtonBounds('skip');
    renderer.drawText(
      'Skip Tutorial',
      skipButton.x,
      skipButton.y + 12,
      {
        color: '#666666',
        fontSize: 11,
        textDecoration: 'underline',
        fontFamily: 'Arial'
      }
    );
  }

  /**
   * Draw visual highlights for current step
   * @param {RenderSystem} renderer - Render system
   * @param {Object} step - Current tutorial step
   * @private
   */
  drawHighlights(renderer, step) {
    if (!step.highlight) return;
    
    const highlightColor = '#FFFF00'; // Yellow highlight
    const highlightAlpha = '80'; // Semi-transparent
    
    switch (step.highlight.type) {
      case 'character':
        // Highlight character position
        renderer.drawCircle(
          step.highlight.x,
          step.highlight.y,
          step.highlight.radius,
          highlightColor + highlightAlpha
        );
        break;
        
      case 'area':
        // Highlight specific area
        renderer.drawRect(
          step.highlight.x,
          step.highlight.y,
          step.highlight.width,
          step.highlight.height,
          highlightColor + highlightAlpha
        );
        break;
        
      case 'areas':
        // Highlight multiple areas
        step.highlight.areas.forEach(area => {
          renderer.drawRect(
            area.x,
            area.y,
            area.width,
            area.height,
            highlightColor + highlightAlpha
          );
        });
        break;
        
      case 'ui':
        // Highlight UI elements
        if (step.highlight.areas) {
          step.highlight.areas.forEach(area => {
            renderer.drawRect(
              area.x - 5,
              area.y - 5,
              area.width + 10,
              area.height + 10,
              highlightColor + highlightAlpha
            );
          });
        }
        break;
    }
  }
}