import React, { useState, useEffect } from 'react';
import { Mic, Send, Volume2, ShieldCheck, Sparkles } from 'lucide-react';
import GlowingOrb from '../components/GlowingOrb';
import StrictVoiceControls from '../components/StrictVoiceControls';
import { voiceEngine, VoiceState } from '../services/voiceEngine';

export default function VoiceAssistantView() {
  const [state, setState] = useState(voiceEngine.state);
  const [audioRms, setAudioRms] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isFinalTranscript, setIsFinalTranscript] = useState(false);
  const [spokenResponse, setSpokenResponse] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isPaused, setIsPaused] = useState(voiceEngine.isPaused);
  const [isEnrolled, setIsEnrolled] = useState(voiceEngine.isEnrolled);

  useEffect(() => {
    voiceEngine.onStateChange((s) => setState(s));
    voiceEngine.onRms((rms) => setAudioRms(rms));
    voiceEngine.onTranscript((t, final) => {
      setTranscript(t);
      setIsFinalTranscript(final);
    });
    voiceEngine.onResponse((r) => setSpokenResponse(r));
  }, []);

  const handleUpdate = () => {
    setIsPaused(voiceEngine.isPaused);
    setIsEnrolled(voiceEngine.isEnrolled);
    setState(voiceEngine.state);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    voiceEngine.handleSpokenInput(manualInput.trim());
    setManualInput('');
  };

  const getStateLabel = () => {
    switch (state) {
      case VoiceState.PAUSED:
        return { text: 'Listening Paused', color: 'text-aura-danger' };
      case VoiceState.LISTENING_FOR_WAKE:
        return { text: 'Listening for "Hey AURA"...', color: 'text-aura-cyan' };
      case VoiceState.HEARD_WAKE_WORD:
        return { text: 'Wake Word Detected!', color: 'text-aura-magenta' };
      case VoiceState.LISTENING_FOR_COMMAND:
        return { text: 'Listening to command...', color: 'text-aura-cyan' };
      case VoiceState.PROCESSING:
        return { text: 'Processing locally...', color: 'text-amber-400' };
      case VoiceState.SPEAKING:
        return { text: 'Speaking response...', color: 'text-aura-success' };
      default:
        return { text: 'Standby Mode', color: 'text-aura-muted' };
    }
  };

  const status = getStateLabel();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-between min-h-[82vh] space-y-6">
      {/* Header Info */}
      <div className="text-center space-y-1">
        <span className="text-[11px] font-mono uppercase tracking-widest text-aura-cyan flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>STRICT MAIN VOICE INTERFACE (SECTION 4 COMPLIANT)</span>
        </span>
        <h2 className={`text-xl sm:text-2xl font-display font-bold ${status.color}`}>
          {status.text}
        </h2>
      </div>

      {/* Reactive Glowing AI Orb */}
      <div className="my-2 relative flex items-center justify-center">
        <GlowingOrb state={state} audioRms={audioRms} size={280} />
      </div>

      {/* Live Voice Status Bubble & Transcript */}
      {(transcript || spokenResponse) && (
        <div className="w-full max-w-xl glass-card p-5 rounded-2xl border border-aura-border space-y-3 animate-fadeIn">
          {transcript && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-aura-cyan block mb-0.5">
                Heard Input
              </span>
              <p className="text-sm font-semibold text-white">"{transcript}"</p>
            </div>
          )}

          {spokenResponse && (
            <div className="pt-2 border-t border-aura-border/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-aura-magenta block mb-0.5 flex items-center gap-1.5">
                <Volume2 className="w-3 h-3 text-aura-magenta" />
                <span>AURA Synthesized Response</span>
              </span>
              <p className="text-sm text-aura-text leading-relaxed">{spokenResponse}</p>
            </div>
          )}
        </div>
      )}

      {/* Manual Input Bar for Keyboard Testing & Accessibility */}
      <form onSubmit={handleManualSubmit} className="w-full max-w-xl flex gap-2">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder='Try typing: "Note this: Buy milk and submit report" or "Play music"'
          className="flex-1 bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2.5 px-4 text-xs sm:text-sm text-white placeholder-aura-darkMuted outline-none"
        />
        <button
          type="submit"
          className="btn-neon-cyan py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

      {/* STRICT 4 MAIN VOICE CONTROLS */}
      <div className="w-full pt-4">
        <StrictVoiceControls
          voiceState={state}
          isPaused={isPaused}
          isEnrolled={isEnrolled}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
}
