# Database Schema - The Athenaeum

This document details the PostgreSQL tables, column definitions, constraints, and relationships for both the online Supabase database and the local storage fallback.

## 1. Custom Types

### `recurrence_type` (ENUM)
Allowed values:
* `none`
* `daily`
* `weekly`
* `monthly`
* `yearly`

### `priority_level` (ENUM)
Allowed values:
* `low`
* `medium`
* `high`
* `critical`

### `goal_status` (ENUM)
Allowed values:
* `pending`
* `completed`

---

## 2. Table Definitions

### `users`
Tracks individual scholar profiles and morning ritual completion states.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique user identifier |
| `email` | `text` | `UNIQUE`, `NOT NULL` | Account email address |
| `name` | `text` | | Display name / Scholar name |
| `created_at` | `timestamp with time zone` | `DEFAULT now()` | Account creation date |
| `last_ritual_viewed_date` | `date` | | Tracks the last date the Morning Ritual was viewed |

### `monthly_goals`
Tracks Monthly Goals (pinned parchment board).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique goal identifier |
| `user_id` | `uuid` | `REFERENCES users(id) ON DELETE CASCADE` | Owner ID |
| `title` | `text` | `NOT NULL` | Description of the goal |
| `status` | `goal_status` | `DEFAULT 'pending'` | Current status |
| `month_date` | `date` | `NOT NULL` | The month/year this goal is pinned to (e.g. `2026-06-01`) |
| `created_at` | `timestamp with time zone` | `DEFAULT now()` | Creation timestamp |

### `weekly_goals`
Tracks Weekly Goals (leather journal pages).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique goal identifier |
| `user_id` | `uuid` | `REFERENCES users(id) ON DELETE CASCADE` | Owner ID |
| `title` | `text` | `NOT NULL` | Description of the goal |
| `status` | `goal_status` | `DEFAULT 'pending'` | Current status |
| `week_number` | `integer` | `NOT NULL` | Week number of the year (1-53) |
| `year` | `integer` | `NOT NULL` | Calendar year (e.g. `2026`) |
| `created_at` | `timestamp with time zone` | `DEFAULT now()` | Creation timestamp |

### `tasks`
Tracks individual planning tasks with durations.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique task identifier |
| `user_id` | `uuid` | `REFERENCES users(id) ON DELETE CASCADE` | Owner ID |
| `title` | `text` | `NOT NULL` | Task label |
| `description` | `text` | | Elaborate notes |
| `duration_minutes` | `integer` | `DEFAULT 30` | Duration (e.g., 30, 60, 90, 120 minutes) |
| `scheduled_start` | `time` | | Start time of the block (e.g., `09:00:00`) |
| `priority` | `priority_level` | `DEFAULT 'medium'` | Priority level |
| `category` | `text` | `DEFAULT 'Study'` | e.g. Study, Work, Personal, Reading |
| `status` | `text` | `DEFAULT 'Pending'` | Pending, In Progress, Completed, Archived |
| `due_date` | `date` | `NOT NULL` | Date task is scheduled for |
| `created_at` | `timestamp with time zone` | `DEFAULT now()` | Creation timestamp |
| `completed_at` | `timestamp with time zone` | | Time task was crossed out |

### `events`
Tracks calendar events.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique event identifier |
| `user_id` | `uuid` | `REFERENCES users(id) ON DELETE CASCADE` | Owner ID |
| `title` | `text` | `NOT NULL` | Event title |
| `description` | `text` | | Location or meeting notes |
| `location` | `text` | | Venue or digital link |
| `start_time` | `time` | `NOT NULL` | Event start time (e.g., `17:00:00`) |
| `end_time` | `time` | `NOT NULL` | Event end time (e.g., `18:00:00`) |
| `event_date` | `date` | `NOT NULL` | Reference date |
| `recurrence_type` | `recurrence_type` | `DEFAULT 'none'` | none, daily, weekly, monthly, yearly |

### `deadlines`
Tracks critical deadlines.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique deadline identifier |
| `user_id` | `uuid` | `REFERENCES users(id) ON DELETE CASCADE` | Owner ID |
| `title` | `text` | `NOT NULL` | Deadline title |
| `description` | `text` | | Notes |
| `due_date` | `date` | `NOT NULL` | Expiry date |
| `priority` | `priority_level` | `DEFAULT 'high'` | Priority level |
| `status` | `text` | `DEFAULT 'Pending'` | Pending, Completed, Archived |

### `daily_agendas`
Stores the **immutable snapshot** of the printed typewriter agenda.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique agenda identifier |
| `user_id` | `uuid` | `REFERENCES users(id) ON DELETE CASCADE` | Owner ID |
| `date` | `date` | `NOT NULL` | Date of the agenda (e.g. `2026-06-17`) |
| `snapshot_content` | `jsonb` | `NOT NULL` | Frozen self-contained list of events, tasks, and deadlines |
| `workload` | `text` | `NOT NULL` | Calculated workload string (e.g. `6h 45m`) |
| `reflection` | `text` | `NOT NULL` | The quote or custom reflection printed on the paper |
| `generated_at` | `timestamp with time zone` | `DEFAULT now()` | Date/time of generation |

---

## 3. Relationships & Cascades

* **User Deletion:** If a user profile is deleted from `users`, all goals, tasks, events, deadlines, and daily agenda snapshots are deleted via cascading foreign key rules.
* **Snapshot Stability:** The `daily_agendas` table stores `snapshot_content` as a JSONB value. This contains copies of the task/event records as they were at 5:00 AM. If a task or event is updated or deleted on the main tables, the JSON snapshot inside `daily_agendas` is **never updated**, ensuring historical papers in the typewriter remain unaltered.
