import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

SUBJECT_TRACKS = [
    "Web Development",
    "Python / Data Science",
    "Core Computer Science",
    "Mechanical / Civil Engineering",
    "Commerce / Finance",
    "Biology / Life Sciences",
]

DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"]

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
AI_MODEL = os.getenv("AI_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct")
AI_MAX_TOKENS = 8192
AI_TEMPERATURE = 0.7

BADGE_DEFINITIONS = {
    "first_project": {"name": "First Build", "description": "Completed your first project!", "icon": "🏗️"},
    "streak_3": {"name": "On Fire", "description": "3 day learning streak!", "icon": "🔥"},
    "top_10": {"name": "Top Builder", "description": "Reached top 10 on leaderboard!", "icon": "🏆"},
    "cross_stream": {"name": "Explorer", "description": "Built a project outside your stream!", "icon": "🌐"},
    "perfect_score": {"name": "Perfectionist", "description": "Got a perfect score!", "icon": "⭐"},
}
