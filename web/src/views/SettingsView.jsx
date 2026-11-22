import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe2,
  Volume2,
  Sliders,
  Moon,
  Sun,
  Trash2,
  ShieldAlert,
  BatteryCharging,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { voiceEngine } from '../services/voiceEngine';
import { api } from '../services/api';

export default function SettingsView({ darkMode, setDarkMode }) {
  const [language, setLanguage] = useState(voiceEngine.language);
  const [speechRate, setSpeechRate] = useState(voiceEngine.speechRate);
  const [speechPitch, setSpeechPitch] = useState(voiceEngine.speechPitch);
  const [wakeSensitivity, setWakeSensitivity] = useState(70);
  const [savedStatus, setSavedStatus] = useState('');

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    voiceEngine.setLanguage(lang);
    if (api.isAuthenticated()) {
      await api.setPreference('selected_language', lang);
    }
    setSavedStatus('Language updated to ' + (lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English'));
    setTimeout(() => setSavedStatus(''), 2500);
  };

  const handleSpeechRateChange = async (rate) => {
    setSpeechRate(rate);
    voiceEngine.speechRate = rate;
    localStorage.setItem('aura_speech_rate', rate.toString());
    if (api.isAuthenticated()) {
      await api.setPreference('speech_rate', rate.toString());
    }
  };

  const handleSpeechPitchChange = async (pitch) => {
    setSpeechPitch(pitch);
    voiceEngine.speechPitch = pitch;
    localStorage.setItem('aura_speech_pitch', pitch.toString());
    if (api.isAuthenticated()) {
      await api.setPreference('speech_pitch', pitch.toString());
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Clear all offline cache and re-download fresh assets?')) {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach(name => caches.delete(name));
        });
      }
      localStorage.removeItem('aura_cache_notes');
      localStorage.removeItem('aura_cache_tasks');
      localStorage.removeItem('aura_cache_reminders');
      setSavedStatus('Offline cache cleared successfully.');
      setTimeout(() => setSavedStatus(''), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-aura-cyan flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>System Parameters & Customization</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
          AURA System Settings
        </h1>
      </div>

      {savedStatus && (
        <div className="p-3.5 rounded-xl bg-aura-success/15 border border-aura-success/30 text-xs text-aura-success flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedStatus}</span>
        </div>
      )}

      {/* 1. Multilingual Language Selector */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-aura-cyan/10 border border-aura-cyan/30 text-aura-cyan">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Multilingual Engine Language
            </h3>
            <p className="text-xs text-aura-muted">
              Select primary dialect for wake word, local speech parsing, and voice synthesis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { id: 'en', name: 'English (US)', phrase: '"Hey AURA, what is my schedule?"' },
            { id: 'te', name: 'తెలుగు (Telugu)', phrase: '"హే ఆరా, నా పాయింట్లు చెప్పు"' },
            { id: 'hi', name: 'हिन्दी (Hindi)', phrase: '"हे ऑरा, आज का शेड्यूल क्या है?"' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleLanguageChange(item.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                language === item.id
                  ? 'bg-aura-cyan/15 border-aura-cyan text-white shadow-lg shadow-aura-cyan/20'
                  : 'bg-aura-surface border-aura-border text-aura-muted hover:text-white hover:bg-aura-card'
              }`}
            >
              <span className="text-sm font-bold text-white block mb-1">{item.name}</span>
              <span className="text-[11px] text-aura-darkMuted italic block">{item.phrase}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Text-To-Speech Synthesis Controls */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-aura-purple/10 border border-aura-purple/30 text-aura-magenta">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Speech Synthesis Tuning
            </h3>
            <p className="text-xs text-aura-muted">
              Fine-tune spoken voice cadence, playback speed, and pitch modulation
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-white mb-2">
              <span>Speech Speed Rate</span>
              <span className="font-mono text-aura-cyan">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
              className="w-full accent-aura-cyan h-1.5 bg-aura-surface rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-white mb-2">
              <span>Speech Pitch Level</span>
              <span className="font-mono text-aura-magenta">{speechPitch}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechPitch}
              onChange={(e) => handleSpeechPitchChange(parseFloat(e.target.value))}
              className="w-full accent-aura-magenta h-1.5 bg-aura-surface rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Theme & Appearance */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Theme Palette
            </h3>
            <p className="text-xs text-aura-muted">Toggle Cyberpunk Dark Mode or Light Mode</p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn-neon-cyan py-2 px-4 rounded-xl text-xs font-bold"
        >
          {darkMode ? 'Dark Mode Active' : 'Light Mode Active'}
        </button>
      </div>

      {/* 4. Cache & Storage Purge */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-aura-danger/10 border border-aura-danger/30 text-aura-danger">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Offline Storage Management
            </h3>
            <p className="text-xs text-aura-muted">Purge cached Service Worker assets and local database copies</p>
          </div>
        </div>

        <button
          onClick={handleClearCache}
          className="btn-neon-danger py-2 px-4 rounded-xl text-xs font-bold"
        >
          Purge Offline Cache
        </button>
      </div>
    </div>
  );
}
