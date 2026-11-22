import React from 'react';
import { ShieldAlert, X, Check, AlertCircle, Info, ExternalLink } from 'lucide-react';

export default function BrowserPermissionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const compatibilityList = [
    {
      feature: 'Hands-Free Wake Word ("Hey AURA")',
      android: 'Runs in background Foreground Service with microphone type.',
      pwa: 'Supported while web app is open in tab/PWA window. Browsers block microphone when tab is closed.',
      alternative: 'Keep AURA active or pinned in background tab; Screen Wake Lock keeps session alive.',
      status: 'partial'
    },
    {
      feature: 'Direct Phone Calling',
      android: 'ACTION_CALL connects calls silently without dialer prompt.',
      pwa: 'Browser sandbox strictly forbids silent dialing for user security.',
      alternative: 'Launches native phone dialer with number pre-filled via standard tel: URI scheme.',
      status: 'alternative'
    },
    {
      feature: 'Contact Address Book',
      android: 'Direct bulk query to ContactsContract.CommonDataKinds.Phone.',
      pwa: 'Browsers block silent background address book reading.',
      alternative: 'Web Contact Picker API (navigator.contacts.select()) with explicit user selection.',
      status: 'alternative'
    },
    {
      feature: 'Hardware Flashlight / Torch',
      android: 'CameraManager.setTorchMode() without camera preview.',
      pwa: 'Requires user camera permission for rear camera.',
      alternative: 'MediaStreamTrack ImageCapture torch constraint on supported mobile Chrome browsers.',
      status: 'alternative'
    },
    {
      feature: 'System Volume & Brightness',
      android: 'Alters Android OS system-wide master volume and Settings.System brightness.',
      pwa: 'Browser sandbox cannot alter Android OS master sliders.',
      alternative: 'In-app audio gain control, UI screen brightness simulation filter, and Screen Wake Lock API.',
      status: 'alternative'
    },
    {
      feature: '3rd-Party Media Control (Spotify, YouTube Music)',
      android: 'Dispatches raw key events (KEYCODE_MEDIA_PLAY) to OS media bus.',
      pwa: 'Browsers cannot dispatch arbitrary key events to external Android apps.',
      alternative: 'Built-in AURA audio player with Web Media Session API (navigator.mediaSession).',
      status: 'alternative'
    },
    {
      feature: 'Launching Installed Apps by Package Name',
      android: 'PackageManager launch intent (e.g. com.whatsapp).',
      pwa: 'Cannot inspect arbitrary installed APK packages.',
      alternative: 'Web URL schemes and deep-links (e.g. https://web.whatsapp.com, https://youtube.com).',
      status: 'alternative'
    },
    {
      feature: 'Alarms Overriding Doze Mode',
      android: 'AlarmManager.setExactAndAllowWhileIdle() wakes CPU from deep sleep.',
      pwa: 'Blocked when mobile OS enters deep Doze battery mode.',
      alternative: 'Web Push Notifications + Service Worker + in-app audio chime.',
      status: 'alternative'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-aura-surface border border-aura-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-aura-border flex items-center justify-between bg-aura-card/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-aura-cyan/10 border border-aura-cyan/30 rounded-xl text-aura-cyan">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>PWA & Browser Hardware Compatibility Matrix</span>
              </h2>
              <p className="text-xs text-aura-muted">
                Transparent technical audit: Native Android vs. Progressive Web App capabilities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-aura-muted hover:text-white hover:bg-aura-border/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-4 rounded-xl bg-aura-card/60 border border-aura-cyan/20 text-xs text-aura-muted flex items-start gap-3">
            <Info className="w-5 h-5 text-aura-cyan flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              In accordance with your requirements, AURA does not require APK installation. All core voice, notes, ordered points, tasks, reminders, and synchronization features work directly in Chrome. Features restricted by browser security policies provide compliant, standard web alternatives.
            </p>
          </div>

          <div className="space-y-3">
            {compatibilityList.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-aura-card/40 border border-aura-border hover:border-aura-cyan/30 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{item.feature}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-aura-cyan/15 text-aura-cyan border border-aura-cyan/30">
                    Web Alternative Available
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-aura-surface/80 border border-aura-border/60">
                    <span className="text-[10px] uppercase font-bold text-aura-darkMuted block mb-1">Native Android Privilege:</span>
                    <span className="text-aura-muted">{item.android}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-aura-surface/80 border border-aura-cyan/30">
                    <span className="text-[10px] uppercase font-bold text-aura-cyan block mb-1">Browser-Compatible Solution:</span>
                    <span className="text-aura-text">{item.alternative}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-aura-border bg-aura-card/30 flex justify-end">
          <button
            onClick={onClose}
            className="btn-neon-cyan py-2 px-6 rounded-xl text-xs font-bold"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
