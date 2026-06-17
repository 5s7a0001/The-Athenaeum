export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type GoalStatus = 'pending' | 'completed';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  duration_minutes: number;
  scheduled_start?: string; // "HH:MM" format
  scheduled_end?: string;   // "HH:MM" format
  priority: PriorityLevel;
  category: string; // e.g., "Study", "Work", "Personal"
  status: 'Pending' | 'In Progress' | 'Completed' | 'Archived';
  due_date: string; // "YYYY-MM-DD"
  created_at?: string;
  completed_at?: string;
}

export interface Event {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  location: string;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  event_date: string; // "YYYY-MM-DD"
  recurrence_type: RecurrenceType;
}

export interface Deadline {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  due_date: string; // "YYYY-MM-DD"
  priority: PriorityLevel;
  status: 'Pending' | 'Completed' | 'Archived';
}

export interface MonthlyGoal {
  id: string;
  user_id?: string;
  title: string;
  status: GoalStatus;
  month_date: string; // "YYYY-MM-01"
  created_at?: string;
}

export interface WeeklyGoal {
  id: string;
  user_id?: string;
  title: string;
  status: GoalStatus;
  week_number: number;
  year: number;
  created_at?: string;
}

export interface DailyAgenda {
  id: string;
  user_id?: string;
  date: string; // "YYYY-MM-DD"
  snapshot_content: {
    events: Event[];
    tasks: Task[];
    deadlines: Deadline[];
  };
  workload: string; // "6h 45m"
  reflection: string;
  generated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  last_ritual_viewed_date?: string; // "YYYY-MM-DD"
}
