"use client";

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useSound } from '../hooks/useSound';
import { dbService } from '../services/db';
import { CreateItemPopup } from './CreateItemPopup';
import { Task, Event, Deadline } from '../types';

export const DeskCalendar: React.FC = () => {
  const store = useAppStore();
  const { playClick, playPenScratch } = useSound();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayItems, setDayItems] = useState<{ tasks: Task[]; events: Event[]; deadlines: Deadline[] }>({
    tasks: [],
    events: [],
    deadlines: []
  });
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  // Load items when selectedDate changes
  const fetchDayItems = async () => {
    const date = store.selectedDate;
    const tasks = await dbService.getTasks(date);
    const events = await dbService.getEvents(date);
    const deadlines = await dbService.getDeadlines(date);
    setDayItems({ tasks, events, deadlines });
  };

  useEffect(() => {
    fetchDayItems();
  }, [store.selectedDate, store.liveTasks, store.liveEvents, store.liveDeadlines]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const totalDays = new Date(year, month + 1, 0).getDate(); // Days in month
    
    // ISO offset adjustment (make Monday index 0)
    // firstDay adjusted so 0 is Monday, 6 is Sunday
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    return { totalDays, adjustedFirstDay };
  };

  const { totalDays, adjustedFirstDay } = getDaysInMonth(currentMonth);

  const daysArray: (number | null)[] = [];
  // Padding for offset
  for (let i = 0; i < adjustedFirstDay; i++) {
    daysArray.push(null);
  }
  // Month days
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push(i);
  }

  const handleDayClick = (day: number) => {
    playClick();
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${formattedDay}`;
    
    store.setSelectedDate(dateStr);
    setShowDayDetail(true);
  };

  // Check if a day has any tasks, events, or deadlines
  const hasMarkers = (day: number) => {
    // Highly efficient check to show small dots on dates
    return false; // Can be expanded or kept minimal to preserve classical look
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDateLabel = new Date(store.selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="w-full bg-[#d4c3a3] border-2 border-[#2f2118]/60 p-4 shadow-lg paper-texture text-[#1c1611] font-garamond select-none relative flex flex-col justify-between h-full min-h-[300px]">
      
      {/* Calendar Header */}
      <div className="flex justify-between items-center border-b border-[#1c1611]/30 pb-2 mb-2">
        <button 
          onClick={handlePrevMonth} 
          className="font-cormorant font-bold text-lg hover:text-[#8b6a3f] transition-colors cursor-pointer"
        >
          🙘
        </button>
        <h3 className="font-cormorant text-xl font-medium tracking-wide uppercase italic">
          {monthName}
        </h3>
        <button 
          onClick={handleNextMonth} 
          className="font-cormorant font-bold text-lg hover:text-[#8b6a3f] transition-colors cursor-pointer"
        >
          🙚
        </button>
      </div>

      {/* Week Day Labels */}
      <div className="grid grid-cols-7 text-center text-xs font-cormorant font-bold tracking-wider mb-2 text-[#1c1611]/60">
        <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-typewriter flex-1">
        {daysArray.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          
          const year = currentMonth.getFullYear();
          const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
          const formattedDay = String(day).padStart(2, '0');
          const dateStr = `${year}-${month}-${formattedDay}`;
          const isSelected = store.selectedDate === dateStr;
          
          return (
            <div
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`h-7 flex items-center justify-center rounded-sm cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-[#8b6a3f] text-[#d4c3a3] font-bold shadow-sm' 
                  : 'hover:bg-[#1c1611]/5'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Selected Day Ledger Panel Overlay */}
      {showDayDetail && (
        <div className="absolute inset-0 bg-[#d4c3a3] border border-[#2f2118]/40 p-4 paper-texture z-10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[#1c1611]/20 pb-1.5 mb-2">
              <span className="font-cormorant font-bold text-[#8b6a3f] italic text-lg">{selectedDateLabel} Entries</span>
              <button 
                onClick={() => { playClick(); setShowDayDetail(false); }}
                className="text-sm font-bold opacity-60 hover:opacity-100"
              >
                ✕ Close
              </button>
            </div>

            {/* Scrollable list of items */}
            <div className="space-y-3 overflow-y-auto max-h-[170px] custom-scrollbar text-left pr-1">
              {dayItems.events.length === 0 && dayItems.tasks.length === 0 && dayItems.deadlines.length === 0 ? (
                <p className="italic text-xs text-[#1c1611]/40 text-center py-6">No scheduled entries.</p>
              ) : (
                <>
                  {dayItems.events.map(e => (
                    <div key={e.id} className="text-xs border-l-2 border-[#b08d57] pl-1.5 py-0.5">
                      <span className="font-typewriter text-[#8b6a3f]">{e.start_time} </span>
                      <span className="font-semibold">{e.title}</span>
                      {e.location && <span className="text-[10px] text-[#1c1611]/50 block">@{e.location}</span>}
                    </div>
                  ))}

                  {dayItems.tasks.map(t => (
                    <div key={t.id} className="text-xs border-l-2 border-[#1c1611]/30 pl-1.5 py-0.5">
                      <span className={`font-semibold ${t.status === 'Completed' ? 'line-through opacity-50' : ''}`}>{t.title}</span>
                      <span className="text-[10px] text-[#1c1611]/50 block">({t.duration_minutes}m duration)</span>
                    </div>
                  ))}

                  {dayItems.deadlines.map(d => (
                    <div key={d.id} className="text-xs border-l-2 border-red-700/60 pl-1.5 py-0.5">
                      <span className="text-red-700/80 font-bold">! </span>
                      <span className="font-semibold">{d.title}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => { playClick(); setShowCreatePopup(true); }}
            className="w-full bg-[#8b6a3f] hover:bg-[#b08d57] text-[#d4c3a3] py-1 border border-[#1c1611] rounded-sm font-cormorant font-bold text-sm tracking-wide active:scale-95 transition-transform"
          >
            + Pen New Entry
          </button>
        </div>
      )}

      {/* Creation popup modal hook */}
      {showCreatePopup && (
        <CreateItemPopup onClose={() => setShowCreatePopup(false)} />
      )}
    </div>
  );
};
