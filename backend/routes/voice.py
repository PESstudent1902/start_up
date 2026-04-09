from flask import Blueprint, request, jsonify, Response
import logging
import requests
from config import ELEVENLABS_API_KEY

logger = logging.getLogger(__name__)

voice_bp = Blueprint("voice", __name__)

# ElevenLabs "Rachel" — warm, clear teacher-like voice
_ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
_ELEVENLABS_TTS_URL = (
    f"https://api.elevenlabs.io/v1/text-to-speech/{_ELEVENLABS_VOICE_ID}"
)
# Turbo model: lowest latency on ElevenLabs free tier
_ELEVENLABS_MODEL = "eleven_turbo_v2_5"
# Guard against accidental runaway usage on the free tier (10k chars/month)
_MAX_TEXT_LENGTH = 2000


@voice_bp.route("/speak", methods=["POST"])
def speak():
    """Convert text to speech using ElevenLabs and return an MP3 audio stream.

    Returns 503 when ELEVENLABS_API_KEY is not configured so the frontend
    can seamlessly fall back to the browser's built-in SpeechSynthesis API.
    """
    if not ELEVENLABS_API_KEY:
        return jsonify({"error": "ElevenLabs API key not configured"}), 503

    try:
        data = request.get_json()
        text = (data.get("text") or "").strip()
        if not text:
            return jsonify({"error": "Text is required"}), 400

        text = text[:_MAX_TEXT_LENGTH]
        if len(text) == _MAX_TEXT_LENGTH:
            logger.warning(
                "Voice /speak: text truncated to %d characters", _MAX_TEXT_LENGTH
            )

        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": text,
            "model_id": _ELEVENLABS_MODEL,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }

        resp = requests.post(
            _ELEVENLABS_TTS_URL, json=payload, headers=headers, timeout=15
        )
        if resp.status_code != 200:
            logger.error(
                "ElevenLabs returned %s: %s", resp.status_code, resp.text[:200]
            )
            return jsonify({"error": "TTS service error"}), 502

        return Response(resp.content, mimetype="audio/mpeg")

    except Exception as e:
        logger.error("Voice route error: %s", e)
        return jsonify({"error": "An internal error occurred"}), 500
