from flask import Blueprint, request, jsonify
from services.supabase_service import get_client

users_bp = Blueprint("users", __name__)

@users_bp.route("/", methods=["POST"])
def create_user():
    try:
        data = request.get_json()
        required = ["name", "college", "stream", "year", "track"]
        for field in required:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400

        client = get_client()
        result = client.table("users").insert({
            "name": data["name"],
            "college": data["college"],
            "stream": data["stream"],
            "year": str(data["year"]),
            "track": data["track"],
        }).execute()

        if result.data:
            return jsonify({"user": result.data[0]}), 201
        return jsonify({"error": "Failed to create user"}), 500
    except Exception as e:
        print(f"Create user error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500


@users_bp.route("/<user_id>", methods=["GET"])
def get_user(user_id):
    try:
        client = get_client()
        result = client.table("users").select("*").eq("id", user_id).execute()
        if result.data:
            return jsonify({"user": result.data[0]}), 200
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500
