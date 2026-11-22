import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PWAInstallBanner from './components/PWAInstallBanner';
import BrowserPermissionModal from './components/BrowserPermissionModal';
import LandingView from './views/LandingView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import DashboardView from './views/DashboardView';
import VoiceAssistantView from './views/VoiceAssistantView';
import NotesView from './views/NotesView';
import OrderedPointsView from './views/OrderedPointsView';
import TasksView from './views/TasksView';
import RemindersView from './views/RemindersView';
import CommandHistoryView from './views/CommandHistoryView';
import MusicDashboardView from './views/MusicDashboardView';
import DeviceManagementView from './views/DeviceManagementView';
import SettingsView from './views/SettingsView';
import UserProfileView from './views/UserProfileView';
import { api } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam) return viewParam;
    return api.isAuthenticated() ? 'dashboard' : 'landing';
  });

  const [darkMode, setDarkMode] = useState(true);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSetView = (view) => {
    setCurrentView(view);
    const url = new URL(window.location);
    url.searchParams.set('view', view);
    window.history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingView setView={handleSetView} />;
      case 'login':
        return <LoginView setView={handleSetView} />;
      case 'register':
        return <RegisterView setView={handleSetView} />;
      case 'dashboard':
        return <DashboardView setView={handleSetView} />;
      case 'assistant':
        return <VoiceAssistantView />;
      case 'notes':
        return <NotesView setView={handleSetView} />;
      case 'ordered-points':
        return <OrderedPointsView />;
      case 'tasks':
        return <TasksView />;
      case 'reminders':
        return <RemindersView />;
      case 'history':
        return <CommandHistoryView />;
      case 'music':
        return <MusicDashboardView />;
      case 'devices':
        return <DeviceManagementView />;
      case 'settings':
        return <SettingsView darkMode={darkMode} setDarkMode={setDarkMode} />;
      case 'profile':
        return <UserProfileView setView={handleSetView} />;
      default:
        return <DashboardView setView={handleSetView} />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-aura-bg text-aura-text' : 'light bg-slate-50 text-slate-900'} flex flex-col`}>
      {/* PWA Install Banner (Guides User to Install from Browser) */}
      <PWAInstallBanner />

      {/* Main Responsive Header Navigation */}
      <Navbar
        currentView={currentView}
        setView={handleSetView}
        onOpenPermissions={() => setPermissionsModalOpen(true)}
        isOnline={isOnline}
      />

      {/* Primary Dynamic View Content */}
      <main className="flex-1 w-full pb-16">
        {renderView()}
      </main>

      {/* Hardware & Browser Compatibility Modal */}
      <BrowserPermissionModal
        isOpen={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
      />

      {/* Modern Cyberpunk Status Footer */}
      <footer className="w-full border-t border-aura-border/60 bg-aura-surface/40 py-6 text-center text-xs text-aura-darkMuted font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AURA Autonomous AI Assistant &bull; Production Ecosystem</span>
          <span>Web &bull; PWA &bull; Shared Backend &bull; Room & PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}
