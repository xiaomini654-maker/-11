export interface RippleConfig {
  x: number;
  y: number;
  maxRadius: number;
  expansionSpeed: number; // pixels per frame
  color: string;
}

export enum SignalType {
  MOUSE = 'MOUSE',
  KEYBOARD = 'KEYBOARD',
  MIDI = 'MIDI',
  OSC = 'OSC', // Simulated via WebSocket
}

export interface AudioNote {
  freq: number;
  name: string;
}