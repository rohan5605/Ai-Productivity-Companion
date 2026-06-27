# AI Productivity Companion — Intelligent Study & Work Cockpit

Welcome to the architectural specification and product documentation of the **AI Productivity Companion** (also known as the **Gemini Adaptive Study Hub**). This project represents a unified, highly polished, zero-friction learning cockpit designed to streamline self-directed education, active retention, and cognitive time-management through state-of-the-art server-side Gemini AI models.

---

## 1. Problem Statement

Modern learners and professionals are forced to navigate a fragmented digital workspace. Actively retaining and applying new knowledge is highly labor-intensive, creating several core points of friction:

1. **Fragmentation of Toolsets:** Users must constantly switch between disparate applications—one for drafting raw markdown notes, another for spaced-repetition flashcards, a third for generating practice tests, a fourth for managing todo lists, and a fifth for timing focus blocks. This fragmentation disrupts psychological flow.
2. **The "Passive Reading" Trap:** Simply highlighting text or reading lecture scripts results in extremely low retention rates. Actively translating raw material into effective flashcards and practice quizzes requires hours of tedious administrative work.
3. **Cognitive Load of Scheduling:** Trying to manually balance project deadlines, varying task weights, estimated prep times, and personal habits results in "decision fatigue." Users spend more time organizing calendars than actually studying.
4. **Vocal Input Under-utilization:** While voice memos are extremely convenient for capturing quick thoughts on-the-go, they usually sit unorganized in voice recorders without being converted into actionable planner milestones or summarized study sheets.

---

## 2. Solution Detail

The **AI Productivity Companion** solves these challenges by combining structural widgets into a single-page, highly focused dark slate workspace. It utilizes server-side **Gemini AI** as a core cognitive proxy to handle the heavy-lifting of material preparation and dynamic calendar optimization.

### Core Architectural Philosophy:
* **The Cognitive Second-Brain:** The system bridges the gap between **passive consumption** and **active recall**. Any raw study material drafted in the notepad is immediately transformable into flashcard decks or randomized assessments in a single click.
* **Unified State Store:** An elegant React core synchronizes all modules. Tasks created in the planner are visible to the Voice Coach, and notes drafted in the Smart Notepad feed directly into the Active Recall assessment engines.
* **Ambient Design Language:** Employs a distraction-free, eye-safe slate dark visual theme (`#1A1D24` / `#232730`) styled with deep blue highlights, high contrast typography, and custom micro-animations to support sustained deep-work sessions (Flow State).

---

## 3. Key Feature Modules

### 🎙️ Module A: Voice Coach Core (Intelligent Command Proxy)
* **Purpose:** Acts as an conversational natural language proxy that directly mutates application state.
* **Functionality:** 
  * Accepts real-time vocal inputs via the Web Audio API and captures microphone streams, displaying a live **Acoustic Audio Oscilloscope** drawn onto an HTML5 canvas.
  * Proxies commands to server-side Gemini, which evaluates instructions in plain text or vocal transcribing.
  * Translates commands (e.g., *"Set high priority study task Buy Textbooks due next Monday"* or *"start a timer for 15 minutes"*) into structured JSON instructions.
  * **Dynamic State Mutation:** Directly appends tasks to the planner, starts Pomodoro countdowns, or drafts notepad study notes without requiring manual typing.

### 📝 Module B: Smart Notepad (Intelligent Knowledge Synthesizer)
* **Purpose:** High-performance text drafting pad that serves as the content ingestion channel.
* **Functionality:**
  * Draft rich study guides, lecture summaries, or complex course outlines.
  * **AI Summarize Insights:** Requests Gemini to synthetically compile raw drafts into core high-yield concept summaries.
  * **Extract Flashcards Deck:** Instantly compiles raw drafts into structured Question-Answer flashcards and registers them inside the recall database.
  * **Generate Practice Quiz:** Parses content into high-level multiple-choice questions (MCQs) complete with detailed explanations.

### 🧠 Module C: Active Recall & Deck Core (Spaced Repetition & Assessments)
* **Purpose:** Active memory retention engine utilizing randomized MCQs and Leitner-style flashcard scheduling.
* **Functionality:**
  * **Recall Deck Loop:** An interactive flip-card study interface that allows users to grade their memory recall as **Hard**, **Good**, or **Easy**. This simulates spaced repetition scheduling by calculating review intervals.
  * **AI Dynamic Quizzes:** Challenges users with randomized MCQs generated from notes. Includes real-time grading, visual scoresheets, and a **Concept Clarification** box that utilizes Gemini to explain correct solutions.
  * **Practice Records:** Displays a persistent historical log of test scores to monitor performance over time.

