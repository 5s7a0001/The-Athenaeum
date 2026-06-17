import { create } from 'zustand';
import { Task, Event, Deadline, MonthlyGoal, WeeklyGoal, DailyAgenda } from '../types';
import { dbService } from '../services/db';

type ViewType = 'desk' | 'book-monthly' | 'book-weekly' | 'archive' | 'settings' | 'focus';
type TimerType = 'pomodoro' | 'short-break' | 'long-break' | 'custom' | 'stopwatch';

interface AppState {
  activeView: ViewType;
  selectedDate: string; // YYYY-MM-DD
  todayAgenda: DailyAgenda | null;
  activeTypewriterAgenda: DailyAgenda | null;
  morningRitualCompleted: boolean;
  isTyping: boolean;
  
  // Sound controls
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  ambientType: 'none' | 'rain' | 'library' | 'fireplace';
  
  // Focus timer states
  timerType: TimerType;
  timerDurationSeconds: number; // For countdown
  timerElapsedSeconds: number;  // For stopwatch
  timerIsRunning: boolean;
  focusTask: Task | null;
  
  // Live items for Calendar & popup
  liveTasks: Task[];
  liveEvents: Event[];
  liveDeadlines: Deadline[];
  liveMonthlyGoals: MonthlyGoal[];
  liveWeeklyGoals: WeeklyGoal[];

  // Actions
  setActiveView: (view: ViewType) => void;
  setSelectedDate: (date: string) => Promise<void>;
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
  setAmbientType: (type: 'none' | 'rain' | 'library' | 'fireplace') => void;
  setIsTyping: (isTyping: boolean) => void;
  setFocusTask: (task: Task | null) => void;
  setTimerType: (type: TimerType, customSeconds?: number) => void;
  setTimerIsRunning: (running: boolean) => void;
  tickTimer: () => void;
  
