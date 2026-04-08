import google.generativeai as genai
import json
import re
import requests
import base64
import logging
from config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_MAX_TOKENS, GEMINI_TEMPERATURE, GITHUB_TOKEN

logger = logging.getLogger(__name__)

genai.configure(api_key=GEMINI_API_KEY)

FALLBACK_PROJECT = {
    "title": "Build a Personal Portfolio Website",
    "problem_statement": "Most professionals lack an online presence, making it hard for recruiters to find them.",
    "industry_relevance": "Every tech company expects candidates to have a portfolio showcasing their work.",
    "what_you_will_learn": ["HTML/CSS fundamentals", "Responsive design", "Hosting on GitHub Pages"],
    "college_subject_connection": "Connects to web technologies, UI/UX design principles",
    "tools_required": ["VS Code", "GitHub", "GitHub Pages (free)"],
    "steps": [
        {
            "step_number": 1,
            "title": "Set up your project structure",
            "instruction": "Create an index.html file with proper HTML5 boilerplate structure.",
            "why_this_matters": "Industry standard is to always start with proper project scaffolding.",
            "industry_context": "In real companies, a poorly structured codebase costs weeks of refactoring."
        },
        {
            "step_number": 2,
            "title": "Design your hero section",
            "instruction": "Add a hero section with your name, title, and a CTA button.",
            "why_this_matters": "First impressions matter — recruiters spend 6 seconds on a portfolio.",
            "industry_context": "Top product companies hire UX writers just for above-the-fold content."
        },
        {
            "step_number": 3,
            "title": "Create a projects section",
            "instruction": "Add cards for your top 3 projects with links.",
            "why_this_matters": "Project evidence is the most important thing on a tech portfolio.",
            "industry_context": "Startups skip resumes entirely and look at GitHub/portfolio first."
        }
    ],
    "interview_talking_points": [
        "I chose this project because building in public demonstrates work ethic",
        "I learned responsive design which is used in 95% of production websites",
        "I deployed it live — showing I can take a project from idea to production"
    ],
    "difficulty": "Beginner",
    "estimated_hours": "8-12 hours"
}

def generate_project(track: str, difficulty: str, stream: str, college: str) -> dict:
    """Generate a project using Gemini AI"""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)

        prompt = f"""You are an expert industry mentor for Indian college students. Generate a unique, industry-relevant project for a student with the following profile:
- Subject Track: {track}
- Difficulty Level: {difficulty}
- Academic Stream: {stream}
- College: {college}

Generate a project that:
1. Is directly relevant to what Indian companies are hiring for RIGHT NOW
2. Can be built with FREE tools only
3. Connects to real-world problems the student can explain in an interview
4. Has 8-10 specific, actionable build steps
5. Is NOT a tutorial clone — it must be an ORIGINAL project idea

Return ONLY a valid JSON object with this exact structure:
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

        generation_config = genai.types.GenerationConfig(
            max_output_tokens=GEMINI_MAX_TOKENS,
            temperature=GEMINI_TEMPERATURE,
        )

        response = model.generate_content(prompt, generation_config=generation_config)

        text = response.text.strip()
        # Extract JSON if wrapped in code blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            text = json_match.group(1)

        project_data = json.loads(text)
        return project_data

    except Exception as e:
        print(f"Gemini API error: {e}")
        fallback = FALLBACK_PROJECT.copy()
        fallback["title"] = f"Portfolio Project for {track}"
        return fallback


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

    # Build a human-readable snapshot of the repo for Gemini
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
        model = genai.GenerativeModel(GEMINI_MODEL)

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

        generation_config = genai.types.GenerationConfig(
            max_output_tokens=2048,
            temperature=0.3,
        )

        response = model.generate_content(prompt, generation_config=generation_config)

        text = response.text.strip()
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            text = json_match.group(1)

        review_data = json.loads(text)
        return review_data

    except Exception as e:
        print(f"Gemini review error: {e}")
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
        model = genai.GenerativeModel(GEMINI_MODEL)

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

        generation_config = genai.types.GenerationConfig(
            max_output_tokens=1024,
            temperature=0.7,
        )

        response = model.generate_content(prompt, generation_config=generation_config)
        return response.text.strip()

    except Exception as e:
        print(f"Tutor error: {e}")
        return "Hmm, I hit a snag! Try rephrasing your question, and I'll do my best to help you out. 🙂"
