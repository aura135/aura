import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Volume2,
  VolumeX,
  Music,
  Disc3,
  Radio,
  Sparkles
} from 'lucide-react';

const TRACKS = [
  {
    id: 1,
    title: 'Neon Cyber Resonance',
    artist: 'AURA Synthetics',
    album: 'Future Horizon 2026',
    duration: 180,
    artwork: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
    audioFreq: 440 // A4
  },
  {
    id: 2,
    title: 'Quantum Drift',
    artist: 'Neural Waveform',
    album: 'Autonomous Echoes',
    duration: 215,
    artwork: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80',
    audioFreq: 523.25 // C5
  },
  {
    id: 3,
    title: 'Telugu Synth Pulse',
    artist: 'Deccan Electro Beats',
    album: 'Hyderabad Cyberwaves',
    duration: 195,
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    audioFreq: 659.25 // E5
  }
];

export default function MusicDashboardView() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const progressInterval = useRef(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // Web Media Session API integration
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [
          { src: currentTrack.artwork, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => handlePlay());
      navigator.mediaSession.setActionHandler('pause', () => handlePause());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
      navigator.mediaSession.setActionHandler('stop', () => handleStop());
    }

    // Listen to voice engine music events
    const handleVoiceMusic = (e) => {
      const action = e.detail?.action;
      if (action === 'play') handlePlay();
      else if (action === 'pause') handlePause();
      else if (action === 'next') handleNext();
      else if (action === 'prev') handlePrev();
    };

    window.addEventListener('aura:music', handleVoiceMusic);
    return () => window.removeEventListener('aura:music', handleVoiceMusic);
  }, [currentTrackIndex]);

  // Audio Synthesizer Loop
  const startSynthesizer = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(currentTrack.audioFreq, ctx.currentTime);

      // Low pleasant volume synth
      gain.gain.setValueAtTime(isMuted ? 0 : volume * 0.15, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;
    } catch (e) {
      console.warn('Web Audio playback error:', e);
    }
  };

  const stopSynthesizer = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch (e) {}
      oscRef.current = null;
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    startSynthesizer();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';

    clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= currentTrack.duration) {
          handleNext();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopSynthesizer();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    clearInterval(progressInterval.current);
  };

  const handleStop = () => {
    handlePause();
    setProgress(0);
  };

  const handleNext = () => {
    const nextIdx = (currentTrackIndex + 1) % TRACKS.length;
    setCurrentTrackIndex(nextIdx);
    setProgress(0);
    if (isPlaying) {
      setTimeout(() => startSynthesizer(), 50);
    }
  };

  const handlePrev = () => {
    const prevIdx = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    setCurrentTrackIndex(prevIdx);
    setProgress(0);
    if (isPlaying) {
      setTimeout(() => startSynthesizer(), 50);
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    setIsMuted(false);
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setValueAtTime(newVol * 0.15, audioCtxRef.current.currentTime);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setValueAtTime(nextMuted ? 0 : volume * 0.15, audioCtxRef.current.currentTime);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-aura-cyan flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Web Media Session API Integration</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
            Music & Audio Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-aura-surface border border-aura-border text-xs text-aura-muted">
          <Radio className="w-3.5 h-3.5 text-aura-cyan animate-pulse" />
          <span>Lock-Screen & Hardware Media Keys Active</span>
        </div>
      </div>

      {/* Main Music Player Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-aura-border shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Album Artwork with Spinning Animation */}
          <div className="relative mx-auto md:mx-0 w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl shadow-aura-purple/30 border border-aura-border flex-shrink-0 group">
            <img
              src={currentTrack.artwork}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : ''}`}
            />
            {isPlaying && (
              <div className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-aura-cyan border border-aura-cyan/40 animate-spin-slow">
                <Disc3 className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Track Info & Controls */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aura-cyan/15 text-aura-cyan border border-aura-cyan/30 uppercase">
                  {isPlaying ? 'Now Playing' : 'Playback Paused'}
                </span>
                <span className="text-xs text-aura-darkMuted font-mono">{currentTrack.album}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white line-clamp-1">
                {currentTrack.title}
              </h2>
              <p className="text-sm font-semibold text-aura-magenta mt-0.5">{currentTrack.artist}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-1.5 rounded-full bg-aura-surface border border-aura-border overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-aura-cyan to-aura-magenta transition-all duration-300"
                  style={{ width: `${(progress / currentTrack.duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-aura-darkMuted">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  className="p-3 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border text-white hover:text-aura-cyan transition-colors cursor-pointer"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {isPlaying ? (
                  <button
                    onClick={handlePause}
                    className="p-4 rounded-2xl btn-neon-purple text-white transition-transform cursor-pointer"
                  >
                    <Pause className="w-6 h-6 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={handlePlay}
                    className="p-4 rounded-2xl btn-neon-cyan text-aura-bg transition-transform cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-current" />
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="p-3 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border text-white hover:text-aura-cyan transition-colors cursor-pointer"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={handleStop}
                  className="p-3 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border text-aura-darkMuted hover:text-white transition-colors cursor-pointer"
                >
                  <Square className="w-5 h-5" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg text-aura-muted hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-aura-danger" /> : <Volume2 className="w-4 h-4 text-aura-cyan" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 sm:w-28 accent-aura-cyan h-1 bg-aura-surface rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-aura-border/60 pb-3">
          <Music className="w-4 h-4 text-aura-cyan" />
          <span>Available Audio Stems</span>
        </h3>

        <div className="space-y-2">
          {TRACKS.map((t, idx) => (
            <div
              key={t.id}
              onClick={() => {
                setCurrentTrackIndex(idx);
                setProgress(0);
                handlePlay();
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                currentTrackIndex === idx
                  ? 'bg-aura-cyan/10 border-aura-cyan/40 text-white'
                  : 'bg-aura-surface border-aura-border text-aura-muted hover:text-white hover:bg-aura-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-aura-cyan">{idx + 1}</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.title}</h4>
                  <p className="text-xs text-aura-muted">{t.artist} &bull; {t.album}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-aura-darkMuted">{formatTime(t.duration)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
