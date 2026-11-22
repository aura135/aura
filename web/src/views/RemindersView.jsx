import React, { useState, useEffect } from 'react';
import { Bell, Plus, Clock, Trash2, CheckCircle2, Circle, Sparkles, Volume2 } from 'lucide-react';
import { api } from '../services/api';

export default function RemindersView() {
  const [reminders, setReminders] = useState([]);
  const [title, setTitle] = useState('');
  const [isFreeTime, setIsFreeTime] = useState(false);
  const [freeTimeStart, setFreeTimeStart] = useState('6 PM');
  const [freeTimeEnd, setFreeTimeEnd] = useState('8 PM');
  const [targetTime, setTargetTime] = useState('18:00');
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await api.getReminders();
      setReminders(res.reminders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const [hours, minutes] = targetTime.split(':').map(Number);
    const d = new Date();
    d.setHours(hours || 18, minutes || 0, 0, 0);
    if (d.getTime() <= Date.now()) {
      d.setDate(d.getDate() + 1);
    }

    await api.createReminder(
      title.trim(),
      d.getTime(),
      isFreeTime,
      isFreeTime ? freeTimeStart : '',
      isFreeTime ? freeTimeEnd : ''
    );

    playChime();
    setTitle('');
    await fetchReminders();
  };

  const handleToggle = async (id) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, is_completed: !r.is_completed } : r));
    await api.toggleReminder(id);
  };

  const handleDelete = async (id) => {
    setReminders(reminders.filter(r => r.id !== id));
    await api.deleteReminder(id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-aura-cyan flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Time-Sensitive & Context-Aware Scheduling</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
            Reminders & Free-Time Windows
          </h1>
        </div>

        <button
          onClick={playChime}
          className="flex items-center gap-2 py-2 px-3 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border text-xs font-semibold text-aura-cyan transition-colors"
        >
          <Volume2 className="w-4 h-4" />
          <span>Test Notification Chime</span>
        </button>
      </div>

      {/* Creation Card */}
      <div className="glass-card p-6 rounded-2xl border border-aura-border space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-aura-cyan" />
          <span>Schedule Reminder</span>
        </h3>

        <form onSubmit={handleAddReminder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reminder subject (e.g. Review budget with team)"
              className="sm:col-span-2 bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2 px-3 text-xs sm:text-sm text-white placeholder-aura-darkMuted outline-none"
            />
            <input
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2 px-3 text-xs sm:text-sm text-white outline-none cursor-pointer"
            />
          </div>

          {/* Free-Time Window Toggle */}
          <div className="p-3.5 rounded-xl bg-aura-surface/60 border border-aura-border space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFreeTime}
                onChange={(e) => setIsFreeTime(e.target.checked)}
                className="w-4 h-4 rounded text-aura-cyan focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Free-Time Window Scheduling
                </span>
                <span className="text-[11px] text-aura-muted">
                  Remind during an available interval rather than an exact minute (e.g. between 6 PM and 8 PM)
                </span>
              </div>
            </label>

            {isFreeTime && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[10px] text-aura-darkMuted uppercase font-bold block mb-1">Window Start</span>
                  <input
                    type="text"
                    value={freeTimeStart}
                    onChange={(e) => setFreeTimeStart(e.target.value)}
                    placeholder="6 PM"
                    className="w-full bg-aura-card border border-aura-border rounded-lg py-1.5 px-3 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-aura-darkMuted uppercase font-bold block mb-1">Window End</span>
                  <input
                    type="text"
                    value={freeTimeEnd}
                    onChange={(e) => setFreeTimeEnd(e.target.value)}
                    placeholder="8 PM"
                    className="w-full bg-aura-card border border-aura-border rounded-lg py-1.5 px-3 text-xs text-white outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-neon-cyan py-2 px-6 rounded-xl text-xs font-bold cursor-pointer"
            >
              Set Reminder
            </button>
          </div>
        </form>
      </div>

      {/* Reminders List */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border space-y-3">
        {loading ? (
          <div className="text-center py-8 text-xs text-aura-muted">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12 text-aura-muted space-y-2">
            <Bell className="w-10 h-10 mx-auto text-aura-darkMuted" />
            <p className="text-sm font-semibold text-white">No Active Reminders</p>
            <p className="text-xs">Schedule one above or say "Hey AURA, remind me..."</p>
          </div>
        ) : (
          reminders.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-aura-surface border border-aura-border hover:border-aura-cyan/40 transition-all flex items-center justify-between gap-4"
            >
              <div
                onClick={() => handleToggle(r.id)}
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                {r.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-aura-success flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-aura-darkMuted hover:text-aura-cyan transition-colors flex-shrink-0" />
                )}
                <div>
                  <span className={`text-sm font-medium ${r.is_completed ? 'line-through text-aura-darkMuted' : 'text-white'}`}>
                    {r.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {r.is_free_time ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aura-purple/20 text-aura-magenta border border-aura-purple/30">
                        Free Time ({r.free_time_start} - {r.free_time_end})
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-aura-cyan flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(Number(r.reminder_time)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(r.id)}
                className="p-1.5 rounded-lg text-aura-darkMuted hover:text-aura-danger hover:bg-aura-danger/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
