import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioSystem } from '../../../src/engine/systems/AudioSystem.js';

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: vi.fn(),
  createGain: vi.fn(),
  createBufferSource: vi.fn(),
  decodeAudioData: vi.fn(),
  destination: {},
  currentTime: 0
};

const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  frequency: { value: 440 },
  type: 'sine'
};

const mockGainNode = {
  connect: vi.fn(),
  gain: { value: 1 }
};

const mockBufferSource = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  buffer: null
};

// Mock global AudioContext
global.AudioContext = vi.fn(() => mockAudioContext);
global.webkitAudioContext = vi.fn(() => mockAudioContext);

describe('AudioSystem', () => {
  let audioSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioContext.createOscillator.mockReturnValue(mockOscillator);
    mockAudioContext.createGain.mockReturnValue(mockGainNode);
    mockAudioContext.createBufferSource.mockReturnValue(mockBufferSource);
    
    audioSystem = new AudioSystem();
  });

  describe('constructor', () => {
    it('should initialize with default volumes', () => {
      expect(audioSystem.volumes.master).toBe(1);
      expect(audioSystem.volumes.sfx).toBe(1);
      expect(audioSystem.volumes.music).toBe(1);
    });

    it('should initialize with empty sound library', () => {
      expect(audioSystem.sounds).toEqual({});
    });

    it('should initialize with no current music', () => {
      expect(audioSystem.currentMusic).toBeNull();
    });

    it('should create audio context if available', () => {
      expect(audioSystem.audioContext).toBeTruthy();
    });
  });

  describe('volume management', () => {
    describe('setVolume', () => {
      it('should set master volume', () => {
        audioSystem.setVolume('master', 0.5);
        expect(audioSystem.volumes.master).toBe(0.5);
      });

      it('should set SFX volume', () => {
        audioSystem.setVolume('sfx', 0.8);
        expect(audioSystem.volumes.sfx).toBe(0.8);
      });

      it('should set music volume', () => {
        audioSystem.setVolume('music', 0.3);
        expect(audioSystem.volumes.music).toBe(0.3);
      });

      it('should clamp volume between 0 and 1', () => {
        audioSystem.setVolume('master', -0.5);
        expect(audioSystem.volumes.master).toBe(0);

        audioSystem.setVolume('master', 1.5);
        expect(audioSystem.volumes.master).toBe(1);
      });

      it('should ignore invalid volume types', () => {
        const originalVolume = audioSystem.volumes.master;
        audioSystem.setVolume('invalid', 0.5);
        expect(audioSystem.volumes.master).toBe(originalVolume);
      });
    });

    describe('getVolume', () => {
      it('should return correct volume for each type', () => {
        audioSystem.setVolume('master', 0.7);
        expect(audioSystem.getVolume('master')).toBe(0.7);
      });

      it('should return 0 for invalid volume type', () => {
        expect(audioSystem.getVolume('invalid')).toBe(0);
      });
    });

    describe('calculateEffectiveVolume', () => {
      it('should calculate SFX volume correctly', () => {
        audioSystem.setVolume('master', 0.8);
        audioSystem.setVolume('sfx', 0.5);
        
        const effectiveVolume = audioSystem.calculateEffectiveVolume('sfx');
        expect(effectiveVolume).toBe(0.4); // 0.8 * 0.5
      });

      it('should calculate music volume correctly', () => {
        audioSystem.setVolume('master', 0.6);
        audioSystem.setVolume('music', 0.8);
        
        const effectiveVolume = audioSystem.calculateEffectiveVolume('music');
        expect(effectiveVolume).toBe(0.48); // 0.6 * 0.8
      });
    });
  });

  describe('basic sound generation', () => {
    describe('playBeep', () => {
      it('should create and play oscillator for beep', () => {
        audioSystem.playBeep(440, 200);
        
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        expect(mockAudioContext.createGain).toHaveBeenCalled();
        expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
        expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
        expect(mockOscillator.start).toHaveBeenCalled();
      });

      it('should use default frequency and duration', () => {
        audioSystem.playBeep();
        expect(mockOscillator.frequency.value).toBe(440);
      });

      it('should handle audio context unavailable', () => {
        audioSystem.audioContext = null;
        
        expect(() => audioSystem.playBeep()).not.toThrow();
      });
    });

    describe('playTone', () => {
      it('should play tone with specified parameters', () => {
        audioSystem.playTone(880, 500, 0.3);
        
        expect(mockOscillator.frequency.value).toBe(880);
        expect(mockGainNode.gain.value).toBeCloseTo(0.3 * audioSystem.calculateEffectiveVolume('sfx'));
      });
    });
  });

  describe('predefined sounds', () => {
    describe('playRepairSound', () => {
      it('should play repair sound sequence', () => {
        const beepSpy = vi.spyOn(audioSystem, 'playBeep');
        audioSystem.playRepairSound();
        
        expect(beepSpy).toHaveBeenCalled();
      });
    });

    describe('playMoneySound', () => {
      it('should play money collection sound', () => {
        const toneSpy = vi.spyOn(audioSystem, 'playTone');
        audioSystem.playMoneySound();
        
        expect(toneSpy).toHaveBeenCalled();
      });
    });

    describe('playWarningSound', () => {
      it('should play warning sound', () => {
        const toneSpy = vi.spyOn(audioSystem, 'playTone');
        audioSystem.playWarningSound();
        
        expect(toneSpy).toHaveBeenCalled();
      });
    });

    describe('playClickSound', () => {
      it('should play UI click sound', () => {
        const beepSpy = vi.spyOn(audioSystem, 'playBeep');
        audioSystem.playClickSound();
        
        expect(beepSpy).toHaveBeenCalled();
      });
    });

    describe('playGameOverSound', () => {
      it('should play game over sound sequence', () => {
        const toneSpy = vi.spyOn(audioSystem, 'playTone');
        audioSystem.playGameOverSound();
        
        expect(toneSpy).toHaveBeenCalled();
      });
    });
  });

  describe('music system', () => {
    describe('playMusic', () => {
      it('should create and play background music', () => {
        audioSystem.playMusic(200, 400); // Simple two-tone music
        
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        expect(audioSystem.currentMusic).toBeTruthy();
      });

      it('should stop current music before playing new', () => {
        const stopSpy = vi.fn();
        audioSystem.currentMusic = { stop: stopSpy };
        
        audioSystem.playMusic(300);
        expect(stopSpy).toHaveBeenCalled();
      });
    });

    describe('stopMusic', () => {
      it('should stop current music', () => {
        const stopSpy = vi.fn();
        audioSystem.currentMusic = { stop: stopSpy };
        
        audioSystem.stopMusic();
        expect(stopSpy).toHaveBeenCalled();
        expect(audioSystem.currentMusic).toBeNull();
      });

      it('should handle no current music', () => {
        audioSystem.currentMusic = null;
        expect(() => audioSystem.stopMusic()).not.toThrow();
      });
    });
  });

  describe('sound management', () => {
    describe('loadSound', () => {
      it('should register sound in library', () => {
        const mockSound = { buffer: 'mockBuffer' };
        audioSystem.loadSound('test', mockSound);
        
        expect(audioSystem.sounds.test).toBe(mockSound);
      });
    });

    describe('playSound', () => {
      it('should play registered sound', () => {
        const mockSound = { buffer: 'mockBuffer' };
        audioSystem.loadSound('test', mockSound);
        
        audioSystem.playSound('test');
        
        expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
        expect(mockBufferSource.connect).toHaveBeenCalled();
        expect(mockBufferSource.start).toHaveBeenCalled();
      });

      it('should handle unknown sound gracefully', () => {
        expect(() => audioSystem.playSound('unknown')).not.toThrow();
      });

      it('should apply correct volume', () => {
        const mockSound = { buffer: 'mockBuffer' };
        audioSystem.loadSound('test', mockSound);
        audioSystem.setVolume('sfx', 0.5);
        
        audioSystem.playSound('test', 0.8);
        
        const expectedVolume = 0.8 * audioSystem.calculateEffectiveVolume('sfx');
        expect(mockGainNode.gain.value).toBeCloseTo(expectedVolume);
      });
    });
  });

  describe('convenience methods', () => {
    describe('muteAll', () => {
      it('should set master volume to 0', () => {
        audioSystem.muteAll();
        expect(audioSystem.volumes.master).toBe(0);
      });

      it('should store previous volume', () => {
        audioSystem.setVolume('master', 0.8);
        audioSystem.muteAll();
        
        expect(audioSystem.previousMasterVolume).toBe(0.8);
      });
    });

    describe('unmuteAll', () => {
      it('should restore previous master volume', () => {
        audioSystem.setVolume('master', 0.7);
        audioSystem.muteAll();
        audioSystem.unmuteAll();
        
        expect(audioSystem.volumes.master).toBe(0.7);
      });

      it('should handle no previous volume', () => {
        audioSystem.volumes.master = 0;
        audioSystem.previousMasterVolume = undefined;
        
        audioSystem.unmuteAll();
        expect(audioSystem.volumes.master).toBe(1); // Default
      });
    });

    describe('stopAll', () => {
      it('should stop all active sounds', () => {
        const mockActiveSounds = [
          { stop: vi.fn() },
          { stop: vi.fn() }
        ];
        audioSystem.activeSounds = mockActiveSounds;
        
        audioSystem.stopAll();
        
        mockActiveSounds.forEach(sound => {
          expect(sound.stop).toHaveBeenCalled();
        });
        expect(audioSystem.activeSounds).toEqual([]);
      });

      it('should stop music', () => {
        const stopMusicSpy = vi.spyOn(audioSystem, 'stopMusic');
        audioSystem.stopAll();
        
        expect(stopMusicSpy).toHaveBeenCalled();
      });
    });
  });

  describe('fallback behavior', () => {
    it('should handle no Web Audio API support', () => {
      // Create audio system without Web Audio support
      global.AudioContext = undefined;
      global.webkitAudioContext = undefined;
      
      const fallbackAudio = new AudioSystem();
      
      expect(() => fallbackAudio.playBeep()).not.toThrow();
      expect(() => fallbackAudio.playSound('test')).not.toThrow();
      expect(() => fallbackAudio.playMusic()).not.toThrow();
    });

    it('should maintain volume settings without audio context', () => {
      const fallbackAudio = new AudioSystem();
      fallbackAudio.audioContext = null;
      
      fallbackAudio.setVolume('master', 0.5);
      expect(fallbackAudio.getVolume('master')).toBe(0.5);
    });
  });
});