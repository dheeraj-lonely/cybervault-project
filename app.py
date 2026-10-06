"""CyberVault — Minimal Flask (Vercel-safe, no DB, no SocketIO)"""
import os
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "cv-2025")

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
