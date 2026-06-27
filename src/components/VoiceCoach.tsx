import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Send, 
  Plus, 
  Terminal, 
  Volume2, 
  CheckCircle,
  Play,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Task, Note } from '../types';

interface VoiceCoachProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  onStartFocusTimer: (minutes: number) => void;
  onNotify: (message: string) => void;
}

export default function VoiceCoach({
  tasks,
  setTasks,
  notes,
  setNotes,
  onStartFocusTimer,
  onNotify
}: VoiceCoachProps) {
  const [commandText, setCommandText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loadingParse, setLoadingParse] = useState(false);
  
  // Interactive Coach conversation history state
  const [coachLogs, setCoachLogs] = useState<Array<{
    id: string;
    sender: 'user' | 'coach';
    text: string;
    actionResult?: {
      type: 'task' | 'note' | 'timer' | 'info';
      details: string;
    };
  }>>([
    {
      id: 'init',
      sender: 'coach',
      text: "Hello! I am your Proactive AI Productivity Coach. You can speak to me or type commands! Try saying 'Add a study task to read physics by tomorrow night' or 'Start focus timer for 30 minutes'!"
    }
  ]);

  // Audio waveform visualizer elements
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Web Speech Recognition support references
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Configure client-side Speech Recognition if supported by WebKit/Mozilla/Standard
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setCommandText(speechToText);
        handleSendAndParse(speechToText);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        onNotify('Voice transcription could not capture. Please type below instead.');
        stopMicVisualization();
      };

      rec.onend = () => {
        setIsRecording(false);
        stopMicVisualization();
      };

      recognitionRef.current = rec;
    }

    return () => {
      stopMicVisualization();
    };
  }, []);

  // Set up microphone context and visualizer on canvas
  const startMicVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);

      // Trigger standard SpeechRecognition too if available
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      drawWaveform();
    } catch (err) {
      console.error('Mic access error:', err);
      onNotify('Microphone access denied. You can still type commands!');
      setIsRecording(false);
    }
  };

  const stopMicVisualization = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    // Stop speech recognition
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (e) {}
  };

  // HTML5 Canvas visualization draw loop
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#0f172a'; // dark tailwind slate-900
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient styling
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#6366f1'); // indigo-500
        grad.addColorStop(1, '#a78bfa'); // violet-400

        ctx.fillStyle = grad;
        // Mirror waves symmetrically
        ctx.fillRect(x, (height - barHeight) / 2, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    render();
  };

  // Toggle Recording state
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      stopMicVisualization();
    } else {
      setIsRecording(true);
      startMicVisualization();
    }
  };

  // Dispatch Natural Language Parse request
  const handleSendAndParse = async (overrideText?: string) => {
    const textToSubmit = overrideText || commandText;
    if (!textToSubmit.trim()) return;

    // Append User Log
    const userLogId = 'log_' + Date.now();
    setCoachLogs(prev => [...prev, {
      id: userLogId,
      sender: 'user',
      text: textToSubmit
    }]);

    setCommandText('');
    setLoadingParse(true);

    try {
      const res = await fetch('/api/voice/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: textToSubmit,
          currentLocalTime: new Date().toISOString()
        })
      });

      if (!res.ok) {
        throw new Error('Command parser failed. Verify Gemini API key is configured.');
      }

      const parsedResult = await res.json();
      executeParsedAction(parsedResult);

    } catch (err: any) {
      console.error(err);
      setCoachLogs(prev => [...prev, {
        id: 'err_' + Date.now(),
        sender: 'coach',
        text: `I understood your instruction, but could not invoke the server-side processor: "${err.message}". Let's continue scheduling locally.`
      }]);
    } finally {
      setLoadingParse(false);
    }
  };

  // Execute JSON Action returned from Gemini Parser
  const executeParsedAction = (result: any) => {
    const coachLogId = 'coach_res_' + Date.now();
    let textFeedback = '';
    let actionResult: any = undefined;

    if (result.action === 'add_task' && result.taskDetails) {
      const details = result.taskDetails;
      const newTask: Task = {
        id: 'task_coach_' + Date.now(),
        title: details.title,
        description: details.description || 'Dispatched via AI voice coach.',
        category: details.category || 'Study',
        priority: details.priority || 'medium',
        dueDate: details.dueDate.split('T')[0], // Extract just date part
        completed: false,
        estimatedMinutes: details.estimatedMinutes || 30,
        actualMinutesSpent: 0,
        createdAt: new Date().toISOString()
      };

      setTasks(prev => [newTask, ...prev]);
      textFeedback = `Task registered successfully! I have created "${newTask.title}" categorized as ${newTask.category} due on ${newTask.dueDate}.`;
      actionResult = {
        type: 'task',
        details: `${newTask.title} (Priority: ${newTask.priority.toUpperCase()})`
      };

    } else if (result.action === 'add_note' && result.noteDetails) {
      const details = result.noteDetails;
      const newNote: Note = {
        id: 'note_coach_' + Date.now(),
        title: details.title,
        content: details.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setNotes(prev => [newNote, ...prev]);
      textFeedback = `Draft noted! Created study note "${newNote.title}" inside your Notepad Drawer.`;
      actionResult = {
        type: 'note',
        details: newNote.title
      };

    } else if (result.action === 'start_timer' && result.timerDetails) {
      const duration = result.timerDetails.durationMinutes;
      onStartFocusTimer(duration);
      textFeedback = `Focus session activated! Launching your circular Pomodoro timer for ${duration} minutes. Dive in.`;
      actionResult = {
        type: 'timer',
        details: `Focus blocks set for ${duration} minutes.`
      };

    } else {
      textFeedback = "I processed your request, but couldn't map it to an automated planner action. Please specify 'add a task', 'save a note', or 'start Pomodoro'.";
    }

    setCoachLogs(prev => [...prev, {
      id: coachLogId,
      sender: 'coach',
      text: textFeedback,
      actionResult
    }]);

    onNotify('AI Command Executed!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="mb-2">
        <h2 className="text-3xl font-sans font-bold tracking-tight text-[#E2E8F0]">Voice Coach Core</h2>
        <p className="text-sm text-slate-400 mt-1">
          Say or write natural instructions. Gemini acts as an operating system proxy to schedule, write notes, and launch timers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[550px] items-stretch">
        
        {/* Left Card: Active Voice Oscilloscope */}
        <div className="md:col-span-5 bg-[#1A1D24] border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between text-slate-200 shadow-xl">
          
          <div className="flex items-center space-x-2 text-slate-400">
            <Terminal className="h-4.5 w-4.5 text-blue-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Acoustic Audio Feed</span>
          </div>

          {/* Canvas Waveform visualizer wrapper */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 relative min-h-[180px]">
            {isRecording ? (
              <canvas 
                ref={canvasRef} 
                width="280" 
                height="120" 
                className="w-full bg-slate-950 rounded-2xl border border-slate-900 shadow"
              />
            ) : (
              <div className="text-center space-y-3.5 px-4">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mx-auto shadow-inner">
                  <Mic className="h-8 w-8" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Tap below and grant permissions to record. Say: "Add high priority study task Buy Textbooks by next Monday"
                </p>
              </div>
            )}
          </div>

          {/* Big mic record button */}
          <button
            onClick={handleToggleRecord}
            className={`py-3 px-6 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-3 shadow cursor-pointer ${
              isRecording 
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10'
            }`}
          >
            {isRecording ? <MicOff className="h-4.5 w-4.5 shrink-0" /> : <Mic className="h-4.5 w-4.5 shrink-0" />}
            <span>{isRecording ? 'Listening... Tap to finish' : 'Record Spoken Voice Command'}</span>
          </button>
        </div>

        {/* Right Card: Coach Conversation Log */}
        <div className="md:col-span-7 bg-[#1A1D24] border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl overflow-hidden h-full">
          
          {/* Messages Logs area */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
            {coachLogs.map((log) => {
              const isCoach = log.sender === 'coach';
              return (
                <div 
                  key={log.id} 
                  className={`flex ${isCoach ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-md p-4 rounded-2xl text-xs space-y-2 leading-relaxed shadow-sm ${
                    isCoach 
                      ? 'bg-[#232730] border border-slate-800/80 text-slate-200 rounded-tl-none' 
                      : 'bg-blue-600 text-white rounded-tr-none'
                  }`}>
                    <p className="font-sans select-text">{log.text}</p>
                    
                    {/* Log actions results tags */}
                    {log.actionResult && (
                      <div className={`p-2 rounded-lg text-[11px] flex items-center space-x-2 border font-mono ${
                        isCoach 
                          ? 'bg-slate-900/60 border-slate-800 text-slate-300' 
                          : 'bg-blue-700 border-blue-800 text-blue-100'
                      }`}>
                        {log.actionResult.type === 'task' && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
                        {log.actionResult.type === 'note' && <FileText className="h-4 w-4 text-blue-400 shrink-0" />}
                        {log.actionResult.type === 'timer' && <Clock className="h-4 w-4 text-amber-400 shrink-0" />}
                        <span>Executed: {log.actionResult.details}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loadingParse && (
              <div className="flex justify-start">
                <div className="bg-[#232730] border border-slate-800/80 p-3 rounded-2xl rounded-tl-none flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>AI coach interpreting vocal commands...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form manual input command bar */}
          <div className="flex items-center space-x-2 border-t border-slate-800/60 pt-3">
            <input
              type="text"
              value={commandText}
              onChange={e => setCommandText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendAndParse()}
              placeholder="Or type command: 'start timer for 15 minutes'..."
              className="flex-1 px-4 py-2 bg-[#232730] border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-500"
            />
            <button
              onClick={() => handleSendAndParse()}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition cursor-pointer"
              title="Send Command"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
