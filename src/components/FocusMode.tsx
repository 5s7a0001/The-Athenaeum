"use client";

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useSound } from '../hooks/useSound';

export const FocusMode: React.FC = () => {
  const store = useAppStore();
  const { playClick } = useSound();
  
  const [customMinutes, setCustomMinutes] = useState('45');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Format timer readouts
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Tick timer every second
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (store.timerIsRunning) {
      interval = setInterval(() => {
        store.tickTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [store.timerIsRunning]);

  const handleStartStop = () => {
    playClick();
    store.setTimerIsRunning(!store.timerIsRunning);
  };

  const handleReset = () => {
    playClick();
    store.setTimerType(store.timerType);
  };

  const handleTimerSelect = (type: typeof store.timerType) => {
    playClick();
    setShowCustomInput(type === 'custom');
    if (type !== 'custom') {
      store.setTimerType(type);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const mins = Number(customMinutes);
    if (!isNaN(mins) && mins > 0) {
      store.setTimerType('custom', mins * 60);
      setShowCustomInput(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070504] flex flex-col items-center justify-center p-8 select-none font-garamond transition-all duration-1000">
      {/* Dim vignette background focusing on the center */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0f0b08]/85 to-[#070504] pointer-events-none" />

      {/* Main Focus Console */}
      <div className="z-10 text-center max-w-md w-full space-y-8 flex flex-col items-center">
        
        {/* Steam and Teacup Illustration */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          
          {/* Steam Particles */}
          <div className="absolute bottom-16 inset-x-0 flex justify-center gap-3">
            <span className="w-[2px] h-10 bg-[#d4c3a3]/30 rounded-full steam-particle" style={{ animationDelay: '0s' }}></span>
            <span className="w-[2px] h-14 bg-[#d4c3a3]/20 rounded-full steam-particle" style={{ animationDelay: '1.2s' }}></span>
            <span className="w-[2px] h-8 bg-[#d4c3a3]/25 rounded-full steam-particle" style={{ animationDelay: '0.6s' }}></span>
          </div>

          {/* SVG Chalice/Teacup */}
          <svg viewBox="0 0 100 100" className="w-24 h-24 text-[#d4c3a3]/85 drop-shadow-[0_0_15px_rgba(176,141,87,0.3)]">
            {/* Cup Bowl */}
            <path 
              d="M20,30 C20,65 30,75 50,75 C70,75 80,65 80,30 Z" 
              fill="currentColor" 
              stroke="#2f2118" 
              strokeWidth="2"
            />
            {/* Marble Veins details */}
            <path d="M25,35 Q32,55 45,70" stroke="#1c1611" strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M75,32 Q70,48 55,62" stroke="#1c1611" strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M48,30 Q35,42 42,55" stroke="#1c1611" strokeWidth="0.5" fill="none" opacity="0.2" />

            {/* Stem */}
            <path d="M47,75 L53,75 L53,88 L47,88 Z" fill="currentColor" stroke="#2f2118" strokeWidth="1" />
            {/* Foot */}
            <ellipse cx="50" cy="88" rx="15" ry="4" fill="currentColor" stroke="#2f2118" strokeWidth="2" />
          </svg>
          
          {/* Candlelight glow projection on Cup */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#b08d57]/15 mix-blend-color-burn pointer-events-none rounded-full blur-sm" />
        </div>

        {/* Focus Task Descriptor */}
        <div className="space-y-2">
          <p className="font-cormorant text-sm tracking-widest text-[#b08d57] uppercase italic">
            Current Focus
          </p>
          <h2 className="font-cormorant text-3xl font-medium tracking-wide text-[#d4c3a3]">
            {store.focusTask ? store.focusTask.title : 'Silent Contemplation'}
          </h2>
          {store.focusTask?.description && (
            <p className="text-sm text-[#d4c3a3]/50 italic max-w-sm mx-auto">
              "{store.focusTask.description}"
            </p>
          )}
        </div>

        {/* Readout Display */}
        <div className="py-6 border-y border-[#b08d57]/20 w-full relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <span className="font-typewriter text-9xl">FOCUS</span>
          </div>
          <span className="font-typewriter text-6xl tracking-widest text-[#b08d57] drop-shadow-[0_0_10px_rgba(176,141,87,0.2)]">
            {store.timerType === 'stopwatch' 
              ? formatTime(store.timerElapsedSeconds) 
              : formatTime(store.timerDurationSeconds)}
          </span>
        </div>

        {/* Custom Timer Input overlay */}
        {showCustomInput && (
          <form onSubmit={handleCustomSubmit} className="flex gap-2 justify-center items-center">
            <input
              type="number"
              min="1"
              max="240"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-16 bg-transparent border-b border-[#b08d57] text-[#d4c3a3] text-center font-typewriter focus:outline-none"
            />
            <span className="text-sm italic text-[#d4c3a3]/60">minutes</span>
            <button 
              type="submit" 
              className="px-3 py-1 font-cormorant border border-[#b08d57] text-[#b08d57] hover:bg-[#b08d57] hover:text-[#0f0b08] rounded-sm transition-colors"
            >
              Set
            </button>
          </form>
        )}

        {/* Timer Control Buttons */}
        <div className="flex gap-4 items-center justify-center">
          <button
            onClick={handleStartStop}
            className="w-28 border border-[#b08d57] text-[#b08d57] hover:bg-[#b08d57] hover:text-[#0f0b08] font-cormorant text-lg py-1.5 rounded-sm transition-all hover:scale-[1.03] active:scale-[0.97]"
          >
            {store.timerIsRunning ? 'Pause' : 'Commence'}
          </button>
          
          <button
            onClick={handleReset}
            className="w-28 border border-[#d4c3a3]/30 text-[#d4c3a3]/75 hover:border-[#d4c3a3] hover:text-[#d4c3a3] font-cormorant text-lg py-1.5 rounded-sm transition-all active:scale-[0.97]"
          >
            Reset
          </button>
        </div>

        {/* Timer Type Selectors */}
        <div className="flex flex-wrap gap-2 justify-center border-t border-[#b08d57]/10 pt-6 max-w-sm">
          {(['pomodoro', 'short-break', 'long-break', 'custom', 'stopwatch'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleTimerSelect(type)}
              className={`px-3 py-1 text-xs font-cormorant italic rounded-full border transition-all ${
                store.timerType === type 
                  ? 'border-[#b08d57] text-[#b08d57] bg-[#b08d57]/10' 
                  : 'border-transparent text-[#d4c3a3]/50 hover:text-[#d4c3a3]'
              }`}
            >
              {type === 'short-break' ? 'Short Break' : type === 'long-break' ? 'Long Break' : type}
            </button>
          ))}
        </div>

        {/* Exit Button */}
        <button
          onClick={() => { playClick(); store.setActiveView('desk'); }}
          className="pt-4 font-cormorant text-[#b08d57]/70 hover:text-[#b08d57] italic transition-colors flex items-center gap-1 group"
        >
          <span>← Return to Study</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">.</span>
        </button>

      </div>
    </div>
  );
};
