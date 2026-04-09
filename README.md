# BuildIQ — Build Real. Learn Fast. Get Hired. 🚀

BuildIQ is an AI-powered project-based learning platform for Indian college students.
Students don't watch videos — they BUILD real industry projects guided by AI.

## Features
- 🤖 AI-generated industry-relevant projects (Google Gemini)
- 🎮 Gamification with scores, badges, and leaderboard
- 📊 Step-by-step build roadmap with industry context
- 🏆 Competitive leaderboard per track
- 📱 Mobile-first, dark mode UI
- 🦊 **Aria** — an animated AI fox assistant that monitors your progress and helps you when you're stuck

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Python Flask
- **Database**: Supabase
- **AI**: Google Gemini 1.5 Flash

---

## ⚡ One-Click Launch (Windows / macOS / Linux)

The easiest way to start everything with a single double-click:

### Windows
1. **Double-click `start.bat`** in the repo root.  
   The script will create a virtual environment, install all dependencies (first run only), start both servers, and open the app in your browser automatically.

### macOS / Linux
```bash
# Make executable once:
chmod +x start.sh

# Then double-click start.sh in Finder (macOS)
# or run in terminal:
./start.sh
```

> **First run**: The script copies `.env.example` → `.env` in both `backend/` and `frontend/`. Open `backend/.env` and add your `GEMINI_API_KEY` (and optionally Supabase keys) before using AI features.

---

## Manual Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Supabase account (free) at https://supabase.com
- A Google AI Studio API key (free) at https://aistudio.google.com

### 1. Clone the repository
```bash
git clone https://github.com/PESstudent1902/start_up.git
cd start_up
```

### 2. Set up the Database (Supabase)

1. Go to https://supabase.com and create a free project
2. Go to **SQL Editor** and run this schema:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  college TEXT,
  stream TEXT,
  year TEXT,
  track TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  track TEXT,
  difficulty TEXT,
  steps_json TEXT,
  completed_steps TEXT DEFAULT '[]',
  github_link TEXT,
  ai_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard table
CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  score INTEGER DEFAULT 0,
  track TEXT,
  badge TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges table
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_name TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. Go to **Project Settings → API** and copy your `Project URL` and `anon public` key

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:
```
GEMINI_API_KEY=your_api_key_from_aistudio
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_KEY=your_anon_key
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the backend:
```bash
python app.py
```

Backend runs at http://localhost:5000

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at http://localhost:5173

### 5. Open the app

Visit http://localhost:5173 in your browser.

## Project Structure

```
start_up/
├── start.bat              # Windows one-click launcher
├── start.sh               # macOS / Linux one-click launcher
├── frontend/              # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/    # Navbar, Confetti, LoadingState, FoxAssistant
│   │   ├── pages/         # Onboarding, Dashboard, ProjectPage, Leaderboard, Submission
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── backend/               # Python Flask API
│   ├── routes/            # users, projects, leaderboard, badges, tutor
│   ├── services/          # gemini_service, supabase_service
│   ├── app.py
│   ├── config.py
│   └── requirements.txt
└── README.md
```

## Environment Variables

### Backend (.env)
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key from aistudio.google.com |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon key |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:5173) |
| `FLASK_DEBUG` | Enable debug mode (1 or 0) |

### Frontend (.env)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (leave empty to use the built-in Vite proxy) |

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend.railway.app`

### Backend (Railway)
1. Connect your GitHub repo to Railway
2. Set root directory to `backend`
3. Add all environment variables from `.env`
4. Railway auto-detects Python and runs `python app.py`

## Demo Mode
The app works in demo mode without a backend — AI project generation and submission will use fallback data.