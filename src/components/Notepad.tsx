import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  FileText, 
  BookOpen, 
  HelpCircle, 
  ChevronRight,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Note, Flashcard, Deck, Quiz } from '../types';

interface NotepadProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  decks: Deck[];
  setDecks: React.Dispatch<React.SetStateAction<Deck[]>>;
  flashcards: Flashcard[];
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  quizzes: Quiz[];
  setQuizzes: React.Dispatch<React.SetStateAction<Quiz[]>>;
  onNotify: (message: string) => void;
}

export default function Notepad({
  notes,
  setNotes,
  decks,
  setDecks,
  flashcards,
  setFlashcards,
  quizzes,
  setQuizzes,
  onNotify
}: NotepadProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');

  // AI Loaders
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const [aiError, setAiError] = useState<string | null>(null);

  const activeNote = notes.find(n => n.id === selectedNoteId);

  // Sync editing fields with active note selection
  React.useEffect(() => {
    if (activeNote) {
      setEditingTitle(activeNote.title);
      setEditingContent(activeNote.content);
    } else {
      setEditingTitle('');
      setEditingContent('');
    }
    setAiError(null);
  }, [selectedNoteId, notes]);

  // Create new blank note
  const handleCreateNote = () => {
    const newNote: Note = {
      id: 'note_' + Date.now(),
      title: 'Untitled Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  };

  // Save current note edits
  const handleSaveNote = () => {
    if (!selectedNoteId) return;
    setNotes(prev => prev.map(n => {
      if (n.id === selectedNoteId) {
        return {
          ...n,
          title: editingTitle,
          content: editingContent,
          updatedAt: new Date().toISOString()
        };
      }
      return n;
    }));
    onNotify('Note saved successfully!');
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNoteId === id) {
      const remaining = notes.filter(n => n.id !== id);
      setSelectedNoteId(remaining[0]?.id || null);
    }
  };

  // Call Server Note Summarization
  const handleSummarizeNote = async () => {
    if (!editingContent.trim() || !selectedNoteId) return;
    setLoadingSummary(true);
    setAiError(null);
    try {
      const res = await fetch('/api/notepad/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent })
      });
      if (!res.ok) throw new Error('Summarization failed. Verify server is running and key is configured.');
      const data = await res.json();
      
      setNotes(prev => prev.map(n => {
        if (n.id === selectedNoteId) {
          return { ...n, summary: data.summary };
        }
        return n;
      }));
      onNotify('AI Summary generated successfully!');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Could not summarize note.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Call Server Flashcard Generation
  const handleGenerateFlashcards = async () => {
    if (!editingContent.trim() || !selectedNoteId) return;
    setLoadingFlashcards(true);
    setAiError(null);
    try {
      const res = await fetch('/api/notepad/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent, count: 5 })
      });
      if (!res.ok) throw new Error('Flashcard creation failed. Verify server is running.');
      const list = await res.json();

      // Create a Deck first
      const deckId = 'deck_' + Date.now();
      const newDeck: Deck = {
        id: deckId,
        title: `Deck: ${editingTitle || 'Untitled'}`,
        description: `AI-extracted cards from study notes.`,
        createdAt: new Date().toISOString()
      };

      const newCards: Flashcard[] = list.map((item: any, idx: number) => ({
        id: `card_${idx}_${Date.now()}`,
        question: item.question,
        answer: item.answer,
        deckId: deckId,
        easeFactor: 2.5,
        intervalDays: 0,
        nextReviewDate: new Date().toISOString(),
        reviewsCount: 0
      }));

      setDecks(prev => [...prev, newDeck]);
      setFlashcards(prev => [...prev, ...newCards]);
      onNotify(`Added ${newCards.length} AI cards into a new Flashcard Deck!`);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Could not generate flashcards.');
    } finally {
      setLoadingFlashcards(false);
    }
  };

  // Call Server Quiz Generation
  const handleGenerateQuiz = async () => {
    if (!editingContent.trim() || !selectedNoteId) return;
    setLoadingQuiz(true);
    setAiError(null);
    try {
      const res = await fetch('/api/notepad/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent, count: 5 })
      });
      if (!res.ok) throw new Error('Quiz creation failed. Verify server is running.');
      const quizData = await res.json();

      const newQuiz: Quiz = {
        id: 'quiz_' + Date.now(),
        title: quizData.title || `Quiz: ${editingTitle}`,
        questions: quizData.questions,
        createdAt: new Date().toISOString()
      };

      setQuizzes(prev => [...prev, newQuiz]);
      onNotify(`Generated and added new Quiz: "${newQuiz.title}"!`);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Could not generate quiz.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h2 className="text-3xl font-sans font-bold tracking-tight text-[#E2E8F0]">Smart Notepad</h2>
        <p className="text-sm text-slate-400 mt-1">
          Draft study notes and activate instant Gemini AI summarizing, flashcards extraction, and active recall quizzes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Notes List Sidebar */}
        <div className="lg:col-span-3 bg-[#1A1D24] border border-slate-800/80 rounded-3xl p-4 space-y-4 shadow-xl h-[550px] flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-500 font-mono uppercase">Notes Drawer</h3>
            <button
              onClick={handleCreateNote}
              className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition cursor-pointer"
              title="New Note"
            >
              <Plus className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {notes.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-8">No notes yet.</p>
            ) : (
              notes.map(note => {
                const isSelected = note.id === selectedNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-3 rounded-xl flex items-center justify-between cursor-pointer group transition duration-150 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15'
                        : 'bg-[#232730] border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex-1 overflow-hidden pr-2">
                      <h4 className="text-xs font-semibold truncate leading-none mb-1">
                        {note.title || 'Untitled Note'}
                      </h4>
                      <p className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 hover:text-rose-200 transition cursor-pointer ${
                        isSelected ? 'text-blue-200 hover:text-white hover:bg-blue-700' : 'text-slate-500'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center & Right Column: Interactive Editor and AI Core */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-6 h-[550px]">
          
          {/* Note Editor Area */}
          <div className="md:col-span-7 bg-[#1A1D24] rounded-3xl border border-slate-800/80 shadow-xl flex flex-col overflow-hidden h-full">
            {selectedNoteId ? (
              <div className="flex flex-col h-full">
                {/* Editor Header */}
                <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-[#1e222a]/40">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-semibold uppercase font-mono">Editor</span>
                  </div>
                  <button
                    onClick={handleSaveNote}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/10 transition cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save</span>
                  </button>
                </div>

                {/* Editor Inputs */}
                <div className="p-5 flex-1 flex flex-col space-y-4">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    placeholder="Enter descriptive note title..."
                    className="w-full text-lg font-bold text-slate-100 border-b border-slate-800 pb-2 focus:outline-none focus:border-blue-500"
                  />
                  <textarea
                    value={editingContent}
                    onChange={e => setEditingContent(e.target.value)}
                    placeholder="Draft detailed study guides, paste course content, or record lecture snippets here..."
                    className="w-full flex-1 resize-none text-sm text-slate-300 focus:outline-none leading-relaxed placeholder-slate-600 bg-transparent"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                <FileText className="h-8 w-8 text-slate-600" />
                <p className="text-sm">Please select or create a study note to begin.</p>
              </div>
            )}
          </div>

          {/* AI Companion Sidebar */}
          <div className="md:col-span-5 flex flex-col space-y-6 h-full overflow-hidden">
            
            {/* Action Buttons card */}
            <div className="bg-[#1A1D24] p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-3">
              <h3 className="font-bold text-[#E2E8F0] text-sm flex items-center space-x-1.5 mb-2">
                <Sparkles className="h-4 w-4 text-blue-400 animate-spin" />
                <span>Gemini AI Actions</span>
              </h3>

              <div className="space-y-2">
                <button
                  onClick={handleSummarizeNote}
                  disabled={loadingSummary || !editingContent.trim()}
                  className="w-full py-2.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 disabled:bg-slate-800 disabled:text-slate-500 text-blue-400 text-xs font-bold rounded-xl flex items-center justify-between border border-blue-500/20 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>{loadingSummary ? 'Summarizing...' : 'Summarize Core Notes'}</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={handleGenerateFlashcards}
                  disabled={loadingFlashcards || !editingContent.trim()}
                  className="w-full py-2.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 disabled:bg-slate-800 disabled:text-slate-500 text-blue-400 text-xs font-bold rounded-xl flex items-center justify-between border border-blue-500/20 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{loadingFlashcards ? 'Generating cards...' : 'Extract Flashcards Deck'}</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={loadingQuiz || !editingContent.trim()}
                  className="w-full py-2.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 disabled:bg-slate-800 disabled:text-slate-500 text-blue-400 text-xs font-bold rounded-xl flex items-center justify-between border border-blue-500/20 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <HelpCircle className="h-4 w-4" />
                    <span>{loadingQuiz ? 'Creating Quiz...' : 'Generate Practice Quiz'}</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {aiError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-[11px] flex items-start space-x-2 mt-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Sandbox limitations. Ensure GEMINI_API_KEY is registered.</span>
                </div>
              )}
            </div>

            {/* Render Summary Display */}
            <div className="bg-[#1A1D24] rounded-3xl border border-slate-800/80 shadow-xl flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-800/60 bg-[#1e222a]/40">
                <h4 className="font-bold text-slate-400 text-xs uppercase font-mono">
                  AI Summarized Insights
                </h4>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 text-slate-300 text-xs leading-relaxed space-y-3">
                {loadingSummary ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 animate-pulse font-mono">Synthesizing draft concepts...</p>
                  </div>
                ) : activeNote?.summary ? (
                  <div className="whitespace-pre-wrap select-text selection:bg-blue-500/20 bg-[#232730] p-4 rounded-2xl border border-slate-800">
                    {activeNote.summary}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    No active summaries stored. Trigger "Summarize Core Notes" to populate this pane.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
