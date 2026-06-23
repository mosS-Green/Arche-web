import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// TypeScript Type Definitions
// ============================================================================

export interface Profile {
  id: string;
  display_name: string;
  updated_at: string;
}

export interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  deadline: string | null;
  status: 'To Do' | 'In Progress' | 'Done';
  energy_required: 'Low' | 'Medium' | 'High';
  tags: string[];
  created_at: string;
}

export interface PersonalReminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: 'One Time' | 'Daily' | 'Weekly' | 'Monthly';
  date: string;
  time: string | null;
  repeat_until: string | null;
  created_at: string;
}

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  excitement: number;
  difficulty: number;
  status: 'Draft' | 'Refined' | 'Active' | 'Completed' | 'Shelved';
  related_hobby: string | null;
  tags: string[];
  created_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  quote: string;
  author: string | null;
  source: string | null;
  category: string;
  favourite: boolean;
  personal_thoughts: string | null;
  tags: string[];
  created_at: string;
}

export interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface GoalPlan {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Achieved' | 'Paused';
  milestones: Milestone[];
  related_hobby: string | null;
  created_at: string;
}

export interface Musing {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  mood: string;
  tags: string[];
  favourite: boolean;
  created_at: string;
}

export interface MediaItem {
  id: string;
  user_id: string;
  title: string;
  type: 'Music' | 'Book' | 'Series' | 'Movie' | 'Game';
  status: 'Backlog' | 'Consuming' | 'Completed' | 'Abandoned';
  rating: number | null;
  progress: number;
  genre: string | null;
  thoughts: string | null;
  recommendation_source: string | null;
  created_at: string;
}

export interface HobbyLog {
  id: string;
  user_id: string;
  hobby: string;
  duration: number;
  notes: string | null;
  enjoyment: number;
  difficulty: number;
  tags: string[];
  created_at: string;
}

export interface WorkTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'To Do' | 'In Progress' | 'Done';
  deadline: string | null;
  time: string | null;
  tags: string[];
  estimated_duration: number | null;
  notes: string | null;
  created_at: string;
}

export interface WorkReminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: 'One Time' | 'Daily' | 'Weekly' | 'Monthly';
  date: string;
  time: string | null;
  repeat_until: string | null;
  created_at: string;
}

