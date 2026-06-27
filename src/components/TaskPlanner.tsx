import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  Sparkles, 
  CheckSquare, 
  FileEdit,
  Clock,
  Briefcase,
  User,
  HeartPulse,
  MoreHorizontal,
  Flame,
  AlertCircle
} from 'lucide-react';
import { Task, StudySlot, Habit } from '../types';

interface TaskPlannerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  studySlots: StudySlot[];
  setStudySlots: React.Dispatch<React.SetStateAction<StudySlot[]>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

export default function TaskPlanner({
  tasks,
  setTasks,
  studySlots,
  setStudySlots,
  habits,
  setHabits
}: TaskPlannerProps) {
  // Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [category, setCategory] = useState<Task['category']>('Study');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);

  // Filters
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Habit State
  const [habitName, setHabitName] = useState('');
  const [habitFreq, setHabitFreq] = useState<'daily' | 'weekly'>('daily');

  // Study slot adaptive planning state
  const [loadingAdaptive, setLoadingAdaptive] = useState(false);
  const [adaptiveError, setAdaptiveError] = useState<string | null>(null);

  // Calendar View Month State (default to June 2026 for demonstration match with local date metadata)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // 0-indexed, so 5 = June

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper for rendering calendar days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Generate Calendar Days Array
  const calendarDays = [];
  // Padding cells for previous month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  // Current month cells
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Toggle tasks complete
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Delete task
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Add custom task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !dueDate) return;

    const newTask: Task = {
      id: 'task_' + Date.now(),
      title: taskTitle,
      description: taskDesc,
      category,
      priority,
      dueDate,
      completed: false,
      estimatedMinutes,
      actualMinutesSpent: 0,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    setTaskTitle('');
    setTaskDesc('');
    setDueDate('');
    setEstimatedMinutes(45);
  };

  // Add custom habit
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    const newHabit: Habit = {
      id: 'habit_' + Date.now(),
      name: habitName,
      frequency: habitFreq,
      streak: 0,
      history: {},
      createdAt: new Date().toISOString()
    };

    setHabits(prev => [...prev, newHabit]);
    setHabitName('');
  };

  // Delete habit
  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Run Adaptive Study Plan Call
  const generateAdaptivePlan = async () => {
    setLoadingAdaptive(true);
    setAdaptiveError(null);
    try {
      const activeTasks = tasks.filter(t => !t.completed);
      const res = await fetch('/api/planner/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: activeTasks,
          currentLocalTime: new Date(2026, currentMonth, 27).toISOString(), // sync with simulated local date
          targetDailyStudyHours: 2
        })
      });

      if (!res.ok) {
        throw new Error('Failed to schedule study sessions. Make sure GEMINI_API_KEY is active.');
      }

      const recommendedSlots = await res.json();
      const formattedSlots: StudySlot[] = recommendedSlots.map((slot: any, idx: number) => ({
        id: 'slot_adaptive_' + idx + '_' + Date.now(),
        title: slot.title,
        startTime: slot.startTime,
        endTime: slot.endTime,
        relatedTaskId: slot.relatedTaskId,
        notes: slot.notes
      }));

      // Merge new slots into planner, filter duplicates or clear and populate
      setStudySlots(prev => {
        // Keep user's manually added slots but overwrite previous adaptives to prevent clutter
        const manual = prev.filter(s => !s.id.startsWith('slot_adaptive_'));
        return [...manual, ...formattedSlots];
      });

    } catch (err: any) {
      console.error(err);
      setAdaptiveError(err.message || 'Error generating adaptive planner.');
    } finally {
      setLoadingAdaptive(false);
    }
  };

  // Filter Tasks to display
  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'active' && task.completed) return false;
    if (taskFilter === 'completed' && !task.completed) return false;
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    return true;
  });

  // Category badge colors
  const getCategoryIcon = (cat: Task['category']) => {
    switch (cat) {
      case 'Study': return <Clock className="h-3.5 w-3.5" />;
      case 'Work': return <Briefcase className="h-3.5 w-3.5" />;
      case 'Personal': return <User className="h-3.5 w-3.5" />;
      case 'Health': return <HeartPulse className="h-3.5 w-3.5" />;
      default: return <MoreHorizontal className="h-3.5 w-3.5" />;
    }
  };

  const getPriorityBadge = (p: Task['priority']) => {
    switch (p) {
      case 'high': return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">HIGH</span>;
      case 'medium': return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">MEDIUM</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/50">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-sans font-bold tracking-tight text-[#E2E8F0]">Adaptive Planner</h2>
          <p className="text-sm text-slate-400 mt-1">
            Track milestones, register daily habits, and request AI to adapt study slots to deadlines.
          </p>
        </div>
        <button
          onClick={generateAdaptivePlan}
          disabled={loadingAdaptive}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-600/10 transition duration-150 shrink-0 cursor-pointer"
        >
          <Sparkles className={`h-4 w-4 ${loadingAdaptive ? 'animate-spin' : ''}`} />
          <span>{loadingAdaptive ? 'AI scheduling study slots...' : 'Adaptive AI Schedule Planner'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Task Creator & List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Task Addition Form */}
          <div className="bg-[#1A1D24] p-6 rounded-3xl border border-slate-800/80 shadow-xl">
            <h3 className="font-bold text-[#E2E8F0] mb-4 flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-400" />
              <span>Create New Task</span>
            </h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Task Name</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g., Study Chemistry Chapter 4: Organic Mechanisms"
                    className="mt-1 w-full px-4 py-2 bg-[#232730] border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Description / Notes</label>
                  <textarea
                    value={taskDesc}
                    onChange={e => setTaskDesc(e.target.value)}
                    placeholder="Key concepts or deadline sub-tasks..."
                    rows={2}
                    className="mt-1 w-full px-4 py-2 bg-[#232730] border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 bg-[#232730] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Study">Study</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Health">Health</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 bg-[#232730] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-[#232730] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Estimate (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 bg-[#232730] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/10 transition duration-150 cursor-pointer"
              >
                Add Project / Task
              </button>
            </form>
          </div>

          {/* Task List View */}
          <div className="bg-[#1A1D24] rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden">
            
            {/* Filter Headers */}
            <div className="p-5 border-b border-slate-800/60 bg-[#1e222a]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-[#E2E8F0] flex items-center space-x-2">
                <CheckSquare className="h-5 w-5 text-blue-400" />
                <span>Planner Milestones</span>
              </h3>
              
              <div className="flex items-center space-x-3 text-xs">
                {/* Status Filter */}
                <div className="bg-[#232730] p-1 rounded-lg flex space-x-1 border border-slate-800">
                  {(['active', 'completed', 'all'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTaskFilter(tab)}
                      className={`px-2.5 py-1 rounded-md font-semibold capitalize transition cursor-pointer ${
                        taskFilter === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-[#232730] px-2.5 py-1.5 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Tasks Container */}
            <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No matches for current selections.
                </div>
              ) : (
                filteredTasks.map(task => {
                  const isOverdue = !task.completed && new Date(task.dueDate) < new Date();
                  return (
                    <div 
                      key={task.id} 
                      className={`p-4 flex items-start space-x-4 transition hover:bg-slate-800/20 ${
                        task.completed ? 'opacity-55' : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150 cursor-pointer ${
                          task.completed 
                            ? 'bg-blue-600 border-blue-600 text-white shadow shadow-blue-600/30'
                            : 'bg-[#232730] border-slate-700 hover:border-blue-500'
                        }`}
                      >
                        {task.completed && <Check className="h-3 w-3" />}
                      </button>
                      
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-semibold text-slate-200 truncate ${
                            task.completed ? 'line-through text-slate-500' : ''
                          }`}>
                            {task.title}
                          </h4>
                          {getPriorityBadge(task.priority)}
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>
                        )}
                        
                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-500">
                          <span className="flex items-center space-x-1 font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                            {getCategoryIcon(task.category)}
                            <span>{task.category}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.estimatedMinutes}m estimate</span>
                          </span>
                          <span className={`flex items-center space-x-1 ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                            <Calendar className="h-3 w-3" />
                            <span>Due: {task.dueDate} {isOverdue && '(Overdue!)'}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Habit Manager */}
          <div className="bg-[#1A1D24] p-6 rounded-3xl border border-slate-800/80 shadow-xl">
            <h3 className="font-bold text-[#E2E8F0] mb-4 flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
              <span>Configure Habits</span>
            </h3>
            
            <form onSubmit={handleAddHabit} className="flex items-center space-x-3 mb-4">
              <input
                type="text"
                required
                value={habitName}
                onChange={e => setHabitName(e.target.value)}
                placeholder="e.g., Log focus 30m, Drink water..."
                className="flex-1 px-4 py-2 bg-[#232730] border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <select
                value={habitFreq}
                onChange={e => setHabitFreq(e.target.value as any)}
                className="px-3 py-2 bg-[#232730] border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shrink-0 transition cursor-pointer"
              >
                Create
              </button>
            </form>

            <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
              {habits.length === 0 ? (
                <p className="text-center py-4 text-slate-500 text-xs">No habits configured.</p>
              ) : (
                habits.map(h => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold text-slate-300">{h.name}</span>
                      <span className="ml-2.5 text-[9px] font-mono bg-orange-500/10 text-orange-400 px-1.5 py-0.5 border border-orange-500/20 rounded-full uppercase">
                        {h.frequency}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteHabit(h.id)}
                      className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Calendar & Study Blocks */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Interactive Calendar Month Widget */}
          <div className="bg-[#1A1D24] p-6 rounded-3xl border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#E2E8F0] flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <span>{months[currentMonth]} {currentYear}</span>
              </h3>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(y => y - 1);
                    } else {
                      setCurrentMonth(m => m - 1);
                    }
                  }}
                  className="p-1 px-2.5 rounded-lg border border-slate-800 bg-[#232730] hover:bg-slate-800 text-slate-300 font-mono text-sm cursor-pointer"
                >
                  &lt;
                </button>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(y => y + 1);
                    } else {
                      setCurrentMonth(m => m + 1);
                    }
                  }}
                  className="p-1 px-2.5 rounded-lg border border-slate-800 bg-[#232730] hover:bg-slate-800 text-slate-300 font-mono text-sm cursor-pointer"
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* Calendar Grid Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 font-mono mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-10 bg-slate-900/40 rounded-lg border border-slate-800/30" />;
                }

                // Check if any task deadline falls on this date
                const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dailyTasks = tasks.filter(t => t.dueDate === dayStr);
                const dailySlots = studySlots.filter(s => s.startTime.startsWith(dayStr));

                const hasIncompleteTask = dailyTasks.some(t => !t.completed);
                const hasStudySlot = dailySlots.length > 0;

                return (
                  <div 
                    key={`day-${day}`} 
                    className="h-11 bg-[#232730] hover:bg-blue-500/10 rounded-lg p-1 flex flex-col justify-between border border-slate-800/80 hover:border-blue-500/30 transition cursor-pointer relative"
                  >
                    <span className="text-[11px] font-mono text-slate-400">{day}</span>
                    
                    {/* Visual Indicators Inside Calendar Day Cell */}
                    <div className="flex items-center space-x-1">
                      {hasIncompleteTask && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title={`${dailyTasks.length} deadline due`} />
                      )}
                      {hasStudySlot && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${dailySlots.length} study session allocated`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Study Slots Feed */}
          <div className="bg-[#1A1D24] rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800/60 bg-[#1e222a]/40">
              <h3 className="font-bold text-[#E2E8F0] flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <span>Scheduled Study Blocks</span>
              </h3>
            </div>

            <div className="p-5 space-y-4 max-h-[350px] overflow-y-auto">
              {adaptiveError && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-xs flex items-start space-x-2">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Could not generate dynamic allocations. Ensure GEMINI_API_KEY is defined in AI Studio Settings secrets.</span>
                </div>
              )}

              {studySlots.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No active study slots scheduled. Use the "Adaptive AI Schedule Planner" above to distribute blocks intelligently.
                </div>
              ) : (
                studySlots.map(slot => {
                  const formatSlotTime = (isoStr: string) => {
                    try {
                      const dateObj = new Date(isoStr);
                      return dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + 
                        ' (' + dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ')';
                    } catch (e) {
                      return isoStr;
                    }
                  };

                  return (
                    <div key={slot.id} className="p-4 bg-[#232730] rounded-2xl border border-slate-850 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 truncate max-w-[190px]">{slot.title}</span>
                        <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 px-2 py-0.5 border border-blue-500/20 rounded-full uppercase">
                          STUDY SLOT
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                      </div>
                      {slot.notes && (
                        <p className="text-xs text-slate-300 leading-relaxed bg-[#1A1D24] p-2 rounded-lg border border-slate-800">
                          {slot.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
