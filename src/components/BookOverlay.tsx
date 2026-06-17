"use client";

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { dbService } from '../services/db';
import { MonthlyGoal, WeeklyGoal, DailyAgenda } from '../types';
import { useSound } from '../hooks/useSound';

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

interface BookOverlayProps {
  onClose: () => void;
}

export const BookOverlay: React.FC<BookOverlayProps> = ({ onClose }) => {
  const store = useAppStore();
  const { playClick, playPenScratch } = useSound();
  
  const [mgoals, setMgoals] = useState<MonthlyGoal[]>([]);
  const [wgoals, setWgoals] = useState<WeeklyGoal[]>([]);
  const [archives, setArchives] = useState<DailyAgenda[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inputs
  const [newGoalText, setNewGoalText] = useState('');
  
  // Refresh goals when view changes
  const fetchGoalsData = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const goalsMonth = `${year}-${month}-01`;

    if (store.activeView === 'book-monthly') {
      const data = await dbService.getMonthlyGoals(goalsMonth);
      setMgoals(data);
    } else if (store.activeView === 'book-weekly') {
      // Get ISO week
      const d = new Date();
      const dateCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = dateCopy.getUTCDay() || 7;
      dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(dateCopy.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil((((dateCopy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      
      const data = await dbService.getWeeklyGoals(weekNum, year);
      setWgoals(data);
    } else if (store.activeView === 'archive') {
      const data = await dbService.getArchives();
      setArchives(data);
    }
  };

  useEffect(() => {
    fetchGoalsData();
  }, [store.activeView]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    playPenScratch();

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    if (store.activeView === 'book-monthly') {
      await dbService.createMonthlyGoal({
        title: newGoalText,
        status: 'pending',
        month_date: `${year}-${month}-01`,
      });
    } else if (store.activeView === 'book-weekly') {
      const d = new Date();
      const dateCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = dateCopy.getUTCDay() || 7;
      dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(dateCopy.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil((((dateCopy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      
      await dbService.createWeeklyGoal({
        title: newGoalText,
        status: 'pending',
        week_number: weekNum,
        year,
      });
    }
    
    setNewGoalText('');
    fetchGoalsData();
  };

  const handleToggleMonthlyGoal = async (id: string, currentStatus: string) => {
    playPenScratch();
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    await dbService.updateMonthlyGoal(id, { status: newStatus as any });
    fetchGoalsData();
  };

  const handleToggleWeeklyGoal = async (id: string, currentStatus: string) => {
    playPenScratch();
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    await dbService.updateWeeklyGoal(id, { status: newStatus as any });
    fetchGoalsData();
  };

  const handleLoadArchive = (agenda: DailyAgenda) => {
    playClick();
    // Load archive snapshot directly into typewriter active document
    store.setSelectedDate(agenda.date);
    useAppStore.setState({ activeTypewriterAgenda: agenda });
    onClose();
  };

  const filteredArchives = archives.filter(a => 
    a.date.includes(searchQuery) || 
    a.reflection.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-garamond animate-fade-in">
      <div 
        className="w-full max-w-4xl h-[85vh] bg-[#d4c3a3] rounded-sm shadow-2xl border-8 border-[#2f2118] relative flex flex-col paper-texture overflow-hidden"
        onClick={() => playClick()}
      >
        
        {/* Book spine ribbon design on top */}
        <div className="h-6 bg-[#2f2118]/15 border-b border-[#1c1611]/10 flex items-center justify-center text-xs tracking-widest text-[#1c1611]/50 italic">
          THE ATHENAEUM ARCHIVES
        </div>

        {/* Close Wax Seal */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-12 h-12 rounded-full bg-[#8b6a3f] hover:bg-[#b08d57] text-[#d4c3a3] flex items-center justify-center font-cormorant font-bold border-2 border-[#1c1611] shadow-lg hover:scale-105 active:scale-95 transition-transform z-10"
        >
          X
        </button>

        {/* Book pages container */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* 1. MONTHLY GOALS PAGE */}
          {store.activeView === 'book-monthly' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <h2 className="font-cormorant text-4xl font-medium italic text-[#8b6a3f]">
                  Monthly Pinned Goals
                </h2>
                <p className="text-sm italic text-[#1c1611]/60">
                  Month of {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Pin board goals list */}
              <div className="bg-[#1c1611]/5 p-6 rounded-sm border border-[#1c1611]/10 shadow-inner space-y-4 min-h-[300px]">
                {mgoals.length === 0 ? (
                  <p className="text-center italic text-[#1c1611]/40 py-12">
                    No goal is pinned to the parchment board.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mgoals.map((goal) => (
                      <div 
                        key={goal.id}
                        onClick={() => handleToggleMonthlyGoal(goal.id, goal.status)}
                        className="p-4 bg-[#d4c3a3] border border-[#2f2118]/20 rounded-sm shadow-sm relative cursor-pointer hover:border-[#8b6a3f] hover:shadow transition-all group overflow-hidden"
                      >
                        {/* Wax Seal pin mockup */}
                        <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border border-[#1c1611] ${
                          goal.status === 'completed' ? 'bg-[#8b6a3f]' : 'bg-[#1c1611]/20'
                        } transition-colors`} />

                        <p className={`font-garamond text-lg pr-6 ${
                          goal.status === 'completed' ? 'line-through text-[#1c1611]/40 italic' : 'text-[#1c1611]'
                        }`}>
                          {goal.title}
                        </p>

                        {/* Ink blot style underline on completed */}
                        {goal.status === 'completed' && (
                          <div className="absolute bottom-1 inset-x-4 h-[2px] bg-[#8b6a3f]/30" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Write new goal form */}
              <form onSubmit={handleAddGoal} className="flex gap-3 pt-4 border-t border-[#1c1611]/10">
                <input
                  type="text"
                  placeholder="Pin another monthly quest..."
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  className="flex-1 bg-transparent border-b border-[#1c1611] py-2 focus:outline-none focus:border-[#8b6a3f] placeholder-[#1c1611]/40 font-garamond"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#8b6a3f] hover:bg-[#b08d57] text-[#d4c3a3] font-cormorant text-lg font-bold border border-[#1c1611] rounded-sm active:scale-[0.97] transition-all"
                >
                  Pin Goal
                </button>
              </form>
            </div>
          )}

          {/* 2. WEEKLY GOALS PAGE */}
          {store.activeView === 'book-weekly' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <h2 className="font-cormorant text-4xl font-medium italic text-[#8b6a3f]">
                  Weekly Scholarly Ledger
                </h2>
                <p className="text-sm italic text-[#1c1611]/60">
                  Week {getWeekNumber(new Date())} | Year {new Date().getFullYear()}
                </p>
              </div>

              {/* Journal ruled pages layout */}
              <div className="bg-[#d4c3a3] border border-[#2f2118]/30 shadow-md p-8 relative min-h-[300px] paper-texture">
                {/* Rule lines */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1c1611]/5 to-transparent bg-[size:100%_2rem] pointer-events-none" />

                <div className="relative space-y-3 pt-2">
                  {wgoals.length === 0 ? (
                    <p className="text-center italic text-[#1c1611]/40 py-12">
                      The ledger pages remain clean and empty.
                    </p>
                  ) : (
                    wgoals.map((goal) => (
                      <div 
                        key={goal.id}
                        onClick={() => handleToggleWeeklyGoal(goal.id, goal.status)}
                        className="flex items-center gap-3 py-1 cursor-pointer group"
                      >
                        {/* Fountain pen circle checkbox mockup */}
                        <div className={`w-5 h-5 rounded-full border border-[#1c1611] flex items-center justify-center ${
                          goal.status === 'completed' ? 'bg-[#8b6a3f]/10' : 'bg-transparent'
                        }`}>
                          {goal.status === 'completed' && (
                            <span className="text-xs font-bold text-[#8b6a3f]">✓</span>
                          )}
                        </div>

                        <p className={`font-garamond text-xl ${
                          goal.status === 'completed' ? 'line-through text-[#1c1611]/40 italic' : 'text-[#1c1611]'
                        }`}>
                          {goal.title}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Write weekly goal form */}
              <form onSubmit={handleAddGoal} className="flex gap-3 pt-4 border-t border-[#1c1611]/10">
                <input
                  type="text"
                  placeholder="Record another weekly objective..."
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  className="flex-1 bg-transparent border-b border-[#1c1611] py-2 focus:outline-none focus:border-[#8b6a3f] placeholder-[#1c1611]/40 font-garamond"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#8b6a3f] hover:bg-[#b08d57] text-[#d4c3a3] font-cormorant text-lg font-bold border border-[#1c1611] rounded-sm active:scale-[0.97] transition-all"
                >
                  Write Goal
                </button>
              </form>
            </div>
          )}

          {/* 3. ARCHIVE LEDGER */}
          {store.activeView === 'archive' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <h2 className="font-cormorant text-4xl font-medium italic text-[#8b6a3f]">
                  The Historical Records
                </h2>
                <p className="text-sm italic text-[#1c1611]/60">
                  Select a past day to load its immutable snapshot into the typewriter.
                </p>
              </div>

              {/* Search filter */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by date (YYYY-MM-DD) or reflection quote..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-b border-[#1c1611] py-2 focus:outline-none focus:border-[#8b6a3f] placeholder-[#1c1611]/40 font-garamond"
                />
              </div>

              {/* Scrollable list */}
              <div className="border border-[#1c1611]/20 max-h-[350px] overflow-y-auto custom-scrollbar bg-[#1c1611]/5 divide-y divide-[#1c1611]/10">
                {filteredArchives.length === 0 ? (
                  <p className="text-center italic text-[#1c1611]/40 py-12">
                    No archive registers match your search query.
                  </p>
                ) : (
                  filteredArchives.map((agenda) => {
                    const agendaDateStr = new Date(agenda.date + 'T00:00:00').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    
                    return (
                      <div 
                        key={agenda.id}
                        onClick={() => handleLoadArchive(agenda)}
                        className="p-4 hover:bg-[#d4c3a3] hover:text-[#8b6a3f] cursor-pointer transition-colors group flex justify-between items-center"
                      >
                        <div>
                          <p className="font-cormorant font-bold text-lg">{agendaDateStr}</p>
                          <p className="text-xs text-[#1c1611]/50 italic truncate max-w-xs md:max-w-md">
                            "{agenda.reflection}"
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs border border-[#1c1611]/30 rounded-sm px-2 py-0.5 font-typewriter">
                            {agenda.workload}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 4. SETTINGS PAGE */}
          {store.activeView === 'settings' && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="text-center space-y-2 mb-8">
                <h2 className="font-cormorant text-4xl font-medium italic text-[#8b6a3f]">
                  Scholar's Library Prefs
                </h2>
              </div>

              <div className="space-y-6 text-left">
                {/* Audio Toggles */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-cormorant text-xl">Sound Effects</span>
                    <button 
                      onClick={() => { playClick(); store.toggleSound(); }}
                      className={`w-14 h-7 rounded-full transition-colors relative border border-[#1c1611] ${
                        store.soundEnabled ? 'bg-[#8b6a3f]' : 'bg-[#1c1611]/10'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5.5 h-5.5 rounded-full bg-[#d4c3a3] border border-[#1c1611] transition-transform ${
                        store.soundEnabled ? 'translate-x-7' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="font-cormorant text-lg block">Master Volume ({Math.round(store.soundVolume * 100)}%)</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={store.soundVolume}
                      onChange={(e) => store.setSoundVolume(Number(e.target.value))}
                      className="w-full accent-[#8b6a3f]"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="font-cormorant text-lg block">Room Ambiance Loop</span>
                    <select
                      value={store.ambientType}
                      onChange={(e) => store.setAmbientType(e.target.value as any)}
                      className="w-full bg-transparent border-b border-[#1c1611] py-1 focus:outline-none focus:border-[#8b6a3f]"
                    >
                      <option value="none" className="bg-[#d4c3a3]">No Ambiance</option>
                      <option value="rain" className="bg-[#d4c3a3]">Rainstorm against leaded glass</option>
                      <option value="library" className="bg-[#d4c3a3]">Silent Archive library hum</option>
                      <option value="fireplace" className="bg-[#d4c3a3]">Fireplace crackle sparks</option>
                    </select>
                  </div>
                </div>

                {/* Database Info */}
                <div className="pt-6 border-t border-[#1c1611]/10 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#1c1611]/60">Storage Connection:</span>
                    <span className="font-bold text-[#8b6a3f]">
                      {dbService.getTasks.name.includes('supabase') || !!process.env.NEXT_PUBLIC_SUPABASE_URL
                        ? 'Supabase Cloud (PostgreSQL)' 
                        : 'LocalStorage Sandbox (Persistent Offline)'}
                    </span>
                  </div>
                </div>

                {/* Reset Buttons for Testing */}
                <div className="pt-4 flex gap-2">
                  <button
                    onClick={() => {
                      playClick();
                      const today = new Date().toISOString().split('T')[0];
                      localStorage.removeItem(`morning_ritual_completed_${today}`);
                      store.checkMorningRitual();
                      onClose();
                    }}
                    className="flex-1 bg-transparent hover:bg-[#1c1611]/5 text-[#1c1611]/80 hover:text-[#1c1611] border border-[#1c1611]/30 py-2 text-xs rounded-sm active:scale-95 transition-all font-typewriter"
                  >
                    Reset Morning Ritual
                  </button>
                  <button
                    onClick={() => {
                      playClick();
                      if (confirm("Reset local repository and discard all tasks?")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="flex-1 bg-transparent hover:bg-red-500/10 text-red-700/80 hover:text-red-700 border border-red-700/30 py-2 text-xs rounded-sm active:scale-95 transition-all font-typewriter"
                  >
                    Erase Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="h-10 bg-[#2f2118]/15 border-t border-[#1c1611]/10 flex items-center justify-center text-xs tracking-wider text-[#1c1611]/40">
          Click outside to return to study desk
        </div>
      </div>
    </div>
  );
};
