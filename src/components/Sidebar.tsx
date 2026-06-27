import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FileText, 
  BrainCircuit, 
  Timer, 
  Mic, 
  Settings,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail?: string;
}

export default function Sidebar({ activeTab, setActiveTab, userEmail }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Planner & Tasks', icon: CalendarDays },
    { id: 'notepad', label: 'Smart Notepad', icon: FileText },
    { id: 'study', label: 'Study Deck & Quizzes', icon: BrainCircuit },
    { id: 'pomodoro', label: 'Pomodoro Focus', icon: Timer },
    { id: 'voice', label: 'Voice Coach', icon: Mic },
  ];

  return (
    <aside id="app-sidebar" className="w-64 bg-[#14161C] text-slate-200 flex flex-col h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/60 flex items-center space-x-3">
        <div className="p-2 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h1 className="font-sans font-bold text-lg tracking-wider text-[#E2E8F0]">
            AURA <span className="text-blue-400 font-mono text-xs">OS</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono">Revision Cycle Active</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                  : 'text-slate-400 border border-transparent hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span className="font-sans">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/60 bg-[#0F1115]/80">
        <div className="flex items-center space-x-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-400 font-mono text-xs font-bold flex items-center justify-center border border-blue-500/20">
            {userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AI'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-sans font-semibold text-slate-200 truncate">
              {userEmail || 'Productive User'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono truncate">
              Secure Cloud Environment
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
