/**
 * Generates simple notification sounds using the Web Audio API
 */

type SoundType = 'default' | 'success' | 'error' | 'warning' | 'info';

const soundConfigs: Record<SoundType, {
  frequency: number;
  type: OscillatorType;
  duration: number;
  vibrato?: boolean;
  volume?: number;
}> = {
  default: {
    frequency: 800,
    type: 'sine',
    duration: 0.2,
    volume: 0.5,
  },
  success: {
    frequency: 1000,
    type: 'sine',
    duration: 0.3,
    vibrato: true,
    volume: 0.5,
  },
  error: {
    frequency: 600,
    type: 'square',
    duration: 0.5,
    volume: 0.5,
  },
  warning: {
    frequency: 400,
    type: 'sawtooth',
    duration: 0.4,
    volume: 0.4,
  },
  info: {
    frequency: 1200,
    type: 'sine',
    duration: 0.2,
    volume: 0.3,
  },
};

export function playSound(type: SoundType = 'default'): void {
  // Don't play sound in development to avoid annoyance
  if (process.env.NODE_ENV === 'development') return;

  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    const config = soundConfigs[type];
    
    oscillator.type = config.type;
    oscillator.frequency.value = config.frequency;
    gainNode.gain.value = config.volume || 0.5;
    
    // Add vibrato effect if specified
    if (config.vibrato) {
      const vibrato = audioCtx.createOscillator();
      const vibratoGain = audioCtx.createGain();
      
      vibrato.frequency.value = 5.0; // Vibrato speed
      vibratoGain.gain.value = 10.0; // Vibrato depth
      
      vibrato.connect(vibratoGain);
      vibratoGain.connect(oscillator.frequency);
      
      vibrato.start();
      vibrato.stop(audioCtx.currentTime + config.duration);
    }
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Fade out to avoid clicks
    gainNode.gain.setValueAtTime(config.volume || 0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + config.duration);
    
    // Start and stop the oscillator
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + config.duration);
    
    // Clean up
    oscillator.onended = () => {
      gainNode.disconnect();
      oscillator.disconnect();
      if (audioCtx.state !== 'closed') {
        audioCtx.close().catch(console.error);
      }
    };
  } catch (error) {
    console.warn('Error playing notification sound:', error);
  }
}

// Export a simple notification function for convenience
export function notifyWithSound(
  message: string,
  type: SoundType = 'default',
  consoleLog = false
): void {
  playSound(type);
  
  if (consoleLog) {
    const styles = {
      default: 'color: #333; background: #f0f0f0; padding: 2px 6px; border-radius: 3px;',
      success: 'color: #155724; background: #d4edda; padding: 2px 6px; border-radius: 3px;',
      error: 'color: #721c24; background: #f8d7da; padding: 2px 6px; border-radius: 3px;',
      warning: 'color: #856404; background: #fff3cd; padding: 2px 6px; border-radius: 3px;',
      info: 'color: #0c5460; background: #d1ecf1; padding: 2px 6px; border-radius: 3px;',
    };
    
    console.log(`%c🔔 ${message}`, styles[type]);
  }
}
