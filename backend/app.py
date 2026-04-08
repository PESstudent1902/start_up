from flask import Flask
from flask_cors import CORS
from config import FRONTEND_URL, FLASK_DEBUG
from routes.users import users_bp
from routes.projects import projects_bp
from routes.leaderboard import leaderboard_bp
from routes.badges import badges_bp
from routes.tutor import tutor_bp

def create_app():
    app = Flask(__name__)

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

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=FLASK_DEBUG, host="0.0.0.0", port=5000)
