import React from 'react';
import { Mic, ShieldCheck, Zap, Globe2, Sparkles, Smartphone, ArrowRight, CheckCircle2, Lock, Cpu } from 'lucide-react';
import GlowingOrb from '../components/GlowingOrb';
import { VoiceState } from '../services/voiceEngine';

export default function LandingView({ setView }) {
  return (
    <div className="min-h-screen space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-aura-cyan/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-aura-purple/15 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-aura-card border border-aura-cyan/30 text-xs font-semibold text-aura-cyan shadow-lg shadow-aura-cyan/10 mb-8 animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Multilingual AI Assistant Ecosystem</span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Intelligent Hands-Free Control.{' '}
          <span className="bg-gradient-to-r from-aura-cyan via-aura-blue to-aura-magenta bg-clip-text text-transparent">
            Without Cloud LLM Wrappers.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-aura-muted max-w-2xl leading-relaxed">
          AURA executes local, deterministic intent-parsing across English, Telugu (తెలుగు), and Hindi (हिन्दी). Experience seamless notes, ordered points, tasks, reminders, and phone controls right in your browser.
        </p>

        {/* Glowing Orb Hero Element */}
        <div className="my-10 relative">
          <GlowingOrb state={VoiceState.LISTENING_FOR_WAKE} size={280} />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-aura-surface/90 border border-aura-border text-xs font-mono text-aura-cyan backdrop-blur-md">
            Say: "Hey AURA, note this..."
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
          <button
            onClick={() => setView('assistant')}
            className="btn-neon-cyan py-3.5 px-8 rounded-xl text-sm font-bold flex items-center gap-2.5 cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Launch Voice Assistant</span>
          </button>

          <button
            onClick={() => setView('dashboard')}
            className="py-3.5 px-8 rounded-xl text-sm font-semibold text-white bg-aura-surface hover:bg-aura-card border border-aura-border transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4 text-aura-cyan" />
          </button>
        </div>
      </section>

      {/* Ecosystem Pillar Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
            One Unified Product. Three Connected Experiences.
          </h2>
          <p className="mt-2 text-sm text-aura-muted">
            Engineered for seamless synchronization between Web, PWA, and Android.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Web */}
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-aura-cyan/10 border border-aura-cyan/30 flex items-center justify-center text-aura-cyan">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Responsive Web Application</h3>
            <p className="text-xs text-aura-muted leading-relaxed">
              Ultra-responsive desktop and mobile interface with instant access, zero install friction, and real-time audio visualizers.
            </p>
            <ul className="text-xs text-aura-text space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aura-cyan" /> Web Speech Recognition
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aura-cyan" /> Multilingual Synthesis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aura-cyan" /> Relational Cloud Database
              </li>
            </ul>
          </div>

          {/* 2. PWA */}
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-4 border-aura-purple/30">
            <div className="w-12 h-12 rounded-xl bg-aura-purple/10 border border-aura-purple/30 flex items-center justify-center text-aura-magenta">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Installable Progressive Web App</h3>
            <p className="text-xs text-aura-muted leading-relaxed">
              Standalone application experience installable through Chrome. Complete with offline caching, Service Worker, and Push notifications.
            </p>
            <ul className="text-xs text-aura-text space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aura-magenta" /> Standalone Fullscreen
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aura-magenta" /> Offline Data & Sync
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aura-magenta" /> Web Push Notifications
              </li>
            </ul>
          </div>

          {/* 3. Android Ecosystem */}
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-aura-cyan/10 border border-aura-cyan/30 flex items-center justify-center text-aura-cyan">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Android Integration Benchmark</h3>
            <p className="text-xs text-aura-muted leading-relaxed">
              Built on clean Kotlin & Jetpack Compose architecture with Room SQLite database and hardware controller standards.
            </p>
            <ul className="text-xs text-aura-text space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aura-cyan" /> Room Database Architecture
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aura-cyan" /> Foreground Audio Engine
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-aura-cyan" /> Hardware Controllers
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Multilingual Commands Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 rounded-3xl border border-aura-border space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Multilingual Voice Commands</h3>
              <p className="text-xs text-aura-muted">Supports English, Telugu (తెలుగు), and Hindi (हिन्दी) out of the box</p>
            </div>
            <span className="text-xs font-mono text-aura-cyan px-3 py-1 rounded-full bg-aura-cyan/10 border border-aura-cyan/30">
              Deterministic Parsing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-aura-surface border border-aura-border space-y-2">
              <span className="text-xs font-bold text-aura-cyan uppercase tracking-wider block">English Commands</span>
              <p className="text-xs text-aura-muted">"Hey AURA, note this: complete the task and call Rahul"</p>
              <p className="text-xs text-aura-muted">"Remind me during my free time between 6 PM and 8 PM"</p>
              <p className="text-xs text-aura-muted">"Play music"</p>
            </div>

            <div className="p-4 rounded-xl bg-aura-surface border border-aura-border space-y-2">
              <span className="text-xs font-bold text-aura-magenta uppercase tracking-wider block">తెలుగు (Telugu Commands)</span>
              <p className="text-xs text-aura-muted">"హే ఆరా, ప్రాజెక్ట్ నోట్ రాసుకో"</p>
              <p className="text-xs text-aura-muted">"నా పాయింట్లు చెప్పు"</p>
              <p className="text-xs text-aura-muted">"సాయంత్రం 6 గంటలకు గుర్తు చెయ్యి"</p>
            </div>

            <div className="p-4 rounded-xl bg-aura-surface border border-aura-border space-y-2">
              <span className="text-xs font-bold text-aura-cyan uppercase tracking-wider block">हिन्दी (Hindi Commands)</span>
              <p className="text-xs text-aura-muted">"हे ऑरा, असाइनमेंट पूरा करना है यह बात लिख लो"</p>
              <p className="text-xs text-aura-muted">"मेरे पॉइंट दोहराओ"</p>
              <p className="text-xs text-aura-muted">"खाली समय में 6 से 8 के बीच याद दिलाओ"</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
