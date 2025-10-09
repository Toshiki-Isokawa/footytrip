# routes/ai_chat.py
from flask import Blueprint, request, jsonify
from helpers.ai_client import get_ai_response
from helpers.prompt_builder import build_prediction_prompt, build_analyzer_prompt, build_personal_chat_prompt

ai_bp = Blueprint("ai_bp", __name__, url_prefix="/api")

@ai_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_id = data.get("user_id")
    mode = data.get("mode")
    user_message = data.get("message", "")

    if not user_id or not mode:
        return jsonify({"error": "Missing required fields"}), 400

    if mode == "prediction":
        prompt = build_prediction_prompt(user_id, user_message)
        reply = get_ai_response(prompt)
        return jsonify({"reply": reply}), 200
    
    elif mode == "analyzer":
        prompt = build_analyzer_prompt(user_id)
        reply = get_ai_response(prompt)
        return jsonify({"reply": reply}), 200
    
    elif mode == "personal_chat":
        prompt = build_personal_chat_prompt(user_id, user_message)
        reply = get_ai_response(prompt)
        return jsonify({"reply": reply}), 200

    return jsonify({"reply": "This mode is under development."}), 200
