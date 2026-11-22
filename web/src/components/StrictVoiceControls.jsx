import React, { useState } from 'react';
import { ShieldCheck, UserX, Trash2, Pause, Play, AlertTriangle } from 'lucide-react';
import { voiceEngine, VoiceState } from '../services/voiceEngine';

export default function StrictVoiceControls({ voiceState, isPaused, isEnrolled, onUpdate }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleAddVoice = () => {
    voiceEngine.addVoice();
    if (onUpdate) onUpdate();
  };

  const handleRemoveVoice = () => {
    voiceEngine.removeVoice();
    if (onUpdate) onUpdate();
  };

  const handleTogglePause = () => {
    voiceEngine.togglePauseVoice();
    if (onUpdate) onUpdate();
  };

  const handleDeleteConfirm = () => {
    voiceEngine.deleteVoice();
    setShowDeleteModal(false);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Strict 4 Voice Controls Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* 1. ADD VOICE */}
        <button
          onClick={handleAddVoice}
          disabled={isEnrolled && !isPaused}
          className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border ${
            !isEnrolled || isPaused
              ? 'btn-neon-cyan border-aura-cyan text-aura-bg cursor-pointer'
              : 'bg-aura-card/40 border-aura-border text-aura-darkMuted cursor-not-allowed opacity-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ADD VOICE</span>
        </button>

        {/* 2. REMOVE VOICE */}
        <button
          onClick={handleRemoveVoice}
          disabled={!isEnrolled}
          className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border ${
            isEnrolled
              ? 'bg-aura-surface hover:bg-aura-card border-aura-border hover:border-aura-cyan/40 text-aura-text cursor-pointer'
              : 'bg-aura-card/40 border-aura-border text-aura-darkMuted cursor-not-allowed opacity-50'
          }`}
        >
          <UserX className="w-4 h-4 text-aura-muted" />
          <span>REMOVE VOICE</span>
        </button>

        {/* 3. PAUSE VOICE / RESUME VOICE */}
        <button
          onClick={handleTogglePause}
          disabled={!isEnrolled}
          className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border ${
            isPaused
              ? 'btn-neon-cyan border-aura-cyan text-aura-bg cursor-pointer'
              : 'bg-aura-surface hover:bg-aura-card border-aura-border hover:border-aura-cyan/40 text-aura-text cursor-pointer'
          }`}
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>RESUME VOICE</span>
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              <span>PAUSE VOICE</span>
            </>
          )}
        </button>

        {/* 4. DELETE VOICE */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border btn-neon-danger border-aura-danger cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>DELETE VOICE</span>
        </button>
      </div>

      {/* Confirmation Modal for DELETE VOICE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-aura-surface border border-aura-danger/40 rounded-2xl p-6 shadow-2xl shadow-aura-danger/20 space-y-4">
            <div className="flex items-center gap-3 text-aura-danger">
              <div className="p-2.5 bg-aura-danger/10 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Saved Voice Profile?</h3>
            </div>
            <p className="text-sm text-aura-muted leading-relaxed">
              This action will permanently delete your enrolled voice profile, speech sensitivity thresholds, and listening preferences from this device and the cloud.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-aura-border bg-aura-card hover:bg-aura-border/40 text-sm font-medium text-aura-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-aura-danger hover:bg-red-600 text-sm font-semibold text-white shadow-lg shadow-aura-danger/30 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