export interface WorkNote {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  tags: string[];
  project: string | null;
  pin: boolean;
  created_at: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface AppContextType {
  userId: string | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboardingRequired: boolean;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  removeToast: (id: string) => void;
  
  personalLoaded: boolean;
  workLoaded: boolean;
  loadPersonalData: () => Promise<void>;
  loadWorkData: () => Promise<void>;
  
  personalTasks: PersonalTask[];
  personalReminders: PersonalReminder[];
  ideas: Idea[];
  quotes: Quote[];
  goalsPlans: GoalPlan[];
  musings: Musing[];
  media: MediaItem[];
  hobbies: HobbyLog[];
  workTasks: WorkTask[];
  workReminders: WorkReminder[];
  workNotes: WorkNote[];
  
  onboardUser: (displayName: string) => Promise<boolean>;
  
  saveItem: (category: string, item: any) => Promise<void>;
  deleteItem: (category: string, id: string) => Promise<void>;
  duplicateItem: (category: string, item: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingRequired, setIsOnboardingRequired] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [personalLoaded, setPersonalLoaded] = useState(false);
  const [workLoaded, setWorkLoaded] = useState(false);

  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
  const [personalReminders, setPersonalReminders] = useState<PersonalReminder[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [goalsPlans, setGoalsPlans] = useState<GoalPlan[]>([]);
  const [musings, setMusings] = useState<Musing[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [hobbies, setHobbies] = useState<HobbyLog[]>([]);
  const [workTasks, setWorkTasks] = useState<WorkTask[]>([]);
  const [workReminders, setWorkReminders] = useState<WorkReminder[]>([]);
  const [workNotes, setWorkNotes] = useState<WorkNote[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial App Setup
  useEffect(() => {
    const initApp = async () => {
      const storedId = localStorage.getItem('arche_user_id');
      if (!storedId) {
        setIsOnboardingRequired(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', storedId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setUserId(storedId);
          setProfile(data);
          setIsOnboardingRequired(false);
        } else {
          localStorage.removeItem('arche_user_id');
          setIsOnboardingRequired(true);
        }
      } catch (err) {
        console.warn('Supabase profile check failed, trying offline fallback:', err);
        // Offline fallback - trust localStorage cache
        setUserId(storedId);
        setProfile({
          id: storedId,
          display_name: 'Owner',
          updated_at: new Date().toISOString()
        });
        setIsOnboardingRequired(false);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  const loadPersonalData = async () => {
    if (personalLoaded || !userId) return;
    try {
      const [
        tasksRes,
        remindersRes,
        ideasRes,
        quotesRes,
        goalsRes,
        musingsRes,
        mediaRes,
        hobbiesRes
      ] = await Promise.all([
        supabase.from('personal_tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('personal_reminders').select('*').eq('user_id', userId).order('date', { ascending: true }),
        supabase.from('ideas').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('quotes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('goals_plans').select('*').eq('user_id', userId).order('target_date', { ascending: true }),
        supabase.from('musings').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('media').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('hobbies').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (remindersRes.error) throw remindersRes.error;
      if (ideasRes.error) throw ideasRes.error;
      if (quotesRes.error) throw quotesRes.error;
      if (goalsRes.error) throw goalsRes.error;
      if (musingsRes.error) throw musingsRes.error;
      if (mediaRes.error) throw mediaRes.error;
      if (hobbiesRes.error) throw hobbiesRes.error;

      setPersonalTasks(tasksRes.data || []);
      setPersonalReminders(remindersRes.data || []);
      setIdeas(ideasRes.data || []);
      setQuotes(quotesRes.data || []);
      setGoalsPlans(goalsRes.data || []);
      setMusings(musingsRes.data || []);
      setMedia(mediaRes.data || []);
      setHobbies(hobbiesRes.data || []);
      setPersonalLoaded(true);
    } catch (err: any) {
      console.error('Failed to load personal data:', err.message);
      addToast('error', 'Fetch Error', 'Failed to load personal domain logs.');
    }
  };

  const loadWorkData = async () => {
    if (workLoaded || !userId) return;
    try {
      const [tasksRes, remindersRes, notesRes] = await Promise.all([
        supabase.from('work_tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('work_reminders').select('*').eq('user_id', userId).order('date', { ascending: true }),
        supabase.from('work_notes').select('*').eq('user_id', userId).order('pin', { ascending: false }).order('created_at', { ascending: false })
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (remindersRes.error) throw remindersRes.error;
      if (notesRes.error) throw notesRes.error;

      setWorkTasks(tasksRes.data || []);
      setWorkReminders(remindersRes.data || []);
      setWorkNotes(notesRes.data || []);
      setWorkLoaded(true);
    } catch (err: any) {
      console.error('Failed to load work data:', err.message);
      addToast('error', 'Fetch Error', 'Failed to load work domain logs.');
    }
  };

  const onboardUser = async (displayName: string): Promise<boolean> => {
    const name = displayName.trim();
    if (!name) return false;

    try {
      // Lookup existing profile by name (case-insensitive) for multi-device support
      const { data: existingProfile, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', name)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingProfile) {
        localStorage.setItem('arche_user_id', existingProfile.id);
        setUserId(existingProfile.id);
        setProfile(existingProfile);
        setIsOnboardingRequired(false);
        addToast('success', 'Profile Restored', `Welcome back to Arché, ${existingProfile.display_name}.`);
        setPersonalLoaded(false);
        setWorkLoaded(false);
        return true;
      }

      // Create new profile
      const newId = crypto.randomUUID();
      const newProfile = { id: newId, display_name: name };

      const { error: insertError } = await supabase.from('profiles').insert(newProfile);
      if (insertError) throw insertError;

      localStorage.setItem('arche_user_id', newId);
      setUserId(newId);
      setProfile({ ...newProfile, updated_at: new Date().toISOString() });
      setIsOnboardingRequired(false);
      addToast('success', 'Profile Activated', `Welcome to Arché, ${name}.`);

      await seedMockData(newId);
      return true;
    } catch (err: any) {
      console.error('Onboarding failed:', err.message);
      addToast('error', 'Onboarding Failed', err.message || 'Could not save profile.');
      return false;
    }
  };

  // ============================================================================
  // Mock Data Seed Flow
  // ============================================================================
  const seedMockData = async (targetUserId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const samplePersonalTasks: PersonalTask[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Morning alignment: Tea and journaling",
        description: "Spend 15 minutes in meditation without digital devices.",
        category: "Mindfulness",
        priority: "Medium",
        deadline: today,
        status: "To Do",
        energy_required: "Low",
        tags: ["daily", "habits"],
        created_at: new Date().toISOString()
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Sketch schematic for interlocking shelf",
        description: "Draft interlocking modular slots using birch plywood sheets.",
        category: "Creativity",
        priority: "High",
        deadline: tomorrow,
        status: "In Progress",
        energy_required: "High",
        tags: ["design", "woodworking"],
        created_at: new Date().toISOString()
      }
    ];

    const samplePersonalReminders: PersonalReminder[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Water the snake plants",
        description: "Avoid overwatering during winters. Touch the topsoil to verify dry level.",
        type: "Weekly",
        date: today,
        time: "09:00:00",
        repeat_until: null,
        created_at: new Date().toISOString()
      }
    ];

    const sampleIdeas: Idea[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "ESP32 micro greenhouse dashboard",
        description: "Continuous telemetry monitoring moisture, sunlight levels, and moisture indexes.",
        category: "Electronics",
        excitement: 5,
        difficulty: 4,
        status: "Refined",
        related_hobby: "Gardening",
        tags: ["iot", "arduino"],
        created_at: new Date().toISOString()
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Family history recipe publication",
        description: "Capture handwriting scans, digitize text, format in elegant columns.",
        category: "Writing",
        excitement: 4,
        difficulty: 2,
        status: "Draft",
        related_hobby: "Cooking",
        tags: ["heritage", "book"],
        created_at: new Date().toISOString()
      }
    ];

    const sampleQuotes: Quote[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        quote: "Simplicity is the ultimate sophistication.",
        author: "Leonardo da Vinci",
        source: "Notebooks",
        category: "Design Philosophy",
        favourite: true,
        personal_thoughts: "Strip away decorative layouts. Layout hierarchy should flow directly from content weight.",
        tags: ["wisdom"],
        created_at: new Date().toISOString()
      }
    ];

    const sampleGoalsPlans: GoalPlan[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Run a 10k pace base",
        description: "Improve aerobic ceiling and pace maintenance.",
        target_date: threeMonthsLater,
        progress: 35,
        status: "In Progress",
        related_hobby: "Running",
        milestones: [
          { id: "m1", text: "5k continuous sub-25m run", completed: true },
          { id: "m2", text: "8k practice run under 42m", completed: false },
          { id: "m3", text: "Interval track workouts weekly", completed: true }
        ],
        created_at: new Date().toISOString()
      }
    ];

    const sampleMusings: Musing[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "The rhythm of early mornings",
        body: "There is a brief, silent window before the world starts demanding attention. It's when thoughts flow without friction, and typing feels like breathing. Coffee is warm, screen is dark, minds are clear.",
        mood: "Reflective",
        favourite: true,
        tags: ["morning", "writing"],
        created_at: new Date().toISOString()
      }
    ];

    const sampleMedia: MediaItem[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Atomic Habits",
        type: "Book",
        status: "Consuming",
        rating: 5,
        progress: 142,
        genre: "Self-Improvement",
        thoughts: "Compounding gains are highly underestimated. Focus on systems rather than endpoints.",
        recommendation_source: "Friend",
        created_at: new Date().toISOString()
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Interstellar",
        type: "Movie",
        status: "Completed",
        rating: 5,
        progress: 100,
        genre: "Sci-Fi",
        thoughts: "A masterpiece of cinematic atmosphere. Audio balance is exceptional.",
        recommendation_source: "Self",
        created_at: new Date().toISOString()
      }
    ];

    const sampleHobbies: HobbyLog[] = [];
    const logIntervals = [14, 12, 11, 8, 7, 6, 4, 2, 1, 0];
    logIntervals.forEach((daysAgo, index) => {
      const logDate = new Date();
      logDate.setDate(logDate.getDate() - daysAgo);
      const isRunning = index % 3 === 1;
      
      sampleHobbies.push({
        id: `hobby-${index}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: targetUserId,
        hobby: isRunning ? "Running" : "Guitar",
        duration: isRunning ? 35 : 45,
        notes: isRunning ? "Felt light on my feet, steady tempo." : "Practiced chord transitions and metronome rhythm.",
        enjoyment: isRunning ? 4 : 5,
        difficulty: isRunning ? 3 : 2,
        tags: isRunning ? ["intervals", "cardio"] : ["fingerstyle", "scales"],
        created_at: logDate.toISOString()
      });
    });

    const sampleWorkTasks: WorkTask[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Q2 Performance Analysis report",
        description: "Compile api error rates, database transaction logs, and overall client load speeds.",
        priority: "High",
        status: "In Progress",
        deadline: today,
        time: "17:00:00",
        estimated_duration: 120,
        notes: "Request reports from DevOps and pull metrics from console.",
        tags: ["metrics", "analytics"],
        created_at: new Date().toISOString()
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Audit layout contrast for screenreaders",
        description: "Ensure all contrast ratios of text elements are >= 4.5:1 against surfaces.",
        priority: "Critical",
        status: "To Do",
        deadline: tomorrow,
        time: "10:00:00",
        estimated_duration: 60,
        notes: "Focus on deep charcoal surfaces and red warning items.",
        tags: ["accessibility", "audit"],
        created_at: new Date().toISOString()
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Configure staging deployment parameters",
        description: "Set up secrets and variables inside GitHub Actions workflows.",
        priority: "Medium",
        status: "Done",
        deadline: yesterday,
        time: "15:00:00",
        estimated_duration: 30,
        notes: "All test builds passing.",
        tags: ["ci-cd", "devops"],
        created_at: new Date().toISOString()
      }
    ];

    const sampleWorkReminders: WorkReminder[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "Weekly architecture review",
        description: "Prepare diagrams for the new caching mechanism.",
        type: "Weekly",
        date: today,
        time: "14:00:00",
        repeat_until: null,
        created_at: new Date().toISOString()
      }
    ];

    const sampleWorkNotes: WorkNote[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        title: "API Gateway design thoughts",
        body: "We should route authentication verification directly in the DB using Row-Level Security checks. Views must have security_invoker = true to guarantee database RLS policies apply when executing queries. Keep edge endpoints lightweight.",
        project: "Gateway",
        pin: true,
        tags: ["design", "security"],
        created_at: new Date().toISOString()
      }
    ];

    try {
      await Promise.all([
        supabase.from('personal_tasks').insert(samplePersonalTasks),
        supabase.from('personal_reminders').insert(samplePersonalReminders),
        supabase.from('ideas').insert(sampleIdeas),
        supabase.from('quotes').insert(sampleQuotes),
        supabase.from('goals_plans').insert(sampleGoalsPlans),
        supabase.from('musings').insert(sampleMusings),
        supabase.from('media').insert(sampleMedia),
        supabase.from('hobbies').insert(sampleHobbies),
        supabase.from('work_tasks').insert(sampleWorkTasks),
        supabase.from('work_reminders').insert(sampleWorkReminders),
        supabase.from('work_notes').insert(sampleWorkNotes)
      ]);

      // Reload state in UI
      setPersonalTasks(samplePersonalTasks);
      setPersonalReminders(samplePersonalReminders);
      setIdeas(sampleIdeas);
      setQuotes(sampleQuotes);
      setGoalsPlans(sampleGoalsPlans);
      setMusings(sampleMusings);
      setMedia(sampleMedia);
      setHobbies(sampleHobbies);
      setPersonalLoaded(true);

      setWorkTasks(sampleWorkTasks);
      setWorkReminders(sampleWorkReminders);
      setWorkNotes(sampleWorkNotes);
      setWorkLoaded(true);
    } catch (e) {
      console.error('Failed database seeding:', e);
    }
  };

  // ============================================================================
  // Optimistic UI Actions
  // ============================================================================
  const getCacheSetters = (category: string): [any[], React.Dispatch<React.SetStateAction<any[]>>] | [null, null] => {
    switch (category) {
      case 'personal_tasks': return [personalTasks, setPersonalTasks] as any;
      case 'personal_reminders': return [personalReminders, setPersonalReminders] as any;
      case 'ideas': return [ideas, setIdeas] as any;
      case 'quotes': return [quotes, setQuotes] as any;
      case 'goals_plans': return [goalsPlans, setGoalsPlans] as any;
      case 'musings': return [musings, setMusings] as any;
      case 'media': return [media, setMedia] as any;
      case 'hobbies': return [hobbies, setHobbies] as any;
      case 'work_tasks': return [workTasks, setWorkTasks] as any;
      case 'work_reminders': return [workReminders, setWorkReminders] as any;
      case 'work_notes': return [workNotes, setWorkNotes] as any;
      default: return [null, null];
    }
  };

  const saveItem = async (category: string, item: any) => {
    if (!userId) return;
    const [cache, setCache] = getCacheSetters(category);
    if (!cache || !setCache) return;

    const isEdit = !!item.id;
    const originalCache = [...cache];
    const tempId = item.id || `temp-${Math.random().toString(36).substring(2, 11)}`;
    const fullItem = {
      ...item,
      id: tempId,
      user_id: userId,
      created_at: item.created_at || new Date().toISOString()
    };

    // 1. Optimistic State Update
    if (isEdit) {
      setCache((prev: any[]) => prev.map((x) => (x.id === item.id ? fullItem : x)));
    } else {
      setCache((prev: any[]) => [fullItem, ...prev]);
    }

    // 2. Database Write
    try {
      let result;
      if (isEdit) {
        result = await supabase
          .from(category)
          .update(item)
          .eq('id', item.id)
          .select()
          .single();
      } else {
        const { id, ...insertable } = fullItem;
        result = await supabase
          .from(category)
          .insert(insertable)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setCache((prev: any[]) => 
        prev.map((x) => (x.id === tempId ? result.data : x))
      );
      addToast('success', `${isEdit ? 'Updated' : 'Created'} item successfully.`);
    } catch (err: any) {
      console.error(`Failed to save item to ${category}:`, err.message);
      setCache(originalCache);
      addToast('error', 'Sync Failure', 'Could not sync update with database.');
    }
  };

  const deleteItem = async (category: string, id: string) => {
    const [cache, setCache] = getCacheSetters(category);
    if (!cache || !setCache) return;

    const originalCache = [...cache];

    // 1. Optimistic Delete
    setCache((prev: any[]) => prev.filter((x) => x.id !== id));

    // 2. Database Delete
    try {
      const { error } = await supabase.from(category).delete().eq('id', id);
      if (error) throw error;
      addToast('success', 'Deleted item successfully.');
    } catch (err: any) {
      console.error(`Failed to delete item from ${category}:`, err.message);
      setCache(originalCache);
      addToast('error', 'Sync Failure', 'Could not sync delete with database.');
    }
  };

  const duplicateItem = async (category: string, item: any) => {
    if (!userId) return;
    const [cache, setCache] = getCacheSetters(category);
    if (!cache || !setCache) return;

    const originalCache = [...cache];
    const tempId = `temp-${Math.random().toString(36).substring(2, 11)}`;
    const duplicated = {
      ...item,
      id: tempId,
      title: item.title ? `${item.title} (Copy)` : undefined,
      quote: item.quote ? `${item.quote} (Copy)` : undefined,
      created_at: new Date().toISOString()
    };

    // 1. Optimistic Insert
    setCache((prev: any[]) => [duplicated, ...prev]);

    // 2. Database Insert
    try {
      const { id, user_id, created_at, ...insertable } = duplicated;
      const { data, error } = await supabase
        .from(category)
        .insert({ ...insertable, user_id: userId })
        .select()
        .single();

      if (error) throw error;

      setCache((prev: any[]) => prev.map((x) => (x.id === tempId ? data : x)));
      addToast('success', 'Duplicated item successfully.');
    } catch (err: any) {
      console.error(`Failed to duplicate item in ${category}:`, err.message);
      setCache(originalCache);
      addToast('error', 'Sync Failure', 'Could not duplicate item.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        userId,
        profile,
        isLoading,
        isOnboardingRequired,
        toasts,
        addToast,
        removeToast,
        
        personalLoaded,
        workLoaded,
        loadPersonalData,
        loadWorkData,
        
        personalTasks,
        personalReminders,
        ideas,
        quotes,
        goalsPlans,
        musings,
        media,
        hobbies,
        workTasks,
        workReminders,
        workNotes,
        
        onboardUser,
        saveItem,
        deleteItem,
        duplicateItem
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
