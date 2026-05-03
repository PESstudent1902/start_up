import os
from urllib.parse import quote
from flask import Flask, send_from_directory, redirect
from flask_cors import CORS
from werkzeug.exceptions import NotFound
from config import FRONTEND_URL, FLASK_DEBUG
from routes.users import users_bp
from routes.projects import projects_bp
from routes.leaderboard import leaderboard_bp
from routes.badges import badges_bp
from routes.tutor import tutor_bp

FRONTEND_DIST_PATH = os.path.realpath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)


def create_app():
    app = Flask(__name__, static_folder=FRONTEND_DIST_PATH, static_url_path="")

    CORS(app, resources={
        r"/api/*": {
            "origins": [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    })

    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(leaderboard_bp, url_prefix="/api/leaderboard")
    app.register_blueprint(badges_bp, url_prefix="/api/badges")
    app.register_blueprint(tutor_bp, url_prefix="/api/tutor")

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"status": "ok", "app": "BuildIQ API"}, 200

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        # Never intercept API routes (safety guard in case of route ordering edge cases)
        if path.startswith("api/"):
            raise NotFound()

        dist = FRONTEND_DIST_PATH
        if os.path.isdir(dist):
            # send_from_directory uses safe_join internally to prevent path traversal.
            # If the file doesn't exist it raises NotFound, which we catch to serve
            # index.html so that React Router can handle client-side navigation.
            if path:
                try:
                    return send_from_directory(dist, path)
                except NotFound:
                    pass
            return send_from_directory(dist, "index.html")

        # Development fallback: redirect to the Vite dev server.
        # Strip leading slashes, remove any ".." traversal segments, and
        # percent-encode the result so it is always a safe URL path segment.
        segments = [s for s in path.lstrip("/").split("/") if s != ".."]
        safe_path = quote("/".join(segments), safe=":@!$&'()*+,;=._~-")
        return redirect("http://localhost:5173/" + safe_path)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=FLASK_DEBUG, host="0.0.0.0", port=5000)
