import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Volume2, Search, Tag, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { voiceEngine } from '../services/voiceEngine';

export default function NotesView({ setView }) {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [pointsInput, setPointsInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.getNotes();
      setNotes(res.notes || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Split points by comma or newline
    const rawPoints = pointsInput
      .split(/[\n,;]/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    await api.createNote(newTitle.trim(), rawPoints, newCategory);
    setNewTitle('');
    setPointsInput('');
    await fetchNotes();
  };

  const handleDeleteNote = async (id) => {
    await api.deleteNote(id);
    await fetchNotes();
  };

  const handleReadAloud = (note) => {
    const pointsText = (note.points || [])
      .map((p, idx) => `Point ${idx + 1}: ${p.point_text || p}`)
      .join('. ');
    const textToSpeak = `Note titled ${note.title}. ${pointsText || 'No points recorded.'}`;
    voiceEngine.speak(textToSpeak);
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.points || []).some(p => (p.point_text || p).toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-aura-cyan flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Persistent Knowledge Vault</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
            Notes & Captured Points
          </h1>
        </div>

        <button
          onClick={() => setView('ordered-points')}
          className="btn-neon-purple py-2 px-4 rounded-xl text-xs font-bold"
        >
          Manage Ordered Points Mode
        </button>
      </div>

      {/* Note Creation Card */}
      <div className="glass-card p-6 rounded-2xl border border-aura-border space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-aura-cyan" />
          <span>Create Note with Ordered Points</span>
        </h3>

        <form onSubmit={handleCreateNote} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title (e.g. Project Sprint Plan)"
              className="sm:col-span-2 bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2 px-3 text-xs sm:text-sm text-white placeholder-aura-darkMuted outline-none"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2 px-3 text-xs sm:text-sm text-white outline-none cursor-pointer"
            >
              <option value="General">General</option>
              <option value="Work">Work</option>
              <option value="Study">Study</option>
              <option value="Personal">Personal</option>
              <option value="Voice Capture">Voice Capture</option>
            </select>
          </div>

          <div>
            <textarea
              rows={2}
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              placeholder="Enter ordered points separated by commas or lines (e.g. 1. Draft architecture, 2. Deploy backend, 3. Complete tests)"
              className="w-full bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2 px-3 text-xs sm:text-sm text-white placeholder-aura-darkMuted outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-neon-cyan py-2 px-5 rounded-xl text-xs font-bold cursor-pointer"
            >
              Save Note & Points
            </button>
          </div>
        </form>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-aura-darkMuted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes and points..."
            className="w-full bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-aura-darkMuted outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'General', 'Work', 'Study', 'Personal', 'Voice Capture'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-aura-cyan text-aura-bg font-bold'
                  : 'bg-aura-card text-aura-muted hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-aura-muted">Loading vault records...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-aura-border text-aura-muted space-y-2">
          <FileText className="w-10 h-10 mx-auto text-aura-darkMuted" />
          <p className="text-sm font-semibold text-white">No Notes Found</p>
          <p className="text-xs">Create your first note above, or say "Hey AURA, note this..."</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="glass-card glass-card-hover p-5 rounded-2xl border border-aura-border flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-base font-bold text-white font-display line-clamp-1">
                    {note.title}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aura-cyan/15 text-aura-cyan border border-aura-cyan/30 flex-shrink-0">
                    {note.category}
                  </span>
                </div>

                {/* Ordered Points List */}
                <div className="space-y-1.5 mt-3">
                  {(note.points || []).length > 0 ? (
                    note.points.map((pt, pIdx) => (
                      <div
                        key={pt.id || pIdx}
                        className="flex items-start gap-2 p-2 rounded-lg bg-aura-surface/80 border border-aura-border/60 text-xs"
                      >
                        <span className="text-aura-cyan font-mono font-bold text-[11px] flex-shrink-0">
                          {pIdx + 1}.
                        </span>
                        <span className="text-aura-text leading-tight">{pt.point_text || pt}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-aura-darkMuted italic">No ordered points.</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-aura-border/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-aura-darkMuted font-mono">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleReadAloud(note)}
                    title="Read points aloud"
                    className="p-1.5 rounded-lg text-aura-cyan hover:bg-aura-cyan/10 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    title="Delete note"
                    className="p-1.5 rounded-lg text-aura-darkMuted hover:text-aura-danger hover:bg-aura-danger/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
