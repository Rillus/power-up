/**
 * AudioSystem for handling game audio using Web Audio API
 * @class AudioSystem
 */
export class AudioSystem {
  /**
   * Create an AudioSystem
   */
  constructor() {
    // Initialize Audio Context
    this.audioContext = null;
    this.initializeAudioContext();
    
    // Volume controls
    this.volumes = {
      master: 1.0,
      sfx: 1.0,
      music: 1.0
    };
    
    // Sound library
    this.sounds = {};
    
    // Active sounds tracking
    this.activeSounds = [];
    
    // Music system
    this.currentMusic = null;
    
    // Mute state
    this.previousMasterVolume = undefined;
  }

  /**
   * Initialize Web Audio Context
   * @private
   */
  initializeAudioContext() {
    try {
      // Try modern AudioContext first, then webkit fallback
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      } else {
        console.warn('Web Audio API not supported. Audio will be disabled.');
      }
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
      this.audioContext = null;
    }
  }

  /**
   * Set volume for a specific audio type
   * @param {string} type - Volume type ('master', 'sfx', 'music')
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(type, volume) {
    if (this.volumes.hasOwnProperty(type)) {
      this.volumes[type] = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get volume for a specific audio type
   * @param {string} type - Volume type
   * @returns {number} Volume level (0.0 to 1.0)
   */
  getVolume(type) {
    return this.volumes[type] || 0;
  }

  /**
   * Calculate effective volume combining master and type volumes
   * @param {string} type - Audio type ('sfx' or 'music')
   * @returns {number} Effective volume
   * @private
   */
  calculateEffectiveVolume(type) {
    return this.volumes.master * (this.volumes[type] || 1);
  }

  /**
   * Play a simple beep sound
   * @param {number} [frequency=440] - Frequency in Hz
   * @param {number} [duration=200] - Duration in milliseconds
   * @param {number} [volume=0.3] - Volume (0.0 to 1.0)
   */
  playBeep(frequency = 440, duration = 200, volume = 0.3) {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Configure oscillator
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Configure volume
      const effectiveVolume = volume * this.calculateEffectiveVolume('sfx');
      gainNode.gain.value = effectiveVolume;

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Play sound
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + (duration / 1000));

      // Track active sound
      this.activeSounds.push(oscillator);

      // Clean up after sound ends
      oscillator.onended = () => {
        const index = this.activeSounds.indexOf(oscillator);
        if (index > -1) {
          this.activeSounds.splice(index, 1);
        }
      };
    } catch (error) {
      console.warn('Failed to play beep:', error);
    }
  }

  /**
   * Play a tone with specified parameters
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in milliseconds
   * @param {number} [volume=0.3] - Volume (0.0 to 1.0)
   * @param {string} [waveType='sine'] - Oscillator wave type
   */
  playTone(frequency, duration, volume = 0.3, waveType = 'sine') {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.frequency.value = frequency;
      oscillator.type = waveType;

      const effectiveVolume = volume * this.calculateEffectiveVolume('sfx');
      gainNode.gain.value = effectiveVolume;

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + (duration / 1000));

      this.activeSounds.push(oscillator);

      oscillator.onended = () => {
        const index = this.activeSounds.indexOf(oscillator);
        if (index > -1) {
          this.activeSounds.splice(index, 1);
        }
      };
    } catch (error) {
      console.warn('Failed to play tone:', error);
    }
  }

  // Predefined Game Sounds

  /**
   * Play repair action sound
   */
  playRepairSound() {
    // Three-tone repair sequence
    this.playBeep(600, 100, 0.2);
    setTimeout(() => this.playBeep(800, 100, 0.2), 120);
    setTimeout(() => this.playBeep(1000, 150, 0.3), 240);
  }

  /**
   * Play money collection sound
   */
  playMoneySound() {
    this.playTone(800, 200, 0.4, 'triangle');
    setTimeout(() => this.playTone(1200, 150, 0.3, 'triangle'), 100);
  }

  /**
   * Play warning/alert sound
   */
  playWarningSound() {
    this.playTone(300, 500, 0.5, 'sawtooth');
  }

  /**
   * Play UI click sound
   */
  playClickSound() {
    this.playBeep(1000, 50, 0.2);
  }

  /**
   * Play game over sound sequence
   */
  playGameOverSound() {
    this.playTone(400, 300, 0.4, 'sawtooth');
    setTimeout(() => this.playTone(300, 300, 0.4, 'sawtooth'), 320);
    setTimeout(() => this.playTone(200, 500, 0.5, 'sawtooth'), 640);
  }

  /**
   * Play success/achievement sound
   */
  playSuccessSound() {
    this.playTone(600, 200, 0.3);
    setTimeout(() => this.playTone(800, 200, 0.3), 150);
    setTimeout(() => this.playTone(1000, 300, 0.4), 300);
  }

  /**
   * Play power-up collection sound
   */
  playPowerUpSound() {
    // Ascending chime for power-up collection
    this.playTone(800, 100, 0.3, 'sine');
    setTimeout(() => this.playTone(1000, 100, 0.3, 'sine'), 80);
    setTimeout(() => this.playTone(1200, 100, 0.3, 'sine'), 160);
    setTimeout(() => this.playTone(1600, 200, 0.4, 'sine'), 240);
  }

  // Music System

  /**
   * Play background music (simple procedural music)
   * @param {number} [baseFreq=220] - Base frequency for music
   * @param {number} [harmonic=330] - Harmonic frequency
   * @param {number} [volume=0.1] - Music volume
   */
  playMusic(baseFreq = 220, harmonic = 330, volume = 0.1) {
    if (!this.audioContext) return;

    // Stop current music if playing
    this.stopMusic();

    try {
      // Create two oscillators for simple harmony
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      osc1.frequency.value = baseFreq;
      osc2.frequency.value = harmonic;
      osc1.type = 'sine';
      osc2.type = 'sine';

      const effectiveVolume = volume * this.calculateEffectiveVolume('music');
      gainNode.gain.value = effectiveVolume;

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      osc1.start();
      osc2.start();

      // Store reference for stopping
      this.currentMusic = {
        stop: () => {
          try {
            osc1.stop();
            osc2.stop();
          } catch (e) {
            // Oscillators might already be stopped
          }
        }
      };
    } catch (error) {
      console.warn('Failed to play music:', error);
    }
  }

  /**
   * Stop background music
   */
  stopMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
      } catch (error) {
        console.warn('Error stopping music:', error);
      }
      this.currentMusic = null;
    }
  }

  // Sound Library Management

  /**
   * Load a sound into the library
   * @param {string} name - Sound identifier
   * @param {Object} soundData - Sound data/buffer
   */
  loadSound(name, soundData) {
    this.sounds[name] = soundData;
  }

  /**
   * Play a loaded sound from the library
   * @param {string} name - Sound identifier
   * @param {number} [volume=1.0] - Volume (0.0 to 1.0)
   */
  playSound(name, volume = 1.0) {
    if (!this.audioContext || !this.sounds[name]) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = this.sounds[name].buffer;
      
      const effectiveVolume = volume * this.calculateEffectiveVolume('sfx');
      gainNode.gain.value = effectiveVolume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
      
      this.activeSounds.push(source);

      source.onended = () => {
        const index = this.activeSounds.indexOf(source);
        if (index > -1) {
          this.activeSounds.splice(index, 1);
        }
      };
    } catch (error) {
      console.warn(`Failed to play sound '${name}':`, error);
    }
  }

  // Utility Methods

  /**
   * Mute all audio
   */
  muteAll() {
    this.previousMasterVolume = this.volumes.master;
    this.setVolume('master', 0);
  }

  /**
   * Unmute all audio
   */
  unmuteAll() {
    const restoreVolume = this.previousMasterVolume !== undefined 
      ? this.previousMasterVolume 
      : 1.0;
    this.setVolume('master', restoreVolume);
    this.previousMasterVolume = undefined;
  }

  /**
   * Stop all currently playing sounds and music
   */
  stopAll() {
    // Stop all active sound effects
    this.activeSounds.forEach(sound => {
      try {
        sound.stop();
      } catch (error) {
        // Sound might already be stopped
      }
    });
    this.activeSounds = [];

    // Stop music
    this.stopMusic();
  }

  /**
   * Get audio system status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      audioContextAvailable: !!this.audioContext,
      activeSounds: this.activeSounds.length,
      volumes: { ...this.volumes },
      musicPlaying: !!this.currentMusic,
      soundsLoaded: Object.keys(this.sounds).length
    };
  }
}