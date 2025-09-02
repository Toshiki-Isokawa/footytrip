from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, Prediction, User
from math import floor
from sqlalchemy import func, desc
import requests


prediction_bp = Blueprint("prediction", __name__, url_prefix="/api/predictions")

RAPIDAPI_HOST = "free-api-live-football-data.p.rapidapi.com"
RAPIDAPI_KEY = "YOUR_RAPIDAPI_KEY"
HEADERS = {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key": RAPIDAPI_KEY,
}


def get_week_number(date: datetime):
    """Return ISO week number for a given date."""
    return date.isocalendar()[1]


@prediction_bp.route("/create", methods=["POST"])
def create_prediction():
    """
    Create a new prediction for the user.
    Request JSON should include:
    {
        "user_id": 123,
        "matches": [
            {
                "event_id": 4694674,
                "home_id": 10235,
                "home_name": "Feyenoord",
                "away_id": 10013,
                "away_name": "Salzburg",
                "prediction": "home"
            },
            ...
        ]
    }
    """
    data = request.get_json()
    user_id = data.get("user_id")
    matches = data.get("matches", [])

    # Validation 1: 1-3 matches
    if not matches or len(matches) > 3:
        return jsonify({"error": "You must select 1 to 3 matches"}), 400

    # Validation 2: Prediction period (Monday-Thursday)
    now = datetime.utcnow()
    if now.weekday() > 3:  # 0=Monday, 3=Thursday
        return jsonify({"error": "Predictions can only be submitted Monday to Thursday"}), 400

    # Validation 3: No existing prediction for the week
    week_number = get_week_number(now)
    existing = Prediction.query.filter_by(user_id=user_id, week=week_number).first()
    if existing:
        return jsonify({"error": "Prediction for this week already exists. Use update API"}), 400

    # Validation 4: Each match must not have started yet
    for m in matches:
        event_id = m.get("event_id")
        # Fetch match info from schedule API
        try:
            date_str = now.strftime("%Y%m%d")
            res = requests.get(
                f"https://{RAPIDAPI_HOST}/football-get-matches-by-date",
                headers=HEADERS,
                params={"date": date_str}
            )
            res.raise_for_status()
            schedule_data = res.json()
            match_info = next(
                (x for x in schedule_data.get("response", {}).get("matches", []) if x["id"] == event_id),
                None
            )
            if not match_info:
                return jsonify({"error": f"Match {event_id} not found"}), 400

            status_info = match_info.get("status", {})
            if status_info.get("started") or status_info.get("finished"):
                return jsonify({"error": f"Match {event_id} already started or finished"}), 400
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"Failed to validate match {event_id}: {str(e)}"}), 500

    # Create Prediction object
    pred = Prediction(
        user_id=user_id,
        week=week_number,
        status="pending"
    )

    # Map matches to DB columns
    match_fields = ["one", "two", "three"]
    for idx, m in enumerate(matches):
        key = match_fields[idx]
        setattr(pred, f"match_{key}_id", m.get("event_id"))
        setattr(pred, f"match_{key}_home", m.get("home_name"))
        setattr(pred, f"match_{key}_home_id", m.get("home_id"))
        setattr(pred, f"match_{key}_away", m.get("away_name"))
        setattr(pred, f"match_{key}_away_id", m.get("away_id"))
        setattr(pred, f"match_{key}_prediction", m.get("prediction"))

    db.session.add(pred)
    db.session.commit()

    return jsonify({"status": "success", "message": "Prediction created successfully"}), 200


