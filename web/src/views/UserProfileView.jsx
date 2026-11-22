import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, Database, Download, LogOut, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function UserProfileView({ setView }) {
  const [profile, setProfile] = useState(api.user || { full_name: 'Commander', email: 'user@aura.ai', preferred_language: 'en' });
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [language, setLanguage] = useState(profile.preferred_language || 'en');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProfile().then(res => {
      if (res.user) {
        setProfile(res.user);
        setFullName(res.user.full_name || '');
        setLanguage(res.user.preferred_language || 'en');
      }
    }).catch(() => {});
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateProfile(fullName, language);
      if (res.user) setProfile(res.user);
      setStatusMsg('Profile successfully updated.');
      setTimeout(() => setStatusMsg(''), 2500);
    } catch (e) {
      setStatusMsg('Error updating profile: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const [notes, tasks, reminders, alarms] = await Promise.all([
        api.getNotes(),
        api.getTasks(),
        api.getReminders(),
        api.getAlarms()
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        user: profile,
        notes: notes.notes || [],
        tasks: tasks.tasks || [],
        reminders: reminders.reminders || [],
        alarms: alarms.alarms || []
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AURA_data_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not export data: ' + e.message);
    }
  };

  const handleLogout = () => {
    api.logout();
    setView('landing');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-aura-cyan flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Identity & Data Governance</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
          User Account & Security
        </h1>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-aura-cyan/15 border border-aura-cyan/30 text-xs text-aura-cyan flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-aura-border relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-aura-cyan via-aura-purple to-aura-magenta flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-aura-cyan/25 flex-shrink-0">
            {profile.full_name ? profile.full_name[0].toUpperCase() : 'U'}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-2xl font-bold font-display text-white">{profile.full_name || 'Commander'}</h2>
            <p className="text-xs text-aura-muted font-mono">{profile.email}</p>
            <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-aura-success/15 text-aura-success border border-aura-success/30">
                Authenticated
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-aura-cyan/15 text-aura-cyan border border-aura-cyan/30">
                PWA + Web Synced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-aura-border/60 pb-3">
          <User className="w-4 h-4 text-aura-cyan" />
          <span>Update Account Information</span>
        </h3>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-aura-muted uppercase tracking-wider block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2.5 px-4 text-xs sm:text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-aura-muted uppercase tracking-wider block mb-1.5">
                Preferred Interface Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2.5 px-4 text-xs sm:text-sm text-white outline-none cursor-pointer"
              >
                <option value="en">English (US)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-neon-cyan py-2 px-6 rounded-xl text-xs font-bold"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Data Export & Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-6 rounded-2xl border border-aura-border space-y-3">
          <div className="flex items-center gap-2 text-aura-cyan font-bold text-sm">
            <Download className="w-4 h-4" />
            <span>Export Personal Knowledge Vault</span>
          </div>
          <p className="text-xs text-aura-muted leading-relaxed">
            Download a portable, complete JSON backup containing all your notes, ordered points, tasks, and scheduled reminders.
          </p>
          <button
            onClick={handleExportData}
            className="w-full py-2.5 px-4 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border text-xs font-semibold text-white transition-colors"
          >
            Download JSON Data Export
          </button>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-aura-border space-y-3">
          <div className="flex items-center gap-2 text-aura-danger font-bold text-sm">
            <LogOut className="w-4 h-4" />
            <span>Session Termination</span>
          </div>
          <p className="text-xs text-aura-muted leading-relaxed">
            Safely disconnect your session and purge authentication tokens from this local browser cache.
          </p>
          <button
            onClick={handleLogout}
            className="w-full btn-neon-danger py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition-transform"
          >
            Sign Out of AURA
          </button>
        </div>
      </div>
    </div>
  );
}
