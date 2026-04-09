from openai import OpenAI
import json
import re
import random
import requests
import base64
import logging
from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, AI_MODEL, AI_MAX_TOKENS, AI_TEMPERATURE, GITHUB_TOKEN

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url=OPENROUTER_BASE_URL,
        )
    return _client


# Variety seeds to ensure different projects each call
_PROJECT_THEMES = [
    "automation and productivity",
    "sustainability and green tech",
    "healthcare and wellness",
    "education and e-learning",
    "finance and payments",
    "logistics and supply chain",
    "social networking and community",
    "security and privacy",
    "agriculture and food tech",
    "smart city and IoT",
    "entertainment and media",
    "accessibility and inclusion",
]

FALLBACK_PROJECTS = [
    {
        "title": "Smart Expense Tracker with Analytics",
        "problem_statement": "College students and young professionals struggle to track their daily expenses, leading to poor financial habits and overspending. Manual tracking is tedious and most apps are too complex.",
        "industry_relevance": "Fintech is one of India's fastest-growing sectors. Companies like Razorpay, Paytm, and PhonePe hire engineers who understand financial data flows.",
        "what_you_will_learn": ["REST API design", "Data visualization with Chart.js", "Local storage and state management", "Date/time manipulation", "Responsive UI design"],
        "college_subject_connection": "Connects to DBMS, Data Structures, and Software Engineering course topics.",
        "tools_required": ["VS Code (free)", "GitHub (free)", "Chart.js (free)", "Netlify (free hosting)"],
        "steps": [
            {"step_number": 1, "title": "Set up project structure", "instruction": "Create a well-organized folder structure with separate files for HTML, CSS, and JavaScript. Plan the data model for an expense entry (id, amount, category, date, note).", "why_this_matters": "Clean project structure is the first thing a code reviewer checks during a hiring process.", "industry_context": "At startups, engineers own entire features end-to-end, so structure matters from day one."},
            {"step_number": 2, "title": "Build the expense input form", "instruction": "Create a form with fields: amount, category (dropdown), date picker, and optional note. Add validation to prevent empty or negative values.", "why_this_matters": "Input validation prevents bad data — a core software engineering principle.", "industry_context": "Production apps validate both on the frontend (UX) and backend (security)."},
            {"step_number": 3, "title": "Implement local storage persistence", "instruction": "Use the browser's localStorage API to save and retrieve expenses as JSON. Implement CRUD operations: add, read, update, delete.", "why_this_matters": "Understanding data persistence is foundational to building real apps.", "industry_context": "Engineers must choose the right storage layer — localStorage for prototypes, databases for production."},
            {"step_number": 4, "title": "Build the expense list view", "instruction": "Render expenses in a dynamic table with sorting by date and filtering by category. Add a delete button for each row.", "why_this_matters": "Data display is critical — how you present data affects user decisions.", "industry_context": "Product analytics dashboards at companies like Swiggy use similar list + filter patterns."},
            {"step_number": 5, "title": "Add monthly summary cards", "instruction": "Calculate and display total spending, top spending category, and average daily spend for the current month using JavaScript array methods.", "why_this_matters": "Aggregations and summaries are the core of any analytics product.", "industry_context": "Data aggregation is at the heart of products like Google Analytics and Mixpanel."},
            {"step_number": 6, "title": "Integrate Chart.js for visualization", "instruction": "Add a doughnut chart for category breakdown and a bar chart for daily spending trends over the past 7 days.", "why_this_matters": "Visual data is processed 60,000 times faster by the brain — visualization skills are highly valued.", "industry_context": "All major dashboards from fintech to healthtech rely on chart libraries for business insights."},
            {"step_number": 7, "title": "Add budget alerts", "instruction": "Let users set a monthly budget. Show a visual warning (red progress bar) when spending exceeds 80% of budget.", "why_this_matters": "Proactive notifications are what separates great products from average ones.", "industry_context": "Banks like HDFC and Kotak use similar threshold alerts in their mobile apps."},
            {"step_number": 8, "title": "Deploy to Netlify and write README", "instruction": "Deploy your app to Netlify with one click. Write a README with a project overview, features list, screenshots, and setup instructions.", "why_this_matters": "A live deployed app is 10x more impressive to a recruiter than local code.", "industry_context": "Every production app is deployed — knowing deployment basics is non-negotiable in the industry."},
        ],
        "interview_talking_points": [
            "I built a full CRUD application using vanilla JavaScript and localStorage for data persistence",
            "I integrated Chart.js to visualize spending patterns, understanding how data aggregation works",
            "I implemented input validation and budget alerts, applying core software engineering principles",
            "I deployed the app live on Netlify, demonstrating end-to-end ownership"
        ],
        "difficulty": "Beginner",
        "estimated_hours": "10-15 hours",
    },
    {
        "title": "Campus Event Finder App",
        "problem_statement": "Students miss important campus events, hackathons, and workshops because information is scattered across notice boards, WhatsApp groups, and emails with no central discovery platform.",
        "industry_relevance": "Event tech and community platforms are growing rapidly. Companies like Unstop, Internshala, and Townscript operate in this space and look for engineers who understand community-driven product design.",
        "what_you_will_learn": ["React component architecture", "State management with useState/useEffect", "API integration with fetch/axios", "Search and filter UX patterns", "Responsive card-based layouts"],
        "college_subject_connection": "Aligns with Web Technologies, Human-Computer Interaction, and Software Engineering subjects.",
        "tools_required": ["VS Code (free)", "React + Vite (free)", "GitHub (free)", "Vercel (free hosting)"],
        "steps": [
            {"step_number": 1, "title": "Design the data model", "instruction": "Define a JSON structure for an event: id, title, description, date, time, venue, category (tech/sports/cultural/academic), organizer, registration link, tags.", "why_this_matters": "Good data modelling prevents costly refactoring later in the project.", "industry_context": "At product companies, data schema discussions happen before any code is written."},
            {"step_number": 2, "title": "Create sample event data", "instruction": "Create a `data/events.json` file with 15-20 realistic events across different categories. This will act as your mock API.", "why_this_matters": "Working with mock data first lets you build UI independently of backend readiness.", "industry_context": "Frontend and backend teams work in parallel using mock data and API contracts."},
            {"step_number": 3, "title": "Build the EventCard component", "instruction": "Create a reusable React component that displays event details as a card with category badge, date/time, venue, and a register button.", "why_this_matters": "Reusable components reduce duplication and are the core of React's design philosophy.", "industry_context": "Component libraries like those at Atlassian or Shopify are built on this principle."},
            {"step_number": 4, "title": "Implement search functionality", "instruction": "Add a search bar that filters events by title, description, and tags in real-time as the user types, using React controlled components.", "why_this_matters": "Real-time search is one of the most common and impactful UX patterns.", "industry_context": "Search is a core feature at companies like LinkedIn, Naukri, and Internshala."},
            {"step_number": 5, "title": "Add category filter tabs", "instruction": "Build filter buttons for each category (All, Tech, Sports, Cultural, Academic) that dynamically show/hide cards.", "why_this_matters": "Filtering large datasets is a fundamental product interaction pattern.", "industry_context": "E-commerce sites like Amazon and Flipkart are built around this exact filtering UX."},
            {"step_number": 6, "title": "Add event detail modal", "instruction": "When a user clicks an event card, show a modal/drawer with full details including a description, organizer info, and registration CTA.", "why_this_matters": "Modals reduce navigation complexity and improve conversion rates.", "industry_context": "UI pattern used in Airbnb, Zomato, and most modern SaaS products."},
            {"step_number": 7, "title": "Implement bookmark feature", "instruction": "Let users bookmark events using localStorage. Show a saved events tab that persists across browser sessions.", "why_this_matters": "Personalization and persistence improve user engagement significantly.", "industry_context": "Features like LinkedIn job saves or Flipkart wishlists use the same concept."},
            {"step_number": 8, "title": "Deploy and document", "instruction": "Deploy to Vercel. Write a README with a live demo link, feature list, and a screenshot. Add a CONTRIBUTING.md guide.", "why_this_matters": "Documentation is how you communicate the value of your work to others.", "industry_context": "Open source projects and internal tools both require good documentation."},
        ],
        "interview_talking_points": [
            "I built a React app with reusable components, demonstrating component-based architecture",
            "I implemented real-time search and category filtering over a dataset of 20+ events",
            "I used localStorage for persistent bookmarks, understanding client-side data storage",
            "I deployed the app to Vercel and documented it with a proper README"
        ],
        "difficulty": "Beginner",
        "estimated_hours": "12-18 hours",
    },
]


