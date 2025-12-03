import { PENTATONIC_SCALE } from '../constants';

class AudioService {
  private context: AudioContext | null = null;
  private isEnabled: boolean = false;

  constructor() {
    // We strictly initialize on user interaction to comply with browser autoplay policies
  }

  public init() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
      this.isEnabled = true;
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  public playRandomNote() {
    if (!this.context || !this.isEnabled) return;

    const randomIndex = Math.floor(Math.random() * PENTATONIC_SCALE.length);
    const note = PENTATONIC_SCALE[randomIndex];
    this.playTone(note.freq);
  }

  private playTone(frequency: number) {
    if (!this.context) return;

    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, t);

    // Envelope matching the ripple visual:
    // Attack (very fast) -> Decay (slowly) -> Silence
    const duration = 1.5; // Seconds, matches visual duration roughly

    // Connect graph
    osc.connect(gain);
    gain.connect(this.context.destination);

    // Amplitude Envelope
    // Start slightly silent to avoid pop
    gain.gain.setValueAtTime(0, t);
    // Quick attack to 0.8 volume
    gain.gain.linearRampToValueAtTime(0.8, t + 0.05);
    // Exponential decay to near zero
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.start(t);
    osc.stop(t + duration + 0.1);

    // Garbage collection cleanup happens automatically when node disconnects/stops
    osc.onended = () => {
        gain.disconnect();
    };
  }

  public getContextState(): AudioContextState | 'uninitialized' {
    return this.context ? this.context.state : 'uninitialized';
  }
}

export const audioService = new AudioService();