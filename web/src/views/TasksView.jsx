import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks();
      setTasks(res.tasks || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.createTask(title.trim());
    setTitle('');
    await fetchTasks();
  };

  const handleToggleTask = async (taskId) => {
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t));
    await api.toggleTask(taskId);
  };

  const handleDeleteTask = async (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    await api.deleteTask(taskId);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-aura-cyan flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Productivity & Execution</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
            Personal Tasks & Action Items
          </h1>
        </div>

        <div className="flex gap-1.5 bg-aura-surface border border-aura-border p-1 rounded-xl">
          {['all', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-aura-purple text-white shadow-sm shadow-aura-purple/30'
                  : 'text-aura-muted hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Task Creation Bar */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Add a new task (e.g. "Review API security guidelines")...'
          className="flex-1 bg-aura-surface border border-aura-border focus:border-aura-cyan rounded-xl py-2.5 px-4 text-xs sm:text-sm text-white placeholder-aura-darkMuted outline-none"
        />
        <button
          type="submit"
          className="btn-neon-purple py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </form>

      {/* Tasks List */}
      <div className="glass-card p-6 rounded-3xl border border-aura-border space-y-3">
        {loading ? (
          <div className="text-center py-8 text-xs text-aura-muted">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-aura-muted space-y-2">
            <CheckSquare className="w-10 h-10 mx-auto text-aura-darkMuted" />
            <p className="text-sm font-semibold text-white">No Tasks In This View</p>
            <p className="text-xs">Add a task above or say "Hey AURA, add task..."</p>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                t.is_completed
                  ? 'bg-aura-card/30 border-aura-border/40 opacity-70'
                  : 'bg-aura-surface border-aura-border hover:border-aura-cyan/40'
              }`}
            >
              <div
                onClick={() => handleToggleTask(t.id)}
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                {t.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-aura-success flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-aura-darkMuted hover:text-aura-cyan transition-colors flex-shrink-0" />
                )}
                <span
                  className={`text-sm font-medium transition-all ${
                    t.is_completed ? 'line-through text-aura-darkMuted' : 'text-white'
                  }`}
                >
                  {t.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-aura-darkMuted hidden sm:inline">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDeleteTask(t.id)}
                  className="p-1.5 rounded-lg text-aura-darkMuted hover:text-aura-danger hover:bg-aura-danger/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
