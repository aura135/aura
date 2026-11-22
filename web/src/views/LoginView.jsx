import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function LoginView({ setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.login(email, password);
      setView('dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('commander@aura.ai');
    setPassword('aura2026pass');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-aura-border shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-aura-cyan/15 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-aura-cyan to-aura-purple mx-auto flex items-center justify-center shadow-lg shadow-aura-cyan/25 mb-4">
            <Lock className="w-6 h-6 text-aura-bg" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">Sign In to AURA</h2>
          <p className="text-xs text-aura-muted mt-1">Access your connected assistant ecosystem</p>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-aura-darkMuted outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-neon-cyan py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-transform cursor-pointer mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={fillDemoAccount}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-aura-cyan bg-aura-cyan/10 hover:bg-aura-cyan/20 border border-aura-cyan/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use Demo Account Credentials</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-aura-muted">
          Don't have an account?{' '}
          <button
            onClick={() => setView('register')}
            className="text-aura-cyan hover:underline font-semibold"
          >
            Register Now
          </button>
        </div>
      </div>
    </div>
  );
}
