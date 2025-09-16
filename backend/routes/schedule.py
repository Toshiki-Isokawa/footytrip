# routes/schedule.py
import os
import requests
from flask import Blueprint, request, jsonify
from models import db, TeamLogo
from sqlalchemy.exc import IntegrityError
from functools import lru_cache
import time

schedule_bp = Blueprint("schedule", __name__, url_prefix="/api")

RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HEADERS = {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key": RAPIDAPI_KEY,
}

def fetch_logo_helper(team_id):
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
            new_team = TeamLogo(
                team_id=team_id,
                team_name="", 
                logo_url=logo_url
            )
            db.session.add(new_team)
            try:
                db.session.commit()
            except IntegrityError:
                db.session.rollback()
                existing = TeamLogo.query.get(team_id)
                return existing.logo_url if existing else logo_url
            return logo_url
    except requests.exceptions.RequestException:
        return None
    return None

@schedule_bp.route("/logo", methods=["GET"])
def fetch_logo():
    team_id = request.args.get("team_id", type=int)
    if not team_id:
        return jsonify({"error": "team_id is required"}), 400

    result = fetch_logo_helper(team_id)
    if not result:
        return jsonify({"error": "Failed to fetch match result"}), 500

    return jsonify({"logo_url": result}), 200


LEAGUE_CACHE_TTL = 60 * 60  # 1 hour

_last_league_fetch = 0
_league_map = {}

def get_league_map():
    """Fetch and cache leagueId -> (name, country)."""
    global _last_league_fetch, _league_map

    now = time.time()
    if now - _last_league_fetch > LEAGUE_CACHE_TTL or not _league_map:
        url = f"https://{RAPIDAPI_HOST}/football-get-all-leagues-with-countries"
        res = requests.get(url, headers=HEADERS)
        res.raise_for_status()
        data = res.json()

        league_map = {}
        for item in data.get("response", {}).get("leagues", []):
            country = item.get("name")
            for league in item.get("leagues", []):
                league_map[league["id"]] = {
                    "name": league.get("localizedName") or league.get("name"),
                    "country": country
                }

        _league_map = league_map
        _last_league_fetch = now

    return _league_map

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
        league_map = get_league_map()
        leagues = {}
        for m in matches:
            league_id = m.get("leagueId")
            if not league_id:
                continue

            league_info = league_map.get(league_id, {"name": "Unknown", "country": ""})
            league_name = f"{league_info['name']} ({league_info['country']})"

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
                    "logo": fetch_logo_helper(home_team.get("id"))
                },
                "away": {
                    "id": away_team.get("id"),
                    "name": away_team.get("name"),
                    "score": away_team.get("score"),
                    "logo": fetch_logo_helper(away_team.get("id"))
                },
            }

            if league_id not in leagues:
                leagues[league_id] = {
                    "leagueId": league_id,
                    "leagueName": league_name,
                    "matches": []
                }

            leagues[league_id]["matches"].append(match_obj)

        normalized = list(leagues.values())
        return jsonify({"status": "success", "schedule": normalized}), 200

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500