def _random_fallback(difficulty: str) -> dict:
    """Return a varied fallback project so users don't always see the same one."""
    fallback = random.choice(FALLBACK_PROJECTS).copy()
    fallback["difficulty"] = difficulty
    return fallback


def generate_project(track: str, difficulty: str, stream: str, college: str) -> dict:
    """Generate a project using the NVIDIA model via OpenRouter."""
    try:
        client = _get_client()
        theme = random.choice(_PROJECT_THEMES)

        prompt = f"""You are an expert industry mentor for Indian college students. Generate a unique, industry-relevant project for a student with the following profile:
- Subject Track: {track}
- Difficulty Level: {difficulty}
- Academic Stream: {stream}
- College: {college}
- Theme focus (vary the project around this): {theme}

Generate a project that:
1. Is directly relevant to what Indian companies are hiring for RIGHT NOW
2. Can be built with FREE tools only
3. Connects to real-world problems the student can explain in an interview
4. Has 8-10 specific, actionable build steps
5. Is NOT a tutorial clone — it must be an ORIGINAL project idea
6. Is themed around: {theme}Return ONLY a valid JSON object with this exact structure:
{{
  "title": "Project title (creative, industry-sounding)",
  "problem_statement": "The real-world problem this project solves (2-3 sentences)",
  "industry_relevance": "Why companies need this solution RIGHT NOW (2-3 sentences)",
  "what_you_will_learn": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "college_subject_connection": "How this connects to college syllabus topics (1-2 sentences)",
  "tools_required": ["tool 1 (free)", "tool 2 (free)", "tool 3 (free)"],
  "steps": [
    {{
      "step_number": 1,
      "title": "Step title",
      "instruction": "Detailed instruction (3-4 sentences)",
      "why_this_matters": "Why this step is important for the overall project",
      "industry_context": "How this is done in real companies"
    }}
  ],
  "interview_talking_points": ["point 1", "point 2", "point 3", "point 4"],
  "difficulty": "{difficulty}",
  "estimated_hours": "X-Y hours"
}}

Make sure to generate exactly 8-10 steps. Each step must have meaningful instructions and real industry context. Return ONLY the JSON, no markdown, no explanation."""

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=AI_MAX_TOKENS,
            temperature=AI_TEMPERATURE,
        )

        text = response.choices[0].message.content.strip()
        # Extract JSON if wrapped in code blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            text = json_match.group(1)

        project_data = json.loads(text)
        return project_data

    except Exception as e:
        logger.error("AI API error: %s", e)
        return _random_fallback(difficulty)


