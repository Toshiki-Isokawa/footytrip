# routes/schedule.py
import os
import requests
from flask import Blueprint, request, jsonify
from models import db, TeamLogo

schedule_bp = Blueprint("schedule", __name__, url_prefix="/api")

RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HEADERS = {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key": RAPIDAPI_KEY,
}

def fetch_logo(team_id):
    """Return cached logo or fetch from external API and store it."""
    team = TeamLogo.query.get(team_id)
    if team:
        return team.logo_url

    # Fetch from API
    url = f"https://{RAPIDAPI_HOST}/football-team-logo?teamid={team_id}"
    try:
        res = requests.get(url, headers=HEADERS)
        res.raise_for_status()
        data = res.json()
        logo_url = data.get("response", {}).get("url")
        if logo_url:
            # Save to DB
            new_team = TeamLogo(
                team_id=team_id,
                team_name="",  # optional, can fill later
                logo_url=logo_url
            )
            db.session.add(new_team)
            db.session.commit()
            return logo_url
    except requests.exceptions.RequestException:
        return None
    return None


@schedule_bp.route("/schedule", methods=["GET"])
def get_schedule():
    """
    Fetch and normalize match schedule for a given date,
    injecting home and away team logos.
    Example: /api/schedule?date=20241107
    """
    date = request.args.get("date")
    if not date:
        return jsonify({"error": "Missing 'date' query parameter"}), 400

    url = f"https://{RAPIDAPI_HOST}/football-get-matches-by-date"
    params = {"date": date}

    try:
        res = requests.get(url, headers=HEADERS, params=params)
        res.raise_for_status()
        data = res.json()
        matches = data.get("response", {}).get("matches", [])

        # Normalize matches into leagues
        leagues = {}
        for m in matches:
            league_id = m.get("leagueId")
            if not league_id:
                continue

            # Determine match status
            status_info = m.get("status", {})
            if status_info.get("finished"):
                status = "finished"
            elif status_info.get("started"):
                status = "live"
            else:
                status = "upcoming"

            home_team = m.get("home", {})
            away_team = m.get("away", {})

            match_obj = {
                "id": m.get("id"),
                "utcTime": status_info.get("utcTime"),
                "status": status,
                "scoreStr": status_info.get("scoreStr"),
                "home": {
                    "id": home_team.get("id"),
                    "name": home_team.get("name"),
                    "score": home_team.get("score"),
                    "logo": fetch_logo(home_team.get("id"))
                },
                "away": {
                    "id": away_team.get("id"),
                    "name": away_team.get("name"),
                    "score": away_team.get("score"),
                    "logo": fetch_logo(away_team.get("id"))
                },
            }

            if league_id not in leagues:
                leagues[league_id] = {
                    "leagueId": league_id,
                    "matches": []
                }

            leagues[league_id]["matches"].append(match_obj)

        normalized = list(leagues.values())
        return jsonify({"status": "success", "schedule": normalized}), 200

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500