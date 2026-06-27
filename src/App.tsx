import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskPlanner from './components/TaskPlanner';
import Notepad from './components/Notepad';
import FlashcardsView from './components/FlashcardsView';
import Pomodoro from './components/Pomodoro';
import VoiceCoach from './components/VoiceCoach';
import { Task, Habit, FocusSession, StudySlot, Deck, Flashcard, Quiz, QuizAttempt, Note } from './types';
import { Sparkles, Info, X } from 'lucide-react';

// Seeding Initial Data for rich, immediate functionality
const INITIAL_TASKS: Task[] = [
  {
    id: 'seed_task_1',
    title: 'Study Physics Chapter 6: Thermodynamics',
    description: 'Review entropy formulations, Carnot cycle efficiency, and complete practice set 3.',
    category: 'Study',
    priority: 'high',
    dueDate: '2026-06-28', // tomorrow relative to June 27 local date
    completed: false,
    estimatedMinutes: 60,
    actualMinutesSpent: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed_task_2',
    title: 'Prepare Biochemistry Presentation',
    description: 'Complete slide decks on Enzyme Inhibition kinetics, competitive vs non-competitive graphs.',
    category: 'Study',
    priority: 'medium',
    dueDate: '2026-06-29',
    completed: false,
    estimatedMinutes: 90,
    actualMinutesSpent: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed_task_3',
    title: 'Log Health Metrics & Workouts',
    category: 'Health',
    priority: 'low',
    dueDate: '2026-06-27',
    completed: true,
    estimatedMinutes: 10,
    actualMinutesSpent: 10,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_HABITS: Habit[] = [
  {
    id: 'seed_habit_1',
    name: 'Log 30 Minutes Focused Studying',
    frequency: 'daily',
    streak: 3,
    history: {
      '2026-06-24': true,
      '2026-06-25': true,
      '2026-06-26': true
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed_habit_2',
    name: 'Read Scientific Publications',
    frequency: 'weekly',
    streak: 1,
    history: {
      '2026-06-25': true
    },
    createdAt: new Date().toISOString()
  }
];

const INITIAL_NOTES: Note[] = [
  {
    id: 'seed_note_1',
    title: 'Thermodynamics Core Concepts',
    content: `Thermodynamics is the branch of physics that deals with heat, work, and temperature, and their relation to energy, entropy, and radiation.

1. First Law: Conservation of Energy (dU = dQ - dW). Energy can change forms but cannot be created or destroyed.
2. Second Law: The entropy of any isolated system always increases. Heat flows spontaneously from hot to cold bodies.
3. Carnot Cycle: An idealized reversible thermodynamic cycle. Efficiency is given by: n = 1 - Tc / Th, where Tc is cold reservoir temp and Th is hot reservoir temp in Kelvins.`,
    summary: `• **First Law of Thermodynamics:** Conservation of Energy, energy changes forms but cannot be created or destroyed.
• **Second Law of Thermodynamics:** Entropy of isolated systems always increases, heat flows hot to cold spontaneously.
• **Carnot Efficiency Formula:** Max efficiency depends strictly on reservoir temperatures: n = 1 - (Tc / Th).`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_DECKS: Deck[] = [
  {
    id: 'seed_deck_1',
    title: 'Thermodynamics Mastery',
    description: 'Flashcard review of standard equations, entropic properties, and Carnot efficiency.',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'seed_card_1',
    question: 'What is the First Law of Thermodynamics?',
    answer: 'It is the law of Conservation of Energy, stating dU = dQ - dW, meaning energy cannot be created or destroyed.',
    deckId: 'seed_deck_1',
    easeFactor: 2.5,
    intervalDays: 3,
    nextReviewDate: new Date().toISOString(),
    reviewsCount: 1
  },
  {
    id: 'seed_card_2',
    question: 'Define entropy based on the Second Law.',
    answer: 'Entropy is a measure of system disorder. The Second Law dictates that the total entropy of any isolated system always increases over time.',
    deckId: 'seed_deck_1',
    easeFactor: 2.5,
    intervalDays: 0,
    nextReviewDate: new Date().toISOString(),
    reviewsCount: 0
  },
  {
    id: 'seed_card_3',
    question: 'What is the efficiency formula of a Carnot engine?',
    answer: 'n = 1 - Tc / Th, where Tc is cold reservoir temperature and Th is hot reservoir temperature in Kelvins.',
    deckId: 'seed_deck_1',
    easeFactor: 2.5,
    intervalDays: 0,
    nextReviewDate: new Date().toISOString(),
    reviewsCount: 0
  }
];

const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'seed_quiz_1',
    title: 'Thermodynamics Review',
    questions: [
      {
        question: 'Which of the following describes the Second Law of Thermodynamics?',
        options: [
          'Energy cannot be created or destroyed.',
          'The entropy of an isolated system always increases.',
          'Absolute zero cannot be reached in a finite number of steps.',
          'Pressure is directly proportional to temperature.'
        ],
        correctAnswerIndex: 1,
        explanation: 'The Second Law establishes that processes occur spontaneously in a direction that increases overall system entropy (disorder).'
      },
      {
        question: 'What happens to Carnot cycle efficiency as the cold reservoir temperature Tc decreases?',
        options: [
          'Efficiency increases.',
          'Efficiency decreases.',
          'Efficiency remains constant.',
          'Efficiency drops to absolute zero.'
        ],
        correctAnswerIndex: 0,
        explanation: 'According to n = 1 - (Tc / Th), a lower Tc decreases the fraction (Tc/Th), meaning (1 - fraction) becomes larger, increasing overall thermal efficiency.'
      }
    ],
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Floating Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state with localStorage for persistence
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('aura_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('aura_habits');
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('aura_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem('aura_decks');
    return saved ? JSON.parse(saved) : INITIAL_DECKS;
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('aura_flashcards');
    return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem('aura_quizzes');
    return saved ? JSON.parse(saved) : INITIAL_QUIZZES;
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    const saved = localStorage.getItem('aura_quiz_attempts');
    return saved ? JSON.parse(saved) : [];
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem('aura_focus_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [studySlots, setStudySlots] = useState<StudySlot[]>(() => {
    const saved = localStorage.getItem('aura_study_slots');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist hooks
  useEffect(() => {
    localStorage.setItem('aura_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('aura_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('aura_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('aura_decks', JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    localStorage.setItem('aura_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem('aura_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('aura_quiz_attempts', JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  useEffect(() => {
    localStorage.setItem('aura_focus_sessions', JSON.stringify(focusSessions));
  }, [focusSessions]);

  useEffect(() => {
    localStorage.setItem('aura_study_slots', JSON.stringify(studySlots));
  }, [studySlots]);

  // Helper trigger notifications
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Launch Focus Timer from Voice Assistant
  const handleLaunchFocusTimer = (minutes: number) => {
    setActiveTab('pomodoro');
    triggerToast(`AI voice launched Pomodoro focused timer for ${minutes} minutes!`);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0F1115] text-[#E2E8F0]">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userEmail="thakorrohan0002@gmail.com"
      />

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto bg-[#0F1115] relative p-6 md:p-8">
        
        {/* Active Tab Router */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            tasks={tasks}
            habits={habits}
            focusSessions={focusSessions}
            setHabits={setHabits}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskPlanner 
            tasks={tasks}
            setTasks={setTasks}
            studySlots={studySlots}
            setStudySlots={setStudySlots}
            habits={habits}
            setHabits={setHabits}
          />
        )}

        {activeTab === 'notepad' && (
          <Notepad 
            notes={notes}
            setNotes={setNotes}
            decks={decks}
            setDecks={setDecks}
            flashcards={flashcards}
            setFlashcards={setFlashcards}
            quizzes={quizzes}
            setQuizzes={setQuizzes}
            onNotify={triggerToast}
          />
        )}

        {activeTab === 'study' && (
          <FlashcardsView 
            decks={decks}
            flashcards={flashcards}
            setFlashcards={setFlashcards}
            quizzes={quizzes}
            quizAttempts={quizAttempts}
            setQuizAttempts={setQuizAttempts}
            onNotify={triggerToast}
          />
        )}

        {activeTab === 'pomodoro' && (
          <Pomodoro 
            focusSessions={focusSessions}
            setFocusSessions={setFocusSessions}
            onNotify={triggerToast}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceCoach 
            tasks={tasks}
            setTasks={setTasks}
            notes={notes}
            setNotes={setNotes}
            onStartFocusTimer={handleLaunchFocusTimer}
            onNotify={triggerToast}
          />
        )}

        {/* Floating AI Notification Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-slate-900 border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-slate-950/20 max-w-sm animate-bounce">
            <Sparkles className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
            <span className="text-xs font-semibold leading-tight">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white transition shrink-0 pl-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
