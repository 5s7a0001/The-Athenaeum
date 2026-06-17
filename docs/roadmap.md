# Project Roadmap - The Athenaeum

This document outlines the milestones and releases for The Athenaeum, categorizing features by release phases.

## Phase 1: MVP (Current Implementation)

* ** Tactile Desk Canvas Interface:**
  * Recreate 16:9 aspect ratio Dutch still-life desk composition.
  * Floral arrangement decoration (subtle keyframe sway/candlelight shadows).
  * Marble teacup object link to Focus Mode.
  * Stack of 4 functional books: Monthly Goals, Weekly Goals, Archive, Settings.
  * Permanent flat parchment paper for Month-view Calendar.

* ** Typewriter & Mechanical Animation:**
  * Typewriter carriage frame with scrolling paper.
  * Letter-by-letter printing loop with sound effects.
  * Morning Ritual sequence (room fade-in and typewriter printing; plays once daily).
  * Dynamic key depression animation.
  * Pen ink stroke crossing animation when completing tasks.

* ** Time Blocking & Workload Calculation:**
  * Event sorting (always top of agenda).
  * Time blocks formatted as `HH:MM - HH:MM`.
  * Today's Workload summed automatically from tasks (e.g. `6h 45m`).
  * Daily reflection quote added at the bottom.

* ** Immutable Archive Snapshots:**
  * Self-contained JSON snapshots of generated agendas written to `daily_agendas`.
  * Task changes do not overwrite historical snapshots.

* ** Focus Mode:**
  * Room fades into complete darkness except for a candle-lit spotlight on the teacup.
  * Countdown timer, Pomodoro timer (25/5/45), Custom timer, and Stopwatch modes.

* ** Local Database & Supabase Integration:**
  * Production-ready Supabase auth and postgres adapter.
  * Seamless persistent LocalStorage/IndexedDB fallback for instant local operation.

---

## Phase 2: Reminders & Notifications

* ** Browser & Push Notifications:**
  * Service worker daemon to trigger alerts 5, 10, 15, 30, or 60 minutes before scheduled tasks.
  * Vapid key notification subscription registry.

* ** Expanded Journal Layouts:**
  * Flip-page transitions on book pages with tactile audio feedback.

---

## Phase 3: Advanced Scholar Tools

* ** AI Daily Focus Message:**
  * Local LLM or OpenAI integration to write a short morning quote/reflection based on today's scheduled tasks and priorities.
* ** Sound System Expansion:**
  * Sliders for custom ambiance mixtures (e.g., Rain volume 40% + Library volume 20% + Fireplace volume 10%).
* ** Habit Tracking Ledger:**
  * Ink stamp markers for daily habit achievements.
