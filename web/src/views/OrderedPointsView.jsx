import React, { useState, useEffect } from 'react';
import { ListOrdered, Plus, Volume2, ArrowUp, ArrowDown, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { voiceEngine } from '../services/voiceEngine';

export default function OrderedPointsView() {
  const [activeNote, setActiveNote] = useState(null);
  const [points, setPoints] = useState([]);
  const [newPointText, setNewPointText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLatestPoints = async () => {
    try {
      setLoading(true);
      const res = await api.getNotes();
      if (res.notes && res.notes.length > 0) {
        const latest = res.notes[0];
        setActiveNote(latest);
        setPoints(latest.points || []);
      } else {
        setActiveNote(null);
        setPoints([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestPoints();
  }, []);

  const handleAddPoint = async (e) => {
    e.preventDefault();
    if (!newPointText.trim()) return;

    if (activeNote) {
      await api.addNotePoint(activeNote.id, newPointText.trim(), points.length + 1);
      await fetchLatestPoints();
    } else {
      // Create new note with this point
      await api.createNote('Ordered Points Vault', [newPointText.trim()], 'Voice Capture');
      await fetchLatestPoints();
    }
    setNewPointText('');
  };

  const handleRepeatPoints = () => {
    if (points.length === 0) {
      voiceEngine.speak("You have no saved points in your knowledge vault.");
      return;
    }

    const orderedText = points
      .map((p, idx) => `Point ${idx + 1}: ${p.point_text || p}`)
      .join('. ');

    const lang = voiceEngine.language;
    const header = lang === 'te' ? 'మీ భద్రపరిచిన పాయింట్లు:' : lang === 'hi' ? 'आपके सहेजे गए पॉइंट:' : 'Repeating your saved points:';
    voiceEngine.speak(`${header} ${orderedText}`);
  };

  const movePoint = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= points.length) return;
    const updated = [...points];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setPoints(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-aura-cyan flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MANDATORY ORDERED POINTS ENGINE</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
            Sequential Points & Readout
          </h1>
        </div>

        <button
          onClick={handleRepeatPoints}
          className="btn-neon-cyan py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-aura-cyan/20"
        >
          <Volume2 className="w-4 h-4" />
          <span>Repeat My Points Aloud</span>
        </button>
      </div>

      {/* Voice Prompt Help Box */}
      <div className="glass-card p-5 rounded-2xl border border-aura-cyan/30 bg-gradient-to-r from-aura-cyan/10 via-aura-surface to-aura-purple/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-sm font-semibold text-white flex items-center gap-2 justify-center sm:justify-start">
            <CheckCircle2 className="w-4 h-4 text-aura-cyan" />
            <span>Natural Spoken Points Capture</span>
          </p>
          <p className="text-xs text-aura-muted">
            Say: <span className="text-aura-cyan font-mono">"Hey AURA, note this: complete assignment, call team, and submit report"</span>
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-aura-card border border-aura-border text-[11px] font-mono text-aura-magenta">
          Voice Action: POINTS_REPEAT
        </div>
      </div>

      {/* Add Single Point Form */}
      <form onSubmit={handleAddPoint} className="flex gap-2">
        <input
          type="text"
          value={newPointText}
          onChange={(e) => setNewPointText(e.target.value)}
          placeholder="Append new ordered point (e.g. Verify unit test coverage)..."
          className="flex-1 bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2.5 px-4 text-xs sm:text-sm text-white placeholder-aura-darkMuted outline-none"
        />
        <button
          type="submit"
          className="btn-neon-cyan py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Point</span>
        </button>
      </form>

      {/* Points Ordered List */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border space-y-4">
        <div className="flex items-center justify-between border-b border-aura-border/60 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-aura-cyan" />
            <span>Active Ordered Sequence</span>
          </h3>
          <span className="text-xs text-aura-muted font-mono">{points.length} points active</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-aura-muted">Loading points sequence...</div>
        ) : points.length === 0 ? (
          <div className="text-center py-12 text-aura-muted space-y-2">
            <ListOrdered className="w-10 h-10 mx-auto text-aura-darkMuted" />
            <p className="text-sm font-semibold text-white">No Ordered Points in Vault</p>
            <p className="text-xs">Say "Hey AURA, note this: point 1, point 2..." or add one above.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {points.map((pt, idx) => (
              <div
                key={pt.id || idx}
                className="p-3.5 rounded-xl bg-aura-surface border border-aura-border hover:border-aura-cyan/40 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-aura-cyan/15 border border-aura-cyan/30 text-aura-cyan flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-white font-medium">{pt.point_text || pt}</span>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => movePoint(idx, -1)}
                    disabled={idx === 0}
                    title="Move Up"
                    className="p-1.5 rounded-lg text-aura-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-aura-card transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => movePoint(idx, 1)}
                    disabled={idx === points.length - 1}
                    title="Move Down"
                    className="p-1.5 rounded-lg text-aura-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-aura-card transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
