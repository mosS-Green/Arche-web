import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { WorkTask } from '../context/AppContext';
import { ItemFormModal } from './ItemFormModal';
import { ItemContextMenu } from './ItemContextMenu';
import { SmartCaptureModal } from './SmartCaptureModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Pin, CheckCircle2, Circle, Play, AlertCircle, 
  Clock, FileText, Sparkles
} from 'lucide-react';

export const WorkWorkspace: React.FC = () => {
  const {
    loadWorkData,
    workTasks,
    workReminders,
    workNotes,
    saveItem
  } = useApp();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCategory, setFormCategory] = useState('work_tasks');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSmartCaptureOpen, setIsSmartCaptureOpen] = useState(false);

  // FAB sub-menu state
  const [isFabOpen, setIsFabOpen] = useState(false);

  const longPressTimeout = useRef<number | null>(null);
  const isLongPressActive = useRef(false);

  const startPress = () => {
    isLongPressActive.current = false;
    if (longPressTimeout.current) {
      window.clearTimeout(longPressTimeout.current);
    }
    longPressTimeout.current = window.setTimeout(() => {
      isLongPressActive.current = true;
      setIsFabOpen((prev) => !prev);
    }, 500);
  };

  const endPress = () => {
    if (longPressTimeout.current) {
      window.clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    if (!isLongPressActive.current) {
      setIsSmartCaptureOpen(true);
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

  // Load data on mount
  useEffect(() => {
    loadWorkData();
  }, []);

  // Keyboard shortcut listener: 'N' opens new task directly, 'Escape' closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return; // Skip if user is inputting text
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openCreateForm('work_tasks');
      } else if (e.key === 'Escape') {
        setIsFormOpen(false);
        setIsFabOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openCreateForm = (category: string) => {
    setFormCategory(category);
    setEditingItem(null);
    setIsFormOpen(true);
    setIsFabOpen(false);
  };

  const openEditForm = (category: string, item: any) => {
    setFormCategory(category);
    setEditingItem(item);
    setIsFormOpen(true);
  };

  // Cycle task status: To Do -> In Progress -> Done -> To Do
  const handleCycleStatus = async (task: WorkTask, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click from opening Edit form
    
    let nextStatus: 'To Do' | 'In Progress' | 'Done' = 'To Do';
    if (task.status === 'To Do') {
      nextStatus = 'In Progress';
    } else if (task.status === 'In Progress') {
      nextStatus = 'Done';
    }
    
    await saveItem('work_tasks', { ...task, status: nextStatus });
  };

  // ============================================================================
  // Task Grouping
  // ============================================================================
  const todayStr = new Date().toISOString().split('T')[0];

  const getGroupedTasks = () => {
    const overdue: WorkTask[] = [];
    const today: WorkTask[] = [];
    const inProgress: WorkTask[] = [];
    const completed: WorkTask[] = [];

    workTasks.forEach((task) => {
      if (task.status === 'Done') {
        completed.push(task);
      } else if (task.status === 'In Progress') {
        inProgress.push(task);
      } else if (task.deadline && task.deadline < todayStr) {
        overdue.push(task);
      } else if (task.deadline === todayStr) {
        today.push(task);
      } else {
        // Just standard upcoming 'To Do'
        today.push(task); // Render inside general tasks queue
      }
    });

    // Sort completed by date desc, overdue by date asc
    overdue.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
    today.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
    completed.sort((a, b) => b.created_at.localeCompare(a.created_at));

    return { overdue, today, inProgress, completed };
  };

  const { overdue, today, inProgress, completed } = getGroupedTasks();

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto pb-32">
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface/60 pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-mono uppercase tracking-widest text-accent-work">PROFESSIONAL WORKSPACE</p>
          <h1 className="font-display text-3xl font-light tracking-tight text-ink-primary">
            Work Dashboard
          </h1>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="text-ink-secondary">{overdue.length} Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-work" />
            <span className="text-ink-secondary">{inProgress.length} In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ink-muted" />
            <span className="text-ink-secondary">{today.length + inProgress.length + overdue.length} Pending</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 3 columns layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ====================================================================
            COLUMN 1 & 2: TASKS BOARD
            ==================================================================== */}
        <div className="xl:col-span-2 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-medium text-ink-primary flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent-work" /> Tasks Queue
            </h2>
            <button
              onClick={() => openCreateForm('work_tasks')}
              className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-accent-work hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>

          <div className="space-y-6">
            
            {/* OVERDUE */}
            {overdue.length > 0 && (
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-danger/10 text-danger px-2.5 py-0.5 rounded-full border border-danger/20 font-semibold tracking-wider">
                  <AlertCircle className="w-3 h-3" /> Overdue ({overdue.length})
                </span>
                <div className="grid grid-cols-1 gap-3">
                  {overdue.map((task) => (
                    <ItemContextMenu key={task.id} category="work_tasks" item={task} onEdit={() => openEditForm('work_tasks', task)}>
                      <div 
                        onClick={() => openEditForm('work_tasks', task)}
                        className="bg-surface/30 border-l-2 border-l-danger border-y border-r border-surface rounded-r-xl p-4 flex items-center justify-between gap-4 hover:bg-surface/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Cycle Check Icon */}
                          <button
                            onClick={(e) => handleCycleStatus(task, e)}
                            className="shrink-0 text-danger hover:text-accent-work transition-colors cursor-pointer"
                            title="Toggle status"
                          >
                            <Circle className="w-5 h-5" />
                          </button>
                          <div className="min-w-0">
                            <h4 className="text-sm font-display font-medium text-ink-primary truncate">{task.title}</h4>
                            <p className="text-xs text-ink-secondary truncate max-w-sm mt-0.5">{task.description || 'No details'}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-[10px] font-mono text-danger font-semibold">
                          DUE: {task.deadline}
                        </div>
                      </div>
                    </ItemContextMenu>
                  ))}
                </div>
              </div>
            )}

            {/* IN PROGRESS */}
            {inProgress.length > 0 && (
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-accent-work/10 text-accent-work px-2.5 py-0.5 rounded-full border border-accent-work/20 font-semibold tracking-wider">
                  <Play className="w-3 h-3 fill-accent-work" /> In Progress ({inProgress.length})
                </span>
                <div className="grid grid-cols-1 gap-3">
                  {inProgress.map((task) => (
                    <ItemContextMenu key={task.id} category="work_tasks" item={task} onEdit={() => openEditForm('work_tasks', task)}>
                      <div 
                        onClick={() => openEditForm('work_tasks', task)}
                        className="bg-surface/30 border-l-2 border-l-accent-work border-y border-r border-surface rounded-r-xl p-4 flex items-center justify-between gap-4 hover:bg-surface/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={(e) => handleCycleStatus(task, e)}
                            className="shrink-0 text-accent-work hover:text-ink-muted transition-colors cursor-pointer"
                            title="Complete task"
                          >
                            <Play className="w-5 h-5 fill-accent-work text-accent-work" />
                          </button>
                          <div className="min-w-0">
                            <h4 className="text-sm font-display font-medium text-ink-primary truncate">{task.title}</h4>
                            <p className="text-xs text-ink-secondary truncate max-w-sm mt-0.5">{task.description}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-[10px] font-mono text-ink-muted">
                          {task.estimated_duration ? `${task.estimated_duration}m est` : ''}
                        </div>
                      </div>
                    </ItemContextMenu>
                  ))}
                </div>
              </div>
            )}

            {/* TODAY / PENDING */}
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-surface-hover text-ink-primary px-2.5 py-0.5 rounded-full border border-surface font-semibold tracking-wider">
                Pending Queue ({today.length})
              </span>
              <div className="grid grid-cols-1 gap-3">
                {today.length === 0 && inProgress.length === 0 && overdue.length === 0 ? (
                  <p className="text-xs font-mono text-ink-muted italic py-4">No pending tasks. You are clear!</p>
                ) : (
                  today.map((task) => (
                    <ItemContextMenu key={task.id} category="work_tasks" item={task} onEdit={() => openEditForm('work_tasks', task)}>
                      <div 
                        onClick={() => openEditForm('work_tasks', task)}
                        className="bg-surface/30 border border-surface rounded-xl p-4 flex items-center justify-between gap-4 hover:border-accent-work/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={(e) => handleCycleStatus(task, e)}
                            className="shrink-0 text-ink-muted hover:text-accent-work transition-colors cursor-pointer"
                            title="Start task"
                          >
                            <Circle className="w-5 h-5" />
                          </button>
                          <div className="min-w-0">
                            <h4 className="text-sm font-display font-medium text-ink-primary truncate">{task.title}</h4>
                            <p className="text-xs text-ink-secondary truncate max-w-sm mt-0.5">{task.description}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-[10px] font-mono text-ink-muted">
                          PRIORITY: {task.priority}
                        </div>
                      </div>
                    </ItemContextMenu>
                  ))
                )}
              </div>
            </div>

            {/* COMPLETED */}
            {completed.length > 0 && (
              <div className="space-y-3 opacity-60">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-surface-hover text-ink-muted px-2.5 py-0.5 rounded-full border border-surface font-semibold tracking-wider">
                  Completed ({completed.length})
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {completed.slice(0, 5).map((task) => (
                    <ItemContextMenu key={task.id} category="work_tasks" item={task} onEdit={() => openEditForm('work_tasks', task)}>
                      <div 
                        onClick={() => openEditForm('work_tasks', task)}
                        className="bg-surface/10 border border-surface/50 rounded-xl p-3.5 flex items-center justify-between gap-4 hover:bg-surface/20 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={(e) => handleCycleStatus(task, e)}
                            className="shrink-0 text-accent-work cursor-pointer"
                            title="Re-open task"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <h4 className="text-sm font-display font-medium text-ink-muted truncate line-through">{task.title}</h4>
                        </div>
                        <span className="text-[9px] font-mono text-ink-muted">DONE</span>
                      </div>
                    </ItemContextMenu>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ====================================================================
            COLUMN 3: REMINDERS TIMELINE & NOTES PINBOARD
            ==================================================================== */}
        <div className="space-y-12">
          
          {/* REMINDERS TIMELINE */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-medium text-ink-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent-work" /> Reminders
              </h2>
              <button
                onClick={() => openCreateForm('work_reminders')}
                className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-accent-work hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* Timeline Line */}
            <div className="relative border-l border-surface/60 pl-6 ml-2 space-y-6">
              {workReminders.length === 0 ? (
                <p className="text-xs font-mono text-ink-muted italic pl-2">No work reminders set.</p>
              ) : (
                workReminders.map((rem) => (
                  <ItemContextMenu key={rem.id} category="work_reminders" item={rem} onEdit={() => openEditForm('work_reminders', rem)}>
                    <div 
                      onClick={() => openEditForm('work_reminders', rem)}
                      className="relative bg-surface/20 border border-surface rounded-xl p-4 hover:border-accent-work/40 transition-colors cursor-pointer space-y-2"
                    >
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-4 w-2.5 h-2.5 rounded-full bg-accent-work border-4 border-bg" />
                      
                      <div className="flex justify-between items-start text-[10px] font-mono">
                        <span className="text-accent-work uppercase tracking-wider font-semibold">{rem.type}</span>
                        <span className="text-ink-muted">{rem.date} {rem.time ? `@ ${rem.time}` : ''}</span>
                      </div>
                      <h4 className="text-sm font-display font-medium text-ink-primary leading-tight">{rem.title}</h4>
                      {rem.description && <p className="text-xs text-ink-secondary leading-normal">{rem.description}</p>}
                    </div>
                  </ItemContextMenu>
                ))
              )}
            </div>
          </div>

          {/* NOTES PINBOARD */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-medium text-ink-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-work" /> Pinned Notes
              </h2>
              <button
                onClick={() => openCreateForm('work_notes')}
                className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-accent-work hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Note
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {workNotes.length === 0 ? (
                <p className="text-xs font-mono text-ink-muted italic">No work notes logged.</p>
              ) : (
                workNotes.map((note) => (
                  <ItemContextMenu key={note.id} category="work_notes" item={note} onEdit={() => openEditForm('work_notes', note)}>
                    <div 
                      onClick={() => openEditForm('work_notes', note)}
                      className="bg-surface/30 border border-surface rounded-2xl p-5 space-y-3 hover:border-accent-work/40 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[9px] font-mono uppercase bg-accent-work/10 text-accent-work px-2 py-0.5 rounded">
                          {note.project || 'General'}
                        </span>
                        {note.pin && <Pin className="w-3.5 h-3.5 text-accent-work fill-accent-work shrink-0" />}
                      </div>
                      <h4 className="text-sm font-display font-semibold text-ink-primary">{note.title}</h4>
                      {note.body && (
                        <p className="text-xs text-ink-secondary line-clamp-3 leading-relaxed font-sans">{note.body}</p>
                      )}
                      
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-surface/40">
                          {note.tags.map((t, idx) => (
                            <span key={idx} className="text-[9px] font-mono text-ink-muted">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </ItemContextMenu>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* FAB Button - Work Workspace */}
      <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40">
        <div className="relative">
          {/* Sub menu controls */}
          <AnimatePresence>
            {isFabOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                className="absolute bottom-16 right-0 bg-surface border border-surface rounded-xl p-2 shadow-2xl w-40 space-y-1 z-50 backdrop-blur-lg"
              >
                <span className="block text-[9px] font-mono text-ink-muted uppercase px-2.5 py-1 tracking-wider border-b border-surface/50 mb-1">
                  Add Work Item
                </span>

                <button 
                  onClick={() => openCreateForm('work_tasks')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Work Task
                </button>
                <button 
                  onClick={() => openCreateForm('work_reminders')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Work Reminder
                </button>
                <button 
                  onClick={() => openCreateForm('work_notes')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-display text-ink-primary hover:bg-surface-hover cursor-pointer"
                >
                  Work Note
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
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent-work hover:bg-accent-work/90 text-bg shadow-lg shadow-accent-work/20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Add work item"
          >
            <Plus className={`w-6 h-6 transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Item Form dialog portal */}
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
