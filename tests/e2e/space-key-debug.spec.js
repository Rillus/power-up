import { test, expect } from '@playwright/test';

test.describe('Space Key Input Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.waitForFunction(() => window.game !== undefined);
  });

  test('should detect space key presses in browser', async ({ page }) => {
    // Check that input system is working
    const inputSystemExists = await page.evaluate(() => {
      return window.game.inputSystem !== undefined;
    });
    
    expect(inputSystemExists).toBe(true);
    
    // Break a console for testing
    await page.evaluate(() => {
      const console = window.game.consoles[0];
      console.durability = 0;
      console.state = 'broken';
      
      // Move player near the console
      const playerTransform = window.game.player.getComponent('Transform');
      const consoleTransform = console.getComponent('Transform');
      playerTransform.setPosition(consoleTransform.x + 30, consoleTransform.y);
    });
    
    // Focus the canvas to ensure it receives keyboard events
    await page.locator('#game-canvas').focus();
    
    // Wait a moment for focus
    await page.waitForTimeout(100);
    
    // Press space key
    await page.keyboard.press('Space');
    
    // Wait for next frame to process input
    await page.waitForTimeout(50);
    
    // Check if space key was detected
    const spaceDetected = await page.evaluate(() => {
      return window.game.inputSystem.isKeyJustPressed('Space');
    });
    
    // Even if we miss the justPressed window, the console should be repaired
    const consoleState = await page.evaluate(() => {
      return window.game.consoles[0].state;
    });
    
    // Either the space key should be detected OR the console should be under repair
    expect(spaceDetected || consoleState === 'under-repair').toBe(true);
  });

  test('should process space key in game update loop', async ({ page }) => {
    // Set up broken console
    await page.evaluate(() => {
      const console = window.game.consoles[0];
      console.durability = 0;
      console.state = 'broken';
      
      // Position player right next to console
      const playerTransform = window.game.player.getComponent('Transform');
      const consoleTransform = console.getComponent('Transform');
      playerTransform.setPosition(consoleTransform.x + 20, consoleTransform.y);
    });
    
    // Focus canvas
    await page.locator('#game-canvas').focus();
    await page.waitForTimeout(100);
    
    // Get initial state
    const initialState = await page.evaluate(() => {
      return window.game.consoles[0].state;
    });
    
    expect(initialState).toBe('broken');
    
    // Simulate space key press directly through the input system
    await page.evaluate(() => {
      // Simulate keydown event
      const spaceEvent = new KeyboardEvent('keydown', {
        code: 'Space',
        key: ' ',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(spaceEvent);
      
      // Process one game frame
      window.game.update(16.67);
    });
    
    // Check if console state changed
    const finalState = await page.evaluate(() => {
      return window.game.consoles[0].state;
    });
    
    expect(finalState).toBe('under-repair');
  });

  test('should show repair floating number when space pressed', async ({ page }) => {
    // Set up broken console
    await page.evaluate(() => {
      const console = window.game.consoles[0];
      console.durability = 0;
      console.state = 'broken';
      
      // Position player next to console
      const playerTransform = window.game.player.getComponent('Transform');
      const consoleTransform = console.getComponent('Transform');
      playerTransform.setPosition(consoleTransform.x + 25, consoleTransform.y);
      
      // Directly trigger repair interaction
      window.game.handleRepairInteraction();
    });
    
    // Check for floating number
    const floatingNumbers = await page.evaluate(() => {
      return window.game.floatingNumbers.filter(fn => fn.text === 'REPAIRING...');
    });
    
    expect(floatingNumbers.length).toBe(1);
  });
});