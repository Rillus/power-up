import { test, expect } from '@playwright/test';

test.describe('Console System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.waitForFunction(() => window.game !== undefined);
  });

  test('should display consoles with status indicators', async ({ page }) => {
    // Verify consoles are created
    const consoleCount = await page.evaluate(() => {
      return window.game.consoles.length;
    });
    expect(consoleCount).toBe(2);

    // Verify consoles have correct properties
    const consoleData = await page.evaluate(() => {
      return window.game.consoles.map(console => ({
        type: console.type,
        state: console.state,
        durability: console.durability,
        maxDurability: console.maxDurability
      }));
    });

    expect(consoleData).toEqual([
      { type: 'retro-arcade', state: 'operational', durability: 20, maxDurability: 20 },
      { type: 'retro-arcade', state: 'operational', durability: 20, maxDurability: 20 }
    ]);
  });

  test('should allow player to repair broken console', async ({ page }) => {
    // Break a console for testing
    await page.evaluate(() => {
      const console = window.game.consoles[0];
      console.durability = 0;
      console.state = 'broken';
    });

    // Move player near the broken console
    await page.evaluate(() => {
      const playerTransform = window.game.player.getComponent('Transform');
      const consoleTransform = window.game.consoles[0].getComponent('Transform');
      playerTransform.setPosition(consoleTransform.x + 30, consoleTransform.y);
    });

    // Press space to repair - use direct interaction
    await page.evaluate(() => {
      window.game.handleRepairInteraction();
    });
    await page.waitForTimeout(100);

    // Verify repair started
    const consoleState = await page.evaluate(() => {
      return window.game.consoles[0].state;
    });
    expect(consoleState).toBe('under-repair');

    // Wait for repair to complete
    await page.waitForTimeout(3500); // Repair time is 3 seconds

    // Verify repair completed
    const finalState = await page.evaluate(() => {
      return {
        state: window.game.consoles[0].state,
        durability: window.game.consoles[0].durability
      };
    });
    
    expect(finalState.state).toBe('operational');
    expect(finalState.durability).toBe(20);
  });

  test('should show repair progress during repair', async ({ page }) => {
    // Break a console and start repair
    await page.evaluate(() => {
      const console = window.game.consoles[0];
      console.durability = 0;
      console.state = 'broken';
      console.startRepair();
    });

    await page.waitForTimeout(1000); // Wait partway through repair

    // Check repair progress
    const repairProgress = await page.evaluate(() => {
      return window.game.consoles[0].getRepairProgress();
    });

    expect(repairProgress).toBeGreaterThan(0);
    expect(repairProgress).toBeLessThan(1);
  });

  test('should display correct status colors', async ({ page }) => {
    // Test different console states
    const statusColors = await page.evaluate(() => {
      const console = window.game.consoles[0];
      const colors = {};
      
      // Test operational
      console.state = 'operational';
      colors.operational = console.getStatusColor();
      
      // Test in-use
      console.state = 'in-use';
      colors.inUse = console.getStatusColor();
      
      // Test broken
      console.state = 'broken';
      colors.broken = console.getStatusColor();
      
      // Test under-repair
      console.state = 'under-repair';
      colors.underRepair = console.getStatusColor();
      
      return colors;
    });

    expect(statusColors.operational).toBe('#00ff00'); // Green
    expect(statusColors.inUse).toBe('#0066ff'); // Blue
    expect(statusColors.broken).toBe('#ff0000'); // Red
    expect(statusColors.underRepair).toBe('#ffff00'); // Yellow
  });
});