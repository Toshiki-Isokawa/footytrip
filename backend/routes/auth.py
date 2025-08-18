from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from werkzeug.exceptions import BadRequest
from models import UserLogin
from extensions import db, bcrypt
from jwt.exceptions import DecodeError
from flask_jwt_extended.exceptions import NoAuthorizationError

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

# -----------------------------
# POST /api/auth/register
# -----------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        raise BadRequest("Missing JSON body")

    email = data.get("email")
    password = data.get("password")

    if UserLogin.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    new_user = UserLogin(email=email, hashed_password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=email)
    return jsonify(access_token=access_token, msg="User registered"), 201


# -----------------------------
# POST /api/login
# -----------------------------
@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return "", 204
    
    data = request.get_json()
    if not data:
        raise BadRequest("Missing JSON body")

    email = data.get("email")
    password = data.get("password")

    user = UserLogin.query.filter_by(email=email).first()
    if user and user.check_password(password):
        access_token = create_access_token(identity=user.email)
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"msg": "Invalid credentials"}), 401


# -----------------------------
# GET /api/auth/check
# -----------------------------
@auth_bp.route("/check", methods=["GET"])
@jwt_required()
def check_auth():
    current_user_email = get_jwt_identity()
    user = UserLogin.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({"email": user.email, "user_id": user.user_id}), 200


# -----------------------------
# Error handlers
# -----------------------------
@auth_bp.app_errorhandler(NoAuthorizationError)
@auth_bp.app_errorhandler(DecodeError)
def handle_auth_error(e):
    return jsonify({"msg": "Invalid or missing JWT token"}), 401
