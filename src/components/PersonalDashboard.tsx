import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ItemFormModal } from './ItemFormModal';
import { ItemContextMenu } from './ItemContextMenu';
import { SmartCaptureModal } from './SmartCaptureModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, ArrowLeft, Flame, BookOpen, Heart, Compass, 
  Trophy, Quote as QuoteIcon, CheckCircle2, ChevronRight, Clock, Sparkles, Bookmark
} from 'lucide-react';
import { fetchDailyQuote } from '../lib/inspiration';
import type { DailyQuote } from '../lib/inspiration';

type PanelType = 'dashboard' | 'tasks' | 'reminders' | 'ideas' | 'quotes' | 'goals' | 'musings' | 'media' | 'hobbies';

export const PersonalDashboard: React.FC = () => {
  const {
    loadPersonalData,
    personalTasks,
    personalReminders,
    ideas,
    quotes,
    goalsPlans,
    musings,
    media,
    hobbies,
    profile,
    saveItem
  } = useApp();

  const [activePanel, setActivePanel] = useState<PanelType>('dashboard');
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);

  // Fetch daily quote on mount
  useEffect(() => {
    fetchDailyQuote()
      .then(setDailyQuote)
      .catch((err) => console.error("Failed to fetch daily quote:", err));
  }, []);

  const handleSaveDailyQuote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dailyQuote) return;
    await saveItem('quotes', {
      quote: dailyQuote.quote,
      author: dailyQuote.author,
      category: 'Inspiration',
      favourite: false,
      tags: ['inspiration']
    });
  };
  
  // Modal Edit/Create states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCategory, setFormCategory] = useState('personal_tasks');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSmartCaptureOpen, setIsSmartCaptureOpen] = useState(false);

  // FAB Menu state (when in dashboard mode)
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const longPressTimeout = useRef<number | null>(null);
  const isLongPressActive = useRef(false);

  const startPress = () => {
    isLongPressActive.current = false;
    if (longPressTimeout.current) {
      window.clearTimeout(longPressTimeout.current);
    }
    longPressTimeout.current = window.setTimeout(() => {
      isLongPressActive.current = true;
      setIsFabMenuOpen((prev) => !prev);
    }, 500);
  };

  const endPress = () => {
    if (longPressTimeout.current) {
      window.clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    if (!isLongPressActive.current) {
      if (activePanel === 'dashboard') {
        setIsSmartCaptureOpen(true);
      } else {
        openCreateForm(getCategoryFromPanel(activePanel));
      }
    }
    isLongPressActive.current = false;
  };

  const cancelPress = () => {
    if (longPressTimeout.current) {
      window.clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    isLongPressActive.current = false;
  };

  // Load personal data on mount
  useEffect(() => {
    loadPersonalData();
  }, []);

  // Keyboard shortcut listener: 'N' for New item, 'Escape' to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return; // Don't trigger if the user is typing in a form field
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (activePanel === 'dashboard') {
          setIsFabMenuOpen((prev) => !prev);
        } else {
          // Open creation form directly for the active category
          openCreateForm(getCategoryFromPanel(activePanel));
        }
      } else if (e.key === 'Escape') {
        setIsFormOpen(false);
        setIsFabMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel]);

  const getCategoryFromPanel = (panel: PanelType): string => {
    switch (panel) {
      case 'tasks': return 'personal_tasks';
      case 'reminders': return 'personal_reminders';
      case 'ideas': return 'ideas';
      case 'quotes': return 'quotes';
      case 'goals': return 'goals_plans';
      case 'musings': return 'musings';
      case 'media': return 'media';
      case 'hobbies': return 'hobbies';
      default: return 'personal_tasks';
    }
  };

  const openCreateForm = (category: string) => {
    setFormCategory(category);
    setEditingItem(null);
    setIsFormOpen(true);
    setIsFabMenuOpen(false);
  };

  const openEditForm = (category: string, item: any) => {
    setFormCategory(category);
    setEditingItem(item);
    setIsFormOpen(true);
  };

  // ============================================================================
  // Hobby Heatmap Calculations
  // ============================================================================
  const getHobbyStats = () => {
    if (hobbies.length === 0) return { streak: 0, totalMinutes: 0, calendarGrid: [] };

    // Group logs by YYYY-MM-DD
    const logsByDate: { [date: string]: number } = {};
    let totalMinutes = 0;

    hobbies.forEach((log) => {
      totalMinutes += log.duration;
      const dateStr = new Date(log.created_at).toISOString().split('T')[0];
      logsByDate[dateStr] = (logsByDate[dateStr] || 0) + 1;
    });

    // Compute Streak (consecutive days of practice)
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If no log today and no log yesterday, streak is broken
    if (!logsByDate[todayStr] && !logsByDate[yesterdayStr]) {
      streak = 0;
    } else {
      // Start checking from the most recent logged date
      let currentCheck = logsByDate[todayStr] ? new Date() : yesterday;
      while (true) {
        const curStr = currentCheck.toISOString().split('T')[0];
        if (logsByDate[curStr]) {
          streak++;
          currentCheck.setDate(currentCheck.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Build Heatmap Grid (last 20 weeks / 140 days)
    const calendarGrid = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 139); // Go back 140 days

    for (let i = 0; i < 140; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = logsByDate[dateStr] || 0;

      calendarGrid.push({
        date: dateStr,
        count,
        dayOfWeek: currentDate.getDay()
      });
    }

    return { streak, totalMinutes, calendarGrid };
  };

  const { streak, totalMinutes, calendarGrid } = getHobbyStats();

  return (
    <div className="p-6 md:p-12 space-y-12 max-w-7xl mx-auto pb-32">
      {/* 1. Header Greeting Section */}
      <div className="space-y-4">
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-mono uppercase tracking-widest text-accent-personal"
        >
          PERSONAL DOMAIN
        </motion.p>
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl md:text-5xl font-light tracking-tight text-ink-primary"
          >
            Welcome, <span className="font-normal text-accent-personal">{profile?.display_name || 'Julian'}</span>.
          </motion.h1>
          
          {/* Sub-header navigation tabs */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono tracking-wider uppercase text-ink-muted">
            <button 
              onClick={() => setActivePanel('dashboard')} 
              className={`hover:text-ink-primary transition-colors ${activePanel === 'dashboard' ? 'text-accent-personal border-b border-accent-personal pb-1 font-bold' : ''}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActivePanel('tasks')} 
              className={`hover:text-ink-primary transition-colors ${activePanel === 'tasks' ? 'text-accent-personal border-b border-accent-personal pb-1 font-bold' : ''}`}
            >
              Tasks & Reminders
            </button>
            <button 
              onClick={() => setActivePanel('goals')} 
              className={`hover:text-ink-primary transition-colors ${activePanel === 'goals' ? 'text-accent-personal border-b border-accent-personal pb-1 font-bold' : ''}`}
            >
              Goals
            </button>
            <button 
              onClick={() => setActivePanel('ideas')} 
              className={`hover:text-ink-primary transition-colors ${activePanel === 'ideas' ? 'text-accent-personal border-b border-accent-personal pb-1 font-bold' : ''}`}
            >
              Ideas
            </button>
            <button 
              onClick={() => setActivePanel('quotes')} 
              className={`hover:text-ink-primary transition-colors ${activePanel === 'quotes' ? 'text-accent-personal border-b border-accent-personal pb-1 font-bold' : ''}`}
            >
              Musings
            </button>
            <button 
              onClick={() => setActivePanel('musings')} 
              className={`hover:text-ink-primary transition-colors ${activePanel === 'musings' ? 'text-accent-personal border-b border-accent-personal pb-1 font-bold' : ''}`}
            >
              Journal
            </button>
            <button 
              onClick={() => setActivePanel('media')} 
              className={`hover:text-ink-primary transition-colors ${activePanel === 'media' ? 'text-accent-personal border-b border-accent-personal pb-1 font-bold' : ''}`}
            >
              Media Shelf
            </button>
            <button 
              onClick={() => setActivePanel('hobbies')} 
              className={`hover:text-ink-primary transition-colors ${activePanel === 'hobbies' ? 'text-accent-personal border-b border-accent-personal pb-1 font-bold' : ''}`}
            >
              Hobby Log
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ====================================================================
            DASHBOARD VIEW
            ==================================================================== */}
        {activePanel === 'dashboard' && (
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Widget 1: Hobbies practice heatmap (Github grid) */}
            {hobbies.length > 0 && (
              <div 
                className="col-span-1 md:col-span-2 lg:col-span-3 bg-surface/30 border border-surface rounded-2xl p-6 space-y-6 cursor-pointer hover:bg-surface/40 transition-colors"
                onClick={() => setActivePanel('hobbies')}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-medium tracking-wide text-ink-primary flex items-center gap-2">
                    <Compass className="w-5 h-5 text-accent-personal" /> Hobby Practice logs
                  </h3>
                  <div className="flex items-center gap-6 text-sm font-mono">
                    <span className="flex items-center gap-1 text-accent-personal">
                      <Flame className="w-4 h-4 fill-accent-personal" /> {streak} day streak
                    </span>
                    <span className="text-ink-secondary flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {Math.round(totalMinutes / 60)} hrs total
                    </span>
                  </div>
                </div>

                {/* The Heatmap Grid */}
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[500px] flex flex-col justify-center">
                    <div className="grid grid-flow-col grid-rows-7 gap-1 w-max mx-auto">
                      {calendarGrid.map((day, idx) => (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-sm transition-colors duration-300 ${
                            day.count === 0 ? 'bg-surface/40 border border-surface/10' :
                            day.count === 1 ? 'bg-accent-personal/30 border border-accent-personal/20' :
                            day.count === 2 ? 'bg-accent-personal/60 border border-accent-personal/40' :
                            'bg-accent-personal border border-accent-personal/80'
                          }`}
                          title={`${day.date}: ${day.count} practice session(s)`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted mt-2 max-w-[650px] w-full mx-auto px-1">
                      <span>140 days ago</span>
                      <div className="flex items-center gap-1">
                        <span>Less</span>
                        <div className="w-2.5 h-2.5 rounded-sm bg-surface/40" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent-personal/30" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent-personal/60" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent-personal" />
                        <span>More</span>
                      </div>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Widget 2: Goal progress rings */}
            {goalsPlans.length > 0 && (
              <div 
                className="bg-surface/30 border border-surface rounded-2xl p-6 space-y-6 hover:bg-surface/40 transition-colors cursor-pointer"
                onClick={() => setActivePanel('goals')}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-medium tracking-wide text-ink-primary flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent-personal" /> Goals & Plans
                  </h3>
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </div>

                {goalsPlans.slice(0, 1).map((goal) => {
                  // SVG Circular progress details
                  const radius = 34;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (goal.progress / 100) * circumference;

                  return (
                    <div key={goal.id} className="flex items-center gap-5">
                      {/* SVG Progress Ring */}
                      <div className="relative w-20 h-20 shrink-0">
                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className="stroke-surface-hover fill-none stroke-[6]"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className="stroke-accent-personal fill-none stroke-[6] transition-all duration-1000 ease-out"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-mono font-semibold">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-display font-medium text-ink-primary truncate">{goal.title}</p>
                        <p className="text-xs text-ink-secondary truncate mt-0.5">{goal.description || 'No description'}</p>
                        <span className="inline-block mt-2 text-[10px] font-mono uppercase bg-accent-personal/10 text-accent-personal px-2 py-0.5 rounded">
                          {goal.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Widget 3A: Daily Inspiration Card (API quote) */}
            {dailyQuote && (
              <div 
                className="bg-surface/30 border border-surface rounded-2xl p-6 space-y-6 flex flex-col justify-between relative group hover:bg-surface/40 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-medium tracking-wide text-ink-primary flex items-center gap-2">
                    <QuoteIcon className="w-4 h-4 text-accent-personal" /> Daily Inspiration
                  </h3>
                  <button
                    onClick={handleSaveDailyQuote}
                    className="p-1.5 hover:bg-surface-hover rounded-full transition-colors duration-200 cursor-pointer text-ink-muted hover:text-accent-personal group/btn"
                    title="Save to Musings"
                  >
                    <Bookmark className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="font-display font-light text-lg italic text-ink-primary leading-snug">
                    "{dailyQuote.quote}"
                  </p>
                  <p className="text-xs text-ink-secondary font-mono text-right">
                    — {dailyQuote.author}
                  </p>
                </div>
              </div>
            )}



            {/* Widget 4: Ideas (Excitement/Difficulty visual cards) */}
            {ideas.length > 0 && (
              <div 
                className="bg-surface/30 border border-surface rounded-2xl p-6 space-y-6 hover:bg-surface/40 transition-colors cursor-pointer"
                onClick={() => setActivePanel('ideas')}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-medium tracking-wide text-ink-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-personal" /> Latest Ideas
                  </h3>
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </div>

                <div className="space-y-4">
                  {ideas.slice(0, 2).map((idea) => (
                    <div key={idea.id} className="border-b border-surface/50 pb-3 last:border-b-0 last:pb-0 space-y-2">
                      <p className="text-sm font-display font-medium text-ink-primary truncate">{idea.title}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-ink-secondary">
                        <span className="flex items-center gap-1">
                          EXCITE: <span className="text-accent-personal font-semibold">{'★'.repeat(idea.excitement)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          DIFF: <span className="text-accent-work font-semibold">{'⚡'.repeat(idea.difficulty)}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Widget 5: Musings (Journal mood highlight) */}
            {musings.length > 0 && (
              <div 
                className="bg-surface/30 border border-surface rounded-2xl p-6 space-y-6 hover:bg-surface/40 transition-colors cursor-pointer"
                onClick={() => setActivePanel('musings')}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-medium tracking-wide text-ink-primary flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent-personal" /> Journal Logs
                  </h3>
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </div>

                {musings.slice(0, 1).map((m) => (
                  <div key={m.id} className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-ink-muted">{new Date(m.created_at).toLocaleDateString()}</span>
                      <span className="text-accent-personal uppercase tracking-wider font-semibold">{m.mood}</span>
                    </div>
                    {m.title && <p className="text-sm font-display font-medium text-ink-primary truncate">{m.title}</p>}
                    <p className="text-xs text-ink-secondary line-clamp-3 leading-relaxed font-sans">
                      {m.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Widget 6: Media Shelf (Consuming) */}
            {media.length > 0 && (
              <div 
                className="bg-surface/30 border border-surface rounded-2xl p-6 space-y-6 hover:bg-surface/40 transition-colors cursor-pointer"
                onClick={() => setActivePanel('media')}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-medium tracking-wide text-ink-primary flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent-personal" /> Active Media
                  </h3>
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </div>

                {media.slice(0, 1).map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-12 h-16 bg-surface-hover rounded border border-surface flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono text-ink-muted uppercase">{item.type}</span>
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-display font-medium text-ink-primary truncate">{item.title}</p>
                      <p className="text-xs text-ink-secondary truncate">Genre: {item.genre || 'General'}</p>
                      {item.progress > 0 && (
                        <p className="text-[10px] font-mono text-accent-personal">
                          Progress: {item.progress}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Widget 7: Personal Tasks list */}
            {personalTasks.length > 0 && (
              <div 
                className="bg-surface/30 border border-surface rounded-2xl p-6 space-y-6 hover:bg-surface/40 transition-colors cursor-pointer"
                onClick={() => setActivePanel('tasks')}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-medium tracking-wide text-ink-primary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent-personal" /> Active Tasks
                  </h3>
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </div>

                <div className="space-y-3">
                  {personalTasks.filter(x => x.status !== 'Done').slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-personal shrink-0" />
                      <span className="text-xs font-display text-ink-secondary truncate flex-1">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* ====================================================================
            PERSONAL TASKS & REMINDERS PANEL
            ==================================================================== */}
        {activePanel === 'tasks' && (
          <motion.div
            key="tasks-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActivePanel('dashboard')} 
                className="p-2 bg-surface hover:bg-surface-hover rounded-full transition-colors duration-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-2xl font-display font-normal text-ink-primary">Tasks & Reminders</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tasks Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-medium text-ink-primary text-lg">Personal Tasks</h3>
                  <button
                    onClick={() => openCreateForm('personal_tasks')}
                    className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-accent-personal hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </button>
                </div>

                <div className="space-y-3">
                  {personalTasks.length === 0 ? (
                    <p className="text-xs font-mono text-ink-muted italic">No personal tasks logged.</p>
                  ) : (
                    personalTasks.map((task) => (
                      <ItemContextMenu 
                        key={task.id} 
                        category="personal_tasks" 
                        item={task} 
                        onEdit={() => openEditForm('personal_tasks', task)}
                      >
                        <div 
                          onClick={() => openEditForm('personal_tasks', task)}
                          className="bg-surface/30 border border-surface rounded-xl p-4 flex items-start justify-between gap-4 hover:border-accent-personal/40 transition-colors"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <span className="text-[10px] font-mono bg-accent-personal/10 text-accent-personal px-2 py-0.5 rounded">
                              {task.category}
                            </span>
                            <h4 className={`text-sm font-display font-medium text-ink-primary truncate ${task.status === 'Done' ? 'line-through text-ink-muted' : ''}`}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-ink-secondary truncate max-w-sm">{task.description}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-[10px] font-mono text-ink-muted uppercase">PRIORITY: {task.priority}</span>
                            <span className="block text-[10px] font-mono text-ink-muted uppercase mt-1">ENERGY: {task.energy_required}</span>
                          </div>
                        </div>
                      </ItemContextMenu>
                    ))
                  )}
                </div>
              </div>

              {/* Reminders Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-medium text-ink-primary text-lg">Personal Reminders</h3>
                  <button
                    onClick={() => openCreateForm('personal_reminders')}
                    className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-accent-personal hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Reminder
                  </button>
                </div>

                <div className="space-y-3">
                  {personalReminders.length === 0 ? (
                    <p className="text-xs font-mono text-ink-muted italic">No personal reminders logged.</p>
                  ) : (
                    personalReminders.map((rem) => (
                      <ItemContextMenu 
                        key={rem.id} 
                        category="personal_reminders" 
                        item={rem} 
                        onEdit={() => openEditForm('personal_reminders', rem)}
                      >
                        <div 
                          onClick={() => openEditForm('personal_reminders', rem)}
                          className="bg-surface/30 border border-surface rounded-xl p-4 hover:border-accent-personal/40 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono uppercase text-accent-personal tracking-wider">
                              {rem.type}
                            </span>
                            <span className="text-[10px] font-mono text-ink-muted">{rem.date} {rem.time ? `@ ${rem.time}` : ''}</span>
                          </div>
                          <h4 className="text-sm font-display font-medium text-ink-primary mt-2">
                            {rem.title}
                          </h4>
                          {rem.description && <p className="text-xs text-ink-secondary mt-1">{rem.description}</p>}
                        </div>
                      </ItemContextMenu>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ====================================================================
            GOALS PANEL
            ==================================================================== */}
        {activePanel === 'goals' && (
          <motion.div
            key="goals-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActivePanel('dashboard')} 
                  className="p-2 bg-surface hover:bg-surface-hover rounded-full transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-2xl font-display font-normal text-ink-primary">Goals & Plans</h2>
              </div>
              <button
                onClick={() => openCreateForm('goals_plans')}
                className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase bg-accent-personal text-bg px-4 py-2 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" /> New Goal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {goalsPlans.length === 0 ? (
                <p className="text-xs font-mono text-ink-muted italic col-span-2">No goals defined yet. Set one up to track progress rings.</p>
              ) : (
                goalsPlans.map((goal) => {
                  const radius = 28;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (goal.progress / 100) * circumference;

                  return (
                    <ItemContextMenu 
                      key={goal.id} 
                      category="goals_plans" 
                      item={goal} 
                      onEdit={() => openEditForm('goals_plans', goal)}
                    >
                      <div 
                        onClick={() => openEditForm('goals_plans', goal)}
                        className="bg-surface/30 border border-surface rounded-2xl p-6 space-y-6 hover:border-accent-personal/40 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative w-16 h-16 shrink-0">
                            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                              <circle cx="32" cy="32" r={radius} className="stroke-surface fill-none stroke-[4]" />
                              <circle 
                                cx="32" cy="32" r={radius} 
                                className="stroke-accent-personal fill-none stroke-[4] transition-all duration-500" 
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-medium">
                              {goal.progress}%
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-1">
                            <h3 className="text-base font-display font-medium text-ink-primary truncate">{goal.title}</h3>
                            <p className="text-xs text-ink-secondary line-clamp-2">{goal.description}</p>
                          </div>
                        </div>

                        {/* Milestones status */}
                        {goal.milestones && goal.milestones.length > 0 && (
                          <div className="space-y-2 border-t border-surface/50 pt-4">
                            <span className="text-[10px] font-mono uppercase text-ink-muted tracking-wider">Milestones checklist</span>
                            <div className="space-y-1.5">
                              {goal.milestones.map((m) => (
                                <div key={m.id} className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${m.completed ? 'bg-accent-personal' : 'bg-surface'}`} />
                                  <span className={`text-xs truncate ${m.completed ? 'line-through text-ink-muted' : 'text-ink-secondary'}`}>
                                    {m.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 text-[10px] font-mono text-ink-muted border-t border-surface/40">
                          <span>TARGET: {goal.target_date}</span>
                          <span className="uppercase text-accent-personal font-semibold">{goal.status}</span>
                        </div>
                      </div>
                    </ItemContextMenu>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ====================================================================
            IDEAS PANEL
            ==================================================================== */}
        {activePanel === 'ideas' && (
          <motion.div
            key="ideas-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActivePanel('dashboard')} 
                  className="p-2 bg-surface hover:bg-surface-hover rounded-full transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-2xl font-display font-normal text-ink-primary">Ideas Shelf</h2>
              </div>
              <button
                onClick={() => openCreateForm('ideas')}
                className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase bg-accent-personal text-bg px-4 py-2 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" /> New Idea
              </button>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {ideas.length === 0 ? (
                <p className="text-xs font-mono text-ink-muted italic">No ideas logged yet. Ideate and rate their excitation.</p>
              ) : (
                ideas.map((idea) => (
                  <ItemContextMenu 
                    key={idea.id} 
                    category="ideas" 
                    item={idea} 
                    onEdit={() => openEditForm('ideas', idea)}
                  >
                    <div 
                      onClick={() => openEditForm('ideas', idea)}
                      className="break-inside-avoid bg-surface/30 border border-surface rounded-2xl p-6 space-y-4 hover:border-accent-personal/40 transition-colors mb-6 cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[10px] font-mono bg-accent-personal/10 text-accent-personal px-2 py-0.5 rounded">
                          {idea.category}
                        </span>
                        <span className="text-[10px] font-mono text-ink-muted uppercase">{idea.status}</span>
                      </div>

                      <h3 className="text-base font-display font-medium text-ink-primary">{idea.title}</h3>
                      
                      {idea.description && (
                        <p className="text-xs text-ink-secondary leading-relaxed font-sans">{idea.description}</p>
                      )}

                      <div className="space-y-2 border-t border-surface/50 pt-3 text-[10px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-ink-muted uppercase tracking-wider">Excitement</span>
                          <span className="text-accent-personal font-semibold">{'★'.repeat(idea.excitement)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted uppercase tracking-wider">Difficulty</span>
                          <span className="text-accent-work font-semibold">{'⚡'.repeat(idea.difficulty)}</span>
                        </div>
                      </div>

                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {idea.tags.map((t, idx) => (
                            <span key={idx} className="text-[9px] font-mono text-ink-muted">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </ItemContextMenu>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ====================================================================
            QUOTES PANEL
            ==================================================================== */}
        {activePanel === 'quotes' && (
          <motion.div
            key="quotes-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActivePanel('dashboard')} 
                  className="p-2 bg-surface hover:bg-surface-hover rounded-full transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-2xl font-display font-normal text-ink-primary">Musings</h2>
              </div>
              <button
                onClick={() => openCreateForm('quotes')}
                className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase bg-accent-personal text-bg px-4 py-2 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" /> Add Musing
              </button>
            </div>

            <div className="space-y-6">
              {quotes.length === 0 ? (
                <p className="text-xs font-mono text-ink-muted italic">No musings added.</p>
              ) : (
                quotes.map((q) => (
                  <ItemContextMenu 
                    key={q.id} 
                    category="quotes" 
                    item={q} 
                    onEdit={() => openEditForm('quotes', q)}
                  >
                    <div 
                      onClick={() => openEditForm('quotes', q)}
                      className="bg-surface/30 border border-surface rounded-2xl p-6 md:p-8 space-y-6 hover:border-accent-personal/40 transition-colors cursor-pointer"
                    >
                      <div className="space-y-4">
                        <p className="font-display font-light text-xl md:text-2xl italic text-ink-primary leading-snug">
                          "{q.quote}"
                        </p>
                        <div className="flex justify-between items-center text-xs font-mono text-ink-secondary">
                          <span className="text-accent-personal font-semibold">#{q.category}</span>
                          <span>— {q.author || 'Unknown'}{q.source ? `, ${q.source}` : ''}</span>
                        </div>
                      </div>

                      {q.personal_thoughts && (
                        <div className="border-t border-surface/50 pt-4 space-y-1.5">
                          <span className="text-[10px] font-mono uppercase text-ink-muted tracking-wider">My Thoughts</span>
                          <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                            {q.personal_thoughts}
                          </p>
                        </div>
                      )}
                    </div>
                  </ItemContextMenu>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ====================================================================
            JOURNAL (MUSINGS) PANEL
            ==================================================================== */}
        {activePanel === 'musings' && (
          <motion.div
            key="musings-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActivePanel('dashboard')} 
                  className="p-2 bg-surface hover:bg-surface-hover rounded-full transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-2xl font-display font-normal text-ink-primary">Journal logs</h2>
              </div>
              <button
                onClick={() => openCreateForm('musings')}
                className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase bg-accent-personal text-bg px-4 py-2 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" /> Write Log
              </button>
            </div>

            <div className="space-y-6 max-w-3xl mx-auto">
              {musings.length === 0 ? (
                <p className="text-xs font-mono text-ink-muted italic">No journal entries logged.</p>
              ) : (
                musings.map((m) => (
                  <ItemContextMenu 
                    key={m.id} 
                    category="musings" 
                    item={m} 
                    onEdit={() => openEditForm('musings', m)}
                  >
                    <div 
                      onClick={() => openEditForm('musings', m)}
                      className="bg-surface/30 border border-surface rounded-2xl p-6 md:p-8 space-y-4 hover:border-accent-personal/40 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-ink-muted">{new Date(m.created_at).toLocaleDateString()}</span>
                        <span className="text-accent-personal uppercase tracking-wider font-semibold">{m.mood}</span>
                      </div>
                      
                      {m.title && <h3 className="text-lg font-display font-medium text-ink-primary">{m.title}</h3>}
                      
                      <p className="text-sm text-ink-secondary leading-relaxed font-sans whitespace-pre-wrap">
                        {m.body}
                      </p>

                      {m.tags && m.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-surface/30">
                          {m.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] font-mono text-accent-personal/80">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </ItemContextMenu>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ====================================================================
            MEDIA SHELF PANEL
            ==================================================================== */}
        {activePanel === 'media' && (
          <motion.div
            key="media-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActivePanel('dashboard')} 
                  className="p-2 bg-surface hover:bg-surface-hover rounded-full transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-2xl font-display font-normal text-ink-primary">Media Shelf</h2>
              </div>
              <button
                onClick={() => openCreateForm('media')}
                className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase bg-accent-personal text-bg px-4 py-2 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" /> Add Media
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {media.length === 0 ? (
                <p className="text-xs font-mono text-ink-muted italic">No media items in backlog.</p>
              ) : (
                media.map((item) => (
                  <ItemContextMenu 
                    key={item.id} 
                    category="media" 
                    item={item} 
                    onEdit={() => openEditForm('media', item)}
                  >
                    <div 
                      onClick={() => openEditForm('media', item)}
                      className="bg-surface/30 border border-surface rounded-2xl p-5 flex flex-col justify-between h-48 hover:border-accent-personal/40 transition-colors cursor-pointer"
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-16 bg-surface-hover rounded border border-surface flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-mono text-ink-muted uppercase">{item.type}</span>
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h4 className="text-sm font-display font-medium text-ink-primary truncate">{item.title}</h4>
                          <p className="text-xs text-ink-secondary truncate">Genre: {item.genre || 'General'}</p>
                          {item.rating && (
                            <div className="flex text-xs text-accent-personal font-mono">
                              {'★'.repeat(item.rating)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-surface/50 pt-3">
                        {item.thoughts && <p className="text-xs text-ink-secondary line-clamp-1 italic">"{item.thoughts}"</p>}
                        <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted">
                          <span>REC: {item.recommendation_source || 'Self'}</span>
                          <span className="uppercase text-accent-personal font-semibold">{item.status}</span>
                        </div>
                      </div>
                    </div>
                  </ItemContextMenu>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ====================================================================
            HOBBY LOG PANEL
            ==================================================================== */}
        {activePanel === 'hobbies' && (
          <motion.div
            key="hobbies-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActivePanel('dashboard')} 
                  className="p-2 bg-surface hover:bg-surface-hover rounded-full transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-2xl font-display font-normal text-ink-primary">Hobby Practice logs</h2>
              </div>
              <button
                onClick={() => openCreateForm('hobbies')}
                className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase bg-accent-personal text-bg px-4 py-2 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" /> Log Session
              </button>
            </div>

            {/* Summary statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-surface/20 border border-surface rounded-xl p-4 text-center">
                <span className="block text-[10px] font-mono uppercase text-ink-muted tracking-wider">Practice Streak</span>
                <span className="block text-2xl font-display font-semibold text-accent-personal mt-1 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 fill-accent-personal" /> {streak} days
                </span>
              </div>
              <div className="bg-surface/20 border border-surface rounded-xl p-4 text-center">
                <span className="block text-[10px] font-mono uppercase text-ink-muted tracking-wider">Total Duration</span>
                <span className="block text-2xl font-display font-semibold text-ink-primary mt-1">
                  {Math.round(totalMinutes)} mins
                </span>
              </div>
              <div className="bg-surface/20 border border-surface rounded-xl p-4 text-center">
                <span className="block text-[10px] font-mono uppercase text-ink-muted tracking-wider">Total Sessions</span>
                <span className="block text-2xl font-display font-semibold text-ink-primary mt-1">
                  {hobbies.length} logs
                </span>
              </div>
              <div className="bg-surface/20 border border-surface rounded-xl p-4 text-center">
                <span className="block text-[10px] font-mono uppercase text-ink-muted tracking-wider">Hobby Count</span>
                <span className="block text-2xl font-display font-semibold text-ink-primary mt-1">
                  {new Set(hobbies.map(x => x.hobby)).size} hobbies
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {hobbies.length === 0 ? (
                <p className="text-xs font-mono text-ink-muted italic">No practice logs entered. Log sessions to view heatmap activity.</p>
              ) : (
                hobbies.map((log) => (
                  <ItemContextMenu 
                    key={log.id} 
                    category="hobbies" 
                    item={log} 
                    onEdit={() => openEditForm('hobbies', log)}
                  >
                    <div 
                      onClick={() => openEditForm('hobbies', log)}
                      className="bg-surface/30 border border-surface rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-accent-personal/40 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-display font-semibold text-ink-primary">{log.hobby}</span>
                          <span className="text-[10px] font-mono text-ink-muted">{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                        {log.notes && <p className="text-xs text-ink-secondary leading-relaxed font-sans">{log.notes}</p>}
                      </div>

                      <div className="flex items-center gap-6 shrink-0 text-xs font-mono">
                        <span className="flex items-center gap-1 text-ink-muted">
                          DURATION: <span className="text-accent-personal font-semibold">{log.duration}m</span>
                        </span>
                        <span className="flex items-center gap-1 text-ink-muted">
                          ENJOY: <span className="text-accent-personal font-semibold">{'★'.repeat(log.enjoyment)}</span>
                        </span>
                        <span className="flex items-center gap-1 text-ink-muted">
                          DIFF: <span className="text-accent-work font-semibold">{'⚡'.repeat(log.difficulty)}</span>
                        </span>
                      </div>
                    </div>
                  </ItemContextMenu>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40">
        <div className="relative">
          {/* Quick create menu (only works on dashboard) */}
          <AnimatePresence>
            {isFabMenuOpen && activePanel === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                className="absolute bottom-16 right-0 bg-surface border border-surface rounded-xl p-2 shadow-2xl w-48 space-y-1 z-50 backdrop-blur-lg"
              >
                <span className="block text-[9px] font-mono text-ink-muted uppercase px-2.5 py-1 tracking-wider border-b border-surface/50 mb-1">
                  Quick Log / Add
                </span>

                <button 
                  onClick={() => openCreateForm('personal_tasks')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Personal Task
                </button>
                <button 
                  onClick={() => openCreateForm('personal_reminders')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Reminder
                </button>
                <button 
                  onClick={() => openCreateForm('goals_plans')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Goal / Plan
                </button>
                <button 
                  onClick={() => openCreateForm('ideas')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Idea Shelf
                </button>
                <button 
                  onClick={() => openCreateForm('quotes')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Musing
                </button>
                <button 
                  onClick={() => openCreateForm('musings')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Journal Log
                </button>
                <button 
                  onClick={() => openCreateForm('media')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Media backlogs
                </button>
                <button 
                  onClick={() => openCreateForm('hobbies')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Hobby Practice
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              startPress();
            }}
            onMouseUp={(e) => {
              if (e.button !== 0) return;
              endPress();
            }}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={(e) => {
              e.preventDefault();
              endPress();
            }}
            onTouchMove={cancelPress}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent-personal hover:bg-accent-personal/90 text-bg shadow-lg shadow-accent-personal/20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Add entry"
          >
            <Plus className={`w-6 h-6 transition-transform duration-300 ${isFabMenuOpen && activePanel === 'dashboard' ? 'rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Item Form Dialog Modal */}
      <ItemFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        category={formCategory}
        item={editingItem}
      />

      {/* Smart Capture Modal */}
      <SmartCaptureModal
        isOpen={isSmartCaptureOpen}
        onClose={() => setIsSmartCaptureOpen(false)}
      />
    </div>
  );
};
