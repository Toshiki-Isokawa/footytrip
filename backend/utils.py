# utils.py
import os
import uuid
from werkzeug.utils import secure_filename

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
