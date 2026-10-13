"""CyberVault — Minimal Flask (Vercel-safe, no DB, no SocketIO)"""
import os
from flask import Flask, render_template, jsonify, request

# Load .env when running locally; on Vercel the env vars are set in the dashboard
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
# .env uses FLASK_SECRET_KEY; fall back to a generic name then a hardcoded default
app.config["SECRET_KEY"] = (
    os.getenv("FLASK_SECRET_KEY") or os.getenv("SECRET_KEY") or "cv-2025-change-me"
)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/game")
def game():
    return render_template("game.html")

@app.route("/api/status")
def status():
    return jsonify({"status": "ok"})

@app.route("/api/subscribe", methods=["POST"])
def subscribe():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip()
    if not email or "@" not in email:
        return jsonify({"ok": False, "message": "Invalid email"}), 400
    return jsonify({"ok": True, "message": "Subscribed!"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
