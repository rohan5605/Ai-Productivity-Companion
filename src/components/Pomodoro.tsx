import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Timer,
  Moon,
  Sun,
  Flame,
  CheckCircle,
  Clock
} from 'lucide-react';
import { FocusSession } from '../types';

interface PomodoroProps {
  focusSessions: FocusSession[];
  setFocusSessions: React.Dispatch<React.SetStateAction<FocusSession[]>>;
  onNotify: (message: string) => void;
}

export default function Pomodoro({
  focusSessions,
  setFocusSessions,
  onNotify
}: PomodoroProps) {
  // Timer settings
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [totalDuration, setTotalDuration] = useState(25 * 60);

  // Focus Mode Toggle
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Audio settings
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Timer reference
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio Chime synthesizer (PCM synthesized on the fly)
  const synthChime = () => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Multi-frequency bell synth
      const playTone = (freq: number, start: number, duration: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      // Arpeggio chime
      playTone(523.25, now, 0.8, 0.15); // C5
      playTone(659.25, now + 0.15, 0.8, 0.15); // E5
      playTone(783.99, now + 0.3, 0.8, 0.15); // G5
      playTone(1046.50, now + 0.45, 1.2, 0.2); // C6
    } catch (e) {
      console.error('Audio synth error:', e);
    }
  };

  // Synthesize soft ticking noise
  const synthTick = () => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.005, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  };

  // Main tick effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer completed!
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            handleSessionComplete();
            return 0;
          }
          // Soft ticking
          if (prev % 60 === 0 || prev < 10) {
            synthTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, sessionType]);

  // Session completed logger
  const handleSessionComplete = () => {
    synthChime();
    
    const minutesFocused = Math.round(totalDuration / 60);
    const newSession: FocusSession = {
      id: 'session_' + Date.now(),
      durationMinutes: minutesFocused,
      type: sessionType,
      completed: true,
      date: new Date().toISOString()
    };

    setFocusSessions(prev => [newSession, ...prev]);

    if (sessionType === 'work') {
      onNotify(`Focus session complete! You earned ${minutesFocused} productivity minutes. Time for a break!`);
      // Auto-toggle to break
      setSessionType('break');
      setTimeLeft(5 * 60);
      setTotalDuration(5 * 60);
    } else {
      onNotify('Break is over! Time to focus.');
      setSessionType('work');
      setTimeLeft(25 * 60);
      setTotalDuration(25 * 60);
    }
  };

  // Reset controls
  const handleReset = () => {
    setIsRunning(false);
    const defaultMins = sessionType === 'work' ? 25 : 5;
    setTimeLeft(defaultMins * 60);
    setTotalDuration(defaultMins * 60);
  };

  // Set specific configurations
  const configureSession = (type: 'work' | 'short_break' | 'long_break') => {
    setIsRunning(false);
    if (type === 'work') {
      setSessionType('work');
      setTimeLeft(25 * 60);
      setTotalDuration(25 * 60);
    } else if (type === 'short_break') {
      setSessionType('break');
      setTimeLeft(5 * 60);
      setTotalDuration(5 * 60);
    } else {
      setSessionType('break');
      setTimeLeft(15 * 60);
      setTotalDuration(15 * 60);
    }
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate dynamic circular progress dasharray offset
  const progressPercent = timeLeft / totalDuration;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPercent);

  // Focus Mode Classes
  const outerBg = isFocusMode 
    ? 'fixed inset-0 z-50 bg-[#0F1115] flex flex-col items-center justify-center space-y-8 select-none' 
    : 'max-w-6xl mx-auto space-y-6';

  return (
    <div className={outerBg}>
      
      {/* Standard Header Details */}
      {!isFocusMode && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-3xl font-sans font-bold tracking-tight text-[#E2E8F0]">Pomodoro Deep Focus</h2>
            <p className="text-sm text-slate-400 mt-1">
              Structure blocks of intense concentration followed by restorative breaks. Synthesize focus noise to sync brainwaves.
            </p>
          </div>
          <div className="flex space-x-3 shrink-0">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2.5 rounded-xl border flex items-center justify-center transition duration-150 cursor-pointer ${
                audioEnabled 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                  : 'bg-[#232730] border-slate-800 text-slate-500'
              }`}
              title={audioEnabled ? 'Mute chimes & ticks' : 'Unmute chimes & ticks'}
            >
              {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsFocusMode(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-600/10 transition duration-150 cursor-pointer"
            >
              <Maximize2 className="h-4 w-4" />
              <span>Enter Focus Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Timer on one side, instructions on another */}
      <div className={isFocusMode ? 'w-full max-w-lg p-6 space-y-6 text-center' : 'grid grid-cols-1 md:grid-cols-12 gap-6'}>
        
        {/* Left Card: Circular Timer */}
        <div className={isFocusMode ? 'space-y-6' : 'md:col-span-7 bg-[#1A1D24] rounded-3xl border border-slate-800/80 p-8 flex flex-col items-center justify-center shadow-xl relative overflow-hidden'}>
          {isFocusMode && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full uppercase">
                {sessionType === 'work' ? 'DEEP COGNITION BLOCK' : 'RESTORATIVE BREATHING'}
              </span>
              <p className="text-xs text-slate-400 font-sans">Distractions are muted. Focus on the core.</p>
            </div>
          )}

          {/* Quick preset selector */}
          <div className="flex space-x-2 mb-6 z-10">
            <button
              onClick={() => configureSession('work')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                sessionType === 'work' && timeLeft === 25 * 60
                  ? isFocusMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white shadow'
                  : isFocusMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-[#232730] border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Focus 25m
            </button>
            <button
              onClick={() => configureSession('short_break')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                sessionType === 'break' && timeLeft === 5 * 60
                  ? isFocusMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white shadow'
                  : isFocusMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-[#232730] border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Short Break 5m
            </button>
            <button
              onClick={() => configureSession('long_break')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                sessionType === 'break' && timeLeft === 15 * 60
                  ? isFocusMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white shadow'
                  : isFocusMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-[#232730] border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Long Break 15m
            </button>
          </div>

          {/* Dynamic Ring SVG */}
          <div className="relative w-60 h-60 flex items-center justify-center my-4">
            {/* Soft pulsing concentric breathing circle in focus mode */}
            {isFocusMode && isRunning && (
              <div className="absolute inset-0 rounded-full bg-blue-500/5 border border-blue-500/10 animate-ping" />
            )}

            <svg className="w-full h-full transform -rotate-90">
              {/* Back Circle */}
              <circle
                cx="120"
                cy="120"
                r={radius}
                className={isFocusMode ? 'stroke-slate-900' : 'stroke-slate-850'}
                strokeWidth="10"
                fill="transparent"
              />
              {/* Progress Circle */}
              <circle
                cx="120"
                cy="120"
                r={radius}
                className="stroke-blue-500 transition-all duration-300"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Time display */}
            <div className="absolute flex flex-col items-center justify-center space-y-1">
              <span className={`text-4xl font-mono font-bold tracking-tight ${isFocusMode ? 'text-white' : 'text-slate-100'}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                {sessionType === 'work' ? 'FOCUS' : 'BREAK'}
              </span>
            </div>
          </div>

          {/* Primary Action controls */}
          <div className="flex items-center space-x-4 mt-6 z-10">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/15 transition duration-150 cursor-pointer"
            >
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button
              onClick={handleReset}
              className={`p-3 rounded-full border transition duration-150 cursor-pointer ${
                isFocusMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' 
                  : 'bg-[#232730] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Reset Timer"
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Exit focus mode overlay button */}
          {isFocusMode && (
            <div className="flex space-x-4 justify-center items-center pt-8">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
              >
                {audioEnabled ? <Volume2 className="h-4.5 w-4.5 text-blue-400" /> : <VolumeX className="h-4.5 w-4.5" />}
              </button>
              <button
                onClick={() => setIsFocusMode(false)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                <Minimize2 className="h-4 w-4" />
                <span>Exit Deep Focus</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Focus Stats & Activity logs in standard mode */}
        {!isFocusMode && (
          <div className="md:col-span-5 space-y-6">
            
            {/* Focus Habits Guideline card */}
            <div className="bg-[#1A1D24] p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
              <h3 className="font-bold text-[#E2E8F0] flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <span>Cognitive Flow Tips</span>
              </h3>
              <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong className="text-blue-400">The 25/5 Rule:</strong> Keep focus concentrated. Your prefrontal cortex consumes substantial glucose. Resting for 5 minutes regenerates baseline cognition.
                </p>
                <p>
                  <strong className="text-blue-400">Synthesized Chimes:</strong> Our chime frequencies are calibrated near 1046Hz (C6 pitch), which triggers gentle sensory awakening upon focus end without startling you out of deep rest.
                </p>
              </div>
            </div>

            {/* Past focus logs list */}
            <div className="bg-[#1A1D24] rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-800/60 bg-[#1e222a]/40">
                <h4 className="font-bold text-slate-400 text-xs uppercase font-mono tracking-wider">
                  Today's Rehearsal Logs
                </h4>
              </div>
              
              <div className="p-5 space-y-3 max-h-56 overflow-y-auto">
                {focusSessions.length === 0 ? (
                  <p className="text-center py-4 text-slate-500 text-xs">No focus intervals logged today.</p>
                ) : (
                  focusSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-[#232730] border border-slate-800/60 rounded-xl text-xs">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${session.type === 'work' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          <Timer className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 block capitalize">{session.type} Interval</span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-300">{session.durationMinutes}m duration</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