def _fetch_github_repo_context(github_link: str) -> dict:
    """Fetch real content from a public GitHub repository for honest grading."""
    context = {
        "description": "",
        "language": "",
        "topics": [],
        "readme": "",
        "file_tree": [],
        "stars": 0,
        "forks": 0,
        "open_issues": 0,
        "error": None,
    }
    try:
        # Parse owner/repo from URL like https://github.com/owner/repo[/...]
        match = re.search(r'github\.com/([^/]+)/([^/?\s#]+)', github_link)
        if not match:
            context["error"] = "Could not parse GitHub URL"
            return context

        owner, repo = match.group(1), match.group(2).rstrip('/')
        headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

        # Basic repo info
        repo_resp = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers=headers, timeout=8
        )
        if repo_resp.status_code == 404:
            context["error"] = "Repository not found or is private"
            return context
        if repo_resp.ok:
            repo_data = repo_resp.json()
            context["description"] = repo_data.get("description") or ""
            context["language"] = repo_data.get("language") or ""
            context["topics"] = repo_data.get("topics") or []
            context["stars"] = repo_data.get("stargazers_count", 0)
            context["forks"] = repo_data.get("forks_count", 0)
            context["open_issues"] = repo_data.get("open_issues_count", 0)

        # README content (decoded, truncated to 3000 chars)
        readme_resp = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/readme",
            headers=headers, timeout=8
        )
        if readme_resp.ok:
            readme_data = readme_resp.json()
            encoded = readme_data.get("content", "")
            # Guard against maliciously large READMEs (1 MB encoded ≈ 750 KB decoded)
            if encoded and len(encoded) <= 1_000_000:
                decoded = base64.b64decode(encoded).decode("utf-8", errors="replace")
                context["readme"] = decoded[:3000]

        # File tree (top-level files to avoid huge repos)
        tree_resp = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD",
            headers=headers, timeout=8
        )
        if tree_resp.ok:
            tree_data = tree_resp.json()
            context["file_tree"] = [
                item["path"] for item in tree_data.get("tree", [])
            ][:60]

    except Exception as e:
        context["error"] = str(e)

    return context


