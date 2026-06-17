"use client";

import React, { useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useSound } from '../hooks/useSound';
import { Typewriter } from './Typewriter';
import { DeskCalendar } from './DeskCalendar';
import { BookOverlay } from './BookOverlay';
import { FocusMode } from './FocusMode';

export const DeskLayout: React.FC = () => {
  const store = useAppStore();
  const { playClick, playCarriageReturn } = useSound();

  // Load daily tasks, check morning ritual viewed status, compile agenda snapshot
  useEffect(() => {
    const bootstrap = async () => {
      await store.refreshLiveItems(store.selectedDate);
      await store.checkMorningRitual();
      await store.generateTodayAgenda();
    };
    bootstrap();
  }, []);

  const handleBookClick = (view: typeof store.activeView) => {
    playClick();
    store.setActiveView(view);
  };

  const handleTeacupClick = () => {
    playCarriageReturn();
    store.setActiveView('focus');
  };

  // Check if any overlay is active
  const showBookOverlay = [
    'book-monthly', 
    'book-weekly', 
    'archive', 
    'settings'
  ].includes(store.activeView);

  // Morning ritual fade-in container transition
  const fadeClass = store.morningRitualCompleted 
    ? 'opacity-100 transition-opacity duration-1000' 
    : 'animate-[fadeIn_3s_ease-in-out_forwards]';

  return (
    <div className="min-h-screen w-full bg-[#0f0b08] relative overflow-hidden flex items-center justify-center p-4">
      
      {/* 1. Global Vignette & Canvas Shadow */}
      <div className="absolute inset-0 vignette z-30" />
      <div className="absolute inset-0 bg-[#0f0b08]/20 bg-[radial-gradient(ellipse_at_top_left,rgba(176,141,87,0.12)_0%,transparent_60%)] pointer-events-none z-10" />

      {/* 2. Main Desk container (preserving Chiaroscuro Still Life aspect ratios) */}
      <main className={`w-full max-w-6xl h-auto flex flex-col md:grid md:grid-cols-12 gap-8 items-center md:items-stretch py-8 z-20 ${fadeClass}`}>
        
        {/* LEFT COLUMN: Flower Arrangement + Calendar Parchment */}
        <div className="col-span-12 md:col-span-4 flex flex-col justify-between gap-8 order-2 md:order-1">
          
          {/* Top Left: Floral Vase */}
          <div className="flex justify-center md:justify-start items-center">
            <div className="relative group select-none">
              
              {/* Subtle Candleglow cast on the flowers */}
              <div className="absolute inset-0 bg-radial-gradient from-[#b08d57]/10 to-transparent pointer-events-none rounded-full blur-md" />

              {/* SVG flower arrangement sketch */}
              <svg 
                viewBox="0 0 200 240" 
                className="w-48 h-56 text-[#b08d57]/70 filter brightness-[0.75] contrast-[1.1] transition-transform duration-1000 animate-[sway_6s_ease-in-out_infinite_alternate]"
              >
                {/* Vase body */}
                <path d="M70,180 Q60,220 100,220 Q140,220 130,180 Z" fill="#2f2118" stroke="#1c1611" strokeWidth="2" />
                <ellipse cx="100" cy="180" rx="28" ry="8" fill="#1a1410" stroke="#1c1611" strokeWidth="1" />
                
                {/* Stems */}
                <path d="M80,180 Q60,110 50,70" stroke="#1c1611" strokeWidth="2.5" fill="none" />
                <path d="M100,180 L100,60" stroke="#1c1611" strokeWidth="2.5" fill="none" />
                <path d="M120,180 Q140,110 150,80" stroke="#1c1611" strokeWidth="2.5" fill="none" />
                
                {/* Left Rose (white/cream) */}
                <circle cx="50" cy="70" r="16" fill="#d4c3a3" stroke="#2f2118" strokeWidth="1" />
                <path d="M50,58 Q42,70 50,82 Q58,70 50,58" fill="#d4c3a3" opacity="0.8" />
                <circle cx="50" cy="70" r="8" fill="#b08d57" opacity="0.6" />
                
                {/* Center Dahlia (dark red/maroon) */}
                <circle cx="100" cy="55" r="22" fill="#581c16" stroke="#1c1611" strokeWidth="1" />
                <path d="M100,38 C90,55 110,55 100,72 C115,55 85,55 100,38" fill="#3a100c" />
                <circle cx="100" cy="55" r="10" fill="#1c1611" opacity="0.8" />

                {/* Right Rose (cream) */}
                <circle cx="150" cy="80" r="18" fill="#d4c3a3" stroke="#2f2118" strokeWidth="1" />
                <path d="M150,68 Q140,80 150,92 Q160,80 150,68" fill="#d4c3a3" opacity="0.8" />
                <circle cx="150" cy="80" r="9" fill="#b08d57" opacity="0.5" />
                
                {/* Leaves */}
                <path d="M75,140 Q50,140 60,120 Q70,120 75,140" fill="#2f2118" />
                <path d="M125,130 Q150,130 140,110 Q130,110 125,130" fill="#2f2118" />
              </svg>
            </div>
          </div>

          {/* Bottom Left: Permanent Calendar Parchment */}
          <div className="shadow-2xl">
            <DeskCalendar />
          </div>
        </div>

        {/* CENTER COLUMN: The Typewriter */}
        <div className="col-span-12 md:col-span-5 flex items-center justify-center order-1 md:order-2">
          <Typewriter />
        </div>

        {/* RIGHT COLUMN: Stack of Books & Teacup Focus Trigger */}
        <div className="col-span-12 md:col-span-3 flex flex-col justify-between items-center md:items-end gap-8 order-3">
          
          {/* Top Right: Stack of Books */}
          <div className="flex flex-col items-center md:items-end w-full max-w-[240px] space-y-0.5 select-none pt-4">
            
            {/* Book 1 Spine (Monthly Goals) */}
            <div 
              onClick={() => handleBookClick('book-monthly')}
              className="w-full h-11 bg-gradient-to-r from-[#2f2118] via-[#1a1410] to-[#2f2118] border-y border-black/40 rounded-sm cursor-pointer shadow-md transition-all duration-300 transform hover:-translate-x-3 hover:scale-105 active:scale-98 flex items-center px-4 justify-between border-l-8 border-l-[#8b6a3f]"
            >
              <span className="font-cormorant text-xs tracking-widest text-[#b08d57] font-semibold uppercase">
                Ⅰ. Monthly Goals
              </span>
              <span className="text-[10px] text-[#b08d57]/40">🕮</span>
            </div>

            {/* Book 2 Spine (Weekly Goals) */}
            <div 
              onClick={() => handleBookClick('book-weekly')}
              className="w-full h-12 bg-gradient-to-r from-[#1a1410] via-[#2f2118] to-[#1a1410] border-y border-black/40 rounded-sm cursor-pointer shadow-md transition-all duration-300 transform hover:-translate-x-3 hover:scale-105 active:scale-98 flex items-center px-4 justify-between border-l-8 border-l-[#b08d57]"
            >
              <span className="font-cormorant text-xs tracking-widest text-[#b08d57] font-semibold uppercase">
                Ⅱ. Weekly Goals
              </span>
              <span className="text-[10px] text-[#b08d57]/40">🕮</span>
            </div>

            {/* Book 3 Spine (Archive) */}
            <div 
              onClick={() => handleBookClick('archive')}
              className="w-full h-13 bg-gradient-to-r from-[#2f2118] via-[#1a1410] to-[#2f2118] border-y border-black/40 rounded-sm cursor-pointer shadow-md transition-all duration-300 transform hover:-translate-x-3 hover:scale-105 active:scale-98 flex items-center px-4 justify-between border-l-8 border-l-[#8b6a3f]"
            >
              <span className="font-cormorant text-xs tracking-widest text-[#b08d57] font-semibold uppercase">
                Ⅲ. Archives
              </span>
              <span className="text-[10px] text-[#b08d57]/40">🕮</span>
            </div>

            {/* Book 4 Spine (Settings) */}
            <div 
              onClick={() => handleBookClick('settings')}
              className="w-full h-10 bg-gradient-to-r from-[#1a1410] via-[#1a1410] to-[#2f2118] border-y border-black/40 rounded-sm cursor-pointer shadow-md transition-all duration-300 transform hover:-translate-x-3 hover:scale-105 active:scale-98 flex items-center px-4 justify-between border-l-8 border-l-[#8b6a3f]"
            >
              <span className="font-cormorant text-[10px] tracking-widest text-[#b08d57] font-semibold uppercase">
                Ⅳ. Preferences
              </span>
              <span className="text-[10px] text-[#b08d57]/40">⚙</span>
            </div>

          </div>

          {/* Bottom Right: Teacup (Focus Mode Trigger) */}
          <div 
            onClick={handleTeacupClick}
            className="group cursor-pointer flex flex-col items-center select-none pb-4"
            title="Sip tea to commence focus mode"
          >
            {/* Steam animation above the teacup */}
            <div className="h-10 flex justify-center gap-1.5 opacity-40 group-hover:opacity-85 transition-opacity">
              <span className="w-[1.5px] h-6 bg-[#d4c3a3]/30 rounded-full steam-particle" style={{ animationDelay: '0s' }}></span>
              <span className="w-[1.5px] h-8 bg-[#d4c3a3]/20 rounded-full steam-particle" style={{ animationDelay: '1.5s' }}></span>
              <span className="w-[1.5px] h-5 bg-[#d4c3a3]/25 rounded-full steam-particle" style={{ animationDelay: '0.8s' }}></span>
            </div>

            {/* Teacup vector cup */}
            <svg 
              viewBox="0 0 100 80" 
              className="w-20 h-16 text-[#d4c3a3]/75 group-hover:text-[#d4c3a3] group-hover:scale-105 transition-all duration-500 drop-shadow-[0_0_8px_rgba(176,141,87,0.1)]"
            >
              {/* Cup Bowl */}
              <path d="M20,10 C20,45 30,55 50,55 C70,55 80,45 80,10 Z" fill="currentColor" stroke="#1c1611" strokeWidth="1.5" />
              {/* Veins */}
              <path d="M26,16 Q32,32 42,48" stroke="#1c1611" strokeWidth="0.5" fill="none" opacity="0.3" />
              <path d="M74,15 Q68,28 55,42" stroke="#1c1611" strokeWidth="0.5" fill="none" opacity="0.3" />
              
              {/* Foot */}
              <path d="M47,55 L53,55 L53,65 L47,65 Z" fill="currentColor" stroke="#1c1611" strokeWidth="1" />
              <ellipse cx="50" cy="65" rx="12" ry="3.5" fill="currentColor" stroke="#1c1611" strokeWidth="1.5" />
            </svg>

            {/* Subtext */}
            <span className="font-cormorant text-xs italic text-[#b08d57]/60 group-hover:text-[#b08d57] mt-1 transition-colors">
              Sip Tea (Focus)
            </span>
          </div>

        </div>

      </main>

      {/* 3. Modal Overlays */}
      {showBookOverlay && (
        <BookOverlay onClose={() => store.setActiveView('desk')} />
      )}

      {/* 4. Focus Mode overlay */}
      {store.activeView === 'focus' && (
        <FocusMode />
      )}

      {/* Custom fadeIn animation injected inline since Tailwind config is v4 CSS based */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; filter: brightness(0); }
          to { opacity: 1; filter: brightness(1); }
        }
        @keyframes sway {
          from { transform: rotate(-1.5deg) scale(1); }
          to { transform: rotate(1.5deg) scale(1.02); }
        }
      `}</style>
    </div>
  );
};
