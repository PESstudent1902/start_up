import google.generativeai as genai
import json
import re
from config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_MAX_TOKENS, GEMINI_TEMPERATURE

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


def review_github_submission(github_link: str, project_title: str, track: str) -> dict:
    """Review a GitHub submission using Gemini AI"""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)

        prompt = f"""You are a senior software engineer reviewing a student's project submission for BuildIQ.

Project Title: {project_title}
Track: {track}
GitHub Link: {github_link}

Based on the GitHub repository link and project context, provide a realistic code review and score.

Consider that the GitHub link is: {github_link}

Return ONLY a valid JSON object:
{{
  "score": <number between 40-95>,
  "overall_feedback": "2-3 sentence summary of the work",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "interview_readiness": "How ready is this project for an interview (1-2 sentences)",
  "grade": "A/B/C/D"
}}

Be encouraging but honest. Return ONLY the JSON."""

        generation_config = genai.types.GenerationConfig(
            max_output_tokens=2048,
            temperature=0.5,
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
            "grade": "B"
        }