  // Data actions
  refreshLiveItems: (date: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  generateTodayAgenda: () => Promise<void>;
  checkMorningRitual: () => Promise<void>;
  completeMorningRitual: () => Promise<void>;
}

const REFLECTIONS = [
  "Per aspera ad astra. (Through hardships to the stars)",
  "The obstacle is the path.",
  "Scientia ipsa potentia est. (Knowledge itself is power)",
  "Amor fati. (Love of fate)",
  "Acta non verba. (Deeds, not words)",
  "In quietness and confidence shall be your strength.",
  "Dimidium facti qui coepit habet. (He who has begun has half done)",
  "Tempus fugit. (Time flies)"
];

export const useAppStore = create<AppState>((set, get) => ({
  activeView: 'desk',
  selectedDate: new Date().toISOString().split('T')[0],
  todayAgenda: null,
  activeTypewriterAgenda: null,
  morningRitualCompleted: true, // Start assumed completed to avoid flicker, corrected in checkMorningRitual
  isTyping: false,
  
  soundEnabled: true,
  soundVolume: 0.5,
  ambientType: 'none',
  
  timerType: 'pomodoro',
  timerDurationSeconds: 25 * 60,
  timerElapsedSeconds: 0,
  timerIsRunning: false,
  focusTask: null,
  
  liveTasks: [],
  liveEvents: [],
  liveDeadlines: [],
  liveMonthlyGoals: [],
  liveWeeklyGoals: [],

  setActiveView: (view) => set({ activeView: view }),
  
  setSelectedDate: async (date) => {
    set({ selectedDate: date });
    await get().refreshLiveItems(date);
  },
  
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setSoundVolume: (volume) => set({ soundVolume: volume }),
  setAmbientType: (type) => set({ ambientType: type }),
  setIsTyping: (isTyping) => set({ isTyping }),
  setFocusTask: (task) => set({ focusTask: task }),
  
  setTimerType: (type, customSeconds) => {
    let duration = 25 * 60;
    if (type === 'short-break') duration = 5 * 60;
    else if (type === 'long-break') duration = 15 * 60;
    else if (type === 'custom' && customSeconds) duration = customSeconds;
    
    set({
      timerType: type,
      timerDurationSeconds: duration,
      timerElapsedSeconds: 0,
      timerIsRunning: false
    });
  },
  
  setTimerIsRunning: (running) => set({ timerIsRunning: running }),
  
  tickTimer: () => {
    const { timerType, timerDurationSeconds, timerElapsedSeconds, timerIsRunning } = get();
    if (!timerIsRunning) return;
    
    if (timerType === 'stopwatch') {
      set({ timerElapsedSeconds: timerElapsedSeconds + 1 });
    } else {
      if (timerDurationSeconds > 0) {
        set({ timerDurationSeconds: timerDurationSeconds - 1 });
      } else {
        set({ timerIsRunning: false });
        // Handle timer completion (e.g. sound alert)
        if (typeof window !== 'undefined' && get().soundEnabled) {
          const bell = new Audio('/sounds/bell.mp3');
          bell.volume = get().soundVolume;
          bell.play().catch(() => {});
        }
      }
    }
  },

  refreshLiveItems: async (date) => {
    const tasks = await dbService.getTasks(date);
    const events = await dbService.getEvents(date);
    const deadlines = await dbService.getDeadlines(date);
    
    const year = new Date(date).getFullYear();
    const month = String(new Date(date).getMonth() + 1).padStart(2, '0');
    
    // ISO format for goals: YYYY-MM-01
    const goalsMonth = `${year}-${month}-01`;
    const mgoals = await dbService.getMonthlyGoals(goalsMonth);
    
    // Week calculations
    const d = new Date(date);
    const dateCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dateCopy.getUTCDay() || 7;
    dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dateCopy.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((dateCopy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    
    const wgoals = await dbService.getWeeklyGoals(weekNum, year);
    
    set({
      liveTasks: tasks,
      liveEvents: events,
      liveDeadlines: deadlines,
      liveMonthlyGoals: mgoals,
      liveWeeklyGoals: wgoals
    });
  },

  completeTask: async (taskId) => {
    const { selectedDate, activeTypewriterAgenda, todayAgenda } = get();
    
    // 1. Update the live task
    const updated = await dbService.updateTask(taskId, { 
      status: 'Completed', 
      completed_at: new Date().toISOString() 
    });
    
    // 2. Update liveTasks list in state
    set((state) => ({
      liveTasks: state.liveTasks.map(t => t.id === taskId ? updated : t)
    }));

    // 3. Mark the task as visually completed in today's typewriter or loaded agenda snapshot
    // But DO NOT update the text snapshot itself, just trigger crossing out on the UI.
    // We achieve this by mapping tasks completion dynamically in the component, matching activeTypewriterAgenda tasks.
  },

  generateTodayAgenda: async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if snapshot already exists
    const existing = await dbService.getDailyAgenda(today);
    if (existing) {
      set({ 
        todayAgenda: existing,
        activeTypewriterAgenda: existing 
      });
      return;
    }

    // Pipeline compilation
    const tasks = await dbService.getTasks(today);
    const events = await dbService.getEvents(today);
    const deadlines = await dbService.getDeadlines(today);

    // Calculate time blocks for tasks and events
    // Events: sorted by start time
    const sortedEvents = [...events].sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    // Tasks: sorted by scheduled start time if available
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.scheduled_start && b.scheduled_start) {
        return a.scheduled_start.localeCompare(b.scheduled_start);
      }
      if (a.scheduled_start) return -1;
      if (b.scheduled_start) return 1;
      return a.title.localeCompare(b.title);
    });

    const sortedDeadlines = [...deadlines].sort((a, b) => a.priority.localeCompare(b.priority));

    // Calculate total duration workload
    let totalMin = 0;
    tasks.forEach(t => {
      totalMin += t.duration_minutes || 0;
    });
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    const workloadStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    // Reflection quote
    const randQuote = REFLECTIONS[Math.floor(Math.random() * REFLECTIONS.length)];

    const snapshot = {
      date: today,
      snapshot_content: {
        events: sortedEvents,
        tasks: sortedTasks,
        deadlines: sortedDeadlines
      },
      workload: workloadStr,
      reflection: randQuote
    };

    const saved = await dbService.saveDailyAgenda(snapshot);
    set({
      todayAgenda: saved,
      activeTypewriterAgenda: saved
    });
  },

  checkMorningRitual: async () => {
    const today = new Date().toISOString().split('T')[0];
    const completed = await dbService.getRitualViewed(today);
    set({ morningRitualCompleted: completed });
  },

  completeMorningRitual: async () => {
    const today = new Date().toISOString().split('T')[0];
    await dbService.setRitualViewed(today);
    set({ morningRitualCompleted: true });
  }
}));
