import { createClient } from '@supabase/supabase-js';
import { Task, Event, Deadline, MonthlyGoal, WeeklyGoal, DailyAgenda, RecurrenceType } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// A list of default mock data to populate local storage if it's empty
const DEFAULT_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Finish DHCP Lab',
    description: 'Complete the Cisco packet tracer labs for DHCP relay configuration.',
    duration_minutes: 90,
    scheduled_start: '09:00',
    scheduled_end: '10:30',
    priority: 'high',
    category: 'Study',
    status: 'Pending',
    due_date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'task-2',
    title: 'Review OSPF Notes',
    description: 'Read Chapter 4 of CCNP Routing Guide regarding OSPF areas and LSA types.',
    duration_minutes: 60,
    scheduled_start: '11:00',
    scheduled_end: '12:00',
    priority: 'medium',
    category: 'Study',
    status: 'Pending',
    due_date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'task-3',
    title: 'Submit NeuralRetail Update',
    description: 'Commit the latest PyTorch model training code to the neural branch.',
    duration_minutes: 120,
    scheduled_start: '14:00',
    scheduled_end: '16:00',
    priority: 'critical',
    category: 'Work',
    status: 'Pending',
    due_date: new Date().toISOString().split('T')[0],
  }
];

const DEFAULT_EVENTS: Event[] = [
  {
    id: 'event-1',
    title: 'Cisco Revision Seminar',
    description: 'Weekly study circle with CCNA focus groups.',
    location: 'Archive Library Room 4',
    start_time: '08:00',
    end_time: '09:00',
    event_date: new Date().toISOString().split('T')[0],
    recurrence_type: 'weekly',
  },
  {
    id: 'event-2',
    title: 'Team Meeting',
    description: 'Discuss retail model optimizations and database migration.',
    location: 'Meeting Room 2 / Zoom',
    start_time: '17:00',
    end_time: '18:00',
    event_date: new Date().toISOString().split('T')[0],
    recurrence_type: 'none',
  }
];

const DEFAULT_DEADLINES: Deadline[] = [
  {
    id: 'deadline-1',
    title: 'Subnetting Assignment Upload',
    description: 'Upload solutions as PDF to portal.',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'high',
    status: 'Pending',
  }
];

const DEFAULT_MONTHLY_GOALS: MonthlyGoal[] = [
  {
    id: 'mgoal-1',
    title: 'Complete Cisco CCNA certification chapters',
    status: 'pending',
    month_date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
  },
  {
    id: 'mgoal-2',
    title: 'Train retail prediction model to 92% accuracy',
    status: 'completed',
    month_date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
  }
];

const DEFAULT_WEEKLY_GOALS: WeeklyGoal[] = [
  {
    id: 'wgoal-1',
    title: 'Configure and test all OSPF areas in simulator',
    status: 'pending',
    week_number: getWeekNumber(new Date()),
    year: new Date().getFullYear(),
  },
  {
    id: 'wgoal-2',
    title: 'Read 100 pages of Philosophy of Mind',
    status: 'pending',
    week_number: getWeekNumber(new Date()),
    year: new Date().getFullYear(),
  }
];

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Local storage helpers
const getLocal = <T>(key: string, defaultVal: T): T => {
  if (typeof window === 'undefined') return defaultVal;
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(val);
};

const setLocal = <T>(key: string, val: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(val));
  }
};

// Seed local storage with default mock data if not set
if (typeof window !== 'undefined') {
  if (!localStorage.getItem('athenaeum_tasks')) setLocal('athenaeum_tasks', DEFAULT_TASKS);
  if (!localStorage.getItem('athenaeum_events')) setLocal('athenaeum_events', DEFAULT_EVENTS);
  if (!localStorage.getItem('athenaeum_deadlines')) setLocal('athenaeum_deadlines', DEFAULT_DEADLINES);
  if (!localStorage.getItem('athenaeum_mgoals')) setLocal('athenaeum_mgoals', DEFAULT_MONTHLY_GOALS);
  if (!localStorage.getItem('athenaeum_wgoals')) setLocal('athenaeum_wgoals', DEFAULT_WEEKLY_GOALS);
}

