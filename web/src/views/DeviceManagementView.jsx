import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Globe2,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  Sparkles,
  Camera,
  Mic,
  Bell,
  Users,
  Battery,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function DeviceManagementView() {
  const [devices, setDevices] = useState([]);
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('web');
  const [loading, setLoading] = useState(true);

  // Diagnostics State
  const [diagnostics, setDiagnostics] = useState({
    mic: 'Checking...',
    torch: 'Checking...',
    contacts: 'Checking...',
    battery: 'Checking...',
    notifications: 'Checking...'
  });

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await api.getDevices();
      setDevices(res.devices || []);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    // 1. Microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setDiagnostics(d => ({ ...d, mic: 'Granted & Active' }));
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      setDiagnostics(d => ({ ...d, mic: 'Denied or Unavailable' }));
    }

    // 2. Torch / Camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      setDiagnostics(d => ({ ...d, torch: caps.torch ? 'Supported & Ready' : 'Camera Available (No Hardware Torch)' }));
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      setDiagnostics(d => ({ ...d, torch: 'Camera Blocked' }));
    }

    // 3. Contacts
    if ('contacts' in navigator && 'select' in navigator.contacts) {
      setDiagnostics(d => ({ ...d, contacts: 'Supported (Web Contact Picker API)' }));
    } else {
      setDiagnostics(d => ({ ...d, contacts: 'Unsupported in this browser (tel: fallback active)' }));
    }

    // 4. Battery
    if ('getBattery' in navigator) {
      try {
        const b = await navigator.getBattery();
        setDiagnostics(d => ({ ...d, battery: `${Math.round(b.level * 100)}% (${b.charging ? 'Charging' : 'Discharging'})` }));
      } catch (e) {
        setDiagnostics(d => ({ ...d, battery: 'Battery API restricted' }));
      }
    } else {
      setDiagnostics(d => ({ ...d, battery: 'Unsupported in this browser' }));
    }

    // 5. Notifications
    if ('Notification' in window) {
      setDiagnostics(d => ({ ...d, notifications: `Permission: ${Notification.permission}` }));
    } else {
      setDiagnostics(d => ({ ...d, notifications: 'Unsupported' }));
    }
  };

  useEffect(() => {
    fetchDevices();
    runDiagnostics();
  }, []);

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    if (!deviceName.trim()) return;
    await api.registerDevice(deviceName.trim(), deviceType);
    setDeviceName('');
    await fetchDevices();
  };

  const handleUnregister = async (id) => {
    await api.unregisterDevice(id);
    await fetchDevices();
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setDiagnostics(d => ({ ...d, notifications: `Permission: ${result}` }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-aura-cyan flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cross-Platform Ecosystem Mesh</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
            Device Management & Diagnostics
          </h1>
        </div>

        <button
          onClick={runDiagnostics}
          className="btn-neon-cyan py-2 px-4 rounded-xl text-xs font-bold"
        >
          Re-Run Hardware Probe
        </button>
      </div>

      {/* Hardware Sensors Diagnostics Cards */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-aura-border/60 pb-3">
          <ShieldCheck className="w-4 h-4 text-aura-cyan" />
          <span>Browser Hardware Sensor Status</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Mic */}
          <div className="p-3.5 rounded-xl bg-aura-surface border border-aura-border space-y-1">
            <div className="flex items-center gap-2 text-aura-cyan font-bold">
              <Mic className="w-4 h-4" />
              <span>Microphone Stream</span>
            </div>
            <p className="text-aura-muted">{diagnostics.mic}</p>
          </div>

          {/* Torch / Camera */}
          <div className="p-3.5 rounded-xl bg-aura-surface border border-aura-border space-y-1">
            <div className="flex items-center gap-2 text-aura-magenta font-bold">
              <Camera className="w-4 h-4" />
              <span>Flashlight / Camera</span>
            </div>
            <p className="text-aura-muted">{diagnostics.torch}</p>
          </div>

          {/* Contact Picker */}
          <div className="p-3.5 rounded-xl bg-aura-surface border border-aura-border space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Users className="w-4 h-4" />
              <span>Contact Picker API</span>
            </div>
            <p className="text-aura-muted truncate">{diagnostics.contacts}</p>
          </div>

          {/* Battery */}
          <div className="p-3.5 rounded-xl bg-aura-surface border border-aura-border space-y-1">
            <div className="flex items-center gap-2 text-aura-cyan font-bold">
              <Battery className="w-4 h-4" />
              <span>Device Battery</span>
            </div>
            <p className="text-aura-muted">{diagnostics.battery}</p>
          </div>

          {/* Push Notifications */}
          <div className="p-3.5 rounded-xl bg-aura-surface border border-aura-border space-y-1 sm:col-span-2 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-aura-success font-bold">
                <Bell className="w-4 h-4" />
                <span>Web Push Notifications</span>
              </div>
              <p className="text-aura-muted">{diagnostics.notifications}</p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="py-1.5 px-3 rounded-lg bg-aura-card hover:bg-aura-border/40 border border-aura-border text-[11px] font-semibold text-white transition-colors"
            >
              Request Permission
            </button>
          </div>
        </div>
      </div>

      {/* Register New Device */}
      <div className="glass-card p-6 rounded-2xl border border-aura-border space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-aura-cyan" />
          <span>Register New Device Endpoint</span>
        </h3>

        <form onSubmit={handleRegisterDevice} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Device Name (e.g. Work PC Chrome, Pixel 8 PWA)"
            className="flex-1 bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2 px-4 text-xs sm:text-sm text-white placeholder-aura-darkMuted outline-none"
          />
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2 px-4 text-xs sm:text-sm text-white outline-none cursor-pointer"
          >
            <option value="pwa">PWA (Progressive Web App)</option>
            <option value="web">Web Browser</option>
            <option value="android">Android Phone</option>
          </select>
          <button
            type="submit"
            className="btn-neon-cyan py-2 px-6 rounded-xl text-xs font-bold cursor-pointer"
          >
            Register
          </button>
        </form>
      </div>

      {/* Registered Devices List */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-aura-border/60 pb-3">
          <Smartphone className="w-4 h-4 text-aura-cyan" />
          <span>Active Device Inventory</span>
        </h3>

        {loading ? (
          <div className="text-center py-8 text-xs text-aura-muted">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="text-center py-10 text-aura-muted text-xs">
            No devices currently registered. Register this browser above.
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-aura-surface border border-aura-border flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-aura-card border border-aura-border flex items-center justify-center text-aura-cyan">
                    {d.device_type === 'android' ? <Smartphone className="w-5 h-5" /> : <Globe2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{d.device_name}</h4>
                    <p className="text-xs text-aura-muted uppercase font-mono tracking-wider">
                      Type: {d.device_type} &bull; Active: {new Date(d.last_active).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleUnregister(d.id)}
                  className="p-2 rounded-lg text-aura-darkMuted hover:text-aura-danger hover:bg-aura-danger/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
