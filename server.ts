import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// 1. Personalized Coach Insights (Proactive Recommendations)
app.post('/api/coach/tips', async (req, res) => {
  try {
    const { tasks, habits, focusSessions, currentLocalTime } = req.body;
    const ai = getGeminiClient();

    const prompt = `
You are a proactive, highly advanced AI productivity coach. 
Analyze the current productivity snapshot of the user:
- Current Local Time: ${currentLocalTime || new Date().toISOString()}
- Active Tasks (with due dates and priority): ${JSON.stringify(tasks || [])}
- Active Habits (frequency & history): ${JSON.stringify(habits || [])}
- Focus Sessions Log (past completed sessions): ${JSON.stringify(focusSessions || [])}

Provide 3 highly actionable, personalized, and motivating productivity coaching suggestions, alerts, or warnings.
Label each with a specific category: 'warning' (for urgent, overdue or close deadlines), 'tip' (for better studying methods), 'praise' (if they have done well with habits/sessions), or 'schedule' (for suggestions on planner slots).

Output your response strictly as a JSON array of objects conforming to this schema:
[
  {
    "title": "Short catchy title",
    "message": "Direct, personalized, helpful coaching message referencing their actual data.",
    "type": "warning" | "tip" | "praise" | "schedule"
  }
]
Do not return any markdown formatting outside of the JSON array.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              message: { type: Type.STRING },
              type: { 
                type: Type.STRING, 
                enum: ['warning', 'tip', 'praise', 'schedule'] 
              },
            },
            required: ['title', 'message', 'type'],
          },
        },
      },
    });

    const resultText = response.text || '[]';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Coach API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate coach suggestions' });
  }
});

// 2. Note Summarization
app.post('/api/notepad/summarize', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required for summarization' });
    }

    const ai = getGeminiClient();
    const prompt = `
Analyze and summarize the following note content. 
Generate a clear, structured summary with bullet points, actionable takeaways, and a high-level summary paragraph. Make it look beautiful and easy to read.

Note Content:
"""
${content}
"""
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error('Summarize API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to summarize note' });
  }
});

// 3. AI Flashcard Generation
app.post('/api/notepad/flashcards', async (req, res) => {
  try {
    const { content, count = 5 } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required for flashcard generation' });
    }

    const ai = getGeminiClient();
    const prompt = `
Based on the following content, generate ${count} high-quality flashcards for active recall and spaced repetition study.
Ensure questions are clear and target core concepts. Answers should be brief but complete.

Content:
"""
${content}
"""

Output strictly as a JSON array of objects conforming to:
[
  {
    "question": "The recall question...",
    "answer": "The concise answer..."
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ['question', 'answer'],
          },
        },
      },
    });

    const resultText = response.text || '[]';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Flashcard API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate flashcards' });
  }
});

// 4. AI Quiz Generation
app.post('/api/notepad/quiz', async (req, res) => {
  try {
    const { content, count = 5 } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required for quiz generation' });
    }

    const ai = getGeminiClient();
    const prompt = `
Create an educational quiz based on the following study content.
Generate ${count} multiple choice questions. Each question must have exactly 4 choices and exactly 1 correct answer (0-indexed index). Provide a brief explanation of why the correct option is right.

Content:
"""
${content}
"""

Output strictly as a JSON object with this schema:
{
  "title": "An appropriate quiz title",
  "questions": [
    {
      "question": "The quiz question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Why Option A is correct..."
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
              },
            },
          },
          required: ['title', 'questions'],
        },
      },
    });

    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Quiz API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