@prediction_bp.route("/update", methods=["PUT"])
def update_prediction():
    """
    Update an existing prediction for the user.
    Request JSON should include:
    {
        "user_id": 123,
        "matches": [
            {
                "event_id": 4694674,
                "home_id": 10235,
                "home_name": "Feyenoord",
                "away_id": 10013,
                "away_name": "Salzburg",
                "prediction": "home"
            },
            ...
        ]
    }
    """
    data = request.get_json()
    user_id = data.get("user_id")
    matches = data.get("matches", [])

    # Validation 1: 1-3 matches
    if not matches or len(matches) > 3:
        return jsonify({"error": "You must select 1 to 3 matches"}), 400

    # Validation 2: Prediction period (Monday-Thursday)
    now = datetime.utcnow()
    if now.weekday() > 3:  # 0=Monday, 3=Thursday
        return jsonify({"error": "Predictions can only be updated Monday to Thursday"}), 400

    week_number = get_week_number(now)

    # Validation 3: Existing prediction must exist
    prediction = Prediction.query.filter_by(user_id=user_id, week=week_number).first()
    if not prediction:
        return jsonify({"error": "No existing prediction found for this week"}), 404

    # Validation 4: Check matches have not started yet
    for m in matches:
        event_id = m.get("event_id")
        try:
            date_str = now.strftime("%Y%m%d")
            res = requests.get(
                f"https://{RAPIDAPI_HOST}/football-get-matches-by-date",
                headers=HEADERS,
                params={"date": date_str}
            )
            res.raise_for_status()
            schedule_data = res.json()
            match_info = next(
                (x for x in schedule_data.get("response", {}).get("matches", []) if x["id"] == event_id),
                None
            )
            if not match_info:
                return jsonify({"error": f"Match {event_id} not found"}), 400

            status_info = match_info.get("status", {})
            if status_info.get("started") or status_info.get("finished"):
                return jsonify({"error": f"Match {event_id} already started or finished"}), 400
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"Failed to validate match {event_id}: {str(e)}"}), 500

    # Update prediction fields
    match_fields = ["one", "two", "three"]
    for idx, m in enumerate(matches):
        key = match_fields[idx]
        setattr(prediction, f"match_{key}_id", m.get("event_id"))
        setattr(prediction, f"match_{key}_home", m.get("home_name"))
        setattr(prediction, f"match_{key}_home_id", m.get("home_id"))
        setattr(prediction, f"match_{key}_away", m.get("away_name"))
        setattr(prediction, f"match_{key}_away_id", m.get("away_id"))
        setattr(prediction, f"match_{key}_prediction", m.get("prediction"))

    prediction.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"status": "success", "message": "Prediction updated successfully"}), 200


@prediction_bp.route("/fetch", methods=["GET"])
def fetch_prediction():
    """
    Fetch a user's predictions for a given week.
    Query params:
      - user_id (required)
      - week (optional, defaults to current week)
    Response: user's predictions for up to 3 matches (and points if scored).
    """
    user_id = request.args.get("user_id", type=int)
    week = request.args.get("week", type=int)

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    # Default to current week
    if not week:
        week = get_week_number(datetime.utcnow())

    prediction = Prediction.query.filter_by(user_id=user_id, week=week).first()
    if not prediction:
        return jsonify({"error": "No predictions found for this week"}), 404

    response = {
        "user_id": user_id,
        "week": week,
        "status": prediction.status,
        "matches": []
    }

    # Helper function to build match response
    def build_match(event_id, home_id, home_name, away_id, away_name, pred, points):
        match_data = {
            "event_id": event_id,
            "home_id": home_id,
            "home_name": home_name,
            "away_id": away_id,
            "away_name": away_name,
            "prediction": pred
        }
        # Only include points if status == "scored"
        if prediction.status == "scored":
            match_data["points"] = points
        return match_data

    # Add match one
    if prediction.match_one_id:
        response["matches"].append(build_match(
            prediction.match_one_id,
            prediction.match_one_home_id,
            prediction.match_one_home,
            prediction.match_one_away_id,
            prediction.match_one_away,
            prediction.match_one_prediction,
            prediction.match_one_point
        ))

    # Add match two
    if prediction.match_two_id:
        response["matches"].append(build_match(
            prediction.match_two_id,
            prediction.match_two_home_id,
            prediction.match_two_home,
            prediction.match_two_away_id,
            prediction.match_two_away,
            prediction.match_two_prediction,
            prediction.match_two_point
        ))

    # Add match three
    if prediction.match_three_id:
        response["matches"].append(build_match(
            prediction.match_three_id,
            prediction.match_three_home_id,
            prediction.match_three_home,
            prediction.match_three_away_id,
            prediction.match_three_away,
            prediction.match_three_prediction,
            prediction.match_three_point
        ))

    # Add total points + bonus if scored
    if prediction.status == "scored":
        response["total_points"] = prediction.obtained_points
        response["bonus"] = prediction.bonus

    return jsonify(response), 200


