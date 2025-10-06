# routes/google_auth.py
import os
import uuid
from extensions import bcrypt
from flask import Blueprint, request, jsonify, current_app
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from models import db, UserLogin, User 
from flask_jwt_extended import create_access_token
import datetime

google_bp = Blueprint("google_auth", __name__, url_prefix="/api/auth")

# -----------------------------
# POST /api/auth/google
# -----------------------------
@google_bp.route("/auth/google", methods=["POST"])
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
        idinfo = google_id_token.verify_oauth2_token(id_token, requests.Request(), CLIENT_ID)

        email = idinfo.get("email")
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", None)

        if not email:
            return jsonify({"msg": "Google account missing email"}), 400

        # Check if this email already exists
        user_login = UserLogin.query.filter_by(email=email).first()

        if not user_login:
            # 🚀 New Google user → create UserLogin with dummy password
            dummy_password = uuid.uuid4().hex  # random string
            user_login = UserLogin(email=email, hashed_password=bcrypt.generate_password_hash(dummy_password).decode("utf-8"))
            db.session.add(user_login)
            db.session.commit()

            # Also create User profile (minimal info, user can edit later)
            user = User(
                user_id=user_login.user_id,
                name=name or "New User",
                profile=picture,  # store Google picture
                created_at=datetime.utcnow(),
                edited_at=datetime.utcnow(),
            )
            db.session.add(user)
            db.session.commit()

            # Redirect to account setup page later on frontend
            new_user = True
        else:
            # Existing user → fetch associated User
            user = User.query.filter_by(user_id=user_login.user_id).first()
            new_user = False

        # Issue JWT token for session
        access_token = create_access_token(identity=email)

        return jsonify({
            "access_token": access_token,
            "msg": "Google authentication successful",
            "new_user": new_user,  # frontend can use this to decide redirect
            "user": {
                "email": email,
                "name": user.name if user else name,
                "profile": user.profile if user and user.profile else picture,
            }
        }), 200

    except ValueError as e:
        # Invalid token
        return jsonify({"msg": "Invalid Google token", "error": str(e)}), 401