// 5. Voice-to-Task / Command Parser
app.post('/api/voice/parse', async (req, res) => {
  try {
    const { command, currentLocalTime } = req.body;
    if (!command || command.trim() === '') {
      return res.status(400).json({ error: 'Command text is required' });
    }

    const ai = getGeminiClient();
    const prompt = `
You are a smart natural-language command processor for a productivity app.
Parse the user's natural language request (written or transcribed from voice) and convert it into structured commands.
Current local time is: ${currentLocalTime || new Date().toISOString()}

Supported Actions:
- 'add_task': Creating a task with due date, priority, category, title, description, and time estimate.
- 'add_note': Creating a note with title and text content.
- 'start_timer': Starting a focused Pomodoro/timer with specified duration.
- 'search': Searching or query tasks/notes.

Task Rules:
- Infer category: 'Study', 'Work', 'Personal', 'Health', 'Other'.
- Infer priority: 'low', 'medium', 'high'.
- Parse dates: Resolve words like "tomorrow", "tonight", "next Friday", "in 2 days", "by 5 PM" into complete ISO strings relative to the current time. If time isn't specified, set it to end of day.
- Estimate minutes: default to 30.

Command: "${command}"

Output strictly as a JSON object with this schema:
{
  "action": "add_task" | "add_note" | "start_timer" | "search",
  "taskDetails": {
    "title": "Parsed task title",
    "description": "Additional parsed details",
    "category": "Study" | "Work" | "Personal" | "Health" | "Other",
    "priority": "low" | "medium" | "high",
    "dueDate": "ISO Date string e.g. 2026-06-28T23:59:59.000Z",
    "estimatedMinutes": 30
  } (optional),
  "noteDetails": {
    "title": "Parsed note title",
    "content": "Parsed note content"
  } (optional),
  "timerDetails": {
    "durationMinutes": 25
  } (optional)
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { 
              type: Type.STRING, 
              enum: ['add_task', 'add_note', 'start_timer', 'search'] 
            },
            taskDetails: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { 
                  type: Type.STRING, 
                  enum: ['Study', 'Work', 'Personal', 'Health', 'Other'] 
                },
                priority: { 
                  type: Type.STRING, 
                  enum: ['low', 'medium', 'high'] 
                },
                dueDate: { type: Type.STRING },
                estimatedMinutes: { type: Type.INTEGER },
              },
              required: ['title', 'category', 'priority', 'dueDate', 'estimatedMinutes'],
            },
            noteDetails: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ['title', 'content'],
            },
            timerDetails: {
              type: Type.OBJECT,
              properties: {
                durationMinutes: { type: Type.INTEGER },
              },
              required: ['durationMinutes'],
            },
          },
          required: ['action'],
        },
      },
    });

    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Voice Command API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse command' });
  }
});

// 6. Adaptive Study Planner
app.post('/api/planner/adaptive', async (req, res) => {
  try {
    const { tasks, currentLocalTime, targetDailyStudyHours = 2 } = req.body;
    const ai = getGeminiClient();

    const prompt = `
You are an expert adaptive study planning assistant.
Help the user schedule focused study slots for their upcoming tasks/deadlines.
Current local time is: ${currentLocalTime || new Date().toISOString()}
Target study hours per day: ${targetDailyStudyHours}
Tasks & Deadlines: ${JSON.stringify(tasks || [])}

Create a series of optimized study slot recommendations (up to 6 slots) over the next 3 days. 
Distribute the slots intelligently to give the user enough time to complete tasks prior to their respective due dates. 
Avoid early morning (before 8 AM) and late night (after 10 PM) unless highly necessary. Each slot should relate to a specific task ID if applicable.

Output strictly as a JSON array of objects conforming to:
[
  {
    "title": "Study session title (e.g. Study Chemistry: Reaction Kinetics)",
    "startTime": "ISO timestamp string e.g. 2026-06-27T14:00:00.000Z",
    "endTime": "ISO timestamp string e.g. 2026-06-27T15:30:00.000Z",
    "relatedTaskId": "Task ID string",
    "notes": "Actionable focus items for this session."
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              relatedTaskId: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: ['title', 'startTime', 'endTime', 'relatedTaskId', 'notes'],
          },
        },
      },
    });

    const resultText = response.text || '[]';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Adaptive Planner API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate study slots' });
  }
});

// Setup Vite Dev Server / Static Hosting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
