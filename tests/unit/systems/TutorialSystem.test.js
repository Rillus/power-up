import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TutorialSystem } from '../../../src/systems/TutorialSystem.js';

describe('TutorialSystem', () => {
  let tutorialSystem;
  let mockRenderer;
  let mockSaveSystem;

  beforeEach(() => {
    mockRenderer = {
      drawRect: vi.fn(),
      drawText: vi.fn(),
      drawCircle: vi.fn()
    };

    mockSaveSystem = {
      loadGame: vi.fn(() => ({ 
        success: true, 
        data: { settings: { tutorialCompleted: false } }
      })),
      saveGame: vi.fn(() => ({ success: true }))
    };

    tutorialSystem = new TutorialSystem(mockSaveSystem);
  });

  describe('constructor', () => {
    it('should initialize with default state', () => {
      expect(tutorialSystem.isActive).toBe(false);
      expect(tutorialSystem.currentStep).toBe(0);
      expect(tutorialSystem.steps.length).toBeGreaterThan(0);
    });

    it('should load tutorial completion status', () => {
      mockSaveSystem.loadGame.mockReturnValue({
        success: true,
        data: { settings: { tutorialCompleted: true } }
      });

      const completedTutorial = new TutorialSystem(mockSaveSystem);
      expect(completedTutorial.tutorialCompleted).toBe(true);
    });
  });

  describe('tutorial steps', () => {
    it('should have movement step', () => {
      const movementStep = tutorialSystem.steps.find(step => step.id === 'movement');
      
      expect(movementStep).toBeDefined();
      expect(movementStep.title).toContain('Movement');
      expect(movementStep.description).toContain('WASD');
    });

    it('should have console purchase step', () => {
      const purchaseStep = tutorialSystem.steps.find(step => step.id === 'purchase');
      
      expect(purchaseStep).toBeDefined();
      expect(purchaseStep.title).toContain('Console');
      expect(purchaseStep.description).toContain('click');
    });

    it('should have repair step', () => {
      const repairStep = tutorialSystem.steps.find(step => step.id === 'repair');
      
      expect(repairStep).toBeDefined();
      expect(repairStep.title).toContain('Repair');
      expect(repairStep.description).toContain('SPACE');
    });

    it('should have guest management step', () => {
      const guestStep = tutorialSystem.steps.find(step => step.id === 'guests');
      
      expect(guestStep).toBeDefined();
      expect(guestStep.title).toContain('Guest');
    });

    it('should have objective step', () => {
      const objectiveStep = tutorialSystem.steps.find(step => step.id === 'objective');
      
      expect(objectiveStep).toBeDefined();
      expect(objectiveStep.title).toContain('Objective');
    });
  });

  describe('tutorial control', () => {
    describe('startTutorial', () => {
      it('should start tutorial if not completed', () => {
        tutorialSystem.tutorialCompleted = false;
        
        const result = tutorialSystem.startTutorial();
        
        expect(result).toBe(true);
        expect(tutorialSystem.isActive).toBe(true);
        expect(tutorialSystem.currentStep).toBe(0);
      });

      it('should not start tutorial if already completed', () => {
        tutorialSystem.tutorialCompleted = true;
        
        const result = tutorialSystem.startTutorial();
        
        expect(result).toBe(false);
        expect(tutorialSystem.isActive).toBe(false);
      });

      it('should allow forcing tutorial restart', () => {
        tutorialSystem.tutorialCompleted = true;
        
        const result = tutorialSystem.startTutorial(true);
        
        expect(result).toBe(true);
        expect(tutorialSystem.isActive).toBe(true);
      });
    });

    describe('nextStep', () => {
      beforeEach(() => {
        tutorialSystem.startTutorial();
      });

      it('should advance to next step', () => {
        tutorialSystem.nextStep();
        
        expect(tutorialSystem.currentStep).toBe(1);
      });

      it('should complete tutorial on last step', () => {
        // Advance to last step
        tutorialSystem.currentStep = tutorialSystem.steps.length - 1;
        
        tutorialSystem.nextStep();
        
        expect(tutorialSystem.isActive).toBe(false);
        expect(tutorialSystem.tutorialCompleted).toBe(true);
      });

      it('should save completion status', () => {
        tutorialSystem.currentStep = tutorialSystem.steps.length - 1;
        
        tutorialSystem.nextStep();
        
        expect(mockSaveSystem.saveGame).toHaveBeenCalledWith(
          expect.objectContaining({
            settings: expect.objectContaining({
              tutorialCompleted: true
            })
          })
        );
      });
    });

    describe('previousStep', () => {
      beforeEach(() => {
        tutorialSystem.startTutorial();
        tutorialSystem.currentStep = 2;
      });

      it('should go back to previous step', () => {
        tutorialSystem.previousStep();
        
        expect(tutorialSystem.currentStep).toBe(1);
      });

      it('should not go below step 0', () => {
        tutorialSystem.currentStep = 0;
        tutorialSystem.previousStep();
        
        expect(tutorialSystem.currentStep).toBe(0);
      });
    });

    describe('skipTutorial', () => {
      beforeEach(() => {
        tutorialSystem.startTutorial();
      });

      it('should end tutorial and mark as completed', () => {
        tutorialSystem.skipTutorial();
        
        expect(tutorialSystem.isActive).toBe(false);
        expect(tutorialSystem.tutorialCompleted).toBe(true);
      });

      it('should save completion status', () => {
        tutorialSystem.skipTutorial();
        
        expect(mockSaveSystem.saveGame).toHaveBeenCalled();
      });
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      tutorialSystem.startTutorial();
    });

    describe('render', () => {
      it('should render overlay when active', () => {
        tutorialSystem.render(mockRenderer);
        
        expect(mockRenderer.drawRect).toHaveBeenCalled(); // Background overlay
        expect(mockRenderer.drawText).toHaveBeenCalled(); // Tutorial text
      });

      it('should not render when inactive', () => {
        tutorialSystem.isActive = false;
        
        tutorialSystem.render(mockRenderer);
        
        expect(mockRenderer.drawRect).not.toHaveBeenCalled();
        expect(mockRenderer.drawText).not.toHaveBeenCalled();
      });

      it('should render current step content', () => {
        const currentStep = tutorialSystem.getCurrentStep();
        
        tutorialSystem.render(mockRenderer);
        
        // Should render step title and description
        expect(mockRenderer.drawText).toHaveBeenCalledWith(
          currentStep.title,
          expect.any(Number),
          expect.any(Number),
          expect.any(Object)
        );
      });

      it('should render step counter', () => {
        tutorialSystem.render(mockRenderer);
        
        const stepText = `Step 1 of ${tutorialSystem.steps.length}`;
        expect(mockRenderer.drawText).toHaveBeenCalledWith(
          stepText,
          expect.any(Number),
          expect.any(Number),
          expect.any(Object)
        );
      });

      it('should render navigation buttons', () => {
        tutorialSystem.currentStep = 1; // Not first step
        
        tutorialSystem.render(mockRenderer);
        
        // Should render Next and Previous buttons
        expect(mockRenderer.drawText).toHaveBeenCalledWith(
          'Next',
          expect.any(Number),
          expect.any(Number),
          expect.any(Object)
        );
        
        expect(mockRenderer.drawText).toHaveBeenCalledWith(
          'Previous',
          expect.any(Number),
          expect.any(Number),
          expect.any(Object)
        );
      });

      it('should render skip button', () => {
        tutorialSystem.render(mockRenderer);
        
        expect(mockRenderer.drawText).toHaveBeenCalledWith(
          'Skip Tutorial',
          expect.any(Number),
          expect.any(Number),
          expect.any(Object)
        );
      });
    });

    describe('visual highlights', () => {
      it('should render highlight for movement step', () => {
        tutorialSystem.currentStep = 0; // Movement step
        
        tutorialSystem.render(mockRenderer);
        
        // Should highlight WASD area or character
        expect(mockRenderer.drawCircle).toHaveBeenCalled();
      });

      it('should render highlight for console areas', () => {
        const purchaseStep = tutorialSystem.findStepIndex('purchase');
        tutorialSystem.currentStep = purchaseStep;
        
        tutorialSystem.render(mockRenderer);
        
        // Should highlight console placement areas
        expect(mockRenderer.drawRect).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.stringContaining('#') // Color highlight
        );
      });
    });
  });

  describe('interaction handling', () => {
    beforeEach(() => {
      tutorialSystem.startTutorial();
    });

    describe('handleClick', () => {
      it('should advance step on Next button click', () => {
        const nextButton = tutorialSystem.getButtonBounds('next');
        
        const result = tutorialSystem.handleClick(
          nextButton.x + 10, 
          nextButton.y + 10
        );
        
        expect(result).toBe(true);
        expect(tutorialSystem.currentStep).toBe(1);
      });

      it('should go back on Previous button click', () => {
        tutorialSystem.currentStep = 1;
        const prevButton = tutorialSystem.getButtonBounds('previous');
        
        const result = tutorialSystem.handleClick(
          prevButton.x + 10,
          prevButton.y + 10
        );
        
        expect(result).toBe(true);
        expect(tutorialSystem.currentStep).toBe(0);
      });

      it('should skip on Skip button click', () => {
        const skipButton = tutorialSystem.getButtonBounds('skip');
        
        const result = tutorialSystem.handleClick(
          skipButton.x + 10,
          skipButton.y + 10
        );
        
        expect(result).toBe(true);
        expect(tutorialSystem.isActive).toBe(false);
        expect(tutorialSystem.tutorialCompleted).toBe(true);
      });

      it('should not handle clicks outside buttons', () => {
        const result = tutorialSystem.handleClick(10, 10);
        
        expect(result).toBe(false);
        expect(tutorialSystem.currentStep).toBe(0); // Unchanged
      });
    });

    describe('handleKeyPress', () => {
      it('should advance on Enter key', () => {
        const result = tutorialSystem.handleKeyPress('Enter');
        
        expect(result).toBe(true);
        expect(tutorialSystem.currentStep).toBe(1);
      });

      it('should go back on Backspace key', () => {
        tutorialSystem.currentStep = 1;
        
        const result = tutorialSystem.handleKeyPress('Backspace');
        
        expect(result).toBe(true);
        expect(tutorialSystem.currentStep).toBe(0);
      });

      it('should skip on Escape key', () => {
        const result = tutorialSystem.handleKeyPress('Escape');
        
        expect(result).toBe(true);
        expect(tutorialSystem.isActive).toBe(false);
      });

      it('should not handle other keys', () => {
        const result = tutorialSystem.handleKeyPress('A');
        
        expect(result).toBe(false);
      });
    });
  });

  describe('step management', () => {
    describe('getCurrentStep', () => {
      it('should return current step object', () => {
        tutorialSystem.startTutorial();
        
        const step = tutorialSystem.getCurrentStep();
        
        expect(step).toBe(tutorialSystem.steps[0]);
      });

      it('should return null when inactive', () => {
        const step = tutorialSystem.getCurrentStep();
        
        expect(step).toBeNull();
      });
    });

    describe('findStepIndex', () => {
      it('should find step by ID', () => {
        const index = tutorialSystem.findStepIndex('movement');
        
        expect(index).toBe(0);
      });

      it('should return -1 for unknown step', () => {
        const index = tutorialSystem.findStepIndex('unknown');
        
        expect(index).toBe(-1);
      });
    });

    describe('isFirstStep', () => {
      it('should return true for first step', () => {
        tutorialSystem.startTutorial();
        
        expect(tutorialSystem.isFirstStep()).toBe(true);
      });

      it('should return false for other steps', () => {
        tutorialSystem.startTutorial();
        tutorialSystem.currentStep = 1;
        
        expect(tutorialSystem.isFirstStep()).toBe(false);
      });
    });

    describe('isLastStep', () => {
      it('should return true for last step', () => {
        tutorialSystem.startTutorial();
        tutorialSystem.currentStep = tutorialSystem.steps.length - 1;
        
        expect(tutorialSystem.isLastStep()).toBe(true);
      });

      it('should return false for other steps', () => {
        tutorialSystem.startTutorial();
        
        expect(tutorialSystem.isLastStep()).toBe(false);
      });
    });
  });

  describe('progress tracking', () => {
    describe('getProgress', () => {
      it('should calculate progress percentage', () => {
        tutorialSystem.startTutorial();
        tutorialSystem.currentStep = 2;
        
        const progress = tutorialSystem.getProgress();
        const expected = (2 / tutorialSystem.steps.length) * 100;
        
        expect(progress).toBe(expected);
      });

      it('should return 0 when inactive', () => {
        const progress = tutorialSystem.getProgress();
        
        expect(progress).toBe(0);
      });
    });

    describe('getRemainingSteps', () => {
      it('should return remaining step count', () => {
        tutorialSystem.startTutorial();
        tutorialSystem.currentStep = 1;
        
        const remaining = tutorialSystem.getRemainingSteps();
        
        expect(remaining).toBe(tutorialSystem.steps.length - 2); // -1 for current, -1 for 0-indexing
      });
    });
  });

  describe('utility methods', () => {
    describe('isPointInButton', () => {
      it('should detect point inside button bounds', () => {
        const button = { x: 100, y: 200, width: 80, height: 30 };
        
        expect(tutorialSystem.isPointInButton(120, 210, button)).toBe(true);
        expect(tutorialSystem.isPointInButton(50, 210, button)).toBe(false);
      });
    });

    describe('getButtonBounds', () => {
      it('should return bounds for valid button', () => {
        const bounds = tutorialSystem.getButtonBounds('next');
        
        expect(bounds).toHaveProperty('x');
        expect(bounds).toHaveProperty('y');
        expect(bounds).toHaveProperty('width');
        expect(bounds).toHaveProperty('height');
      });

      it('should return null for invalid button', () => {
        const bounds = tutorialSystem.getButtonBounds('invalid');
        
        expect(bounds).toBeNull();
      });
    });
  });

  describe('reset functionality', () => {
    describe('resetTutorial', () => {
      it('should reset tutorial state', () => {
        tutorialSystem.startTutorial();
        tutorialSystem.currentStep = 3;
        
        tutorialSystem.resetTutorial();
        
        expect(tutorialSystem.isActive).toBe(false);
        expect(tutorialSystem.currentStep).toBe(0);
        expect(tutorialSystem.tutorialCompleted).toBe(false);
      });

      it('should save reset state', () => {
        tutorialSystem.resetTutorial();
        
        expect(mockSaveSystem.saveGame).toHaveBeenCalledWith(
          expect.objectContaining({
            settings: expect.objectContaining({
              tutorialCompleted: false
            })
          })
        );
      });
    });
  });
});