### 📅 Module D: Adaptive AI Schedule Planner
* **Purpose:** Multi-dimensional milestone tracker and automated daily calendar solver.
* **Functionality:**
  * Track milestone lists with customized category tags (Study, Work, Health, Personal), due dates, and priority indicators (High, Medium, Low).
  * Configure recurring personal habits (Daily, Weekly) with visual fire icons to build streaks.
  * **Adaptive AI Schedule Solver:** Submits your current pending milestones, estimated durations, and daily habits to Gemini, which returns an optimized, chronologically sequenced schedule of study slots mapped directly onto an interactive custom monthly calendar grid.

### ⏱️ Module E: Pomodoro Deep Focus
* **Purpose:** Focus management and ambient audio synthesizer.
* **Functionality:**
  * Features standard work intervals (25m), short breaks (5m), and long breaks (15m).
  * **Full-Screen Immersive Focus Mode:** Hides all dashboard distraction panels, rendering a clean, centering breathing progress circle.
  * **Chime Audio Synthesizer:** Incorporates an audio synthesizer using the Web Audio API that outputs sound chimes near 1046Hz (C6 pitch). This frequency provides an alert to mark interval completions without jarring the user's focus.
  * Persistent tracking of focus minutes completed throughout the day.

---

## 4. Project Flows & Diagrams

### Flow 1: Global Architecture & Core State Loop
This diagram represents how user interaction, React local states, local storage persistence, and server-side Gemini interact.

```
       ┌──────────────────────────────────────────────────────────┐
       │               User Browser (React UI)                    │
       │                                                          │
       │ ┌───────────────┐ ┌────────────────┐ ┌─────────────────┐ │
       │ │ Voice Coach   │ │  Smart Notepad │ │  Task Planner   │ │
       │ └───────┬───────┘ └───────┬────────┘ └───────┬─────────┘ │
       │         │                 │                  │           │
       └─────────┼─────────────────┼──────────────────┼───────────┘
                 │                 │                  │
                 │                 │ (Draft Notes,    │ (Tasks,
                 │ (Audio Stream / │  Notepad Text)   │  Habits,
                 │  Vocal Text)    │                  │  Deadlines)
                 ▼                 ▼                  ▼
       ┌──────────────────────────────────────────────────────────┐
       │             Client API Proxy Module (App.tsx)            │
       └───────────────────────────┬──────────────────────────────┘
                                   │
                         Secure HTTPS /api Request
                                   │
                                   ▼
       ┌──────────────────────────────────────────────────────────┐
       │             Node.js Express Server (server.ts)           │
       │                                                          │
       │       ┌──────────────────────────────────────────┐       │
       │       │    Google GenAI SDK (@google/genai)      │       │
       │       │                                          │       │
       │       │    * Models: gemini-2.5-flash / newer     │       │
       │       │    * System Instructions & Schemas        │       │
       │       └────────────────────┬─────────────────────┘       │
       └────────────────────────────┼─────────────────────────────┘
                                    │
                        Secure API Call with Auth
                                    │
                                    ▼
       ┌──────────────────────────────────────────────────────────┐
       │                    Google Gemini API                     │
       └──────────────────────────────────────────────────────────┘
```

---

### Flow 2: Voice-to-Command State Mutation Flow
How the voice capture converts vocal commands into structured React actions via AI parsing.

```
┌─────────────┐     Mic Recorded     ┌─────────────────┐     Draws waves onto Canvas
│ User Speaks │ ───────────────────> │ Web Audio API   │ ───────────────────────────────┐
└─────────────┘                      │  Oscilloscope   │                                │
       ▲                             └─────────────────┘                                │
       │                                                                                │
       │ User reviews coach's actions and visual feedback                               ▼
┌─────────────┐                      ┌─────────────────┐                       ┌──────────────┐
│ State Sync  │ <─────────────────── │ Execute Command │ <──────────────────── │ Gemini AI    │
│ React State │   Appends Task,      │ Parser Routine  │   Parses JSON:        │ Command API  │
│ updated     │   drafts Note, etc.  └─────────────────┘   "type", "title",    │  Evaluator   │
└─────────────┘                                            "dueDate", "notes"  └──────────────┘
```

