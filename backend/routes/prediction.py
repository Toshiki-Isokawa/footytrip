import os
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from models import db, Prediction, PredictionMatch, User
from routes.predictionMatch import fetch_match_result
from math import floor
from sqlalchemy import func, desc
import requests


prediction_bp = Blueprint("prediction", __name__, url_prefix="/api/predictions")

RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HEADERS = {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key": RAPIDAPI_KEY,
}


def get_week_number(date: datetime):
    """Return ISO week number for a given date."""
    return date.isocalendar()[1]


@prediction_bp.route("/create", methods=["POST"])
def create_prediction():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    matches = data.get("matches", [])

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    if not matches or not (1 <= len(matches) <= 3):
        return jsonify({"error": "You must submit between 1 and 3 matches"}), 400

    now = datetime.utcnow()
    if now.weekday() > 3:
        return jsonify({"error": "Predictions can only be submitted Monday to Thursday"}), 400

    week_number = get_week_number(now)
    existing = Prediction.query.filter_by(user_id=user_id, week=week_number).first()
    if existing:
        return jsonify({"error": "Prediction for this week already exists. Use update API"}), 400

    # validate each match via match-status API and required fields
    for m in matches:
        match_id = m.get("match_id") or m.get("event_id")
        home_team = m.get("home_team") or m.get("home_name")
        home_team_id = m.get("home_team_id") or m.get("home_id")
        away_team = m.get("away_team") or m.get("away_name")
        away_team_id = m.get("away_team_id") or m.get("away_id")
        result_prediction = m.get("result_prediction")

        if not match_id or not home_team or not home_team_id or not away_team or not away_team_id or not result_prediction:
            return jsonify({"error": "Each match must include match_id, home_team(+id), away_team(+id), and result_prediction"}), 400

        try:
            res = requests.get(
                f"https://{RAPIDAPI_HOST}/football-get-match-status",
                headers=HEADERS,
                params={"eventid": match_id}
            )
            res.raise_for_status()
            body = res.json()
            status_info = body.get("response", {}).get("status", {})
            if status_info.get("started") or status_info.get("finished"):
                return jsonify({"error": f"Match {match_id} already started or finished"}), 400
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"Failed to validate match {match_id}: {str(e)}"}), 500

    # create prediction row
    prediction = Prediction(user_id=user_id, week=week_number, status="pending")
    db.session.add(prediction)
    db.session.flush()

    # insert prediction_match rows
    for m in matches:
        match_id = m.get("match_id") or m.get("event_id")
        home_team = m.get("home_team") or m.get("home_name")
        home_team_id = m.get("home_team_id") or m.get("home_id")
        away_team = m.get("away_team") or m.get("away_name")
        away_team_id = m.get("away_team_id") or m.get("away_id")

        pm = PredictionMatch(
            prediction_id=prediction.prediction_id,
            match_id=match_id,
            home_team=home_team,
            home_team_id=home_team_id,
            away_team=away_team,
            away_team_id=away_team_id,
            result_prediction=m.get("result_prediction"),
            score_home_prediction=m.get("score_home_prediction"),
            score_away_prediction=m.get("score_away_prediction"),
            total_goals_prediction=m.get("total_goals_prediction"),
            red_card_prediction=bool(m.get("red_card_prediction")) if m.get("red_card_prediction") is not None else None
        )
        db.session.add(pm)

    db.session.commit()
    return jsonify({"status": "success", "message": "Prediction created successfully"}), 200


@prediction_bp.route("/update", methods=["PUT"])
def update_prediction():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    matches = data.get("matches", [])

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    if not matches or not (1 <= len(matches) <= 3):
        return jsonify({"error": "You must submit between 1 and 3 matches"}), 400

    now = datetime.utcnow()
    if now.weekday() > 3:
        return jsonify({"error": "Predictions can only be updated Monday to Thursday"}), 400

    week_number = get_week_number(now)
    prediction = Prediction.query.filter_by(user_id=user_id, week=week_number).first()
    if not prediction:
        return jsonify({"error": "No existing prediction for this week"}), 404

    if prediction.status != "pending":
        return jsonify({"error": "Prediction already locked or scored and cannot be updated"}), 400

    for m in matches:
        match_id = m.get("match_id") or m.get("event_id")
        try:
            res = requests.get(
                f"https://{RAPIDAPI_HOST}/football-get-match-status",
                headers=HEADERS,
                params={"eventid": match_id}
            )
            res.raise_for_status()
            body = res.json()
            status_info = body.get("response", {}).get("status", {})
            if status_info.get("started") or status_info.get("finished"):
                return jsonify({"error": f"Match {match_id} already started or finished"}), 400
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"Failed to validate match {match_id}: {str(e)}"}), 500

    PredictionMatch.query.filter_by(prediction_id=prediction.prediction_id).delete()
    db.session.flush()

    for m in matches:
        match_id = m.get("match_id") or m.get("event_id")
        home_team = m.get("home_team") or m.get("home_name")
        home_team_id = m.get("home_team_id") or m.get("home_id")
        away_team = m.get("away_team") or m.get("away_name")
        away_team_id = m.get("away_team_id") or m.get("away_id")

        pm = PredictionMatch(
            prediction_id=prediction.prediction_id,
            match_id=match_id,
            home_team=home_team,
            home_team_id=home_team_id,
            away_team=away_team,
            away_team_id=away_team_id,
            result_prediction=m.get("result_prediction"),
            score_home_prediction=m.get("score_home_prediction"),
            score_away_prediction=m.get("score_away_prediction"),
            total_goals_prediction=m.get("total_goals_prediction"),
            red_card_prediction=bool(m.get("red_card_prediction")) if m.get("red_card_prediction") is not None else None
        )
        db.session.add(pm)

    prediction.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"status": "success", "message": "Prediction updated successfully"}), 200


