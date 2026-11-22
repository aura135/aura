import React, { useState, useEffect } from 'react';
import {
  Mic,
  FileText,
  ListOrdered,
  CheckSquare,
  Bell,
  Music,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { api } from '../services/api';
import { voiceEngine, VoiceState } from '../services/voiceEngine';

export default function DashboardView({ setView }) {
  const [metrics, setMetrics] = useState({
    notesCount: 0,
    tasksCount: 0,
    remindersCount: 0,
    alarmsCount: 0
  });
  const [recentCommands, setRecentCommands] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  const loadData = async () => {
    try {
      const [notesRes, tasksRes, remRes, alarmsRes, cmdRes] = await Promise.all([
        api.getNotes(),
        api.getTasks(),
        api.getReminders(),
        api.getAlarms(),
        api.getCommandHistory()
      ]);

      setMetrics({
        notesCount: notesRes.notes?.length || 0,
        tasksCount: tasksRes.tasks?.filter(t => !t.is_completed).length || 0,
        remindersCount: remRes.reminders?.length || 0,
        alarmsCount: alarmsRes.alarms?.length || 0
      });

      setRecentCommands((cmdRes.history || []).slice(0, 5));
      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Dashboard data fetch error:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await api.pullSync();
      await loadData();
    } finally {
      setTimeout(() => setSyncing(false), 600);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-aura-cyan flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AURA Operating System v2.0</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white mt-1">
            System Command Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-aura-muted uppercase tracking-wider block">Last Synced</span>
            <span className="text-xs font-mono text-aura-cyan">{lastSync}</span>
          </div>

          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-aura-cyan ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>

          <button
            onClick={() => setView('assistant')}
            className="btn-neon-cyan py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Voice Assistant</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Notes & Points Metric */}
        <div
          onClick={() => setView('notes')}
          className="glass-card glass-card-hover p-5 rounded-2xl cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-aura-cyan/10 border border-aura-cyan/30 flex items-center justify-center text-aura-cyan group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-aura-muted group-hover:text-aura-cyan transition-colors" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-bold text-white block">
            {metrics.notesCount}
          </span>
          <span className="text-xs text-aura-muted font-medium">Saved Notes & Points</span>
        </div>

        {/* Pending Tasks */}
        <div
          onClick={() => setView('tasks')}
          className="glass-card glass-card-hover p-5 rounded-2xl cursor-pointer group border-aura-purple/30"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-aura-purple/10 border border-aura-purple/30 flex items-center justify-center text-aura-magenta group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-aura-muted group-hover:text-aura-magenta transition-colors" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-bold text-white block">
            {metrics.tasksCount}
          </span>
          <span className="text-xs text-aura-muted font-medium">Pending Tasks</span>
        </div>

        {/* Reminders Scheduled */}
        <div
          onClick={() => setView('reminders')}
          className="glass-card glass-card-hover p-5 rounded-2xl cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-aura-cyan/10 border border-aura-cyan/30 flex items-center justify-center text-aura-cyan group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-aura-muted group-hover:text-aura-cyan transition-colors" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-bold text-white block">
            {metrics.remindersCount}
          </span>
          <span className="text-xs text-aura-muted font-medium">Active Reminders</span>
        </div>

        {/* Alarms Scheduled */}
        <div
          onClick={() => setView('reminders')}
          className="glass-card glass-card-hover p-5 rounded-2xl cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-aura-muted group-hover:text-amber-400 transition-colors" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-bold text-white block">
            {metrics.alarmsCount}
          </span>
          <span className="text-xs text-aura-muted font-medium">Configured Alarms</span>
        </div>
      </div>

      {/* Main Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Voice Launchpad Banner */}
        <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-3xl border border-aura-border relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aura-cyan/15 text-aura-cyan border border-aura-cyan/30 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Section 4 Compliant Interface</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
              Deterministic Voice Control Engine
            </h3>
            <p className="text-xs sm:text-sm text-aura-muted leading-relaxed max-w-xl">
              Operate notes, ordered points, music, reminders, and flashlight entirely through natural speech. AURA's local engine supports English, Telugu, and Hindi with zero cloud latency.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-aura-border mt-6">
            <button
              onClick={() => setView('ordered-points')}
              className="p-3 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border text-left transition-colors"
            >
              <ListOrdered className="w-4 h-4 text-aura-cyan mb-1.5" />
              <span className="text-xs font-semibold text-white block">Ordered Points</span>
              <span className="text-[10px] text-aura-darkMuted">Point 1, 2, 3...</span>
            </button>

            <button
              onClick={() => setView('music')}
              className="p-3 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border text-left transition-colors"
            >
              <Music className="w-4 h-4 text-aura-magenta mb-1.5" />
              <span className="text-xs font-semibold text-white block">Music Player</span>
              <span className="text-[10px] text-aura-darkMuted">Media Session</span>
            </button>

            <button
              onClick={() => setView('reminders')}
              className="p-3 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border text-left transition-colors"
            >
              <Clock className="w-4 h-4 text-aura-cyan mb-1.5" />
              <span className="text-xs font-semibold text-white block">Free-Time</span>
              <span className="text-[10px] text-aura-darkMuted">Time Windows</span>
            </button>

            <button
              onClick={() => setView('devices')}
              className="p-3 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border text-left transition-colors"
            >
              <Smartphone className="w-4 h-4 text-amber-400 mb-1.5" />
              <span className="text-xs font-semibold text-white block">Devices</span>
              <span className="text-[10px] text-aura-darkMuted">Web & PWA</span>
            </button>
          </div>
        </div>

        {/* Recent Voice Command Feed */}
        <div className="glass-card p-6 rounded-3xl border border-aura-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-aura-cyan" />
              <span>Voice Command Stream</span>
            </h3>
            <button
              onClick={() => setView('history')}
              className="text-[11px] text-aura-cyan hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentCommands.length === 0 ? (
              <div className="text-center py-8 text-xs text-aura-muted space-y-2">
                <Mic className="w-8 h-8 mx-auto text-aura-darkMuted" />
                <p>No voice commands logged yet.</p>
                <p className="text-[10px] text-aura-darkMuted">Say "Hey AURA" to activate.</p>
              </div>
            ) : (
              recentCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="p-3 rounded-xl bg-aura-surface/80 border border-aura-border text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[180px]">
                      "{cmd.raw_text}"
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-aura-cyan/15 text-aura-cyan uppercase">
                      {cmd.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-aura-muted truncate">{cmd.response_text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