export const dbService = {
  // --- TASKS ---
  async getTasks(date: string): Promise<Task[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('due_date', date);
      if (error) throw error;
      return data || [];
    } else {
      const tasks = getLocal<Task[]>('athenaeum_tasks', []);
      return tasks.filter(t => t.due_date === date);
    }
  },

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const newTask: Task = { ...task, id: crypto.randomUUID() };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const tasks = getLocal<Task[]>('athenaeum_tasks', []);
      tasks.push(newTask);
      setLocal('athenaeum_tasks', tasks);
      return newTask;
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const tasks = getLocal<Task[]>('athenaeum_tasks', []);
      const idx = tasks.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Task not found');
      tasks[idx] = { ...tasks[idx], ...updates };
      setLocal('athenaeum_tasks', tasks);
      return tasks[idx];
    }
  },

  async deleteTask(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      const tasks = getLocal<Task[]>('athenaeum_tasks', []);
      const filtered = tasks.filter(t => t.id !== id);
      setLocal('athenaeum_tasks', filtered);
    }
  },

  // --- EVENTS (WITH RECURRENCE) ---
  async getEvents(date: string): Promise<Event[]> {
    let rawEvents: Event[] = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('events').select('*');
      if (error) throw error;
      rawEvents = data || [];
    } else {
      rawEvents = getLocal<Event[]>('athenaeum_events', []);
    }

    // Filter and expand events based on recurrence rule
    const targetDateObj = new Date(date + 'T00:00:00');
    return rawEvents.filter(event => {
      const eventDateObj = new Date(event.event_date + 'T00:00:00');
      
      // If it is in the future relative to event start
      if (targetDateObj < eventDateObj) return false;

      if (event.recurrence_type === 'none') {
        return event.event_date === date;
      } else if (event.recurrence_type === 'daily') {
        return true;
      } else if (event.recurrence_type === 'weekly') {
        return targetDateObj.getDay() === eventDateObj.getDay();
      } else if (event.recurrence_type === 'monthly') {
        return targetDateObj.getDate() === eventDateObj.getDate();
      } else if (event.recurrence_type === 'yearly') {
        return targetDateObj.getMonth() === eventDateObj.getMonth() && 
               targetDateObj.getDate() === eventDateObj.getDate();
      }
      return false;
    });
  },

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const newEvent: Event = { ...event, id: crypto.randomUUID() };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const events = getLocal<Event[]>('athenaeum_events', []);
      events.push(newEvent);
      setLocal('athenaeum_events', events);
      return newEvent;
    }
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const events = getLocal<Event[]>('athenaeum_events', []);
      const idx = events.findIndex(e => e.id === id);
      if (idx === -1) throw new Error('Event not found');
      events[idx] = { ...events[idx], ...updates };
      setLocal('athenaeum_events', events);
      return events[idx];
    }
  },

  async deleteEvent(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    } else {
      const events = getLocal<Event[]>('athenaeum_events', []);
      const filtered = events.filter(e => e.id !== id);
      setLocal('athenaeum_events', filtered);
    }
  },

  // --- DEADLINES ---
  async getDeadlines(date: string): Promise<Deadline[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('deadlines')
        .select('*')
        .eq('due_date', date);
      if (error) throw error;
      return data || [];
    } else {
      const deadlines = getLocal<Deadline[]>('athenaeum_deadlines', []);
      return deadlines.filter(d => d.due_date === date);
    }
  },

  async createDeadline(deadline: Omit<Deadline, 'id'>): Promise<Deadline> {
    const newDeadline: Deadline = { ...deadline, id: crypto.randomUUID() };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('deadlines')
        .insert(newDeadline)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const deadlines = getLocal<Deadline[]>('athenaeum_deadlines', []);
      deadlines.push(newDeadline);
      setLocal('athenaeum_deadlines', deadlines);
      return newDeadline;
    }
  },

  async updateDeadline(id: string, updates: Partial<Deadline>): Promise<Deadline> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('deadlines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const deadlines = getLocal<Deadline[]>('athenaeum_deadlines', []);
      const idx = deadlines.findIndex(d => d.id === id);
      if (idx === -1) throw new Error('Deadline not found');
      deadlines[idx] = { ...deadlines[idx], ...updates };
      setLocal('athenaeum_deadlines', deadlines);
      return deadlines[idx];
    }
  },

  async deleteDeadline(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('deadlines').delete().eq('id', id);
      if (error) throw error;
    } else {
      const deadlines = getLocal<Deadline[]>('athenaeum_deadlines', []);
      const filtered = deadlines.filter(d => d.id !== id);
      setLocal('athenaeum_deadlines', filtered);
    }
  },

  // --- MONTHLY GOALS ---
  async getMonthlyGoals(monthDate: string): Promise<MonthlyGoal[]> {
    // monthDate format: "YYYY-MM-01"
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('month_date', monthDate);
      if (error) throw error;
      return data || [];
    } else {
      const goals = getLocal<MonthlyGoal[]>('athenaeum_mgoals', []);
      return goals.filter(g => g.month_date === monthDate);
    }
  },

  async createMonthlyGoal(goal: Omit<MonthlyGoal, 'id'>): Promise<MonthlyGoal> {
    const newGoal: MonthlyGoal = { ...goal, id: crypto.randomUUID() };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('monthly_goals')
        .insert(newGoal)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const goals = getLocal<MonthlyGoal[]>('athenaeum_mgoals', []);
      goals.push(newGoal);
      setLocal('athenaeum_mgoals', goals);
      return newGoal;
    }
  },

  async updateMonthlyGoal(id: string, updates: Partial<MonthlyGoal>): Promise<MonthlyGoal> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('monthly_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const goals = getLocal<MonthlyGoal[]>('athenaeum_mgoals', []);
      const idx = goals.findIndex(g => g.id === id);
      if (idx === -1) throw new Error('Goal not found');
      goals[idx] = { ...goals[idx], ...updates };
      setLocal('athenaeum_mgoals', goals);
      return goals[idx];
    }
  },

  async deleteMonthlyGoal(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('monthly_goals').delete().eq('id', id);
      if (error) throw error;
    } else {
      const goals = getLocal<MonthlyGoal[]>('athenaeum_mgoals', []);
      const filtered = goals.filter(g => g.id !== id);
      setLocal('athenaeum_mgoals', filtered);
    }
  },

  // --- WEEKLY GOALS ---
  async getWeeklyGoals(weekNum: number, year: number): Promise<WeeklyGoal[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('week_number', weekNum)
        .eq('year', year);
      if (error) throw error;
      return data || [];
    } else {
      const goals = getLocal<WeeklyGoal[]>('athenaeum_wgoals', []);
      return goals.filter(g => g.week_number === weekNum && g.year === year);
    }
  },

  async createWeeklyGoal(goal: Omit<WeeklyGoal, 'id'>): Promise<WeeklyGoal> {
    const newGoal: WeeklyGoal = { ...goal, id: crypto.randomUUID() };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('weekly_goals')
        .insert(newGoal)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const goals = getLocal<WeeklyGoal[]>('athenaeum_wgoals', []);
      goals.push(newGoal);
      setLocal('athenaeum_wgoals', goals);
      return newGoal;
    }
  },

  async updateWeeklyGoal(id: string, updates: Partial<WeeklyGoal>): Promise<WeeklyGoal> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('weekly_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const goals = getLocal<WeeklyGoal[]>('athenaeum_wgoals', []);
      const idx = goals.findIndex(g => g.id === id);
      if (idx === -1) throw new Error('Goal not found');
      goals[idx] = { ...goals[idx], ...updates };
      setLocal('athenaeum_wgoals', goals);
      return goals[idx];
    }
  },

  async deleteWeeklyGoal(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('weekly_goals').delete().eq('id', id);
      if (error) throw error;
    } else {
      const goals = getLocal<WeeklyGoal[]>('athenaeum_wgoals', []);
      const filtered = goals.filter(g => g.id !== id);
      setLocal('athenaeum_wgoals', filtered);
    }
  },

  // --- DAILY AGENDA IMMUTABLE SNAPSHOTS ---
  async getDailyAgenda(date: string): Promise<DailyAgenda | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('daily_agendas')
        .select('*')
        .eq('date', date)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const agendas = getLocal<DailyAgenda[]>('athenaeum_daily_agendas', []);
      return agendas.find(a => a.date === date) || null;
    }
  },

  async saveDailyAgenda(agenda: Omit<DailyAgenda, 'id'>): Promise<DailyAgenda> {
    const newAgenda: DailyAgenda = { ...agenda, id: crypto.randomUUID() };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('daily_agendas')
        .insert(newAgenda)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const agendas = getLocal<DailyAgenda[]>('athenaeum_daily_agendas', []);
      // Remove any existing one for this date to avoid duplicates
      const filtered = agendas.filter(a => a.date !== agenda.date);
      filtered.push(newAgenda);
      setLocal('athenaeum_daily_agendas', filtered);
      return newAgenda;
    }
  },

  async getArchives(): Promise<DailyAgenda[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('daily_agendas')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const agendas = getLocal<DailyAgenda[]>('athenaeum_daily_agendas', []);
      return agendas.sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  // --- MORNING RITUAL COMPLETED TRACKING ---
  async getRitualViewed(date: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user.user) {
        // Auth fallback
        return !!localStorage.getItem(`morning_ritual_completed_${date}`);
      }
      const { data, error: dbError } = await supabase
        .from('users')
        .select('last_ritual_viewed_date')
        .eq('id', user.user.id)
        .single();
      if (dbError) return !!localStorage.getItem(`morning_ritual_completed_${date}`);
      return data?.last_ritual_viewed_date === date;
    } else {
      return !!localStorage.getItem(`morning_ritual_completed_${date}`);
    }
  },

  async setRitualViewed(date: string): Promise<void> {
    // Store in LocalStorage first as backup
    localStorage.setItem(`morning_ritual_completed_${date}`, 'true');
    
    if (isSupabaseConfigured && supabase) {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        await supabase
          .from('users')
          .update({ last_ritual_viewed_date: date })
          .eq('id', user.user.id);
      }
    }
  }
};