@prediction_bp.route("/fetch", methods=["GET"])
def fetch_prediction(user_id=None, week=None):
    if user_id is None:
        user_id = request.args.get("user_id", type=int)
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

    if week is None:
        week = request.args.get("week", type=int)
        if not week:
            week = get_week_number(datetime.utcnow())

    prediction = Prediction.query.filter_by(user_id=user_id, week=week).first()
    print(f"Fetched prediction for user_id={user_id}, week={week}: {prediction}")
    if not prediction:
        return jsonify({"error": "No prediction found for this user/week"}), 404

    matches = PredictionMatch.query.filter_by(prediction_id=prediction.prediction_id).all()
    matches_out = []

    for m in matches:
        item = {
            "match_id": m.match_id,
            "home_team": {"id": m.home_team_id, "name": m.home_team},
            "away_team": {"id": m.away_team_id, "name": m.away_team},
            "result_prediction": m.result_prediction,
            "score_home_prediction": m.score_home_prediction,
            "score_away_prediction": m.score_away_prediction,
            "total_goals_prediction": m.total_goals_prediction,
            "red_card_prediction": m.red_card_prediction
        }

        if prediction.status == "scored":
            item["obtained_points"] = m.obtained_points
            try:
                actual_result = fetch_match_result(m.match_id)
                item["score_home_actual"] = actual_result["home_score"]
                item["score_away_actual"] = actual_result["away_score"]
            except Exception as e:
                item["score_home_actual"] = None
                item["score_away_actual"] = None

        matches_out.append(item)

    resp = {
        "user_id": user_id,
        "week": prediction.week,
        "status": prediction.status,
        "matches": matches_out
    }

    if prediction.status == "scored":
        resp["obtained_points"] = prediction.obtained_points

    return jsonify(resp), 200


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
                func.sum(Prediction.obtained_points).label("obtained_points")
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
    
@prediction_bp.route("/available-matches", methods=["GET"])
def get_available_matches():
    today = datetime.utcnow()
    # Get upcoming Friday to Sunday
    # weekday(): Monday=0 ... Sunday=6
    friday_offset = (4 - today.weekday()) % 7
    friday = today + timedelta(days=friday_offset)
    saturday = friday + timedelta(days=1)
    sunday = friday + timedelta(days=2)
    
    # List of dates in YYYYMMDD format
    date_list = [friday.strftime("%Y%m%d"), saturday.strftime("%Y%m%d"), sunday.strftime("%Y%m%d")]

    matches_out = []

    try:
        for date_str in date_list:
            res = requests.get(
                f"https://{RAPIDAPI_HOST}/football-get-matches-by-date",
                headers=HEADERS,
                params={"date": date_str}
            )
            res.raise_for_status()
            data = res.json()

            for match in data.get("response", {}).get("matches", []):
                status_info = match.get("status", {})
                # Only include matches that haven't started yet
                if status_info.get("started") or status_info.get("finished"):
                    continue

                matches_out.append({
                    "match_id": match.get("id"),
                    "league_id": match.get("leagueId"),
                    "home_team": {
                        "id": match["home"]["id"],
                        "name": match["home"]["name"],
                        "logo": match["home"].get("imageUrl")  # team logo
                    },
                    "away_team": {
                        "id": match["away"]["id"],
                        "name": match["away"]["name"],
                        "logo": match["away"].get("imageUrl")
                    },
                    "kickoff_time": match.get("time")
                })

        return jsonify({"status": "success", "matches": matches_out}), 200

    except requests.exceptions.RequestException as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    

@prediction_bp.route("/current", methods=["GET"])
def current_prediction():
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    week = get_week_number(datetime.utcnow())
    return fetch_prediction(user_id=user_id, week=week)


@prediction_bp.route("/last", methods=["GET"])
def last_prediction():
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    week = get_week_number(datetime.utcnow()) - 1
    return fetch_prediction(user_id=user_id, week=week)
