import React, { useState } from 'react';
import {
  Mic,
  LayoutDashboard,
  FileText,
  ListOrdered,
  CheckSquare,
  Bell,
  Music,
  Smartphone,
  Settings,
  User,
  ShieldAlert,
  Download,
  Wifi,
  WifiOff,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ currentView, setView, onOpenPermissions, isOnline = true }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = api.isAuthenticated();
  const user = api.user;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant', label: 'AI Voice', icon: Mic, highlight: true },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'ordered-points', label: 'Ordered Points', icon: ListOrdered },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'history', label: 'History', icon: FileText, hidden: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (viewId) => {
    setView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-aura-bg/85 backdrop-blur-xl border-b border-aura-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick(isAuthenticated ? 'dashboard' : 'landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-aura-cyan via-aura-purple to-aura-magenta p-0.5 shadow-lg shadow-aura-cyan/20 group-hover:shadow-aura-cyan/40 transition-shadow">
            <div className="w-full h-full bg-aura-bg rounded-[10px] flex items-center justify-center">
              <span className="font-display font-black text-sm tracking-tighter bg-gradient-to-r from-aura-cyan to-aura-magenta bg-clip-text text-transparent">
                AU
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-lg tracking-wider text-white group-hover:text-aura-cyan transition-colors">
              AURA
            </span>
            <span className="text-[9px] tracking-widest text-aura-cyan font-mono uppercase -mt-1">
              AI Assistant
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.filter(item => !item.hidden).map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-aura-cyan/15 text-aura-cyan border border-aura-cyan/30 shadow-sm shadow-aura-cyan/20'
                    : item.highlight
                    ? 'text-aura-cyan hover:bg-aura-card/60'
                    : 'text-aura-muted hover:text-white hover:bg-aura-card/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-aura-cyan' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Online/Offline Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-aura-card border border-aura-border text-[11px] font-mono">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-aura-success animate-pulse" />
                <span className="text-aura-muted">CLOUD SYNC</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-aura-warning" />
                <span className="text-aura-warning">OFFLINE MODE</span>
              </>
            )}
          </div>

          {/* Browser Hardware Compatibility Pill */}
          <button
            onClick={onOpenPermissions}
            title="Browser & Hardware Compatibility Matrix"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-aura-surface hover:bg-aura-card border border-aura-border text-xs text-aura-muted hover:text-aura-cyan transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-aura-cyan" />
            <span className="hidden md:inline">Hardware Matrix</span>
          </button>

          {/* User Account / Login */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-aura-surface hover:bg-aura-card border border-aura-border transition-colors text-xs text-white"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-aura-purple to-aura-cyan flex items-center justify-center text-[10px] font-bold text-white">
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline font-medium">{user?.full_name?.split(' ')[0] || 'User'}</span>
              </button>

              <button
                onClick={() => {
                  api.logout();
                  handleNavClick('landing');
                }}
                title="Log out"
                className="p-1.5 rounded-lg text-aura-darkMuted hover:text-aura-danger hover:bg-aura-danger/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavClick('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-aura-text hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavClick('register')}
                className="btn-neon-cyan px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-aura-muted hover:text-white hover:bg-aura-card transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-aura-surface border-b border-aura-border px-4 py-4 space-y-2 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    active
                      ? 'bg-aura-cyan/15 text-aura-cyan border border-aura-cyan/30'
                      : 'bg-aura-card/40 text-aura-muted hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
