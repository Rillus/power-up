import { test, expect } from '@playwright/test';

test.describe('Guest System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.waitForFunction(() => window.game !== undefined);
  });

  test('should spawn guests automatically', async ({ page }) => {
    // Wait for initial guest spawn
    await page.waitForTimeout(9000); // Wait longer than spawn interval
    
    const guestCount = await page.evaluate(() => {
      return window.game.guests.length;
    });
    
    expect(guestCount).toBeGreaterThan(0);
  });

  test('should display guest properties correctly', async ({ page }) => {
    // Spawn a guest manually for testing
    await page.evaluate(() => {
      window.game.spawnGuest();
    });
    
    await page.waitForTimeout(100);
    
    const guestData = await page.evaluate(() => {
      const guest = window.game.guests[0];
      return {
        type: guest.type,
        state: guest.state,
        satisfaction: guest.satisfaction,
        patience: guest.patience
      };
    });
    
    expect(['casual', 'family', 'enthusiast', 'tourist']).toContain(guestData.type);
    expect(guestData.state).toBe('seeking');
    expect(guestData.satisfaction).toBeGreaterThan(0);
    expect(guestData.patience).toBeGreaterThan(0);
  });

  test('should allow guests to use consoles', async ({ page }) => {
    // Spawn a guest and directly start console interaction
    const guestState = await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      const console = window.game.consoles[0];
      
      // Position guest very close to console
      const guestTransform = guest.getComponent('Transform');
      const consoleTransform = console.getComponent('Transform');
      guestTransform.setPosition(consoleTransform.x + 30, consoleTransform.y);
      
      // Directly start using console instead of relying on AI
      try {
        guest.startUsingConsole(console);
        return guest.state;
      } catch (error) {
        return `error: ${error.message}`;
      }
    });
    
    expect(guestState).toBe('using');
  });

  test('should handle guest patience system', async ({ page }) => {
    // Create a guest and force anger through patience manipulation
    const guestData = await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      
      // Override patience to ensure expiration
      const now = Date.now();
      guest.patience = 500; // Very short patience
      guest.arrivalTime = now - 1000; // 1 second ago (well past patience)
      
      // Force patience update
      guest.updatePatience();
      
      return {
        state: guest.state,
        satisfaction: guest.satisfaction,
        patienceRemaining: guest.getPatienceRemaining(),
        elapsed: now - guest.arrivalTime,
        patience: guest.patience
      };
    });
    
    expect(guestData.patienceRemaining).toBe(0);
    expect(guestData.state).toBe('angry');
    expect(guestData.satisfaction).toBe(-5);
  });

  test('should track angry guests for game over', async ({ page }) => {
    // Get initial angry count
    const initialAngryCount = await page.evaluate(() => {
      return window.game.angryGuests;
    });
    
    // Create an angry guest and force removal
    await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      guest.state = 'angry';
      
      // Position guest at exit
      const transform = guest.getComponent('Transform');
      transform.setPosition(-5, 400); // Just outside boundary
      
      // Force guest removal processing
      window.game.update(16.67);
    });
    
    const finalAngryCount = await page.evaluate(() => {
      return window.game.angryGuests;
    });
    
    expect(finalAngryCount).toBe(initialAngryCount + 1);
  });

  test('should generate revenue from satisfied guests', async ({ page }) => {
    const initialMoney = await page.evaluate(() => {
      return window.game.money;
    });
    
    // Create a guest using a console and complete the interaction
    await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      const console = window.game.consoles[0];
      
      // Start using console
      guest.startUsingConsole(console);
      
      // Simulate use completion
      guest.useStartTime = Date.now() - guest.useTime - 100;
      guest.updateConsoleUse();
      
      // Trigger AI to process payment
      window.game.updateGuestAI();
    });
    
    await page.waitForTimeout(100);
    
    const finalMoney = await page.evaluate(() => {
      return window.game.money;
    });
    
    expect(finalMoney).toBeGreaterThan(initialMoney);
  });

  test('should display different guest status colors', async ({ page }) => {
    // Test different guest states
    const statusColors = await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      const colors = {};
      
      // Test seeking
      guest.state = 'seeking';
      colors.seeking = guest.getStatusColor();
      
      // Test using
      guest.state = 'using';
      colors.using = guest.getStatusColor();
      
      // Test leaving
      guest.state = 'leaving';
      colors.leaving = guest.getStatusColor();
      
      // Test angry
      guest.state = 'angry';
      colors.angry = guest.getStatusColor();
      
      return colors;
    });
    
    expect(statusColors.seeking).toBe('#00ff00'); // Green
    expect(statusColors.using).toBe('#0066ff'); // Blue
    expect(statusColors.leaving).toBe('#888888'); // Gray
    expect(statusColors.angry).toBe('#ff0000'); // Red
  });

  test('should display guest emotions correctly', async ({ page }) => {
    // Test guest emotion system
    const emotionData = await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      
      // Test different satisfaction levels
      const emotions = {};
      
      // Very happy
      guest.satisfaction = 9;
      emotions.veryHappy = {
        state: guest.getEmotionState(),
        icon: guest.getEmotionIcon(),
        color: guest.getEmotionColor()
      };
      
      // Happy
      guest.satisfaction = 7;
      emotions.happy = {
        state: guest.getEmotionState(),
        icon: guest.getEmotionIcon(),
        color: guest.getEmotionColor()
      };
      
      // Neutral
      guest.satisfaction = 5;
      emotions.neutral = {
        state: guest.getEmotionState(),
        icon: guest.getEmotionIcon(),
        color: guest.getEmotionColor()
      };
      
      // Unhappy
      guest.satisfaction = 3;
      emotions.unhappy = {
        state: guest.getEmotionState(),
        icon: guest.getEmotionIcon(),
        color: guest.getEmotionColor()
      };
      
      // Angry by state override
      guest.state = 'angry';
      emotions.angry = {
        state: guest.getEmotionState(),
        icon: guest.getEmotionIcon(),
        color: guest.getEmotionColor()
      };
      
      return emotions;
    });
    
    // Verify emotion states
    expect(emotionData.veryHappy.state).toBe('very-happy');
    expect(emotionData.veryHappy.icon).toBe('😄');
    expect(emotionData.veryHappy.color).toBe('#00FF00');
    
    expect(emotionData.happy.state).toBe('happy');
    expect(emotionData.happy.icon).toBe('😊');
    expect(emotionData.happy.color).toBe('#90EE90');
    
    expect(emotionData.neutral.state).toBe('neutral');
    expect(emotionData.neutral.icon).toBe('😐');
    expect(emotionData.neutral.color).toBe('#FFFF00');
    
    expect(emotionData.unhappy.state).toBe('unhappy');
    expect(emotionData.unhappy.icon).toBe('😕');
    expect(emotionData.unhappy.color).toBe('#FFA500');
    
    expect(emotionData.angry.state).toBe('angry');
    expect(emotionData.angry.icon).toBe('😠');
    expect(emotionData.angry.color).toBe('#FF0000');
  });

  test('should remove guests when they exit', async ({ page }) => {
    // Get initial count, create a guest, then test removal
    const result = await page.evaluate(() => {
      const initialCount = window.game.guests.length;
      
      // Create a guest at the exit
      const guest = window.game.spawnGuest();
      guest.state = 'leaving';
      
      // Position guest at exit
      const transform = guest.getComponent('Transform');
      transform.setPosition(-5, 400); // Just outside boundary
      
      const countAfterSpawn = window.game.guests.length;
      
      // Update game to process guest removal
      window.game.update(16.67);
      
      const finalCount = window.game.guests.length;
      
      return {
        initialCount,
        countAfterSpawn,
        finalCount
      };
    });
    
    expect(result.countAfterSpawn).toBe(result.initialCount + 1); // Guest was added
    expect(result.finalCount).toBe(result.initialCount); // Guest was removed
  });
});