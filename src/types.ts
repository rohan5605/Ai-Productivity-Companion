export interface Task {
  id: string;
  title: string;
  description?: string;
  category: 'Study' | 'Work' | 'Personal' | 'Health' | 'Other';
  priority: 'low' | 'medium' | 'high';
  dueDate: string; // ISO string or date string
  completed: boolean;
  estimatedMinutes: number;
  actualMinutesSpent: number;
  createdAt: string;
}

export interface StudySlot {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  relatedTaskId?: string;
  notes?: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  deckId: string;
  easeFactor: number; // For spaced repetition
  intervalDays: number;
  nextReviewDate: string; // ISO string
  reviewsCount: number;
}

export interface Deck {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number; // percentage
  totalQuestions: number;
  correctAnswers: number;
  date: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  history: { [date: string]: boolean }; // e.g., '2026-06-27': true
  createdAt: string;
}

export interface FocusSession {
  id: string;
  durationMinutes: number;
  type: 'work' | 'break';
  completed: boolean;
  date: string;
}

export interface CoachTip {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'tip' | 'praise' | 'schedule';
  createdAt: string;
}

export interface ProductivityAnalytics {
  totalFocusTime: number;
  completedTasksCount: number;
  tasksOverdueCount: number;
  habitCompletionRate: number; // percent
}
