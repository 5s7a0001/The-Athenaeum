import { useEffect, useRef } from 'react';
import { useAppStore } from '../lib/store';

export const useSound = () => {
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const soundVolume = useAppStore((state) => state.soundVolume);
  const ambientType = useAppStore((state) => state.ambientType);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  const initCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // 1. Synthesize Typewriter Key Click
  const playClick = () => {
    if (!soundEnabled) return;
    try {
      const ctx = initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Brief noise click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500 + Math.random() * 300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(5, ctx.currentTime);

      gain.gain.setValueAtTime(soundVolume * 0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.warn("Audio Context Click failed to play", e);
    }
  };

  // 2. Synthesize Carriage Return Slide + Bell
  const playCarriageReturn = () => {
    if (!soundEnabled) return;
    try {
      const ctx = initCtx();
      const now = ctx.currentTime;

      // Bell (Ding!)
      const bellOsc1 = ctx.createOscillator();
      const bellOsc2 = ctx.createOscillator();
      const bellGain = ctx.createGain();

      bellOsc1.type = 'sine';
      bellOsc1.frequency.setValueAtTime(2200, now);

      bellOsc2.type = 'sine';
      bellOsc2.frequency.setValueAtTime(2800, now);

      bellGain.gain.setValueAtTime(soundVolume * 0.35, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      bellOsc1.connect(bellGain);
      bellOsc2.connect(bellGain);
      bellGain.connect(ctx.destination);

      bellOsc1.start(now);
      bellOsc2.start(now);
      bellOsc1.stop(now + 0.7);
      bellOsc2.stop(now + 0.7);

      // Carriage Slide (Scrape)
      const bufferSize = ctx.sampleRate * 0.4; // 400ms slide
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);

      const slideGain = ctx.createGain();
      slideGain.gain.setValueAtTime(soundVolume * 0.05, now);
      slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      noise.connect(filter);
      filter.connect(slideGain);
      slideGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.4);
    } catch (e) {
      console.warn("Audio Context Carriage Return failed to play", e);
    }
  };

  // 3. Synthesize Fountain Pen Writing Scratch
  const playPenScratch = () => {
    if (!soundEnabled) return;
    try {
      const ctx = initCtx();
      const now = ctx.currentTime;

      const bufferSize = ctx.sampleRate * 0.25; // 250ms scratch stroke
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.25);
      filter.Q.setValueAtTime(4, now);

      const gain = ctx.createGain();
      // Emulate starting force, holding stroke, and lifting the nib
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(soundVolume * 0.09, now + 0.03);
      gain.gain.setValueAtTime(soundVolume * 0.08, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.25);
    } catch (e) {
      console.warn("Audio Context Pen Scratch failed to play", e);
    }
  };

  // Synthesize Background Loops
  const startAmbientSynth = (type: 'rain' | 'library' | 'fireplace') => {
    try {
      const ctx = initCtx();
      const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise buffer
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      if (type === 'rain') {
        // Rain is filtered brownian/pink noise with soft high hiss
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        gain.gain.value = soundVolume * 0.12;
      } else if (type === 'fireplace') {
        // Fireplace is low-frequency rumble + crackle pops
        filter.type = 'bandpass';
        filter.frequency.value = 150;
        filter.Q.value = 1;
        gain.gain.value = soundVolume * 0.15;
        
        // Add crackling sparks
        const sparkInterval = setInterval(() => {
          if (getRefValue(ambientSourceRef) === null || !soundEnabled || getRefValue(audioCtxRef)?.state === 'suspended') {
            clearInterval(sparkInterval);
            return;
          }
          if (Math.random() > 0.6) {
            triggerSpark(ctx, soundVolume);
          }
        }, 120);
      } else {
        // Library is deep warm room rumble
        filter.type = 'lowpass';
        filter.frequency.value = 250;
        gain.gain.value = soundVolume * 0.08;
      }

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      
      ambientSourceRef.current = source;
      ambientGainRef.current = gain;
    } catch (e) {
      console.warn("Ambient Audio loop failed", e);
    }
  };

  // Helper for TS scope
  const getRefValue = <T>(ref: React.MutableRefObject<T | null>): T | null => ref.current;

  const triggerSpark = (ctx: AudioContext, vol: number) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000 + Math.random() * 3000, ctx.currentTime);
      gain.gain.setValueAtTime(vol * 0.012, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.015);
    } catch (e) {}
  };

  const stopAmbient = () => {
    if (ambientSourceRef.current) {
      try {
        ambientSourceRef.current.stop();
      } catch (e) {}
      ambientSourceRef.current = null;
    }
    ambientGainRef.current = null;
  };

  // Sync volume or ambient type changes
  useEffect(() => {
    if (!soundEnabled || ambientType === 'none') {
      stopAmbient();
    } else {
      stopAmbient();
      startAmbientSynth(ambientType);
    }
    return () => {
      stopAmbient();
    };
  }, [ambientType, soundEnabled]);

  // Adjust volume gain node in real-time if volume slider is adjusted
  useEffect(() => {
    if (ambientGainRef.current) {
      const volCoeff = ambientType === 'rain' ? 0.12 : ambientType === 'fireplace' ? 0.15 : 0.08;
      ambientGainRef.current.gain.setValueAtTime(soundVolume * volCoeff, audioCtxRef.current?.currentTime || 0);
    }
  }, [soundVolume, ambientType]);

  return {
    playClick,
    playCarriageReturn,
    playPenScratch
  };
};
