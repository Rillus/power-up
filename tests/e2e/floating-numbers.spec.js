import { test, expect } from '@playwright/test';

test.describe('Floating Numbers System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.waitForFunction(() => window.game !== undefined);
  });

  test('should display floating money numbers when guests pay', async ({ page }) => {
    // Create a guest and simulate payment
    await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      const console = window.game.consoles[0];
      
      // Simulate guest using console and completing interaction
      guest.startUsingConsole(console);
      guest.useStartTime = Date.now() - guest.useTime - 100;
      guest.updateConsoleUse();
      
      // Force payment processing
      window.game.update(16.67);
    });
    
    await page.waitForTimeout(100);
    
    const floatingNumberCount = await page.evaluate(() => {
      return window.game.floatingNumbers.length;
    });
    
    expect(floatingNumberCount).toBeGreaterThan(0);
    
    // Verify it's a money number
    const floatingNumberText = await page.evaluate(() => {
      return window.game.floatingNumbers[0].text;
    });
    
    expect(floatingNumberText).toMatch(/^\+£\d+$/);
  });

  test('should display repair notification when starting repair', async ({ page }) => {
    // Break a console and start repair
    await page.evaluate(() => {
      const console = window.game.consoles[0];
      console.durability = 0;
      console.state = 'broken';
      
      // Move player near console
      const playerTransform = window.game.player.getComponent('Transform');
      const consoleTransform = console.getComponent('Transform');
      playerTransform.setPosition(consoleTransform.x + 30, consoleTransform.y);
      
      // Directly call repair interaction
      window.game.handleRepairInteraction();
    });
    
    await page.waitForTimeout(100);
    
    const repairFloatingNumbers = await page.evaluate(() => {
      return window.game.floatingNumbers.filter(fn => fn.text === 'REPAIRING...');
    });
    
    expect(repairFloatingNumbers.length).toBe(1);
  });

  test('should display repair completion notification', async ({ page }) => {
    // Start repair and simulate completion
    await page.evaluate(() => {
      const console = window.game.consoles[0];
      console.durability = 0;
      console.state = 'broken';
      console.startRepair();
      
      // Fast-forward repair time
      console.repairStartTime = Date.now() - console.repairTime - 100;
    });
    
    // Update to trigger repair completion
    await page.evaluate(() => {
      window.game.update(16.67);
    });
    
    await page.waitForTimeout(100);
    
    const completionFloatingNumbers = await page.evaluate(() => {
      return window.game.floatingNumbers.filter(fn => fn.text === 'REPAIRED!');
    });
    
    expect(completionFloatingNumbers.length).toBe(1);
  });

  test('should fade out floating numbers over time', async ({ page }) => {
    // Create a floating number
    await page.evaluate(() => {
      window.game.createFloatingNumber(400, 300, 'TEST', '#ffffff', 1000);
    });
    
    // Check initial opacity
    const initialOpacity = await page.evaluate(() => {
      return window.game.floatingNumbers[0].getOpacity();
    });
    
    expect(initialOpacity).toBeCloseTo(1, 1);
    
    // Wait and check fading
    await page.waitForTimeout(500);
    
    const fadedOpacity = await page.evaluate(() => {
      return window.game.floatingNumbers[0].getOpacity();
    });
    
    expect(fadedOpacity).toBeLessThan(1);
    expect(fadedOpacity).toBeGreaterThan(0);
  });

  test('should remove floating numbers after duration', async ({ page }) => {
    // Create a short-duration floating number
    await page.evaluate(() => {
      window.game.createFloatingNumber(400, 300, 'TEST', '#ffffff', 500);
    });
    
    const initialCount = await page.evaluate(() => {
      return window.game.floatingNumbers.length;
    });
    
    expect(initialCount).toBe(1);
    
    // Wait for expiration and cleanup
    await page.waitForTimeout(800);
    
    await page.evaluate(() => {
      window.game.update(16.67);
    });
    
    const finalCount = await page.evaluate(() => {
      return window.game.floatingNumbers.length;
    });
    
    expect(finalCount).toBe(0);
  });

  test('should move floating numbers upward', async ({ page }) => {
    // Create a floating number
    await page.evaluate(() => {
      window.game.createFloatingNumber(400, 300, 'TEST', '#ffffff', 2000);
    });
    
    const initialY = await page.evaluate(() => {
      return window.game.floatingNumbers[0].getComponent('Transform').y;
    });
    
    // Wait for movement
    await page.waitForTimeout(200);
    
    const finalY = await page.evaluate(() => {
      return window.game.floatingNumbers[0].getComponent('Transform').y;
    });
    
    expect(finalY).toBeLessThan(initialY);
  });

  test('should handle multiple floating numbers simultaneously', async ({ page }) => {
    // Create multiple floating numbers
    await page.evaluate(() => {
      window.game.createFloatingNumber(300, 200, '+£5', '#00ff00');
      window.game.createFloatingNumber(400, 250, 'REPAIRED!', '#ffff00');
      window.game.createFloatingNumber(500, 300, '+3 HAPPY', '#0066ff');
    });
    
    const floatingNumberCount = await page.evaluate(() => {
      return window.game.floatingNumbers.length;
    });
    
    expect(floatingNumberCount).toBe(3);
    
    // Verify they have different properties
    const numberTexts = await page.evaluate(() => {
      return window.game.floatingNumbers.map(fn => fn.text);
    });
    
    expect(numberTexts).toContain('+£5');
    expect(numberTexts).toContain('REPAIRED!');
    expect(numberTexts).toContain('+3 HAPPY');
  });
});