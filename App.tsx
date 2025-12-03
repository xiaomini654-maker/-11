import React, { useEffect, useRef, useState, useCallback } from 'react';
import RippleCanvas, { RippleCanvasHandle } from './components/RippleCanvas';
import { audioService } from './services/AudioService';
import { SIGNAL_CONFIG } from './constants';

const App: React.FC = () => {
  const canvasRef = useRef<RippleCanvasHandle>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [debugMsg, setDebugMsg] = useState<string>("Waiting for interaction...");

  // Core trigger function: fires Visuals + Audio
  const triggerEffect = useCallback((x?: number, y?: number, source?: string) => {
    if (source) setDebugMsg(`Trigger: ${source}`);
    
    // 1. Trigger Visual
    canvasRef.current?.addRipple(x, y);
    
    // 2. Trigger Audio
    if (audioService.getContextState() === 'running') {
      audioService.playRandomNote();
    }
  }, []);

  // Initialization: Unlocks Audio Context
  const startExperience = () => {
    audioService.init();
    if (audioService.getContextState() === 'running' || audioService.getContextState() === 'suspended') {
        setAudioReady(true);
        setDebugMsg("Audio Engine Active. Listening for Signals...");
    }
  };

  // --- Input Listeners ---

  // 1. Mouse / Touch Listener (Direct Interaction)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!audioReady) {
        startExperience();
    }
    triggerEffect(e.clientX, e.clientY, 'Click');
  };

  // 2. Keyboard Listener (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (!audioReady) startExperience();
        triggerEffect(undefined, undefined, 'Keyboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerEffect, audioReady]);

  // 3. Web MIDI Listener (DigiShow MIDI output)
  useEffect(() => {
    if (!audioReady) return;

    const onMIDIMessage = (event: MIDIMessageEvent) => {
        const [status, note, velocity] = event.data;
        // Status 144 is Note On (channel 1), 145 channel 2, etc. 
        // We check if it is a Note On event (status 0x90 to 0x9F) and velocity > 0
        if ((status & 0xF0) === 0x90 && velocity > 0) {
            triggerEffect(undefined, undefined, `MIDI Note ${note}`);
        }
    };

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(
        (midiAccess) => {
          setDebugMsg("MIDI Connected");
          const inputs = midiAccess.inputs.values();
          for (let input of inputs) {
            input.onmidimessage = onMIDIMessage;
          }
        },
        () => console.warn("MIDI Access Denied")
      );
    }
  }, [audioReady, triggerEffect]);

  // 4. WebSocket Listener (OSC Bridge Simulation)
  // Since browsers can't listen to OSC UDP directly, we expect a WS bridge.
  // Standard OSC-web bridges forward to ws://localhost:8080 or similar.
  useEffect(() => {
    if (!audioReady) return;

    // NOTE: This assumes a local websocket server is bridging OSC messages
    // If you are using DigiShow, you might need a middleware like 'osc-web' 
    // running on node.js to forward UDP port 8000 to this Websocket.
    let socket: WebSocket | null = null;
    try {
        // Attempt to connect to a standard local bridge port
        socket = new WebSocket('ws://localhost:8080'); 
        
        socket.onopen = () => {
            console.log("WS Bridge Connected");
            setDebugMsg("OSC/WS Bridge Connected");
        };

        socket.onmessage = (event) => {
            // Basic parsing assuming JSON or specific string format from bridge
            // Ideally, the bridge sends: { address: "/sensor/vibration", args: [...] }
            try {
                const data = JSON.parse(event.data);
                if (data.address === SIGNAL_CONFIG.oscAddress) {
                    triggerEffect(undefined, undefined, "OSC Signal");
                }
            } catch (e) {
                // If not JSON, check simple string match
                if (typeof event.data === 'string' && event.data.includes('vibration')) {
                    triggerEffect(undefined, undefined, "OSC Signal");
                }
            }
        };
    } catch (e) {
        console.log("No WebSocket bridge found (normal for standalone demo)");
    }

    return () => {
        if (socket) socket.close();
    };
  }, [audioReady, triggerEffect]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#C3D0E3]">
      {/* Canvas Layer */}
      <div onClick={handleCanvasClick} className="w-full h-full">
         <RippleCanvas ref={canvasRef} />
      </div>

      {/* Intro / Overlay */}
      {!audioReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50 pointer-events-none">
          <div className="bg-white/90 p-8 rounded-2xl shadow-xl text-center pointer-events-auto max-w-md">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Resonance</h1>
            <p className="text-slate-600 mb-6">
              Connect Arduino/DigiShow or click to interact.
            </p>
            <button
              onClick={startExperience}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-blue-500/30"
            >
              Start Experience
            </button>
          </div>
        </div>
      )}

      {/* Debug / Status Indicator (Subtle) */}
      <div className="absolute bottom-4 left-4 text-slate-500/50 text-xs font-mono select-none pointer-events-none">
        {debugMsg}
      </div>
    </div>
  );
};

export default App;