def review_github_submission(github_link: str, project_title: str, track: str,
                              project_steps: list = None) -> dict:
    """Review a GitHub submission using actual repo content for honest grading."""
    repo_context = _fetch_github_repo_context(github_link)

    # Build a human-readable snapshot of the repo for the AI
    repo_snapshot_parts = []
    if repo_context.get("error"):
        repo_snapshot_parts.append(f"⚠️ Repo fetch issue: {repo_context['error']}")
    else:
        repo_snapshot_parts.append(f"Primary language: {repo_context['language'] or 'unknown'}")
        repo_snapshot_parts.append(f"Description: {repo_context['description'] or '(none)'}")
        if repo_context["topics"]:
            repo_snapshot_parts.append(f"Topics: {', '.join(repo_context['topics'])}")
        repo_snapshot_parts.append(f"Stars: {repo_context['stars']}, Forks: {repo_context['forks']}")
        if repo_context["file_tree"]:
            repo_snapshot_parts.append(f"Files: {', '.join(repo_context['file_tree'][:30])}")
        else:
            repo_snapshot_parts.append("Files: (empty or inaccessible)")
        if repo_context["readme"]:
            repo_snapshot_parts.append(f"\nREADME (first 3000 chars):\n{repo_context['readme']}")
        else:
            repo_snapshot_parts.append("README: (missing)")

    repo_snapshot = "\n".join(repo_snapshot_parts)

    steps_summary = ""
    if project_steps:
        titles = [f"Step {s.get('step_number', i+1)}: {s.get('title', '')}" for i, s in enumerate(project_steps)]
        steps_summary = "\n".join(titles[:10])

    try:
        client = _get_client()

        prompt = f"""You are a strict but fair senior software engineer reviewing a student's BuildIQ project submission.

=== ASSIGNED PROJECT ===
Title: {project_title}
Track: {track}
{f"Build Steps the student was supposed to complete:{chr(10)}{steps_summary}" if steps_summary else ""}

=== SUBMITTED GITHUB REPOSITORY ===
Link: {github_link}
{repo_snapshot}

=== YOUR TASK ===
1. RELEVANCE CHECK: Does this repository actually implement the assigned project "{project_title}" in the "{track}" track?
   - If the repo is clearly unrelated (e.g., a different project, a template, a fork with no changes, or empty), give a low score (0-30) and explain why.
   - If the repo is related but incomplete, score 30-60.
   - If the repo matches and is well-done, score 60-95.

2. QUALITY CHECK based on the actual README and file structure:
   - Is there a proper README? (no README = max 50 pts)
   - Does the file structure match the expected project?
   - Is there real code (not just a template clone)?

Be HONEST. Do NOT give high scores to repos that are unrelated or empty.
A random unrelated repository must score below 35 and get a D or F grade.

Return ONLY a valid JSON object:
{{
  "score": <0-95>,
  "overall_feedback": "2-3 sentence honest summary. If unrelated, state that clearly.",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "interview_readiness": "Honest assessment of interview readiness (1-2 sentences)",
  "grade": "A/B/C/D/F",
  "relevance_warning": null or "Warning message if repo doesn't match the assigned project"
}}

Return ONLY the JSON."""

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.3,
        )

        text = response.choices[0].message.content.strip()
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            text = json_match.group(1)

        review_data = json.loads(text)
        return review_data

    except Exception as e:
        logger.error("AI review error: %s", e)
        return {
            "score": 65,
            "overall_feedback": "Your project shows good effort and initiative. Keep building!",
            "strengths": ["Project structure is solid", "Good effort shown", "Project idea is relevant"],
            "improvements": ["Add more documentation", "Include a README with setup steps", "Add comments to code"],
            "interview_readiness": "This project is a good starting point. Polish it with the improvements above.",
            "grade": "B",
            "relevance_warning": None,
        }


def ask_tutor(question: str, project_title: str, track: str, step_title: str = "",
              step_instruction: str = "", conversation_history: list = None) -> str:
    """Ask the AI tutor a question about the current project step."""
    try:
        client = _get_client()

        history_text = ""
        if conversation_history:
            for msg in conversation_history[-6:]:  # Last 3 exchanges
                role = "Student" if msg["role"] == "user" else "Aria"
                history_text += f"{role}: {msg['content']}\n"

        prompt = f"""You are Aria, a warm, brilliant, and patient AI tutor for BuildIQ — a platform that teaches Indian college students real-world tech skills through project-based learning.

Your personality:
- Friendly, encouraging, and enthusiastic — like a brilliant senior student who genuinely loves teaching
- You explain concepts simply first, then go deeper if asked
- You use analogies from everyday Indian life to make things relatable
- You never just give the answer — you guide students to understand WHY and HOW
- You celebrate small wins ("Great question!", "You're thinking like a developer!")
- You're concise but complete — no walls of text, use bullet points when listing steps

Current context:
- Project: {project_title}
- Track: {track}
{f"- Current Step: {step_title}" if step_title else ""}
{f"- Step instruction: {step_instruction}" if step_instruction else ""}

{f"Conversation so far:{chr(10)}{history_text}" if history_text else ""}

Student's question: {question}

Respond as Aria. Be helpful, clear, and encouraging. If the question is unrelated to the project/learning, gently redirect back to the topic."""

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.error("Tutor error: %s", e)
        return "Hmm, I hit a snag! Try rephrasing your question, and I'll do my best to help you out. 🙂"
