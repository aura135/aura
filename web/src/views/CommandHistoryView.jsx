import React, { useState, useEffect } from 'react';
import { History, Search, Mic, CheckCircle2, XCircle, Sparkles, Filter } from 'lucide-react';
import { api } from '../services/api';

export default function CommandHistoryView() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getCommandHistory();
      setHistory(res.history || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.raw_text.toLowerCase().includes(search.toLowerCase()) ||
      item.response_text.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || item.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = ['ALL', ...new Set(history.map(h => h.action))];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-aura-cyan flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Audit Trail & Execution Telemetry</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
            Voice Command History
          </h1>
        </div>

        <span className="text-xs text-aura-muted font-mono bg-aura-surface border border-aura-border px-3 py-1.5 rounded-xl">
          {history.length} commands logged
        </span>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-aura-darkMuted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search spoken queries..."
            className="w-full bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-aura-darkMuted outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {uniqueActions.slice(0, 6).map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                actionFilter === act
                  ? 'bg-aura-cyan text-aura-bg font-bold'
                  : 'bg-aura-card text-aura-muted hover:text-white'
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card rounded-2xl border border-aura-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-aura-muted">Loading telemetry logs...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-aura-muted space-y-2">
            <History className="w-10 h-10 mx-auto text-aura-darkMuted" />
            <p className="text-sm font-semibold text-white">No Command History Recorded</p>
            <p className="text-xs">Issue voice commands via the AI Assistant view to build your audit log.</p>
          </div>
        ) : (
          <div className="divide-y divide-aura-border/60">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-aura-card/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {item.success ? (
                      <CheckCircle2 className="w-4 h-4 text-aura-success flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-aura-danger flex-shrink-0" />
                    )}
                    <span className="font-semibold text-sm text-white">"{item.raw_text}"</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aura-cyan/15 text-aura-cyan uppercase">
                      {item.action}
                    </span>
                    <span className="text-[10px] font-mono text-aura-darkMuted uppercase">
                      [{item.language || 'en'}]
                    </span>
                  </div>
                  <p className="text-aura-muted pl-6">{item.response_text}</p>
                </div>

                <span className="text-[11px] font-mono text-aura-darkMuted flex-shrink-0 pl-6 sm:pl-0">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
