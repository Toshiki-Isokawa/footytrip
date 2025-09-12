from flask import Blueprint, jsonify
from routes.prediction import fetch_available_matches
from routes.schedule import fetch_logo_helper
from routes.user import fetch_stadium_helper
import random

upcomingMatch_bp = Blueprint("upcomingMatch", __name__, url_prefix="/api")

@upcomingMatch_bp.route("/upcoming", methods=["GET"])
def get_random_upcoming_match():
    try:
        matches = fetch_available_matches()

        if not matches:
            return jsonify({"error": "No matches available"}), 404

        # Filter out any broken matches (missing team info)
        valid_matches = [
            m for m in matches
            if m.get("home_team") and m.get("away_team")
        ]

        if not valid_matches:
            return jsonify({"error": "No valid matches available"}), 404

        match = random.choice(valid_matches)

        home_team = match["home_team"]
        away_team = match["away_team"]

        # Defensive: fetch logos only if IDs exist
        home_logo = home_team.get("logo") or (
            home_team.get("id") and fetch_logo_helper(home_team["id"])
        )
        away_logo = away_team.get("logo") or (
            away_team.get("id") and fetch_logo_helper(away_team["id"])
        )

        stadium = None
        if home_team.get("id"):
            stadium = fetch_stadium_helper(home_team["id"])

        result = {
            "match_id": match.get("match_id"),
            "league_id": match.get("league_id"),
            "home_team": {
                "id": home_team.get("id"),
                "name": home_team.get("name"),
                "logo": home_logo,
            },
            "away_team": {
                "id": away_team.get("id"),
                "name": away_team.get("name"),
                "logo": away_logo,
            },
            "kickoff_time": match.get("kickoff_time"),
            "stadium": stadium,
        }

        return jsonify({"status": "success", "match": result}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
