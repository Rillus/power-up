import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsSystem } from '../../../src/engine/systems/AnalyticsSystem.js';

describe('AnalyticsSystem', () => {
  let analyticsSystem;
  let mockEventHandler;

  beforeEach(() => {
    mockEventHandler = vi.fn();
    analyticsSystem = new AnalyticsSystem({
      enabled: true,
      onEvent: mockEventHandler
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(analyticsSystem.enabled).toBe(true);
      expect(analyticsSystem.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(analyticsSystem.events).toEqual([]);
      expect(analyticsSystem.actions).toEqual({
        consolePurchases: 0,
        consoleUpgrades: 0,
        repairs: 0,
        powerUpsCollected: 0,
        characterUpgrades: 0,
        angryGuests: 0,
        totalRevenue: 0,
        daysSurvived: 0
      });
    });

    it('should accept custom options', () => {
      const customSessionId = 'test_session_123';
      const customAnalytics = new AnalyticsSystem({
        enabled: false,
        sessionId: customSessionId,
        onEvent: mockEventHandler
      });

      expect(customAnalytics.enabled).toBe(false);
      expect(customAnalytics.sessionId).toBe(customSessionId);
    });
  });

  describe('trackEvent', () => {
    it('should track events when enabled', () => {
      const eventData = { test: 'data' };
      analyticsSystem.trackEvent('test_event', eventData);

      expect(analyticsSystem.events).toHaveLength(1);
      expect(analyticsSystem.events[0].eventName).toBe('test_event');
      expect(analyticsSystem.events[0].data).toEqual(eventData);
      expect(analyticsSystem.events[0].sessionId).toBe(analyticsSystem.sessionId);
      expect(mockEventHandler).toHaveBeenCalledWith(analyticsSystem.events[0]);
    });

    it('should not track events when disabled', () => {
      analyticsSystem.setEnabled(false);
      analyticsSystem.trackEvent('test_event', { test: 'data' });

      expect(analyticsSystem.events).toHaveLength(0);
      expect(mockEventHandler).not.toHaveBeenCalled();
    });

    it('should prevent memory leaks by limiting events', () => {
      // Add more than maxEvents
      for (let i = 0; i < 1100; i++) {
        analyticsSystem.trackEvent(`event_${i}`);
      }

      expect(analyticsSystem.events.length).toBeLessThanOrEqual(analyticsSystem.maxEvents);
    });
  });

  describe('trackAction', () => {
    it('should track player actions and increment counters', () => {
      analyticsSystem.trackAction('consolePurchases', { consoleType: 'retro' });

      expect(analyticsSystem.actions.consolePurchases).toBe(1);
      expect(analyticsSystem.events).toHaveLength(1);
      expect(analyticsSystem.events[0].eventName).toBe('player_action');
      expect(analyticsSystem.events[0].data.action).toBe('consolePurchases');
      expect(analyticsSystem.events[0].data.consoleType).toBe('retro');
    });

    it('should handle unknown actions gracefully', () => {
      analyticsSystem.trackAction('unknownAction', { test: 'data' });

      expect(analyticsSystem.events).toHaveLength(1);
      expect(analyticsSystem.events[0].data.action).toBe('unknownAction');
    });
  });

  describe('trackStateChange', () => {
    it('should track state changes', () => {
      analyticsSystem.trackStateChange('menu', 'playing', { day: 1 });

      expect(analyticsSystem.events).toHaveLength(1);
      expect(analyticsSystem.events[0].eventName).toBe('state_change');
      expect(analyticsSystem.events[0].data.fromState).toBe('menu');
      expect(analyticsSystem.events[0].data.toState).toBe('playing');
      expect(analyticsSystem.events[0].data.day).toBe(1);
    });
  });

  describe('trackPerformance', () => {
    it('should track performance metrics', () => {
      analyticsSystem.trackPerformance({ fps: 60, deltaTime: 16.67 });

      expect(analyticsSystem.sessionData.performance.fps).toHaveLength(1);
      expect(analyticsSystem.sessionData.performance.fps[0]).toBe(60);
      expect(analyticsSystem.events).toHaveLength(1);
      expect(analyticsSystem.events[0].eventName).toBe('performance');
    });

    it('should limit performance data arrays', () => {
      // Add more than 100 FPS readings
      for (let i = 0; i < 110; i++) {
        analyticsSystem.trackPerformance({ fps: i });
      }

      expect(analyticsSystem.sessionData.performance.fps).toHaveLength(100);
      expect(analyticsSystem.sessionData.performance.fps[99]).toBe(109);
    });
  });

  describe('trackSessionStart', () => {
    it('should track session start', () => {
      analyticsSystem.trackSessionStart({ gameState: 'playing' });

      expect(analyticsSystem.gameStartTime).toBeGreaterThan(0);
      expect(analyticsSystem.events).toHaveLength(1);
      expect(analyticsSystem.events[0].eventName).toBe('session_start');
      expect(analyticsSystem.events[0].data.gameState).toBe('playing');
    });
  });

  describe('trackSessionEnd', () => {
    it('should track session end', () => {
      analyticsSystem.trackSessionStart();
      analyticsSystem.actions.consolePurchases = 5;
      analyticsSystem.totalPlayTime = 120; // 2 minutes

      // Add a small delay to ensure session duration is > 0
      const startTime = Date.now();
      while (Date.now() - startTime < 1) {
        // Wait at least 1ms
      }

      analyticsSystem.trackSessionEnd({ reason: 'game_over' });

      expect(analyticsSystem.events).toHaveLength(2); // session_start + session_end
      expect(analyticsSystem.events[1].eventName).toBe('session_end');
      expect(analyticsSystem.events[1].data.sessionDuration).toBeGreaterThan(0);
      expect(analyticsSystem.events[1].data.totalPlayTime).toBe(120);
      expect(analyticsSystem.events[1].data.actions.consolePurchases).toBe(5);
    });
  });

  describe('trackDayProgress', () => {
    it('should track day progression', () => {
      analyticsSystem.trackDayProgress(5, { guestsServed: 10 });

      expect(analyticsSystem.actions.daysSurvived).toBe(5);
      expect(analyticsSystem.events).toHaveLength(1);
      expect(analyticsSystem.events[0].eventName).toBe('day_progress');
      expect(analyticsSystem.events[0].data.day).toBe(5);
      expect(analyticsSystem.events[0].data.guestsServed).toBe(10);
    });
  });

  describe('trackRevenue', () => {
    it('should track revenue changes', () => {
      analyticsSystem.trackRevenue(50, 'console_usage', { consoleType: 'retro' });

      expect(analyticsSystem.actions.totalRevenue).toBe(50);
      expect(analyticsSystem.events).toHaveLength(1);
      expect(analyticsSystem.events[0].eventName).toBe('revenue');
      expect(analyticsSystem.events[0].data.amount).toBe(50);
      expect(analyticsSystem.events[0].data.source).toBe('console_usage');
      expect(analyticsSystem.events[0].data.totalRevenue).toBe(50);
    });

    it('should accumulate total revenue', () => {
      analyticsSystem.trackRevenue(30, 'console_usage');
      analyticsSystem.trackRevenue(20, 'bonus');

      expect(analyticsSystem.actions.totalRevenue).toBe(50);
      expect(analyticsSystem.events).toHaveLength(2);
      expect(analyticsSystem.events[1].data.totalRevenue).toBe(50);
    });
  });

  describe('trackAngryGuest', () => {
    it('should track angry guests', () => {
      analyticsSystem.trackAngryGuest({ guestType: 'casual' });

      expect(analyticsSystem.actions.angryGuests).toBe(1);
      expect(analyticsSystem.events).toHaveLength(1);
      expect(analyticsSystem.events[0].eventName).toBe('angry_guest');
      expect(analyticsSystem.events[0].data.angryGuestCount).toBe(1);
      expect(analyticsSystem.events[0].data.guestType).toBe('casual');
    });
  });

  describe('update', () => {
    it('should update play time when session is active', () => {
      analyticsSystem.trackSessionStart();
      const initialPlayTime = analyticsSystem.totalPlayTime;

      // Add a small delay to ensure time difference is > 0
      const startTime = Date.now();
      while (Date.now() - startTime < 1) {
        // Wait at least 1ms
      }

      analyticsSystem.update(1/60); // 1/60 second

      expect(analyticsSystem.totalPlayTime).toBeGreaterThan(initialPlayTime);
    });

    it('should not update play time when session is not started', () => {
      const initialPlayTime = analyticsSystem.totalPlayTime;

      analyticsSystem.update(1/60);

      expect(analyticsSystem.totalPlayTime).toBe(initialPlayTime);
    });

    it('should not update when disabled', () => {
      analyticsSystem.trackSessionStart();
      analyticsSystem.setEnabled(false);
      const initialPlayTime = analyticsSystem.totalPlayTime;

      analyticsSystem.update(1/60);

      expect(analyticsSystem.totalPlayTime).toBe(initialPlayTime);
    });
  });

  describe('getSummary', () => {
    it('should return analytics summary', () => {
      analyticsSystem.trackSessionStart();
      analyticsSystem.trackPerformance({ fps: 60 });
      analyticsSystem.trackPerformance({ fps: 58 });
      analyticsSystem.actions.consolePurchases = 3;

      // Add a small delay to ensure session duration is > 0
      const startTime = Date.now();
      while (Date.now() - startTime < 1) {
        // Wait at least 1ms
      }

      const summary = analyticsSystem.getSummary();

      expect(summary.sessionId).toBe(analyticsSystem.sessionId);
      expect(summary.sessionDuration).toBeGreaterThan(0);
      expect(summary.eventsCount).toBe(3); // session_start + 2 performance events
      expect(summary.actions.consolePurchases).toBe(3);
      expect(summary.performance.avgFps).toBe(59); // (60 + 58) / 2
      expect(summary.performance.fpsSamples).toBe(2);
    });
  });

  describe('exportData', () => {
    it('should export complete analytics data', () => {
      analyticsSystem.trackEvent('test_event', { test: 'data' });
      analyticsSystem.actions.consolePurchases = 2;

      const exportedData = analyticsSystem.exportData();

      expect(exportedData.sessionId).toBe(analyticsSystem.sessionId);
      expect(exportedData.events).toHaveLength(1);
      expect(exportedData.actions.consolePurchases).toBe(2);
      expect(exportedData.summary).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all analytics data', () => {
      analyticsSystem.trackEvent('test_event');
      analyticsSystem.actions.consolePurchases = 5;
      analyticsSystem.trackPerformance({ fps: 60 });

      analyticsSystem.clear();

      expect(analyticsSystem.events).toHaveLength(0);
      expect(analyticsSystem.sessionData.events).toHaveLength(0);
      expect(analyticsSystem.sessionData.performance.fps).toHaveLength(0);
      expect(analyticsSystem.actions.consolePurchases).toBe(0);
    });
  });

  describe('setEnabled', () => {
    it('should enable/disable analytics', () => {
      analyticsSystem.setEnabled(false);
      expect(analyticsSystem.enabled).toBe(false);

      analyticsSystem.setEnabled(true);
      expect(analyticsSystem.enabled).toBe(true);
    });
  });

  describe('setEventHandler', () => {
    it('should set custom event handler', () => {
      const newHandler = vi.fn();
      analyticsSystem.setEventHandler(newHandler);

      analyticsSystem.trackEvent('test_event');

      expect(newHandler).toHaveBeenCalled();
      expect(mockEventHandler).not.toHaveBeenCalled();
    });
  });
}); 