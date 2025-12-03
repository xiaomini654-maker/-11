import { AudioNote } from './types';

// D Minor Pentatonic Scale
// D4, F4, G4, A4, C5
export const PENTATONIC_SCALE: AudioNote[] = [
  { freq: 293.66, name: 'D4' },
  { freq: 349.23, name: 'F4' },
  { freq: 392.00, name: 'G4' },
  { freq: 440.00, name: 'A4' },
  { freq: 523.25, name: 'C5' },
];

export const VISUAL_CONFIG = {
  bgColor: '#C3D0E3',
  rippleColor: '255, 255, 255', // RGB for interpolation
  maxRadius: 80, // px, as per requirement
  expansionDuration: 1500, // ms (approximate visual duration)
  frameCountToMax: 90, // Approx frames to reach max size (1.5s @ 60fps)
};

export const SIGNAL_CONFIG = {
  oscPort: 8000, // Conceptually used, requires bridge
  oscAddress: '/sensor/vibration',
};