---

### Flow 3: Smart Recall Extraction Pipeline
Converting passive markdown into interactive flashcard collections and quizzes.

```
  ┌────────────────────────────────────────────────┐
  │         Smart Notepad (Raw Study Text)         │
  └───────────────────────┬────────────────────────┘
                          │
                          │ Clicking "Extract Flashcards" or "Generate Quiz"
                          ▼
  ┌────────────────────────────────────────────────┐
  │         Server-Side Gemini API Request         │
  │                                                │
  │ * Schema constraint applied for Quiz / Cards   │
  │ * Processes raw text parameters into structures│
  └───────────────────────┬────────────────────────┘
                          │
                          │ Returns structured JSON payloads
                          ▼
  ┌────────────────────────────────────────────────┐
  │         Client Response Processing             │
  │                                                │
  │ * Appends Flashcards into active recall deck   │
  │ * Registers randomized practice quizzes        │
  └───────────────────────┬────────────────────────┘
                          │
                          ▼
  ┌────────────────────────────────────────────────┐
  │     Active Recall & Assessment Dashboards      │
  │                                                │
  │ * Flip-Card leitner-spaced recall testing      │
  │ * Grade calculations with Concept Clarifier    │
  └────────────────────────────────────────────────┘
```

---

## 5. Technology Stack

The application's stack is built for durability, performance, and low-latency feedback loops:

* **React 19 & TypeScript:** State management is driven by modern hooks (`useState`, `useEffect`, `useRef`). Type safety is enforced across custom data models (tasks, study slots, notes, flashcards, quizzes).
* **Vite & Node.js Custom Server:** Provides a production-grade full-stack configuration. Vite handles ultra-fast hot builds in dev, and server proxy routes handle Gemini API communications securely.
* **Express & esbuild:** Express serves API controllers on Cloud Run container ports. Server scripts are compiled by `esbuild` into bundled CommonJS modules in `dist/` to bypass runtime module mismatches.
* **Tailwind CSS v4:** Full styling engine. Leverages responsive prefix matrices (`sm:`, `md:`, `lg:`) to adjust display density for mobile grids up to wide-monitor bento panels.
* **Canvas API:** Renders live, high-framerate oscilloscope lines for audio visualization inside the voice console.
* **Web Audio API:**
  * Captures real-time audio sample frequencies.
  * Synthesizes audio focus chimes with precise frequency and gain envelopes, avoiding external asset dependency.
* **Motion:** Orchestrates visual feedback transitions, active flip-cards, tab switching fade-ins, and task list items insertion/deletion stagger.

---

## 6. Google Technologies Utilization

### 1. Google Gemini API (`@google/genai` TypeScript SDK)
Gemini models are deployed to process unstructured text, audio logs, and time planning:
* **JSON Output Constraints:** Prompts enforce strict JSON schemas. For instance, the task planner enforces return types conforming to `Array<{ startTime: string, endTime: string, title: string, notes: string }>`, which are parsed natively on the server.
* **Intelligent Schedule Placement:** The solver balances constraints of relative milestone weights, priority levels, estimated preparation durations, daily intervals, and month-grid date bounds.
* **Voice Instruction Execution Parser:** Prompts instruct Gemini to act as a system proxy. The response isolates user-intent parameters to perform clean state mutations.

### 2. Google Cloud Run Deployment
The complete application is compiled, packaged into standard OCI containers, and run on Google Cloud Run:
* **Server-Side API Key Hiding:** Secret parameters like the `GEMINI_API_KEY` are mounted via Cloud Run environment secrets, completely hiding development credentials from the public browser client.
* **Automatic Scaling & Scale-to-Zero:** Standard container parameters adjust ingress, serving client bundles and handling heavy API executions with zero performance bottleneck.

---

## 7. Build, Validation & Port Rules

To maintain high development quality, the project follows strict engineering constraints:
1. **Strict Ingress Port Rule:** The container and development servers are locked to port `3000` on binding host `0.0.0.0` as routed by the platform's nginx reverse proxy.
2. **ESM Compiling with esbuild:** Server codes utilize typescript type-stripping, bundled cleanly using esbuild commands (`npm run build`) to ensure single-file runtime starts:
   ```bash
   vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
   ```
3. **Lazy Initialization:** To prevent start-up sequence crashes, all external integrations are initialized lazily inside route hooks, gracefully alerting the user if secrets are missing.
