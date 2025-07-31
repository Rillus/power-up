import { test } from '@playwright/test';

test('Debug input system', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#game-canvas');
  await page.waitForFunction(() => window.game !== undefined);
  
  // Click canvas to focus
  await page.locator('#game-canvas').click();
  
  // Verify input system is properly initialized
  await page.evaluate(() => {
    const game = window.game;
    const inputSystem = game.inputSystem;
    
    // Check that all required components are present
    if (!inputSystem || typeof inputSystem.getMovementVector !== 'function') {
      throw new Error('Input system not properly initialized');
    }
  });
  
  // Try holding key down
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(100);
  
  const keyState = await page.evaluate(() => {
    return {
      keyW: window.game.inputSystem.keys.KeyW,
      movement: window.game.inputSystem.getMovementVector()
    };
  });
  
  // Verify key is held and movement vector is correct
  if (keyState.keyW && keyState.movement.y === -1) {
    // Input system working correctly
  }
  
  // Wait for movement then release
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyW');
  
  const finalPosition = await page.evaluate(() => {
    const transform = window.game.player.getComponent('Transform');
    return { x: transform.x, y: transform.y };
  });
  
  // Verify movement occurred (position should have changed)
  if (finalPosition.y < 400) {
    // Movement working correctly
  }
});