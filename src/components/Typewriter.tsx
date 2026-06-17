"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { useSound } from '../hooks/useSound';
import { Task, Event, Deadline } from '../types';
import { dbService } from '../services/db';

export const Typewriter: React.FC = () => {
  const store = useAppStore();
  const { playClick, playCarriageReturn, playPenScratch } = useSound();
  
  const [lines, setLines] = useState<string[]>([]);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [currentLineText, setCurrentLineText] = useState('');
  
  const lineIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate lines to type out if morning ritual is running
  useEffect(() => {
    if (!store.activeTypewriterAgenda) return;
    
    const agenda = store.activeTypewriterAgenda;
    const content = agenda.snapshot_content;
    const formattedDate = new Date(agenda.date + 'T00:00:00')
      .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      .toUpperCase();

    const compiledLines: string[] = [
      "==================================",
      "          THE ATHENAEUM           ",
      "==================================",
      `DATE: ${formattedDate}`,
      `WORKLOAD: ${agenda.workload.toUpperCase()}`,
      "----------------------------------",
      ""
    ];

    if (content.events && content.events.length > 0) {
      compiledLines.push("EVENTS:");
      content.events.forEach(e => {
        compiledLines.push(`  ${e.start_time} - ${e.end_time}  ${e.title}`);
        if (e.location) compiledLines.push(`        Loc: ${e.location}`);
      });
      compiledLines.push("");
    }

    if (content.tasks && content.tasks.length > 0) {
      compiledLines.push("TASKS:");
      content.tasks.forEach(t => {
        const timeBlock = t.scheduled_start && t.scheduled_end 
          ? `${t.scheduled_start}-${t.scheduled_end}` 
          : `${t.duration_minutes}m`;
        compiledLines.push(`  [ ] ${timeBlock}  ${t.title}`);
      });
      compiledLines.push("");
    }

    if (content.deadlines && content.deadlines.length > 0) {
      compiledLines.push("DEADLINES:");
      content.deadlines.forEach(d => {
        compiledLines.push(`  ! [ ] ${d.title} (${d.priority.toUpperCase()})`);
      });
      compiledLines.push("");
    }

    compiledLines.push("──────────────────────────────────");
    compiledLines.push("TODAY'S REFLECTION:");
    compiledLines.push(`"${agenda.reflection}"`);
    compiledLines.push("==================================");

    setLines(compiledLines);
  }, [store.activeTypewriterAgenda]);

  // Main typing loop
  useEffect(() => {
    if (store.morningRitualCompleted || lines.length === 0) {
      // If ritual is already completed, show all lines immediately
      setVisibleLines(lines);
      setCurrentLineText('');
      store.setIsTyping(false);
      return;
    }

    store.setIsTyping(true);
    setVisibleLines([]);
    setCurrentLineText('');
    lineIndexRef.current = 0;
    charIndexRef.current = 0;

    let typingInterval: NodeJS.Timeout | null = null;

    const typeChar = () => {
      const currentLine = lines[lineIndexRef.current];
      
      // If line is empty or divider, type it quickly
      if (!currentLine || currentLine.trim() === '' || currentLine.startsWith('==') || currentLine.startsWith('--') || currentLine.startsWith('──')) {
        setVisibleLines(prev => [...prev, currentLine || '']);
        playCarriageReturn();
        lineIndexRef.current++;
        charIndexRef.current = 0;
        
        if (lineIndexRef.current >= lines.length) {
          store.completeMorningRitual();
          store.setIsTyping(false);
          if (typingInterval) clearInterval(typingInterval);
        }
        return;
      }

      if (charIndexRef.current < currentLine.length) {
        const char = currentLine[charIndexRef.current];
        setCurrentLineText(prev => prev + char);
        playClick();
        charIndexRef.current++;
      } else {
        // Line completed, flush to visibleLines
        setVisibleLines(prev => [...prev, currentLine]);
        setCurrentLineText('');
        playCarriageReturn();
        lineIndexRef.current++;
        charIndexRef.current = 0;

        if (lineIndexRef.current >= lines.length) {
          store.completeMorningRitual();
          store.setIsTyping(false);
          if (typingInterval) clearInterval(typingInterval);
        }
      }
    };

    // Typing speed: random jitter between 35ms and 75ms
    typingInterval = setInterval(() => {
      typeChar();
    }, 55);

    return () => {
      if (typingInterval) clearInterval(typingInterval);
    };
  }, [lines, store.morningRitualCompleted]);

  // Auto-scroll paper up as we type
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLines, currentLineText]);

  // Handle checking off interactive tasks from the typewriter paper
  const handleTypewriterTaskClick = async (lineText: string) => {
    if (store.isTyping || !store.activeTypewriterAgenda) return;
    
    // Find the task inside our snapshot tasks
    const tasks = store.activeTypewriterAgenda.snapshot_content.tasks || [];
    const task = tasks.find(t => lineText.includes(t.title));
    if (task) {
      // Look up live status
      const live = store.liveTasks.find(lt => lt.id === task.id) || task;
      if (live.status !== 'Completed') {
        playPenScratch();
        await store.completeTask(task.id);
      }
    }
  };

  const isTaskCompleted = (lineText: string): boolean => {
    if (!store.activeTypewriterAgenda) return false;
    const tasks = store.activeTypewriterAgenda.snapshot_content.tasks || [];
    const task = tasks.find(t => lineText.includes(t.title));
    if (task) {
      const live = store.liveTasks.find(lt => lt.id === task.id);
      return live?.status === 'Completed';
    }
    return false;
  };

  const renderPaperLine = (line: string, index: number) => {
    const isCompleted = isTaskCompleted(line);
    const isTaskLine = line.trim().startsWith('[ ]') || line.trim().startsWith('! [ ]');
    
    return (
      <div 
        key={index} 
        onClick={() => isTaskLine && handleTypewriterTaskClick(line)}
        className={`relative inline-block w-full py-[1px] leading-relaxed transition-all duration-300 ${
          isTaskLine ? 'cursor-pointer hover:bg-[#1c1611]/5' : ''
        } ${isCompleted ? 'text-[#1c1611]/40 italic' : ''}`}
      >
        <span>{line}</span>
        
        {/* Animated Ink fountain pen cross-out */}
        {isCompleted && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <line 
              x1="5%" 
              y1="50%" 
              x2="95%" 
              y2="45%" 
              stroke="#1c1611" 
              strokeWidth="2" 
              strokeLinecap="round"
              className="ink-stroke"
            />
          </svg>
        )}
      </div>
    );
  };

  // Keyboard details: rows of keys
  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '←'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '↵']
  ];

  return (
    <div className="w-full max-w-2xl bg-gradient-to-b from-[#1a1410] to-[#0f0b08] border-t-4 border-x-4 border-[#2f2118] rounded-t-lg shadow-2xl relative p-4 flex flex-col items-center">
      
      {/* 1. Metal Carriage Shaft and Rollers */}
      <div className="w-[108%] h-6 bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-700 border border-zinc-600 rounded-full absolute -top-3 z-20 flex justify-between px-6 shadow-md">
        <div className="w-4 h-full bg-zinc-900 border border-zinc-600 rounded-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer" onClick={() => playCarriageReturn()} title="Carriage return lever" />
        <div className="w-4 h-full bg-zinc-900 border border-zinc-600 rounded-sm" />
      </div>

      {/* 2. Emerging Paper Carriage Slot */}
      <div className="w-full bg-[#110d0a] h-60 border border-[#2f2118]/50 shadow-inner rounded-sm relative overflow-hidden flex justify-center z-10">
        
        {/* Behind Frame Metal Sheet */}
        <div className="absolute inset-x-0 bottom-0 h-4 bg-zinc-950 border-t border-zinc-800 z-10" />

        {/* The Paper Sheet */}
        <div 
          ref={scrollRef}
          className="w-11/12 h-56 bg-[#d4c3a3] border-x border-[#1c1611]/15 text-[#1c1611] font-typewriter p-6 shadow-lg overflow-y-auto custom-scrollbar flex flex-col paper-texture select-text relative"
          style={{ transform: 'translateY(-10px)' }}
        >
          {/* Paper shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none" />

          {/* Lines printed */}
          <div className="flex-1 space-y-0.5 text-left text-sm tracking-wide">
            {visibleLines.map((line, idx) => renderPaperLine(line, idx))}
            
            {/* The active character currently typing line */}
            {currentLineText && (
              <div className="relative inline-block w-full leading-relaxed">
                <span>{currentLineText}</span>
                <span className="w-2 h-4 bg-[#1c1611] inline-block animate-pulse ml-0.5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today snapshot notification if viewing an archive */}
      {store.activeTypewriterAgenda && store.todayAgenda && store.activeTypewriterAgenda.date !== store.todayAgenda.date && (
        <button
          onClick={() => {
            playCarriageReturn();
            useAppStore.setState({ activeTypewriterAgenda: store.todayAgenda! });
            store.setSelectedDate(store.todayAgenda!.date);
          }}
          className="z-20 -mt-2 mb-2 bg-[#8b6a3f] hover:bg-[#b08d57] text-[#d4c3a3] px-4 py-1 text-xs font-cormorant border border-[#1c1611] shadow hover:scale-[1.02] transition-transform"
        >
          ← Return to Today's Agenda
        </button>
      )}

      {/* 3. Typewriter Front Rim & Keyboard */}
      <div className="w-[102%] bg-[#1a1410] border-4 border-[#2f2118] rounded-b-lg p-6 shadow-inner z-20 flex flex-col items-center">
        
        {/* Metal Logo Plate */}
        <div className="border border-[#b08d57]/30 px-6 py-0.5 mb-5 rounded-sm">
          <span className="font-cormorant text-xs tracking-widest text-[#b08d57]">THE ATHENAEUM</span>
        </div>

        {/* Keyboard Keys */}
        <div className="space-y-3 w-full max-w-lg">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-2">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    playClick();
                    if (key === '↵') playCarriageReturn();
                  }}
                  className={`w-10 h-10 rounded-full bg-gradient-to-b from-[#1a1410] to-[#0f0b08] border-2 border-[#b08d57]/50 hover:border-[#b08d57] text-[#d4c3a3] font-cormorant font-bold flex items-center justify-center shadow-md cursor-pointer transition-all active:translate-y-[2px] active:shadow-inner ${
                    key === '↵' ? 'w-14' : key === '←' ? 'w-12 text-sm' : 'text-lg'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
          {/* Spacebar */}
          <div className="flex justify-center">
            <button
              onClick={() => playClick()}
              className="w-48 h-8 bg-gradient-to-b from-[#1a1410] to-[#0f0b08] border-2 border-[#b08d57]/40 hover:border-[#b08d57] rounded-full shadow-md cursor-pointer active:translate-y-[2px] active:shadow-inner"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
