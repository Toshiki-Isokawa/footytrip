# routes/google_auth.py
import os
import uuid
from extensions import bcrypt
from flask import Blueprint, request, jsonify, current_app
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from models import db, UserLogin, User 
from flask_jwt_extended import create_access_token
from datetime import datetime

google_bp = Blueprint("google_auth", __name__, url_prefix="/api/auth")

# -----------------------------
# POST /api/auth/google
# -----------------------------
@google_bp.route("/google", methods=["POST"])
def google_auth():
    """
    Handle login/registration via Google.
    Expecting frontend to send {"id_token": "..."}
    """
    data = request.get_json()
    if not data or "id_token" not in data:
        return jsonify({"msg": "Missing id_token"}), 400

    id_token = data["id_token"]

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests

        CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        mode = data.get("mode", "login")
        idinfo = google_id_token.verify_oauth2_token(id_token, requests.Request(), CLIENT_ID)

        email = idinfo.get("email")
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", None)

        if not email:
            return jsonify({"msg": "Google account missing email"}), 400

        # Check if this email already exists
        user_login = UserLogin.query.filter_by(email=email).first()

        if mode == "register":
            if user_login:
                return jsonify({
                    "msg": "An account with this email already exists. Please log in instead.",
                    "existing_user": True
                }), 409

            dummy_password = uuid.uuid4().hex
            user_login = UserLogin(
                email=email,
                hashed_password=bcrypt.generate_password_hash(dummy_password).decode("utf-8")
            )
            db.session.add(user_login)
            db.session.commit()

            user = User(
                user_id=user_login.user_id,
                name=name or "New User",
                profile=picture,
                created_at=datetime.utcnow(),
                edited_at=datetime.utcnow(),
            )
            db.session.add(user)
            db.session.commit()

            access_token = create_access_token(identity=email)
            return jsonify({
                "access_token": access_token,
                "msg": "Google registration successful",
                "new_user": True,
                "user": {"email": email, "name": name, "profile": picture}
            }), 200
        else:
            if not user_login:
                return jsonify({
                    "msg": "No account found for this Google user. Please register first.",
                    "not_registered": True
                }), 404

            access_token = create_access_token(identity=email)
            return jsonify({
                "access_token": access_token,
                "msg": "Google login successful",
                "user": {"email": email, "name": name, "profile": picture}
            }), 200
    except ValueError as e:
        # Invalid token
        return jsonify({"msg": "Invalid Google token", "error": str(e)}), 401
