from flask import Blueprint, request, jsonify
from services.supabase_service import get_client

leaderboard_bp = Blueprint("leaderboard", __name__)

@leaderboard_bp.route("/", methods=["GET"])
def get_leaderboard():
    try:
        track = request.args.get("track", "all")
        period = request.args.get("period", "all_time")

        client = get_client()

        query = client.table("leaderboard").select(
            "*, users(name, college, stream), projects(title, track)"
        ).order("score", desc=True).limit(50)

        if track and track != "all":
            query = query.eq("track", track)

        result = query.execute()

        entries = []
        for i, entry in enumerate(result.data or []):
            entries.append({
                "rank": i + 1,
                "name": entry.get("users", {}).get("name", "Anonymous") if entry.get("users") else "Anonymous",
                "college": entry.get("users", {}).get("college", "") if entry.get("users") else "",
                "project_title": entry.get("projects", {}).get("title", "") if entry.get("projects") else "",
                "track": entry.get("track", ""),
                "score": entry.get("score", 0),
                "badge": entry.get("badge", ""),
            })

        return jsonify({"leaderboard": entries}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
