import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { dbService } from '../services/db';
import { PriorityLevel, RecurrenceType } from '../types';
import { useSound } from '../hooks/useSound';

interface CreateItemPopupProps {
  onClose: () => void;
}

export const CreateItemPopup: React.FC<CreateItemPopupProps> = ({ onClose }) => {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const refreshLiveItems = useAppStore((state) => state.refreshLiveItems);
  const { playClick, playPenScratch } = useSound();
  
  const [type, setType] = useState<'task' | 'event' | 'deadline'>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Task specific fields
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [category, setCategory] = useState('Study');

  // Event specific fields
  const [location, setLocation] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  // Format date nicely for header
  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (typeof window !== 'undefined') {
      playPenScratch();
    }

    try {
      if (type === 'task') {
        let scheduled_end: string | undefined = undefined;
        if (startTime) {
          const [h, m] = startTime.split(':').map(Number);
          const endMinTotal = h * 60 + m + Number(duration);
          const endH = String(Math.floor(endMinTotal / 60) % 24).padStart(2, '0');
          const endM = String(endMinTotal % 60).padStart(2, '0');
          scheduled_end = `${endH}:${endM}`;
        }

        await dbService.createTask({
          title,
          description,
          duration_minutes: Number(duration),
          scheduled_start: startTime || undefined,
          scheduled_end,
          priority,
          category,
          status: 'Pending',
          due_date: selectedDate,
        });
      } else if (type === 'event') {
        await dbService.createEvent({
          title,
          description,
          location,
          start_time: eventStartTime,
          end_time: eventEndTime,
          event_date: selectedDate,
          recurrence_type: recurrence,
        });
      } else {
        await dbService.createDeadline({
          title,
          description,
          due_date: selectedDate,
          priority,
          status: 'Pending',
        });
      }

      await refreshLiveItems(selectedDate);
      
      // If we added an item for today, re-sync today's agenda if not generated yet, 
      // or at least refresh store. However, we won't rewrite a typed daily snapshot!
      // This matches requirement: "The printed agenda retains its original content"
      
      onClose();
    } catch (err) {
      console.error("Failed to save item:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-garamond">
      <div 
        className="w-full max-w-lg bg-[#d4c3a3] text-[#1c1611] rounded-sm p-8 shadow-2xl border-4 border-[#2f2118] relative paper-texture max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={() => playClick()}
      >
        {/* Wax Seal close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#8b6a3f] hover:bg-[#b08d57] text-[#d4c3a3] flex items-center justify-center font-cormorant font-bold border border-[#1c1611] shadow-md hover:scale-105 active:scale-95 transition-transform"
          title="Discard"
        >
          X
        </button>

        <h3 className="font-cormorant text-2xl font-bold border-b border-[#1c1611]/20 pb-2 mb-4 text-[#8b6a3f] italic">
          Write to the Record
        </h3>
        
        <p className="text-sm italic mb-6 border-b border-[#1c1611]/10 pb-2">
          {formattedDate}
        </p>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-6 border-b-2 border-[#1c1611]/20">
          {(['task', 'event', 'deadline'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setType(tab); playClick(); }}
              className={`px-4 py-2 font-cormorant text-lg capitalize border-t border-x rounded-t-sm transition-colors -mb-[2px] ${
                type === tab 
                  ? 'bg-[#d4c3a3] border-[#1c1611]/30 border-b-[#d4c3a3] text-[#8b6a3f] font-bold' 
                  : 'bg-[#1c1611]/5 border-transparent text-[#1c1611]/60 hover:text-[#1c1611]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div>
            <label className="block font-cormorant text-lg font-bold mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Study Cisco Revision"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b border-[#1c1611] py-1 focus:outline-none focus:border-[#8b6a3f] placeholder-[#1c1611]/40 font-garamond"
            />
          </div>

          <div>
            <label className="block font-cormorant text-lg font-bold mb-1">Description / Notes</label>
            <textarea
              placeholder="Add scholarly details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-transparent border-b border-[#1c1611] py-1 focus:outline-none focus:border-[#8b6a3f] placeholder-[#1c1611]/40 font-garamond resize-none"
            />
          </div>

          {/* TASK OPTIONS */}
          {type === 'task' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-cormorant text-lg font-bold mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-transparent border-b border-[#1c1611] py-1 focus:outline-none focus:border-[#8b6a3f]"
                >
                  <option value={30} className="bg-[#d4c3a3]">30 Minutes</option>
                  <option value={60} className="bg-[#d4c3a3]">60 Minutes</option>
                  <option value={90} className="bg-[#d4c3a3]">90 Minutes</option>
                  <option value={120} className="bg-[#d4c3a3]">120 Minutes</option>
                  <option value={180} className="bg-[#d4c3a3]">3 Hours</option>
                </select>
              </div>

              <div>
                <label className="block font-cormorant text-lg font-bold mb-1">Scheduled Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-transparent border-b border-[#1c1611] py-[3px] focus:outline-none focus:border-[#8b6a3f]"
                />
              </div>

              <div>
                <label className="block font-cormorant text-lg font-bold mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full bg-transparent border-b border-[#1c1611] py-1 focus:outline-none focus:border-[#8b6a3f]"
                >
                  <option value="low" className="bg-[#d4c3a3]">Low</option>
                  <option value="medium" className="bg-[#d4c3a3]">Medium</option>
                  <option value="high" className="bg-[#d4c3a3]">High</option>
                  <option value="critical" className="bg-[#d4c3a3]">Critical</option>
                </select>
              </div>

              <div>
                <label className="block font-cormorant text-lg font-bold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent border-b border-[#1c1611] py-1 focus:outline-none focus:border-[#8b6a3f]"
                >
                  <option value="Study" className="bg-[#d4c3a3]">Study</option>
                  <option value="Work" className="bg-[#d4c3a3]">Work</option>
                  <option value="Personal" className="bg-[#d4c3a3]">Personal</option>
                  <option value="Fitness" className="bg-[#d4c3a3]">Fitness</option>
                  <option value="Reading" className="bg-[#d4c3a3]">Reading</option>
                </select>
              </div>
            </div>
          )}

          {/* EVENT OPTIONS */}
          {type === 'event' && (
            <div className="space-y-4">
              <div>
                <label className="block font-cormorant text-lg font-bold mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Study Room 4, Zoom"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent border-b border-[#1c1611] py-1 focus:outline-none focus:border-[#8b6a3f] placeholder-[#1c1611]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-cormorant text-lg font-bold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full bg-transparent border-b border-[#1c1611] py-[3px] focus:outline-none focus:border-[#8b6a3f]"
                  />
                </div>

                <div>
                  <label className="block font-cormorant text-lg font-bold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full bg-transparent border-b border-[#1c1611] py-[3px] focus:outline-none focus:border-[#8b6a3f]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-cormorant text-lg font-bold mb-1">Recurrence</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                  className="w-full bg-transparent border-b border-[#1c1611] py-1 focus:outline-none focus:border-[#8b6a3f]"
                >
                  <option value="none" className="bg-[#d4c3a3]">No Recurrence</option>
                  <option value="daily" className="bg-[#d4c3a3]">Daily</option>
                  <option value="weekly" className="bg-[#d4c3a3]">Weekly</option>
                  <option value="monthly" className="bg-[#d4c3a3]">Monthly</option>
                  <option value="yearly" className="bg-[#d4c3a3]">Yearly</option>
                </select>
              </div>
            </div>
          )}

          {/* DEADLINE OPTIONS */}
          {type === 'deadline' && (
            <div>
              <label className="block font-cormorant text-lg font-bold mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full bg-transparent border-b border-[#1c1611] py-1 focus:outline-none focus:border-[#8b6a3f]"
              >
                <option value="low" className="bg-[#d4c3a3]">Low</option>
                <option value="medium" className="bg-[#d4c3a3]">Medium</option>
                <option value="high" className="bg-[#d4c3a3]">High</option>
                <option value="critical" className="bg-[#d4c3a3]">Critical</option>
              </select>
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t border-[#1c1611]/10 mt-6">
            <button
              type="submit"
              className="flex-1 bg-[#8b6a3f] hover:bg-[#b08d57] text-[#d4c3a3] font-cormorant text-lg font-bold py-2 border border-[#1c1611] rounded-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Pen to Parchment
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-transparent hover:bg-[#1c1611]/5 text-[#1c1611] font-cormorant text-lg py-2 border border-[#1c1611]/30 rounded-sm active:scale-[0.98] transition-all"
            >
              Discard Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
