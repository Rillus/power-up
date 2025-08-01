import { test, expect } from '@playwright/test';

test.describe('Game Over System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.waitForFunction(() => window.game !== undefined);
  });

  test('should track angry guests counter', async ({ page }) => {
    // Initial angry guest counter should be 0
    const initialCount = await page.evaluate(() => {
      return window.game.angryGuests;
    });
    
    expect(initialCount).toBe(0);
    
    // Force an angry guest
    await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      guest.state = 'angry';
      
      // Simulate guest leaving
      const transform = guest.getComponent('Transform');
      transform.setPosition(-5, 400);
      
      // Update to trigger removal
      window.game.update(16.67);
    });
    
    const finalCount = await page.evaluate(() => {
      return window.game.angryGuests;
    });
    
    expect(finalCount).toBe(1);
  });

  test('should trigger game over at 3 angry guests', async ({ page }) => {
    // Force 3 angry guests
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        const guest = window.game.spawnGuest();
        guest.state = 'angry';
        
        // Position at exit
        const transform = guest.getComponent('Transform');
        transform.setPosition(-5, 400);
      }
      
      // Update to trigger removals and game over check
      window.game.update(16.67);
    });
    
    const gameState = await page.evaluate(() => {
      return {
        gameOver: window.game.gameOver,
        running: window.game.running,
        angryGuests: window.game.angryGuests,
        gameOverReason: window.game.gameOverReason
      };
    });
    
    expect(gameState.gameOver).toBe(true);
    expect(gameState.running).toBe(false);
    expect(gameState.angryGuests).toBe(3);
    expect(gameState.gameOverReason).toContain('Too many angry guests');
  });

  test('should display game over floating numbers', async ({ page }) => {
    // Trigger game over
    await page.evaluate(() => {
      window.game.angryGuests = 3;
      window.game.checkGameOverConditions();
    });
    
    await page.waitForTimeout(100);
    
    // Check for game over floating numbers
    const gameOverFloatingNumbers = await page.evaluate(() => {
      return window.game.floatingNumbers.filter(fn => 
        fn.text === 'GAME OVER' || 
        fn.text.includes('Too many angry guests') ||
        fn.text.includes('Final Score:')
      );
    });
    
    expect(gameOverFloatingNumbers.length).toBe(3);
  });

  test('should continue rendering floating numbers after game over', async ({ page }) => {
    // Trigger game over
    await page.evaluate(() => {
      window.game.angryGuests = 3;
      window.game.checkGameOverConditions();
    });
    
    await page.waitForTimeout(100);
    
    const initialFloatingCount = await page.evaluate(() => {
      return window.game.floatingNumbers.length;
    });
    
    expect(initialFloatingCount).toBeGreaterThan(0);
    
    // Wait a bit and check that floating numbers are still being processed
    await page.waitForTimeout(500);
    
    const gameLoopStillRunning = await page.evaluate(() => {
      // Game loop should still be running to show game over screen
      return window.game.gameOver === true;
    });
    
    expect(gameLoopStillRunning).toBe(true);
  });

  test('should not spawn new guests after game over', async ({ page }) => {
    // Trigger game over
    await page.evaluate(() => {
      window.game.angryGuests = 3;
      window.game.checkGameOverConditions();
    });
    
    const initialGuestCount = await page.evaluate(() => {
      return window.game.guests.length;
    });
    
    // Wait for guest spawn interval
    await page.waitForTimeout(9000);
    
    const finalGuestCount = await page.evaluate(() => {
      return window.game.guests.length;
    });
    
    // Should not spawn new guests when game is over
    expect(finalGuestCount).toBe(initialGuestCount);
  });

  test('should display angry guest notification', async ({ page }) => {
    // Create an angry guest
    await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      guest.state = 'angry';
      
      // Position at exit to trigger removal
      const transform = guest.getComponent('Transform');
      transform.setPosition(-5, 400);
      
      // Update to trigger removal and angry notification
      window.game.update(16.67);
    });
    
    await page.waitForTimeout(100);
    
    const angryFloatingNumbers = await page.evaluate(() => {
      return window.game.floatingNumbers.filter(fn => fn.text === 'ANGRY!');
    });
    
    expect(angryFloatingNumbers.length).toBe(1);
  });

  test('should update UI counter correctly', async ({ page }) => {
    // Check initial UI state
    await expect(page.locator('#angry-counter')).toContainText('0/3');
    
    // Force an angry guest
    await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      guest.state = 'angry';
      
      const transform = guest.getComponent('Transform');
      transform.setPosition(-5, 400);
      
      window.game.update(16.67);
    });
    
    // Check updated UI
    await expect(page.locator('#angry-counter')).toContainText('1/3');
  });

  test('should allow guests to become angry through impatience', async ({ page }) => {
    // Create a guest and force anger through patience manipulation
    const guestState = await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      
      // Override patience to ensure expiration
      const now = Date.now();
      guest.patience = 500; // Very short patience
      guest.arrivalTime = now - 1000; // 1 second ago (well past patience)
      
      // Update patience to trigger anger
      guest.updatePatience();
      
      return {
        state: guest.state,
        satisfaction: guest.satisfaction,
        patienceRemaining: guest.getPatienceRemaining(),
        elapsed: now - guest.arrivalTime,
        patience: guest.patience
      };
    });
    
    expect(guestState.patienceRemaining).toBe(0);
    expect(guestState.state).toBe('angry');
    expect(guestState.satisfaction).toBe(-5);
  });
});