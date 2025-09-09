import os
from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, Prediction, PredictionMatch, User
import requests

predictionMatch_bp = Blueprint("prediction_match", __name__, url_prefix="/api/predictions")

RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HEADERS = {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key": RAPIDAPI_KEY,
}
    

def fetch_match_result_helper(event_id, prediction_match_id=None):
    """
    Fetch the final result of a match including scores, total goals,
    winner, and red card counts.
    Returns a dict or None if failed.
    """
    try:
        score_res = requests.get(
            f"https://{RAPIDAPI_HOST}/football-get-match-score",
            headers=HEADERS,
            params={"eventid": event_id}
        )
        score_res.raise_for_status()
        score_data = score_res.json()

        scores = score_data.get("response", {}).get("scores", [])
        if len(scores) != 2:
            return None

        home_score = scores[0].get("score")
        away_score = scores[1].get("score")
        if home_score is None or away_score is None:
            return None

        winner = "home" if home_score > away_score else "away" if away_score > home_score else "draw"
        total_goals = home_score + away_score

        stats_res = requests.get(
            f"https://{RAPIDAPI_HOST}/football-get-match-all-stats",
            headers=HEADERS,
            params={"eventid": event_id}
        )
        stats_res.raise_for_status()
        stats_data = stats_res.json()

        red_card_home = red_card_away = 0
        stats_list = stats_data.get("response", {}).get("stats", [])
        for stat_group in stats_list:
            if stat_group.get("key") == "discipline":
                for item in stat_group.get("stats", []):
                    if item.get("key") == "red_cards":
                        red_card_home = item.get("stats", [0, 0])[0] or 0
                        red_card_away = item.get("stats", [0, 0])[1] or 0
                        break

        result = {
            "home_score": home_score,
            "away_score": away_score,
            "total_goals": total_goals,
            "red_card_home": red_card_home,
            "red_card_away": red_card_away,
            "winner": winner
        }

        if prediction_match_id:
            match = PredictionMatch.query.get(prediction_match_id)
            if match:
                match.result_actual = winner
                match.score_home_actual = home_score
                match.score_away_actual = away_score
                match.total_goals_actual = total_goals
                match.red_card_actual = red_card_home + red_card_away
                db.session.commit()

        return result

    except requests.exceptions.RequestException:
        return None


@predictionMatch_bp.route("/results", methods=["GET"])
def fetch_match_result():
    event_id = request.args.get("event_id", type=int)
    if not event_id:
        return jsonify({"error": "event_id is required"}), 400
    
    prediction_match_id = request.args.get("prediction_match_id", type=int)
    if not prediction_match_id:
        return jsonify({"error": "prediction_match_id is required"}), 400

    result = fetch_match_result_helper(event_id, prediction_match_id)
    if not result:
        return jsonify({"error": "Failed to fetch match result"}), 500

    return jsonify(result), 200

    

@predictionMatch_bp.route("/calc-points", methods=["POST"])
def calculate_weekly_points():
    """
    Calculate weekly points for all locked predictions.
    """
    try:
        predictions = Prediction.query.filter_by(Prediction.status.in_(["pending", "locked"])).all()

        for pred in predictions:
            total_points = 0
            all_correct = True  # for bonus

            matches = PredictionMatch.query.filter_by(prediction_id=pred.prediction_id).all()

            for match in matches:
                result = fetch_match_result_helper(match.match_id, prediction_match_id=match.id)
                if not result:
                    all_correct = False
                    continue

                match_points = 0

                if match.result_prediction == result["winner"]:
                    match_points += 10
                else:
                    all_correct = False

                if (match.score_home_prediction is not None and
                    match.score_away_prediction is not None and
                    match.score_home_prediction == result["home_score"] and
                    match.score_away_prediction == result["away_score"]):
                    match_points += 50

                if match.total_goals_prediction is not None and match.total_goals_prediction == result["total_goals"]:
                    match_points += 30

                if match.red_card_prediction is not None:
                    predicted_red_card = match.red_card_prediction
                    actual_red_card = (result["red_card_home"] > 0 or result["red_card_away"] > 0)
                    if predicted_red_card == actual_red_card:
                        match_points += 20

                match.obtained_points = match_points
                total_points += match_points

            # Bonus: if user predicted exactly 3 matches and all are correct
            if len(matches) == 3 and all_correct:
                total_points += 100
                pred.bonus_awarded = True

            pred.obtained_points = total_points
            pred.status = "scored"
            pred.updated_at = datetime.utcnow()

            # Update user's cumulative points
            user = User.query.get(pred.user_id)
            if user:
                user.point = (user.point or 0) + total_points

        db.session.commit()
        return jsonify({"message": "Weekly points calculated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500