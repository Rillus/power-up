import { test, expect } from '@playwright/test';

test.describe('Phase 1 Foundation Verification', () => {
  test('should complete Phase 1 foundation requirements', async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
    
    // Wait for game to load
    await page.waitForSelector('#game-canvas');
    await page.waitForFunction(() => window.game !== undefined);
    
    // 1. UI should display correctly
    await expect(page.locator('#money-counter')).toContainText('£2,000');
    await expect(page.locator('#day-counter')).toContainText('Day 1');
    await expect(page.locator('#angry-counter')).toContainText('0/3');
    
    // 2. Loading screen should be hidden
    await expect(page.locator('#loading')).toHaveClass(/hidden/);
    
    // 3. Canvas should be properly sized
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('width', '1200');
    await expect(canvas).toHaveAttribute('height', '800');
    
    // 4. Game object should be initialized with core systems
    const gameInitialized = await page.evaluate(() => {
      return !!(window.game && 
                window.game.renderSystem && 
                window.game.inputSystem &&
                window.game.player);
    });
    expect(gameInitialized).toBe(true);
    
    // 5. Player entity should have Transform component
    const playerHasTransform = await page.evaluate(() => {
      return window.game.player.hasComponent('Transform');
    });
    expect(playerHasTransform).toBe(true);
    
    // 6. Player should start at center position (600, 400)
    const playerPosition = await page.evaluate(() => {
      const transform = window.game.player.getComponent('Transform');
      return { x: transform.x, y: transform.y };
    });
    expect(playerPosition.x).toBe(600);
    expect(playerPosition.y).toBe(400);
    
    // 7. WASD movement should work
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(300); // Hold key for movement
    await page.keyboard.up('KeyW');
    
    const positionAfterW = await page.evaluate(() => {
      const transform = window.game.player.getComponent('Transform');
      return { x: transform.x, y: transform.y };
    });
    
    expect(positionAfterW.y).toBeLessThan(400); // Moved up
    
    // 8. Movement should be bounded
    // Move to top-left corner using held keys
    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(1000); // Hold both keys for 1 second
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyA');
    
    const boundedPosition = await page.evaluate(() => {
      const transform = window.game.player.getComponent('Transform');
      return { x: transform.x, y: transform.y };
    });
    
    expect(boundedPosition.x).toBeGreaterThanOrEqual(20);
    expect(boundedPosition.y).toBeGreaterThanOrEqual(20);
    
    // 9. Game should be running (not stopped)
    const gameRunning = await page.evaluate(() => {
      return window.game.running;
    });
    expect(gameRunning).toBe(true);
    
    // 10. Basic visual elements should be present (grid, player)
    // We can't directly test canvas content, but we can verify the render system works
    const renderSystemWorking = await page.evaluate(() => {
      return !!(window.game.renderSystem.canvas && 
                window.game.renderSystem.context);
    });
    expect(renderSystemWorking).toBe(true);
    
    // Phase 1 Foundation Verification Complete!
  });
});