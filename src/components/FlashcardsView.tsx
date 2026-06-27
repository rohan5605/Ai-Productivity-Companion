import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  ChevronRight, 
  Check, 
  X, 
  RotateCcw, 
  Calendar, 
  Trophy,
  Award,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Flashcard, Deck, Quiz, QuizAttempt } from '../types';

interface FlashcardsViewProps {
  decks: Deck[];
  flashcards: Flashcard[];
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  setQuizAttempts: React.Dispatch<React.SetStateAction<QuizAttempt[]>>;
  onNotify: (message: string) => void;
}

export default function FlashcardsView({
  decks,
  flashcards,
  setFlashcards,
  quizzes,
  quizAttempts,
  setQuizAttempts,
  onNotify
}: FlashcardsViewProps) {
  
  // Selection States
  const [activeMode, setActiveMode] = useState<'browse' | 'flashcard_session' | 'quiz_session'>('browse');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  // Active Flashcard States
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCardsCount, setCompletedCardsCount] = useState(0);

  // Active Quiz States
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Filter cards associated with selected deck
  const activeCards = flashcards.filter(c => c.deckId === selectedDeckId);
  const activeQuiz = quizzes.find(q => q.id === selectedQuizId);

  // Start Flashcard Study
  const handleStartStudy = (deckId: string) => {
    const deckCards = flashcards.filter(c => c.deckId === deckId);
    if (deckCards.length === 0) {
      onNotify('This deck has no flashcards yet! Use the Notepad to generate some.');
      return;
    }
    setSelectedDeckId(deckId);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setCompletedCardsCount(0);
    setActiveMode('flashcard_session');
  };

  // Handle Spaced Repetition Grading
  const handleGradeCard = (rating: 'hard' | 'medium' | 'easy') => {
    if (!selectedDeckId) return;
    
    const cardToUpdate = activeCards[currentCardIndex];
    let intervalDays = 1;
    if (rating === 'medium') intervalDays = 3;
    if (rating === 'easy') intervalDays = 6;

    // Calculate next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);

    // Update state
    setFlashcards(prev => prev.map(c => {
      if (c.id === cardToUpdate.id) {
        return {
          ...c,
          intervalDays,
          nextReviewDate: nextDate.toISOString(),
          reviewsCount: c.reviewsCount + 1
        };
      }
      return c;
    }));

    setCompletedCardsCount(prev => prev + 1);

    // Move to next card or finish
    if (currentCardIndex + 1 < activeCards.length) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      onNotify('Congratulations! You completed this flashcard review!');
      setActiveMode('browse');
    }
  };

  // Start Quiz
  const handleStartQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setCurrentQuizQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setHasAnswered(false);
    setQuizScore(0);
    setQuizFinished(false);
    setActiveMode('quiz_session');
  };

  // Answer multiple choice option
  const handleSelectAnswer = (idx: number) => {
    if (hasAnswered || !activeQuiz) return;
    setSelectedAnswerIndex(idx);
    setHasAnswered(true);

    const question = activeQuiz.questions[currentQuizQuestionIndex];
    if (idx === question.correctAnswerIndex) {
      setQuizScore(prev => prev + 1);
    }
  };

  // Advance Quiz or Finish
  const handleNextQuizQuestion = () => {
    if (!activeQuiz) return;
    
    if (currentQuizQuestionIndex + 1 < activeQuiz.questions.length) {
      setCurrentQuizQuestionIndex(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setHasAnswered(false);
    } else {
      // Save Attempt
      const finalScorePct = Math.round((quizScore / activeQuiz.questions.length) * 100);
      const newAttempt: QuizAttempt = {
        id: 'attempt_' + Date.now(),
        quizId: activeQuiz.id,
        quizTitle: activeQuiz.title,
        score: finalScorePct,
        totalQuestions: activeQuiz.questions.length,
        correctAnswers: quizScore,
        date: new Date().toISOString()
      };
      setQuizAttempts(prev => [newAttempt, ...prev]);
      setQuizFinished(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Back button for sessions */}
      {activeMode !== 'browse' && (
        <button
          onClick={() => setActiveMode('browse')}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Session</span>
        </button>
      )}

      {/* Title */}
      {activeMode === 'browse' && (
        <div className="mb-2">
          <h2 className="text-3xl font-sans font-bold tracking-tight text-[#E2E8F0]">Active Recall & Deck Core</h2>
          <p className="text-sm text-slate-400 mt-1">
            Revisit concepts with Spaced Repetition, or challenge your memory with AI-generated dynamic practice quizzes.
          </p>
        </div>
      )}

      {/* Mode 1: Main Browsing dashboard */}
      {activeMode === 'browse' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Flashcard Decks Panel */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-bold text-[#E2E8F0] flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-400" />
              <span>Review Flashcard Decks</span>
            </h3>

            {decks.length === 0 ? (
              <div className="bg-[#1A1D24] p-10 border border-slate-800/80 rounded-3xl text-center space-y-3 shadow-xl">
                <p className="text-slate-400 text-sm">No flashcard decks generated yet.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Open any study note in the Smart Notepad and click "Extract Flashcards Deck" to auto-populate cards instantly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {decks.map(deck => {
                  const deckCardsCount = flashcards.filter(c => c.deckId === deck.id).length;
                  return (
                    <div 
                      key={deck.id} 
                      className="bg-[#1A1D24] p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between hover:border-blue-500/30 transition duration-150"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{deck.title}</h4>
                        <p className="text-xs text-blue-400 font-mono bg-blue-500/10 border border-blue-500/10 px-2 py-0.5 rounded-full w-max">{deckCardsCount} cards</p>
                        {deck.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">{deck.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleStartStudy(deck.id)}
                        className="mt-4 w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        Start Review Session
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quizzes and Attempts panel */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-bold text-[#E2E8F0] flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-blue-400" />
              <span>AI Dynamic Quizzes</span>
            </h3>

            {quizzes.length === 0 ? (
              <div className="bg-[#1A1D24] p-10 border border-slate-800/80 rounded-3xl text-center space-y-3 shadow-xl">
                <p className="text-slate-400 text-sm">No active practice quizzes built yet.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Draft study content in your Smart Notepad and trigger "Generate Practice Quiz" to test yourself.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quizzes.map(quiz => (
                    <div 
                      key={quiz.id}
                      className="bg-[#1A1D24] p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between hover:border-blue-500/30 transition"
                    >
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{quiz.title}</h4>
                        <p className="text-xs text-slate-400 font-mono mt-1">{quiz.questions.length} dynamic MCQs</p>
                      </div>
                      <button
                        onClick={() => handleStartQuiz(quiz.id)}
                        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/10 transition cursor-pointer"
                      >
                        Take Practice Quiz
                      </button>
                    </div>
                  ))}
                </div>

                {/* Score History */}
                {quizAttempts.length > 0 && (
                  <div className="bg-[#1A1D24] p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-3">
                    <h4 className="font-bold text-[#E2E8F0] text-xs uppercase font-mono tracking-wider">Practice Records</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {quizAttempts.map(attempt => (
                        <div key={attempt.id} className="flex items-center justify-between p-3 bg-[#232730] border border-slate-800/60 rounded-2xl text-xs">
                          <div>
                            <span className="font-semibold text-slate-200 block truncate max-w-[200px]">{attempt.quizTitle}</span>
                            <span className="text-[10px] text-slate-500">{new Date(attempt.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] text-slate-400">{attempt.correctAnswers}/{attempt.totalQuestions} Correct</span>
                            <span className={`px-2.5 py-0.5 font-bold rounded-full text-[10px] ${
                              attempt.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {attempt.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Mode 2: Flashcard Study Active Recall Loop */}
      {activeMode === 'flashcard_session' && selectedDeckId && activeCards.length > 0 && (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center">
            <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              Recall Deck Loop
            </span>
            <p className="text-xs text-slate-400 font-mono mt-3">Card {currentCardIndex + 1} of {activeCards.length}</p>
          </div>

          {/* Flip Card Container */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 bg-[#1A1D24] border border-slate-800 rounded-3xl p-8 flex flex-col justify-between cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 relative select-none overflow-hidden"
          >
            {/* Visual background gradient accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/5 rounded-full filter blur-3xl" />

            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Deck Study</span>
              <span className="text-blue-400">{isFlipped ? 'ANSWER REVEALED' : 'TAP TO REVEAL'}</span>
            </div>

            <div className="flex-1 flex items-center justify-center text-center px-4">
              {isFlipped ? (
                <p className="text-lg text-slate-100 leading-relaxed font-semibold transition duration-200">
                  {activeCards[currentCardIndex].answer}
                </p>
              ) : (
                <p className="text-xl text-slate-200 font-bold transition duration-200 leading-snug">
                  {activeCards[currentCardIndex].question}
                </p>
              )}
            </div>

            <div className="text-center text-[11px] font-mono text-slate-500">
              {isFlipped ? 'How easy was this recall?' : 'Click to flip card'}
            </div>
          </div>

          {/* Feedback controls if flipped */}
          {isFlipped ? (
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleGradeCard('hard')}
                className="py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Hard (Review Tomorrow)
              </button>
              <button
                onClick={() => handleGradeCard('medium')}
                className="py-3 px-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-300 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Good (Review in 3d)
              </button>
              <button
                onClick={() => handleGradeCard('easy')}
                className="py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Easy (Review in 6d)
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsFlipped(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow shadow-blue-600/10 cursor-pointer"
            >
              Flip Card
            </button>
          )}
        </div>
      )}

      {/* Mode 3: Active Quiz Practice Game */}
      {activeMode === 'quiz_session' && activeQuiz && (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Header Progress */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold bg-[#1A1D24] border border-slate-800 text-blue-400 px-2 py-0.5 rounded-full uppercase">
                Active Assessment
              </span>
              <h3 className="font-bold text-[#E2E8F0] text-base mt-1.5">{activeQuiz.title}</h3>
            </div>
            {!quizFinished && (
              <span className="text-xs text-slate-400 font-mono font-semibold">
                Question {currentQuizQuestionIndex + 1} of {activeQuiz.questions.length}
              </span>
            )}
          </div>

          {/* Quiz Play Board */}
          {!quizFinished ? (
            <div className="bg-[#1A1D24] p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
              
              {/* Question Text */}
              <div className="p-4 bg-[#232730] rounded-xl border border-slate-800/60">
                <p className="text-base font-bold text-slate-100 leading-relaxed">
                  {activeQuiz.questions[currentQuizQuestionIndex].question}
                </p>
              </div>

              {/* Options list */}
              <div className="space-y-3">
                {activeQuiz.questions[currentQuizQuestionIndex].options.map((option, idx) => {
                  const isSelected = selectedAnswerIndex === idx;
                  const isCorrect = idx === activeQuiz.questions[currentQuizQuestionIndex].correctAnswerIndex;
                  
                  let optionStyle = 'bg-[#232730] hover:bg-slate-800 border-slate-800 text-slate-300';
                  
                  if (hasAnswered) {
                    if (isCorrect) {
                      optionStyle = 'bg-emerald-600 border-emerald-500 text-white';
                    } else if (isSelected) {
                      optionStyle = 'bg-rose-600 border-rose-500 text-white';
                    } else {
                      optionStyle = 'bg-[#232730] text-slate-500 border-slate-800/50 cursor-not-allowed';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-blue-600/20 border-blue-500 text-blue-200';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={hasAnswered}
                      className={`w-full p-4 rounded-xl border text-left text-sm font-semibold transition flex items-center justify-between cursor-pointer ${optionStyle}`}
                    >
                      <span>{option}</span>
                      {hasAnswered && isCorrect && <Check className="h-4.5 w-4.5 shrink-0" />}
                      {hasAnswered && isSelected && !isCorrect && <X className="h-4.5 w-4.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Detailed Explanation if answered */}
              {hasAnswered && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1">
                  <h5 className="font-bold text-xs text-amber-300 uppercase font-mono flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Concept Clarification</span>
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeQuiz.questions[currentQuizQuestionIndex].explanation || 'Explanation provided on response.'}
                  </p>
                </div>
              )}

              {/* Action Button */}
              {hasAnswered && (
                <button
                  onClick={handleNextQuizQuestion}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/10 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{currentQuizQuestionIndex + 1 === activeQuiz.questions.length ? 'Finish Quiz' : 'Next Question'}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            /* Quiz finished score card */
            <div className="bg-[#1A1D24] p-8 rounded-3xl border border-slate-800/80 shadow-xl text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/20">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-200">Quiz Completed!</h4>
                <p className="text-slate-400 text-xs mt-1">Excellent rehearsal work on active recall concepts.</p>
              </div>

              {/* Big Score Board */}
              <div className="py-6 px-10 bg-[#232730] rounded-2xl border border-slate-800 max-w-sm mx-auto">
                <span className="text-4xl font-extrabold text-blue-400">{Math.round((quizScore / activeQuiz.questions.length) * 100)}%</span>
                <p className="text-xs text-slate-400 mt-2 font-mono">{quizScore} correct answers out of {activeQuiz.questions.length}</p>
              </div>

              <div className="flex space-x-3 max-w-md mx-auto">
                <button
                  onClick={() => handleStartQuiz(activeQuiz.id)}
                  className="flex-1 py-2.5 bg-[#232730] hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Replay Quiz
                </button>
                <button
                  onClick={() => setActiveMode('browse')}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Return to Core
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
