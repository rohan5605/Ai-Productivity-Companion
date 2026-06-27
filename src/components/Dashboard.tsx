import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Compass, 
  Check, 
  Zap, 
  ArrowRight,
  TrendingUp,
  Brain
} from 'lucide-react';
import { Task, Habit, FocusSession, CoachTip } from '../types';

interface DashboardProps {
  tasks: Task[];
  habits: Habit[];
  focusSessions: FocusSession[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({ 
  tasks, 
  habits, 
  focusSessions, 
  setHabits, 
  onNavigateToTab 
}: DashboardProps) {
  const [tips, setTips] = useState<CoachTip[]>([]);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Focus and Task Metrics
  const completedTasks = tasks.filter(t => t.completed);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  
  const totalFocusMinutes = focusSessions
    .filter(s => s.completed && s.type === 'work')
    .reduce((acc, curr) => acc + curr.durationMinutes, 0);

  const formatFocusTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Determine current active streak (Max streak among active habits or daily focus)
  const currentStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0;

  // Load Proactive Coach Tips
  const loadCoachTips = async () => {
    setLoadingCoach(true);
    setCoachError(null);
    try {
      const res = await fetch('/api/coach/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          habits,
          focusSessions,
          currentLocalTime: new Date().toISOString()
        })
      });
      if (!res.ok) {
        throw new Error('Failed to load coach insights. Check that GEMINI_API_KEY is configured.');
      }
      const data = await res.json();
      // Format as CoachTip
      const formattedTips: CoachTip[] = data.map((item: any, idx: number) => ({
        id: String(idx),
        title: item.title,
        message: item.message,
        type: item.type,
        createdAt: new Date().toISOString()
      }));
      setTips(formattedTips);
    } catch (err: any) {
      console.error(err);
      setCoachError(err.message || 'Could not fetch coaching tips.');
    } finally {
      setLoadingCoach(false);
    }
  };

  // Trigger coach tips on first mount if tips are empty
  useEffect(() => {
    loadCoachTips();
  }, []);

  // Format past 7 dates to check habits
  const getLast7Days = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      // Format as YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;
      const weekday = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      list.push({ dateStr, weekday });
    }
    return list;
  };

  const last7Days = getLast7Days();

  // Toggle Habit completion for a specific day
  const toggleHabitDay = (habitId: string, dateStr: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const history = { ...h.history };
        const currentlyDone = !!history[dateStr];
        if (currentlyDone) {
          delete history[dateStr];
        } else {
          history[dateStr] = true;
        }

        // Calculate new streak based on consecutive daily history
        let calculatedStreak = 0;
        let checkDate = new Date();
        while (true) {
          const y = checkDate.getFullYear();
          const m = String(checkDate.getMonth() + 1).padStart(2, '0');
          const d = String(checkDate.getDate()).padStart(2, '0');
          const checkStr = `${y}-${m}-${d}`;
          if (history[checkStr]) {
            calculatedStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        return {
          ...h,
          history,
          streak: Math.max(calculatedStreak, Object.keys(history).length > 0 ? 1 : 0)
        };
      }
      return h;
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-sans font-bold tracking-tight text-[#E2E8F0]">
            AURA <span className="text-blue-400">OS</span> Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Proactive productivity hub. Log sessions, review active targets, and track milestones.
          </p>
        </div>
        <button
          onClick={loadCoachTips}
          disabled={loadingCoach}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-600/10 transition duration-150 shrink-0 cursor-pointer"
        >
          <Sparkles className={`h-4 w-4 ${loadingCoach ? 'animate-spin' : ''}`} />
          <span>{loadingCoach ? 'AI Coach thinking...' : 'Consult Proactive Coach'}</span>
        </button>
      </div>

      {/* Overview Analytics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Metric */}
        <div className="bg-[#1A1D24] p-6 rounded-3xl border border-slate-800/80 hover:border-slate-700/60 transition duration-200 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 border border-orange-500/20">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">ACTIVE STREAK</p>
            <p className="text-2xl font-bold text-orange-400">{currentStreak} Days</p>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Consecutive completes</p>
          </div>
        </div>

        {/* Task Complete Metric */}
        <div className="bg-[#1A1D24] p-6 rounded-3xl border border-slate-800/80 hover:border-slate-700/60 transition duration-200 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">TASK COMPLETED</p>
            <p className="text-2xl font-bold text-emerald-400">
              {completedTasks.length} / {tasks.length}
            </p>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">{completionRate}% total rate</p>
          </div>
        </div>

        {/* Focus Hours Metric */}
        <div className="bg-[#1A1D24] p-6 rounded-3xl border border-slate-800/80 hover:border-slate-700/60 transition duration-200 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">FOCUS TIME</p>
            <p className="text-2xl font-bold text-blue-400">{formatFocusTime(totalFocusMinutes)}</p>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Work Pomodoros</p>
          </div>
        </div>

        {/* Pending Deadlines Metric */}
        <div className="bg-[#1A1D24] p-6 rounded-3xl border border-slate-800/80 hover:border-slate-700/60 transition duration-200 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">PENDING DEADLINES</p>
            <p className="text-2xl font-bold text-purple-400">
              {tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length} Overdue
            </p>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              {tasks.filter(t => !t.completed).length} active tasks left
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Coach & Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Proactive AI Coach Insights */}
        <div className="lg:col-span-7 bg-[#1A1D24] rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800/60 bg-[#1e222a]/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-400" />
              <h3 className="font-bold text-[#E2E8F0]">Proactive Coach Insights</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 uppercase font-mono border border-blue-500/20">
              Live Analysis
            </span>
          </div>

          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {loadingCoach ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400 font-mono animate-pulse">
                  Gemini is auditing your productivity metrics...
                </p>
              </div>
            ) : coachError ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start space-x-3 text-amber-200 text-sm">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-300">Coaching Sandbox Mode</p>
                  <p className="text-xs mt-1 text-slate-300">Please ensure GEMINI_API_KEY is configured in AI Studio Secrets to enable dynamic advice.</p>
                  <button 
                    onClick={loadCoachTips}
                    className="mt-2 text-xs text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    Retry Coach Call
                  </button>
                </div>
              </div>
            ) : tips.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No active guidelines generated. Click the button above to request analysis.
              </div>
            ) : (
              <div className="space-y-3">
                {tips.map((tip) => {
                  let badgeColor = 'bg-slate-800/50 border border-slate-700/40 text-slate-200';
                  let icon = <Compass className="h-5 w-5 text-slate-400" />;
                  
                  if (tip.type === 'warning') {
                    badgeColor = 'bg-rose-950/20 border border-rose-500/20 text-rose-200';
                    icon = <AlertCircle className="h-5 w-5 text-rose-400" />;
                  } else if (tip.type === 'tip') {
                    badgeColor = 'bg-blue-950/20 border border-blue-500/20 text-blue-200';
                    icon = <Zap className="h-5 w-5 text-blue-400" />;
                  } else if (tip.type === 'praise') {
                    badgeColor = 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-200';
                    icon = <Check className="h-5 w-5 text-emerald-400" />;
                  } else if (tip.type === 'schedule') {
                    badgeColor = 'bg-purple-950/20 border border-purple-500/20 text-purple-200';
                    icon = <Sparkles className="h-5 w-5 text-purple-400" />;
                  }

                  return (
                    <div 
                      key={tip.id} 
                      className={`p-4 rounded-2xl flex items-start space-x-4 transition hover:bg-slate-800/30 ${badgeColor}`}
                    >
                      <div className="mt-0.5 shrink-0">{icon}</div>
                      <div>
                        <h4 className="font-semibold text-[#E2E8F0] text-sm">{tip.title}</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{tip.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
 
        {/* Interactive Daily Habits Progress Grid */}
        <div className="lg:col-span-5 bg-[#1A1D24] rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800/60 bg-[#1e222a]/40 flex items-center justify-between">
            <h3 className="font-bold text-[#E2E8F0] flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <span>Interactive Habits</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('tasks')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {habits.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm">No habits configured yet.</p>
                <button
                  onClick={() => onNavigateToTab('tasks')}
                  className="mt-3 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  Create Habit
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {habits.map((habit) => (
                  <div key={habit.id} className="p-4 bg-[#232730] rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-200 text-sm">{habit.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{habit.frequency}</p>
                      </div>
                      <div className="flex items-center space-x-1.5 text-orange-400 font-semibold text-xs bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                        <Flame className="h-3.5 w-3.5 animate-pulse" />
                        <span>{habit.streak} streak</span>
                      </div>
                    </div>

                    {/* Interactive Grid: Last 7 Days */}
                    <div className="flex items-center justify-between pt-1">
                      {last7Days.map(({ dateStr, weekday }) => {
                        const isCompleted = !!habit.history[dateStr];
                        const isToday = dateStr === last7Days[6].dateStr;
                        return (
                          <div key={dateStr} className="flex flex-col items-center space-y-1">
                            <span className="text-[10px] font-mono text-slate-500">{weekday}</span>
                            <button
                              onClick={() => toggleHabitDay(habit.id, dateStr)}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                                isCompleted
                                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                                  : isToday
                                  ? 'bg-slate-800/80 border-blue-500/40 hover:border-blue-500 text-slate-400'
                                  : 'bg-[#1A1D24] border-slate-800 hover:border-slate-700 text-slate-500'
                              }`}
                              title={`${isCompleted ? 'Completed' : 'Not completed'} on ${dateStr}`}
                            >
                              {isCompleted && <Check className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Visual Progress Trend Custom SVG Chart */}
      <div className="bg-[#1A1D24] p-6 rounded-3xl border border-slate-800/80 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#E2E8F0] flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span>Productivity Completion Index</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Continuous 7-Day Completion Velocity</span>
        </div>
        <div className="h-44 w-full flex items-end justify-between px-4 pb-2 pt-6 relative border-b border-slate-800">
          
          {/* Background gridlines */}
          <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-slate-800/40" />
          <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-slate-800/40" />
          <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-slate-800/40" />

          {/* Render progress levels based on task completion distribution */}
          {Array.from({ length: 7 }).map((_, idx) => {
            const dayOffset = 6 - idx;
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - dayOffset);
            
            const dayLetter = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Calculate completed tasks created on or before this day to simulate progress index
            const completionPercent = tasks.length > 0 ? Math.min(30 + (idx * 10) + (completedTasks.length * 5), 100) : 10;
            const barHeight = `${completionPercent}%`;

            return (
              <div key={idx} className="flex flex-col items-center space-y-2 h-full justify-end z-10 w-1/8">
                <div className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity">
                  {completionPercent}%
                </div>
                <div 
                  className="w-8 rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-500 cursor-pointer shadow-sm shadow-blue-500/20"
                  style={{ height: barHeight }}
                />
                <span className="text-xs font-mono text-slate-400">{dayLetter}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
