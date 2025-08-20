# utils.py
import os
import uuid
from werkzeug.utils import secure_filename
from flask_jwt_extended import get_jwt_identity
from models import UserLogin, User

ALLOWED_EXT = {"png", "jpg", "jpeg", "gif"}
UPLOAD_DIR = "static/uploads"

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def save_uploaded_file(fileobj, subdir="trips"):
    if not fileobj or fileobj.filename == "":
        return None
    if not allowed_file(fileobj.filename):
        return None
    filename = secure_filename(fileobj.filename)
    ext = filename.rsplit(".", 1)[1]
    new_name = f"{uuid.uuid4().hex}.{ext}"
    dirpath = os.path.join(UPLOAD_DIR, subdir)
    os.makedirs(dirpath, exist_ok=True)
    filepath = os.path.join(dirpath, new_name)
    fileobj.save(filepath)
    return new_name

def get_current_user():
    """Return the User object for the current JWT identity, or None if not found."""
    email = get_jwt_identity()
    user_login = UserLogin.query.filter_by(email=email).first()
    if not user_login:
        return None
    return User.query.filter_by(user_id=user_login.user_id).first()