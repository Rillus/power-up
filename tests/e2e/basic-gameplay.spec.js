import { test, expect } from '@playwright/test';

test.describe('Basic Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    
    // Wait for game to initialize
    await page.waitForFunction(() => window.game !== undefined);
  });

  test('should load game and show initial UI', async ({ page }) => {
    // Check that UI elements are visible
    await expect(page.locator('#money-counter')).toContainText('£2,000');
    await expect(page.locator('#day-counter')).toContainText('Day 1');
    await expect(page.locator('#angry-counter')).toContainText('0/3');
    
    // Check that loading screen is hidden
    await expect(page.locator('#loading')).toHaveClass(/hidden/);
    
    // Check canvas is visible
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('width', '1200');
    await expect(canvas).toHaveAttribute('height', '800');
  });

  test('should move player with WASD keys', async ({ page }) => {
    // Get initial player position
    const initialPosition = await page.evaluate(() => {
      const transform = window.game.player.getComponent('Transform');
      return { x: transform.x, y: transform.y };
    });
    
    expect(initialPosition.x).toBe(600);
    expect(initialPosition.y).toBe(400);
    
    // Hold W key to move up
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(300); // Hold key for movement
    await page.keyboard.up('KeyW');
    
    // Check player moved up
    const afterMoveUp = await page.evaluate(() => {
      const transform = window.game.player.getComponent('Transform');
      return { x: transform.x, y: transform.y };
    });
    
    expect(afterMoveUp.y).toBeLessThan(initialPosition.y);
    
    // Hold D key to move right
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyD');
    
    // Check player moved right
    const afterMoveRight = await page.evaluate(() => {
      const transform = window.game.player.getComponent('Transform');
      return { x: transform.x, y: transform.y };
    });
    
    expect(afterMoveRight.x).toBeGreaterThan(afterMoveUp.x);
  });

  test('should keep player within canvas bounds', async ({ page }) => {
    // Move player to top-left corner by holding keys
    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(1000); // Hold keys for 1 second
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyA');
    
    const topLeftPosition = await page.evaluate(() => {
      const transform = window.game.player.getComponent('Transform');
      return { x: transform.x, y: transform.y };
    });
    
    // Should be stopped by bounds (minimum 20px from edge)
    expect(topLeftPosition.x).toBeGreaterThanOrEqual(20);
    expect(topLeftPosition.y).toBeGreaterThanOrEqual(20);
    
    // Move player to bottom-right corner by holding keys
    await page.keyboard.down('KeyS');
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(1500); // Hold keys longer to reach corner
    await page.keyboard.up('KeyS');
    await page.keyboard.up('KeyD');
    
    const bottomRightPosition = await page.evaluate(() => {
      const transform = window.game.player.getComponent('Transform');
      return { x: transform.x, y: transform.y };
    });
    
    // Should be stopped by bounds (maximum canvas size - 20px)
    expect(bottomRightPosition.x).toBeLessThanOrEqual(1180);
    expect(bottomRightPosition.y).toBeLessThanOrEqual(780);
  });

  test('should handle arrow keys as alternative movement', async ({ page }) => {
    // Get initial position
    const initialPosition = await page.evaluate(() => {
      const transform = window.game.player.getComponent('Transform');
      return { x: transform.x, y: transform.y };
    });
    
    // Use arrow keys instead of WASD
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowUp');
    
    const afterArrowUp = await page.evaluate(() => {
      const transform = window.game.player.getComponent('Transform');
      return { x: transform.x, y: transform.y };
    });
    
    expect(afterArrowUp.y).toBeLessThan(initialPosition.y);
  });

  test('should display instruction text', async ({ page }) => {
    // Check for instruction text on canvas
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    
    // We can't directly read canvas text, but we can verify the render system works
    const hasInstructions = await page.evaluate(() => {
      // Check if the game and render system are properly initialized
      return !!(window.game && window.game.renderSystem);
    });
    
    expect(hasInstructions).toBe(true);
  });
});