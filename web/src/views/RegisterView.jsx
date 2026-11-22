import React, { useState } from 'react';
import { User, Mail, Lock, Globe2, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function RegisterView({ setView }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.register(email, password, fullName, preferredLanguage);
      setView('dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-aura-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-aura-purple/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-aura-purple to-aura-magenta mx-auto flex items-center justify-center shadow-lg shadow-aura-purple/25 mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">Create AURA Account</h2>
          <p className="text-xs text-aura-muted mt-1">One account across Web, PWA, and Android</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-aura-danger/10 border border-aura-danger/30 text-xs text-aura-danger flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-aura-muted uppercase tracking-wider block mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-aura-darkMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Commander Name"
                className="w-full bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-aura-darkMuted outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-aura-muted uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-aura-darkMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="commander@aura.ai"
                className="w-full bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-aura-darkMuted outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-aura-muted uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-aura-darkMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-aura-darkMuted outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-aura-muted uppercase tracking-wider block mb-1.5">
              Primary Language
            </label>
            <div className="relative">
              <Globe2 className="w-4 h-4 text-aura-darkMuted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none appearance-none cursor-pointer"
              >
                <option value="en">English (US)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-neon-purple py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-transform cursor-pointer mt-2"
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-aura-muted">
          Already have an account?{' '}
          <button
            onClick={() => setView('login')}
            className="text-aura-cyan hover:underline font-semibold"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