@prediction_bp.route("/lock", methods=["POST"])
def lock_predictions():
    """
    Lock all predictions for the current week.
    Should run every Friday at 00:00 (via APScheduler).
    """
    current_week = get_week_number(datetime.utcnow())

    try:
        locked_count = Prediction.query.filter_by(
            week=current_week, status="pending"
        ).update(
            {"status": "locked", "updated_at": datetime.utcnow()},
            synchronize_session=False
        )
        db.session.commit()
        return jsonify({
            "message": f"{locked_count} predictions locked for week {current_week}"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

def fetch_match_result(event_id):
    """Fetch actual match result from API and return 'home', 'away', or 'draw'."""
    url = f"https://{RAPIDAPI_HOST}/football-get-match-score?eventid={event_id}"
    headers = {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
    }
    resp = requests.get(url, headers=headers)
    data = resp.json()

    if data.get("status") != "success":
        return None

    scores = data["response"]["scores"]
    home_score = scores[0]["score"]
    away_score = scores[1]["score"]

    if home_score > away_score:
        return "home"
    elif away_score > home_score:
        return "away"
    else:
        return "draw"


def fetch_odds(event_id, prediction):
    """Fetch odds for given match and prediction ('home', 'away', 'draw')."""
    url = f"https://{RAPIDAPI_HOST}/football-event-odds?eventid={event_id}&countrycode=UK"
    headers = {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
    }
    resp = requests.get(url, headers=headers)
    data = resp.json()

    if data.get("status") != "success":
        return 0.0

    selections = data["response"]["odds"]["odds"]["resolvedOddsMarket"]["selections"]

    for sel in selections:
        if prediction == "home" and sel["name"] == "1":
            return float(sel["oddsDecimal"])
        elif prediction == "draw" and sel["name"] == "X":
            return float(sel["oddsDecimal"])
        elif prediction == "away" and sel["name"] == "2":
            return float(sel["oddsDecimal"])

    return 0.0


@prediction_bp.route("/calc-points", methods=["POST"])
def calculate_weekly_points():
    """
    Scheduled job: calculate points for all users' predictions
    after matches have finished.
    Stores per-match points and bonus.
    """
    try:
        predictions = Prediction.query.filter_by(status="locked").all()

        for pred in predictions:
            total_points = 0
            correct_count = 0
            all_scored = True

            # safeguard: skip if already scored
            if pred.status == "scored":
                continue

            # Loop through matches one, two, three
            for match_num in ["one", "two", "three"]:
                match_id = getattr(pred, f"match_{match_num}_id")
                user_pick = getattr(pred, f"match_{match_num}_prediction")

                if not match_id or not user_pick:
                    all_scored = False
                    break

                # Fetch actual result
                actual_result = fetch_match_result(match_id)
                if not actual_result:
                    all_scored = False
                    break

                # If correct prediction → calculate points from odds
                match_points = 0
                if user_pick == actual_result:
                    odds = fetch_odds(match_id, user_pick)
                    if odds:
                        match_points = floor(float(odds) * 10)
                        correct_count += 1

                # Store match points in respective column
                setattr(pred, f"match_{match_num}_point", match_points)
                total_points += match_points

            # Finalize if all 3 matches have results
            if all_scored:
                # Bonus for perfect 3/3
                if correct_count == 3:
                    total_points += 100
                    pred.bonus_awarded = True
                else:
                    pred.bonus_awarded = False

                pred.status = "scored"
                pred.points = total_points
                pred.updated_at = datetime.utcnow()

                # Update user's cumulative total
                user = User.query.get(pred.user_id)
                if user:
                    user.point = (user.point or 0) + total_points

        db.session.commit()
        return jsonify({"message": "Weekly points calculated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    


@prediction_bp.route("/leaderboard/weekly", methods=["GET"])
def weekly_leaderboard():
    """
    Returns top users for a specific week based on obtained points.
    Query param: ?week=202535
    """
    week = request.args.get("week")
    if not week:
        return jsonify({"error": "Missing 'week' parameter"}), 400

    try:
        # Sum points per user for the week
        results = (
            db.session.query(
                Prediction.user_id,
                User.name,
                User.profile,
                func.sum(Prediction.points).label("obtained_points")
            )
            .join(User, User.user_id == Prediction.user_id)
            .filter(Prediction.week == week)
            .group_by(Prediction.user_id, User.name, User.profile)
            .order_by(desc("obtained_points"))
            .limit(10)
            .all()
        )

        leaderboard = [
            {"user_id": r.user_id, "name": r.name, "profile": r.profile, "obtained_points": int(r.obtained_points)}
            for r in results
        ]

        return jsonify(leaderboard), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@prediction_bp.route("/leaderboard/overall", methods=["GET"])
def overall_leaderboard():
    """
    Returns top users sorted by cumulative points.
    """
    try:
        users = (
            User.query
            .filter(User.point.isnot(None))
            .order_by(User.point.desc())
            .limit(10)
            .all()
        )

        leaderboard = [
            {"user_id": u.user_id, "name": u.name, "profile": u.profile, "total_points": int(u.point)}
            for u in users
        ]

        return jsonify(leaderboard), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500