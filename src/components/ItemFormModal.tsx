import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useApp } from '../context/AppContext';
import { X, Plus, Trash, Check } from 'lucide-react';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string; // e.g., 'personal_tasks', 'ideas', etc.
  item?: any; // If editing
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  category,
  item
}) => {
  const { saveItem } = useApp();
  const [formData, setFormData] = useState<any>({});
  const [milestones, setMilestones] = useState<any[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  // Sync state with item when editing
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({ ...item });
        if (category === 'goals_plans' && item.milestones) {
          setMilestones(item.milestones);
        }
      } else {
        // Load default values based on category
        const defaults: any = { created_at: new Date().toISOString() };
        if (category === 'personal_tasks' || category === 'work_tasks') {
          defaults.status = 'To Do';
          defaults.priority = 'Medium';
          defaults.energy_required = 'Medium';
          defaults.tags = [];
        } else if (category === 'personal_reminders' || category === 'work_reminders') {
          defaults.type = 'One Time';
          defaults.date = new Date().toISOString().split('T')[0];
        } else if (category === 'ideas') {
          defaults.excitement = 3;
          defaults.difficulty = 3;
          defaults.status = 'Draft';
          defaults.tags = [];
        } else if (category === 'quotes') {
          defaults.favourite = false;
          defaults.tags = [];
        } else if (category === 'goals_plans') {
          defaults.progress = 0;
          defaults.status = 'Not Started';
          defaults.target_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          setMilestones([]);
        } else if (category === 'musings') {
          defaults.mood = 'Reflective';
          defaults.favourite = false;
          defaults.tags = [];
        } else if (category === 'media') {
          defaults.type = 'Book';
          defaults.status = 'Backlog';
          defaults.rating = 3;
          defaults.progress = 0;
        } else if (category === 'hobbies') {
          defaults.duration = 30;
          defaults.enjoyment = 3;
          defaults.difficulty = 3;
          defaults.tags = [];
        } else if (category === 'work_notes') {
          defaults.pin = false;
          defaults.tags = [];
        }
        setFormData(defaults);
      }
    }
  }, [isOpen, item, category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else if (name === 'tags') {
      // Split tags by comma
      const tagArray = value.split(',').map((t) => t.trim()).filter((t) => t !== '');
      setFormData((prev: any) => ({ ...prev, tags: tagArray }));
    } else if (type === 'number') {
      setFormData((prev: any) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSliderChange = (name: string, value: number) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Milestone actions for Goals
  const addMilestone = () => {
    if (!newMilestoneText.trim()) return;
    const newM = {
      id: Math.random().toString(36).substr(2, 5),
      text: newMilestoneText.trim(),
      completed: false
    };
    const updated = [...milestones, newM];
    setMilestones(updated);
    setFormData((prev: any) => ({ ...prev, milestones: updated }));
    setNewMilestoneText('');
  };

  const toggleMilestone = (mId: string) => {
    const updated = milestones.map((m) => m.id === mId ? { ...m, completed: !m.completed } : m);
    setMilestones(updated);
    setFormData((prev: any) => ({ ...prev, milestones: updated }));
  };

  const deleteMilestone = (mId: string) => {
    const updated = milestones.filter((m) => m.id !== mId);
    setMilestones(updated);
    setFormData((prev: any) => ({ ...prev, milestones: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title && !formData.quote && !formData.body && category !== 'hobbies') {
      alert('Please fill in the core name or body text.');
      return;
    }
    
    // Auto title for hobbies
    if (category === 'hobbies' && !formData.hobby) {
      alert('Please enter a hobby name.');
      return;
    }

    await saveItem(category, formData);
    onClose();
  };

  const getCategoryTitle = () => {
    const editPrefix = item ? 'Edit' : 'New';
    switch (category) {
      case 'personal_tasks': return `${editPrefix} Personal Task`;
      case 'personal_reminders': return `${editPrefix} Personal Reminder`;
      case 'ideas': return `${editPrefix} Idea`;
      case 'quotes': return `${editPrefix} Musing`;
      case 'goals_plans': return `${editPrefix} Goal / Plan`;
      case 'musings': return `${editPrefix} Journal Log`;
      case 'media': return `${editPrefix} Media Item`;
      case 'hobbies': return `${editPrefix} Hobby Log`;
      case 'work_tasks': return `${editPrefix} Work Task`;
      case 'work_reminders': return `${editPrefix} Work Reminder`;
      case 'work_notes': return `${editPrefix} Work Note`;
      default: return `${editPrefix} Item`;
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-bg/80 backdrop-blur-md z-50 transition-opacity duration-300" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface border border-surface rounded-2xl p-6 md:p-8 shadow-2xl z-50 outline-none max-h-[85vh] overflow-y-auto selection:bg-accent-personal selection:text-bg">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-surface/60 mb-6">
            <Dialog.Title className="text-xl font-display font-medium text-ink-primary">
              {getCategoryTitle()}
            </Dialog.Title>
            <Dialog.Close className="p-1 rounded-full text-ink-muted hover:text-ink-primary hover:bg-surface-hover transition-colors duration-200 cursor-pointer">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. PERSONAL & WORK TASKS */}
            {(category === 'personal_tasks' || category === 'work_tasks') && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Task Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title || ''}
                    onChange={handleChange}
                    placeholder="Describe the task"
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Description</label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Optional details..."
                    rows={3}
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {category === 'personal_tasks' && (
                    <div className="space-y-1">
                      <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Category</label>
                      <input
                        type="text"
                        name="category"
                        required
                        value={formData.category || ''}
                        onChange={handleChange}
                        placeholder="e.g. Wellness, Study"
                        className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority || 'Medium'}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {category === 'personal_tasks' && (
                    <div className="space-y-1">
                      <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Energy Required</label>
                      <select
                        name="energy_required"
                        value={formData.energy_required || 'Medium'}
                        onChange={handleChange}
                        className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                      >
                        <option value="Low">Low (Reflective)</option>
                        <option value="Medium">Medium (Balanced)</option>
                        <option value="High">High (Demanding)</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Status</label>
                    <select
                      name="status"
                      value={formData.status || 'To Do'}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Deadline Date</label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline || ''}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  {category === 'work_tasks' && (
                    <div className="space-y-1">
                      <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Deadline Time</label>
                      <input
                        type="time"
                        name="time"
                        value={formData.time || ''}
                        onChange={handleChange}
                        className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                      />
                    </div>
                  )}
                </div>

                {category === 'work_tasks' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Est. Duration (Mins)</label>
                      <input
                        type="number"
                        name="estimated_duration"
                        value={formData.estimated_duration || ''}
                        onChange={handleChange}
                        placeholder="e.g. 60"
                        className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Notes</label>
                      <input
                        type="text"
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        placeholder="Link or quick memo"
                        className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags ? formData.tags.join(', ') : ''}
                    onChange={handleChange}
                    placeholder="daily, code, health"
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                  />
                </div>
              </>
            )}

            {/* 2. REMINDERS */}
            {(category === 'personal_reminders' || category === 'work_reminders') && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Reminder Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title || ''}
                    onChange={handleChange}
                    placeholder="What to remember"
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Description</label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Short description..."
                    rows={2}
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Frequency Type</label>
                    <select
                      name="type"
                      value={formData.type || 'One Time'}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    >
                      <option value="One Time">One Time</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Reminder Date</label>
                    <input
                      type="date"
                      name="date"
                      required
                      value={formData.date || ''}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Reminder Time</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time || ''}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Repeat Until (Optional)</label>
                    <input
                      type="date"
                      name="repeat_until"
                      value={formData.repeat_until || ''}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 3. IDEAS */}
            {category === 'ideas' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Idea Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title || ''}
                    onChange={handleChange}
                    placeholder="Core concept"
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Details</label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Elaborate on how this idea works..."
                    rows={4}
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Category</label>
                    <input
                      type="text"
                      name="category"
                      required
                      value={formData.category || ''}
                      onChange={handleChange}
                      placeholder="e.g. IoT, Novel"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Status</label>
                    <select
                      name="status"
                      value={formData.status || 'Draft'}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Refined">Refined</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Shelved">Shelved</option>
                    </select>
                  </div>
                </div>

                {/* Excitement and Difficulty Rating sliders */}
                <div className="space-y-4 border border-surface/50 rounded-xl p-4 bg-surface/20">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="uppercase tracking-wider text-ink-muted">Excitement level</span>
                      <span className="text-accent-personal font-semibold font-mono">{formData.excitement || 3} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formData.excitement || 3}
                      onChange={(e) => handleSliderChange('excitement', parseInt(e.target.value))}
                      className="w-full accent-accent-personal bg-surface cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="uppercase tracking-wider text-ink-muted">Difficulty index</span>
                      <span className="text-accent-work font-semibold font-mono">{formData.difficulty || 3} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formData.difficulty || 3}
                      onChange={(e) => handleSliderChange('difficulty', parseInt(e.target.value))}
                      className="w-full accent-accent-work bg-surface cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Related Hobby</label>
                    <input
                      type="text"
                      name="related_hobby"
                      value={formData.related_hobby || ''}
                      onChange={handleChange}
                      placeholder="e.g. Gardening, Painting"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags ? formData.tags.join(', ') : ''}
                      onChange={handleChange}
                      placeholder="maker, coding"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 4. QUOTES */}
            {category === 'quotes' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Musing Text</label>
                  <textarea
                    name="quote"
                    required
                    value={formData.quote || ''}
                    onChange={handleChange}
                    placeholder="Write your musing..."
                    rows={3}
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-display font-light text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Author</label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author || ''}
                      onChange={handleChange}
                      placeholder="Author name"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Source / Book</label>
                    <input
                      type="text"
                      name="source"
                      value={formData.source || ''}
                      onChange={handleChange}
                      placeholder="e.g. Letters to Lucilius"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Category</label>
                    <input
                      type="text"
                      name="category"
                      required
                      value={formData.category || ''}
                      onChange={handleChange}
                      placeholder="e.g. Stoicism, Art"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags ? formData.tags.join(', ') : ''}
                      onChange={handleChange}
                      placeholder="seneca, design"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Personal Reflections</label>
                  <textarea
                    name="personal_thoughts"
                    value={formData.personal_thoughts || ''}
                    onChange={handleChange}
                    placeholder="What does this quote prompt in you?..."
                    rows={2}
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="favourite"
                    name="favourite"
                    checked={formData.favourite || false}
                    onChange={handleChange}
                    className="w-4 h-4 accent-accent-personal bg-surface cursor-pointer rounded"
                  />
                  <label htmlFor="favourite" className="text-sm text-ink-secondary select-none cursor-pointer font-display">
                    Pin as Favourite / Highlight
                  </label>
                </div>
              </>
            )}

            {/* 5. GOALS / PLANS */}
            {category === 'goals_plans' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Goal Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title || ''}
                    onChange={handleChange}
                    placeholder="e.g. Master fingerstyle guitar"
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Purpose / Details</label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Describe the plan and vision..."
                    rows={3}
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Target Completion Date</label>
                    <input
                      type="date"
                      name="target_date"
                      required
                      value={formData.target_date || ''}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Status</label>
                    <select
                      name="status"
                      value={formData.status || 'Not Started'}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Achieved">Achieved</option>
                      <option value="Paused">Paused</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Related Hobby</label>
                    <input
                      type="text"
                      name="related_hobby"
                      value={formData.related_hobby || ''}
                      onChange={handleChange}
                      placeholder="e.g. Guitar"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="uppercase tracking-wider text-ink-muted">Overall progress</span>
                      <span className="text-accent-personal font-semibold font-mono">{formData.progress || 0}%</span>
                    </div>
                    <div className="pt-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.progress || 0}
                        onChange={(e) => handleSliderChange('progress', parseInt(e.target.value))}
                        className="w-full accent-accent-personal bg-surface cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Milestones Editor Section */}
                <div className="space-y-3 border border-surface/50 rounded-xl p-4 bg-surface/20">
                  <label className="block text-xs font-mono tracking-wider uppercase text-ink-muted">Milestones / Steps</label>
                  
                  {/* Milestones list */}
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {milestones.length === 0 ? (
                      <p className="text-xs text-ink-muted font-mono italic">No milestones defined yet.</p>
                    ) : (
                      milestones.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-2 bg-surface/40 p-2 rounded-lg border border-surface/60">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleMilestone(m.id)}
                              className={`w-4 h-4 border rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                m.completed ? 'bg-accent-personal border-accent-personal text-bg' : 'border-ink-muted hover:border-ink-secondary'
                              }`}
                            >
                              {m.completed && <Check className="w-3 h-3 stroke-[3px]" />}
                            </button>
                            <span className={`text-xs truncate ${m.completed ? 'line-through text-ink-muted' : 'text-ink-secondary font-display'}`}>
                              {m.text}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteMilestone(m.id)}
                            className="p-1 text-ink-muted hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add milestone controls */}
                  <div className="flex gap-2 pt-1.5">
                    <input
                      type="text"
                      placeholder="Add goal step..."
                      value={newMilestoneText}
                      onChange={(e) => setNewMilestoneText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addMilestone();
                        }
                      }}
                      className="flex-1 bg-surface/50 border border-surface/80 rounded-lg px-3 py-1.5 text-xs text-ink-primary outline-none focus:border-accent-personal font-display"
                    />
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="p-2 bg-surface hover:bg-surface-hover border border-surface rounded-lg text-ink-primary cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 6. MUSINGS */}
            {category === 'musings' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Title (Optional)</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    placeholder="Musing headline"
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Journal Entry Body</label>
                  <textarea
                    name="body"
                    required
                    value={formData.body || ''}
                    onChange={handleChange}
                    placeholder="Write whatever flows..."
                    rows={6}
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans leading-relaxed text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Current Mood</label>
                    <input
                      type="text"
                      name="mood"
                      required
                      value={formData.mood || ''}
                      onChange={handleChange}
                      placeholder="e.g. Calm, Energetic, Reflective"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags ? formData.tags.join(', ') : ''}
                      onChange={handleChange}
                      placeholder="journal, morning"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="favourite_musing"
                    name="favourite"
                    checked={formData.favourite || false}
                    onChange={handleChange}
                    className="w-4 h-4 accent-accent-personal bg-surface cursor-pointer rounded"
                  />
                  <label htmlFor="favourite_musing" className="text-sm text-ink-secondary select-none cursor-pointer font-display">
                    Highlight Musing
                  </label>
                </div>
              </>
            )}

            {/* 7. MEDIA */}
            {category === 'media' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Media Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title || ''}
                    onChange={handleChange}
                    placeholder="Title of piece"
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Media Type</label>
                    <select
                      name="type"
                      value={formData.type || 'Book'}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    >
                      <option value="Music">Music</option>
                      <option value="Book">Book</option>
                      <option value="Series">Series</option>
                      <option value="Movie">Movie</option>
                      <option value="Game">Game</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Status</label>
                    <select
                      name="status"
                      value={formData.status || 'Backlog'}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    >
                      <option value="Backlog">Backlog / Queue</option>
                      <option value="Consuming">Currently Consuming</option>
                      <option value="Completed">Completed</option>
                      <option value="Abandoned">Abandoned</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Progress (Page, Ep, Track)</label>
                    <input
                      type="number"
                      name="progress"
                      value={formData.progress || 0}
                      onChange={handleChange}
                      placeholder="e.g. 140"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Rating (1-5)</label>
                    <select
                      name="rating"
                      value={formData.rating || 3}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors font-mono font-medium"
                    >
                      <option value={1}>★</option>
                      <option value={2}>★★</option>
                      <option value={3}>★★★</option>
                      <option value={4}>★★★★</option>
                      <option value={5}>★★★★★</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Genre</label>
                    <input
                      type="text"
                      name="genre"
                      value={formData.genre || ''}
                      onChange={handleChange}
                      placeholder="e.g. Sci-Fi, Biography"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Rec. Source</label>
                    <input
                      type="text"
                      name="recommendation_source"
                      value={formData.recommendation_source || ''}
                      onChange={handleChange}
                      placeholder="e.g. Friend, Podcast"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Thoughts / Reviews</label>
                  <textarea
                    name="thoughts"
                    value={formData.thoughts || ''}
                    onChange={handleChange}
                    placeholder="Quick thoughts..."
                    rows={2}
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans"
                  />
                </div>
              </>
            )}

            {/* 8. HOBBIES */}
            {category === 'hobbies' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Hobby Practiced</label>
                  <input
                    type="text"
                    name="hobby"
                    required
                    value={formData.hobby || ''}
                    onChange={handleChange}
                    placeholder="e.g. Guitar, Running"
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Duration (Minutes)</label>
                    <input
                      type="number"
                      name="duration"
                      required
                      value={formData.duration || 30}
                      onChange={handleChange}
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags ? formData.tags.join(', ') : ''}
                      onChange={handleChange}
                      placeholder="scales, speed"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-4 border border-surface/50 rounded-xl p-4 bg-surface/20">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="uppercase tracking-wider text-ink-muted">Enjoyment</span>
                      <span className="text-accent-personal font-semibold font-mono">{formData.enjoyment || 3} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formData.enjoyment || 3}
                      onChange={(e) => handleSliderChange('enjoyment', parseInt(e.target.value))}
                      className="w-full accent-accent-personal bg-surface cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="uppercase tracking-wider text-ink-muted">Difficulty</span>
                      <span className="text-accent-work font-semibold font-mono">{formData.difficulty || 3} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formData.difficulty || 3}
                      onChange={(e) => handleSliderChange('difficulty', parseInt(e.target.value))}
                      className="w-full accent-accent-work bg-surface cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Practice Session Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    placeholder="What did you focus on? Notes about speed, metronome, pain points..."
                    rows={3}
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans"
                  />
                </div>
              </>
            )}

            {/* 9. WORK NOTES */}
            {category === 'work_notes' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Note Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title || ''}
                    onChange={handleChange}
                    placeholder="Title of note"
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Body Content</label>
                  <textarea
                    name="body"
                    value={formData.body || ''}
                    onChange={handleChange}
                    placeholder="Details..."
                    rows={6}
                    className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Project Name</label>
                    <input
                      type="text"
                      name="project"
                      value={formData.project || ''}
                      onChange={handleChange}
                      placeholder="e.g. Arche-API"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags ? formData.tags.join(', ') : ''}
                      onChange={handleChange}
                      placeholder="code, debug"
                      className="w-full bg-surface/40 border border-surface rounded-lg px-4 py-2.5 text-ink-primary outline-none focus:border-accent-personal transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="pin_note"
                    name="pin"
                    checked={formData.pin || false}
                    onChange={handleChange}
                    className="w-4 h-4 accent-accent-work bg-surface cursor-pointer rounded"
                  />
                  <label htmlFor="pin_note" className="text-sm text-ink-secondary select-none cursor-pointer font-display">
                    Pin Note to Top
                  </label>
                </div>
              </>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface/60">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-surface-hover hover:bg-surface border border-surface rounded-lg text-sm text-ink-secondary font-display transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-accent-personal hover:bg-accent-personal/90 text-bg rounded-lg text-sm font-display font-medium transition-colors cursor-pointer"
              >
                {item ? 'Save changes' : 'Create item'}
              </button>
            </div>

          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
