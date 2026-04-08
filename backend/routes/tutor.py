from flask import Blueprint, request, jsonify
import logging
from services.gemini_service import ask_tutor

logger = logging.getLogger(__name__)

tutor_bp = Blueprint("tutor", __name__)


@tutor_bp.route("/ask", methods=["POST"])
def ask():
    try:
        data = request.get_json()
        question = (data.get("question") or "").strip()
        if not question:
            return jsonify({"error": "Question is required"}), 400

        project_title = data.get("project_title", "your project")
        track = data.get("track", "General")
        step_title = data.get("step_title", "")
        step_instruction = data.get("step_instruction", "")
        conversation_history = data.get("conversation_history") or []

        answer = ask_tutor(
            question=question,
            project_title=project_title,
            track=track,
            step_title=step_title,
            step_instruction=step_instruction,
            conversation_history=conversation_history,
        )

        return jsonify({"answer": answer}), 200
    except Exception as e:
        logger.error("Tutor route error: %s", e)
        return jsonify({"error": "An internal error occurred"}), 500
