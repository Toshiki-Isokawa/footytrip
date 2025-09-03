# utils.py
import os
import uuid
from werkzeug.utils import secure_filename
from flask_jwt_extended import get_jwt_identity
from apscheduler.schedulers.background import BackgroundScheduler
from routes.predictionMatch import lock_predictions, calculate_weekly_points
from flask import current_app
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


def schedule_jobs(app):
    scheduler = BackgroundScheduler()

    # Lock predictions every Friday 00:00
    def lock_job():
        with app.app_context():
            try:
                response = app.test_client().post("/api/prediction/lock")
                if response.status_code != 200:
                    app.logger.error(f"Lock predictions failed: {response.get_json()}")
            except Exception as e:
                app.logger.exception("Unexpected error in scheduled lock_predictions")

    scheduler.add_job(lock_job, trigger="cron", day_of_week="fri", hour=0, minute=0)

    # Calculate weekly points every Monday 00:00
    def calc_points_job():
        with app.app_context():
            try:
                response = app.test_client().post("/api/prediction/calc-points")
                if response.status_code != 200:
                    app.logger.error(f"Weekly points calculation failed: {response.get_json()}")
            except Exception as e:
                app.logger.exception("Unexpected error in scheduled calculate_weekly_points")

    scheduler.add_job(calc_points_job, trigger="cron", day_of_week="mon", hour=0, minute=0)

    scheduler.start()

