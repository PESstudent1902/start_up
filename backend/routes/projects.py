from flask import Blueprint, request, jsonify
from services.supabase_service import get_client
from services.gemini_service import generate_project, review_github_submission
import json

projects_bp = Blueprint("projects", __name__)

@projects_bp.route("/generate", methods=["POST"])
def generate():
    try:
        data = request.get_json()
        track = data.get("track", "Web Development")
        difficulty = data.get("difficulty", "Beginner")
        stream = data.get("stream", "Engineering")
        college = data.get("college", "")
        user_id = data.get("user_id")

        project_data = generate_project(track, difficulty, stream, college)

        if user_id:
            try:
                client = get_client()
                saved = client.table("projects").insert({
                    "user_id": user_id,
                    "title": project_data.get("title", "Untitled Project"),
                    "track": track,
                    "difficulty": difficulty,
                    "steps_json": json.dumps(project_data),
                    "completed_steps": json.dumps([]),
                }).execute()
                if saved.data:
                    project_data["project_id"] = saved.data[0]["id"]
            except Exception as save_err:
                print(f"Save error (non-fatal): {save_err}")

        return jsonify({"project": project_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@projects_bp.route("/<project_id>/steps", methods=["PUT"])
def update_steps(project_id):
    try:
        data = request.get_json()
        completed_steps = data.get("completed_steps", [])

        client = get_client()
        result = client.table("projects").update({
            "completed_steps": json.dumps(completed_steps)
        }).eq("id", project_id).execute()

        if result.data:
            return jsonify({"success": True, "project": result.data[0]}), 200
        return jsonify({"error": "Project not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@projects_bp.route("/<project_id>/submit", methods=["POST"])
def submit_project(project_id):
    try:
        data = request.get_json()
        github_link = data.get("github_link", "")
        user_id = data.get("user_id")

        if not github_link:
            return jsonify({"error": "GitHub link is required"}), 400

        client = get_client()
        proj_result = client.table("projects").select("*").eq("id", project_id).execute()
        if not proj_result.data:
            return jsonify({"error": "Project not found"}), 404

        project = proj_result.data[0]
        project_title = project.get("title", "Unknown Project")
        track = project.get("track", "General")

        review = review_github_submission(github_link, project_title, track)
        score = review.get("score", 65)

        client.table("projects").update({
            "github_link": github_link,
            "ai_score": score,
        }).eq("id", project_id).execute()

        if user_id:
            try:
                existing = client.table("leaderboard").select("*").eq("project_id", project_id).execute()
                if existing.data:
                    client.table("leaderboard").update({
                        "score": score,
                    }).eq("project_id", project_id).execute()
                else:
                    client.table("leaderboard").insert({
                        "user_id": user_id,
                        "project_id": project_id,
                        "score": score,
                        "track": track,
                    }).execute()

                _check_and_award_badges(user_id, score, client)
            except Exception as lb_err:
                print(f"Leaderboard update error (non-fatal): {lb_err}")

        return jsonify({"review": review}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _check_and_award_badges(user_id: str, score: int, client):
    try:
        projects = client.table("projects").select("*").eq("user_id", user_id).execute()
        project_count = len(projects.data) if projects.data else 0

        existing_badges = client.table("badges").select("badge_name").eq("user_id", user_id).execute()
        earned = {b["badge_name"] for b in (existing_badges.data or [])}

        new_badges = []
        if project_count >= 1 and "first_project" not in earned:
            new_badges.append({"user_id": user_id, "badge_name": "first_project"})
        if score == 100 and "perfect_score" not in earned:
            new_badges.append({"user_id": user_id, "badge_name": "perfect_score"})

        if new_badges:
            client.table("badges").insert(new_badges).execute()
    except Exception as e:
        print(f"Badge error (non-fatal): {e}")


@projects_bp.route("/user/<user_id>", methods=["GET"])
def get_user_projects(user_id):
    try:
        client = get_client()
        result = client.table("projects").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return jsonify({"projects": result.data or []}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
