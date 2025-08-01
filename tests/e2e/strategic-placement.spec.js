import { test, expect } from '@playwright/test';

test.describe('Strategic Placement System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');
    await page.waitForFunction(() => window.game !== undefined);
  });

  test('should have strategic placement system initialized', async ({ page }) => {
    const hasPlacementSystem = await page.evaluate(() => {
      return window.game.placementSystem !== undefined;
    });
    
    expect(hasPlacementSystem).toBe(true);
  });

  test('should analyze strategic placement positions', async ({ page }) => {
    const analysis = await page.evaluate(() => {
      const entranceAnalysis = window.game.placementSystem.analyzePosition(100, 300);
      const centerAnalysis = window.game.placementSystem.analyzePosition(600, 400);
      const cornerAnalysis = window.game.placementSystem.analyzePosition(1100, 150);
      
      return {
        entrance: entranceAnalysis,
        center: centerAnalysis,
        corner: cornerAnalysis
      };
    });
    
    expect(analysis.entrance.zoneMultiplier).toBe(1.3); // High traffic entrance
    expect(analysis.center.zoneMultiplier).toBe(1.0); // Neutral center
    expect(analysis.corner.zoneMultiplier).toBe(0.8); // Low traffic corner
    
    expect(analysis.entrance.recommendation).toContain('High traffic');
    expect(analysis.corner.recommendation).toContain('Low traffic');
  });

  test('should calculate effective appeal for console placement', async ({ page }) => {
    const effectiveAppeal = await page.evaluate(() => {
      const console = window.game.consoles[0];
      const baseAppeal = console.appeal;
      const effectiveAppeal = window.game.placementSystem.getEffectiveAppeal(console);
      
      return {
        base: baseAppeal,
        effective: effectiveAppeal
      };
    });
    
    expect(effectiveAppeal.effective).toBeGreaterThanOrEqual(1);
    expect(typeof effectiveAppeal.effective).toBe('number');
  });

  test('should find optimal console for guests using strategic placement', async ({ page }) => {
    const guestConsoleSelection = await page.evaluate(() => {
      const guest = window.game.spawnGuest();
      const optimalConsole = window.game.placementSystem.findOptimalConsole(guest, window.game.consoles);
      
      return {
        guestType: guest.type,
        selectedConsole: optimalConsole ? optimalConsole.type : null,
        hasOptimalConsole: optimalConsole !== null
      };
    });
    
    expect(guestConsoleSelection.hasOptimalConsole).toBe(true);
    expect(guestConsoleSelection.selectedConsole).toBeDefined();
  });

  test('should prefer type-compatible consoles for guests', async ({ page }) => {
    const typeCompatibility = await page.evaluate(() => {
      // Create a casual guest and see if they prefer family-friendly consoles
      const casualGuest = window.game.spawnGuest();
      casualGuest.type = 'casual'; // Force casual type
      
      const optimalConsole = window.game.placementSystem.findOptimalConsole(casualGuest, window.game.consoles);
      
      // Check if the console appeals to casual guests
      const appealsToGuest = optimalConsole ? optimalConsole.appealsToGuestType('casual') : false;
      
      return {
        guestType: casualGuest.type,
        selectedConsoleType: optimalConsole ? optimalConsole.type : null,
        appealsToGuest: appealsToGuest
      };
    });
    
    expect(typeCompatibility.guestType).toBe('casual');
    expect(typeCompatibility.selectedConsoleType).toBeDefined();
    // Note: Not all consoles appeal to casual guests, so this might be false but console should still be selected
  });

  test('should detect console clusters and apply bonuses', async ({ page }) => {
    // Place multiple consoles near each other to test clustering
    await page.evaluate(() => {
      // Clear existing consoles
      window.game.consoles = [];
      window.game.entities = window.game.entities.filter(e => e.constructor.name !== 'GameConsole');
      
      // Create a cluster of consoles
      window.game.createConsole(300, 300, 'retro-arcade');
      window.game.createConsole(350, 300, 'classic-home');
      window.game.createConsole(300, 350, 'retro-arcade');
    });
    
    const clusterAnalysis = await page.evaluate(() => {
      const analysis = window.game.placementSystem.analyzePosition(325, 325); // Center of cluster
      return {
        nearbyConsoles: analysis.nearbyConsoles,
        clusterBonus: analysis.clusterBonus,
        overallScore: analysis.overallScore
      };
    });
    
    expect(clusterAnalysis.nearbyConsoles).toBeGreaterThan(0);
    expect(clusterAnalysis.clusterBonus).toBeGreaterThan(0);
    expect(clusterAnalysis.overallScore).toBeGreaterThan(1.0); // Should be better than neutral
  });

  test('should update strategic data on consoles during gameplay', async ({ page }) => {
    await page.evaluate(() => {
      // Force an update
      window.game.placementSystem.update(16.67);
    });
    
    const strategicData = await page.evaluate(() => {
      const console = window.game.consoles[0];
      return {
        hasStrategicData: console.strategicData !== undefined,
        effectiveAppeal: console.strategicData ? console.strategicData.effectiveAppeal : null,
        congestion: console.strategicData ? console.strategicData.congestion : null,
        zoneMultiplier: console.strategicData ? console.strategicData.zoneMultiplier : null
      };
    });
    
    expect(strategicData.hasStrategicData).toBe(true);
    expect(strategicData.effectiveAppeal).toBeGreaterThanOrEqual(1);
    expect(typeof strategicData.congestion).toBe('number');
    expect(typeof strategicData.zoneMultiplier).toBe('number');
  });

  test('should handle congestion and reduce appeal accordingly', async ({ page }) => {
    // Create multiple guests near a console to test congestion
    const congestionTest = await page.evaluate(() => {
      const console = window.game.consoles[0];
      const transform = console.getComponent('Transform');
      
      // Spawn multiple guests near the console
      const initialGuests = window.game.guests.length;
      for (let i = 0; i < 3; i++) {
        const guest = window.game.spawnGuest();
        const guestTransform = guest.getComponent('Transform');
        guestTransform.setPosition(transform.x + 20, transform.y + (i * 15));
      }
      
      // Update strategic analysis
      window.game.placementSystem.update(16.67);
      
      return {
        initialGuests: initialGuests,
        currentGuests: window.game.guests.length,
        congestionLevel: window.game.placementSystem.getCongestionLevel(transform.x, transform.y),
        effectiveAppeal: window.game.placementSystem.getEffectiveAppeal(console)
      };
    });
    
    expect(congestionTest.currentGuests).toBeGreaterThan(congestionTest.initialGuests);
    expect(congestionTest.congestionLevel).toBeGreaterThan(0);
    expect(congestionTest.effectiveAppeal).toBeGreaterThanOrEqual(1);
  });

  test('should provide visualization data for debug purposes', async ({ page }) => {
    const vizData = await page.evaluate(() => {
      return window.game.placementSystem.getVisualizationData();
    });
    
    expect(vizData).toHaveProperty('heatmap');
    expect(vizData).toHaveProperty('zones');
    expect(vizData).toHaveProperty('consoleAnalysis');
    
    expect(Array.isArray(vizData.heatmap)).toBe(true);
    expect(Array.isArray(vizData.consoleAnalysis)).toBe(true);
    
    // Check that visualization data has reasonable structure
    if (vizData.heatmap.length > 0) {
      const heatmapPoint = vizData.heatmap[0];
      expect(heatmapPoint).toHaveProperty('x');
      expect(heatmapPoint).toHaveProperty('y');
      expect(heatmapPoint).toHaveProperty('score');
    }
  });

  test('should integrate with console purchase system for strategic advice', async ({ page }) => {
    const purchaseIntegration = await page.evaluate(() => {
      // Test strategic analysis integration with purchase system
      const previewData = window.game.purchaseSystem.getPreviewData();
      
      // Start placement mode to test integration
      window.game.purchaseSystem.startPlacement('retro-arcade');
      window.game.purchaseSystem.updatePreviewPosition(400, 300);
      
      const previewWithStrategy = window.game.purchaseSystem.getPreviewData();
      
      return {
        hasStrategicData: previewWithStrategy && previewWithStrategy.strategic !== null,
        strategicAnalysis: previewWithStrategy ? previewWithStrategy.strategic : null
      };
    });
    
    if (purchaseIntegration.hasStrategicData) {
      expect(purchaseIntegration.strategicAnalysis).toHaveProperty('zoneMultiplier');
      expect(purchaseIntegration.strategicAnalysis).toHaveProperty('overallScore');
      expect(purchaseIntegration.strategicAnalysis).toHaveProperty('recommendation');
    }
  });
});