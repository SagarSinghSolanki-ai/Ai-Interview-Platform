# AI Interview Platform

An elegant, production-quality, full-stack mock interview platform designed to showcase modern software engineering practices. Candidates can practice real-time technical, coding, and behavioral interviews with structured AI feedback, alongside a Monaco-powered coding sandbox.

---

## 🚀 Tech Stack

### Frontend
*   **Framework**: Next.js 15 (App Router) & React 19
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS & shadcn/ui
*   **State & Caching**: TanStack Query (React Query)
*   **Form Management**: React Hook Form & Zod

### Backend
*   **Framework**: Node.js & Express.js
*   **Database ORM**: Prisma ORM (PostgreSQL)
*   **Authentication**: JWT (Access Token & Refresh Token Rotation) + Cryptographic bcrypt hashes
*   **Language**: TypeScript
*   **AI Engine**: Google Gemini API (`@google/genai` SDK)
*   **Code Compilation**: Judge0 API (with local simulated execution fallbacks)

---

## 🛠️ System Architecture Diagram

```
[Next.js Frontend Client] 
         │ (HTTP Requests with JWT Bearer headers)
         ▼
[Express API Router / app.ts]
         │ (Authentication middleware check)
         ▼
[Zod Schema Input Validation]
         │ (Type-safe query, body, and parameter parsing)
         ▼
[Controllers Layer]
         │ (Handles HTTP status code formatting & forwards logic)
         ▼
[Services Layer] (Reusable single-purpose core modules)
         ├── [Prisma DB Client] ➔ [PostgreSQL Database]
         ├── [Gemini Service]   ➔ [Google Gemini Model API]
         └── [Coding Service]   ➔ [Judge0 Compilation Sandbox]
```

---

## 🌟 Key Features

1.  **Secure JWT Authentication & Session Rotation**
    *   Passwords securely hashed using `bcrypt` salts.
    *   Generates short-lived (15 minutes) access tokens paired with long-lived (7 days) refresh tokens.
    *   Stores active refresh tokens on the User row in the database, allowing immediate token rotation, replay-attack checking, and global session revocation upon logout.
2.  **Multiphase Interview Setup Wizard**
    *   Modern card selector wizard to customize target roles (e.g. Frontend developer, DevOps), experience levels (entry, mid, senior), and focus topics (DSA, Technical, DBMS, System Design, cultural HR).
3.  **Conversational AI Interview Chat Loop**
    *   Google Gemini flash models act as the interviewer.
    *   Gemini assesses candidate responses dynamically, deciding whether to query clarifying follow-ups (if answers are vague) or advance to a new primary question topic.
    *   Caps interview sessions at 5 questions to balance evaluation breadth and runtime performance.
4.  **Monaco Coding Practice Sandbox**
    *   Full-screen compiler console utilizing VS Code's editor engine (Monaco Editor).
    *   Supports code writing in JavaScript, Python, C++, and Java.
    *   Compiles and runs code inside isolated containers using the Judge0 API.
    *   *Graceful Fallback:* If no RapidAPI credentials are set during local developer setups, the server automatically hooks in a local mock runner to prevent compilation crashes during demos.
5.  **Actionable Performance Reviews**
    *   Upon interview completion, Gemini aggregates the full transcript into a comprehensive review.
    *   Exposes radial overall score rings and progress bars measuring Technical accuracy vs Communication clarity.
    *   Renders list logs detailing strengths, improvement areas, actionable tips, and question-by-question critiques.
6.  **Paginated History & Deletion**
    *   Dashboard table fetches completed and in-progress sessions using Prisma count pagination.
    *   Supports cascading deletion. Deleting an interview removes all associated questions and answers in a single query.
7.  **Local Avatar File Storage**
    *   Exposes profile settings to edit names and change security passwords.
    *   Supports custom image file uploads, converting selected images to Base64 data URLs inside browser storage keyed to user IDs, falling back to initials SVG generators if empty.

---

## 📦 Database Schema (Prisma)

*   `User`: Keeps usernames, emails, bcrypt password hashes, and active refresh tokens.
*   `Interview`: Tracks the interview settings, overall aggregates, and final AI summary outputs.
*   `Question`: Keeps chronological questions (primary and follow-ups) prompted by Gemini.
*   `Answer`: Stores candidate response text, question scores, and specific AI critiques.
*   `CodingSubmission`: Logs files run and compiled inside the Monaco sandbox console.

---

## 💻 Local Setup Guide

### 1. Pre-requisites
*   Node.js (v18+)
*   PostgreSQL running locally or a hosted instance (Supabase/Neon)

### 2. Configure Backend
1.  Navigate to `backend/` and copy the env template:
    ```bash
    cd backend
    cp .env.example .env
    ```
2.  Open `.env` and fill in:
    *   `DATABASE_URL`: Your PostgreSQL connection string.
    *   `JWT_SECRET`: A secure random secret key string.
    *   `GEMINI_API_KEY`: A Google Gemini API Key.
    *   `RAPIDAPI_KEY` (Optional): If utilizing Judge0 via RapidAPI (leave blank to run in simulated mockup mode).
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run Prisma migrations to sync database schemas:
    ```bash
    npx prisma migrate dev --name init
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```

### 3. Configure Frontend
1.  Navigate to `frontend/` and install dependencies:
    ```bash
    cd ../frontend
    npm install
    ```
2.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
3.  Open `http://localhost:3000` to access the platform.

---

## ☁️ Deployment Instructions

### A. Backend hosting (Render / Railway)
*   **Build Command**: `npm install && npm run build`
*   **Start Command**: `npm start`
*   **Environment Variables**:
    *   `PORT`: `5000`
    *   `NODE_ENV`: `production`
    *   `DATABASE_URL`: (Your production PostgreSQL URL)
    *   `JWT_SECRET`: (A secure long random string)
    *   `GEMINI_API_KEY`: (Your Google Gemini API Key)

### B. Frontend hosting (Vercel)
Vercel automatically detects Next.js configurations. Configure:
*   **Build Command**: `npm run build`
*   **Output Directory**: `.next`
*   **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: The production URL pointing to your hosted Express backend (e.g. `https://your-backend.onrender.com/api`).
# Ai-Interview-Platform
