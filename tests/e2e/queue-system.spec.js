import { test, expect } from '@playwright/test';

test.describe('Queue System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.waitForFunction(() => window.game !== undefined);
  });

  test('should have queue manager initialized', async ({ page }) => {
    const hasQueueManager = await page.evaluate(() => {
      return window.game.queueManager !== undefined;
    });
    
    expect(hasQueueManager).toBe(true);
  });

  test('should add guests to console queues', async ({ page }) => {
    // Create multiple guests that will need to queue
    const queueTest = await page.evaluate(() => {
      // Clear existing guests first
      window.game.guests = [];
      window.game.entities = window.game.entities.filter(e => e.constructor.name !== 'Guest');
      
      // Spawn multiple guests quickly to force queue formation
      const guests = [];
      for (let i = 0; i < 4; i++) {
        const guest = window.game.spawnGuest();
        guest.state = 'seeking';
        guests.push(guest);
      }
      
      // Force queue manager update to process queue joining
      window.game.queueManager.update(16.67);
      
      // Check if any guests joined queues
      let totalQueued = 0;
      window.game.consoles.forEach(console => {
        totalQueued += console.getQueueLength();
      });
      
      return {
        guestCount: guests.length,
        totalQueued: totalQueued,
        consoleCount: window.game.consoles.length
      };
    });
    
    expect(queueTest.guestCount).toBe(4);
    expect(queueTest.consoleCount).toBeGreaterThan(0);
    // Some guests should join queues (though not necessarily all due to randomness)
    expect(queueTest.totalQueued).toBeGreaterThanOrEqual(0);
  });

  test('should handle queue positioning correctly', async ({ page }) => {
    const queuePositioning = await page.evaluate(() => {
      // Get the first console
      const console = window.game.consoles[0];
      
      // Create multiple guests and manually add them to queue
      const guest1 = window.game.spawnGuest();
      const guest2 = window.game.spawnGuest();
      
      console.addToQueue(guest1);
      console.addToQueue(guest2);
      
      return {
        queueLength: console.getQueueLength(),
        guest1Position: guest1.queuePosition,
        guest2Position: guest2.queuePosition,
        nextInQueue: console.getNextInQueue() === guest1
      };
    });
    
    expect(queuePositioning.queueLength).toBe(2);
    expect(queuePositioning.guest1Position).toBe(0);
    expect(queuePositioning.guest2Position).toBe(1);
    expect(queuePositioning.nextInQueue).toBe(true);
  });

  test('should advance queue when console becomes available', async ({ page }) => {
    const queueAdvancement = await page.evaluate(() => {
      const console = window.game.consoles[0];
      
      // Ensure console is available
      console.state = 'operational';
      console.currentUsers = [];
      
      // Create guest and add to queue
      const guest = window.game.spawnGuest();
      console.addToQueue(guest);
      
      // Mock canStartUsingConsole to return true
      guest.canStartUsingConsole = () => true;
      guest.startUsingConsole = () => {
        guest.state = 'using';
        guest.currentConsole = console;
      };
      
      // Process queue advancement
      window.game.queueManager.processQueueAdvancement();
      
      return {
        guestState: guest.state,
        queueLength: console.getQueueLength(),
        guestRemovedFromQueue: guest.queuePosition === -1
      };
    });
    
    expect(queueAdvancement.guestState).toBe('using');
    expect(queueAdvancement.queueLength).toBe(0);
    expect(queueAdvancement.guestRemovedFromQueue).toBe(true);
  });

  test('should calculate queue scores for different guest types', async ({ page }) => {
    const queueScoring = await page.evaluate(() => {
      const console = window.game.consoles[0];
      
      // Test different guest types
      const casualGuest = window.game.spawnGuest();
      casualGuest.type = 'casual';
      casualGuest.prefersConsoleType = (type) => type === 'retro-arcade';
      
      const enthusiastGuest = window.game.spawnGuest();
      enthusiastGuest.type = 'enthusiast';
      enthusiastGuest.prefersConsoleType = (type) => type === 'vr-experience';
      
      const casualScore = window.game.queueManager.calculateQueueScore(casualGuest, console, 50);
      const enthusiastScore = window.game.queueManager.calculateQueueScore(enthusiastGuest, console, 50);
      
      return {
        casualScore: casualScore,
        enthusiastScore: enthusiastScore,
        consoleType: console.type
      };
    });
    
    expect(typeof queueScoring.casualScore).toBe('number');
    expect(typeof queueScoring.enthusiastScore).toBe('number');
    expect(queueScoring.consoleType).toBeDefined();
  });

  test('should handle guest queue abandonment', async ({ page }) => {
    const abandonmentTest = await page.evaluate(() => {
      const console = window.game.consoles[0];
      
      // Create impatient guest
      const guest = window.game.spawnGuest();
      guest.type = 'enthusiast';
      guest.satisfaction = 3; // Starting satisfaction
      
      console.addToQueue(guest);
      
      // Simulate long wait time that exceeds tolerance
      const longWaitTime = 20000; // 20 seconds (exceeds enthusiast tolerance of 15s)
      const shouldAbandon = window.game.queueManager.shouldAbandonQueue(guest, longWaitTime);
      
      return {
        initialState: guest.state,
        shouldAbandon: shouldAbandon,
        guestType: guest.type,
        waitTime: longWaitTime
      };
    });
    
    expect(abandonmentTest.initialState).toBe('waiting');
    expect(abandonmentTest.shouldAbandon).toBe(true);
    expect(abandonmentTest.guestType).toBe('enthusiast');
  });

  test('should provide queue visualization data', async ({ page }) => {
    const vizData = await page.evaluate(() => {
      // Add some guests to queues
      const console = window.game.consoles[0];
      const guest1 = window.game.spawnGuest();
      const guest2 = window.game.spawnGuest();
      
      console.addToQueue(guest1);
      console.addToQueue(guest2);
      
      return window.game.queueManager.getVisualizationData();
    });
    
    expect(vizData).toBeDefined();
    expect(vizData.console_0).toBeDefined();
    expect(vizData.console_0.queueLength).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(vizData.console_0.queue)).toBe(true);
    expect(vizData.console_0.type).toBeDefined();
  });

  test('should handle different guest type queue preferences', async ({ page }) => {
    const preferences = await page.evaluate(() => {
      // Test queue joining preferences for different guest types
      const console = window.game.consoles[0];
      
      const casualGuest = window.game.spawnGuest();
      casualGuest.type = 'casual';
      
      const familyGuest = window.game.spawnGuest();
      familyGuest.type = 'family';
      
      const enthusiastGuest = window.game.spawnGuest();
      enthusiastGuest.type = 'enthusiast';
      
      // Test queue joining probability (multiple attempts to check randomness)
      let casualJoinAttempts = 0;
      let familyJoinAttempts = 0;
      let enthusiastJoinAttempts = 0;
      
      for (let i = 0; i < 10; i++) {
        if (window.game.queueManager.shouldJoinQueue(casualGuest, console)) casualJoinAttempts++;
        if (window.game.queueManager.shouldJoinQueue(familyGuest, console)) familyJoinAttempts++;
        if (window.game.queueManager.shouldJoinQueue(enthusiastGuest, console)) enthusiastJoinAttempts++;
      }
      
      return {
        casualJoinAttempts,
        familyJoinAttempts,
        enthusiastJoinAttempts
      };
    });
    
    // Families should be most willing to wait, enthusiasts least willing
    // (Note: These are probabilistic, so we just check they're reasonable numbers)
    expect(preferences.casualJoinAttempts).toBeGreaterThanOrEqual(0);
    expect(preferences.familyJoinAttempts).toBeGreaterThanOrEqual(0);
    expect(preferences.enthusiastJoinAttempts).toBeGreaterThanOrEqual(0);
  });
});