from flask import Blueprint, jsonify
from services.supabase_service import get_client
from config import BADGE_DEFINITIONS

badges_bp = Blueprint("badges", __name__)

@badges_bp.route("/user/<user_id>", methods=["GET"])
def get_user_badges(user_id):
    try:
        client = get_client()
        result = client.table("badges").select("*").eq("user_id", user_id).execute()

        badges = []
        for badge in (result.data or []):
            badge_name = badge.get("badge_name", "")
            badge_def = BADGE_DEFINITIONS.get(badge_name, {})
            badges.append({
                "badge_name": badge_name,
                "name": badge_def.get("name", badge_name),
                "description": badge_def.get("description", ""),
                "icon": badge_def.get("icon", "🏅"),
                "earned_at": badge.get("earned_at", ""),
            })

        return jsonify({"badges": badges}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
