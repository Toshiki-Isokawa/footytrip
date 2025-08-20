import os
import requests
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from extensions import db
from models import User, UserLogin
from utils import save_uploaded_file

user_bp = Blueprint("user", __name__, url_prefix="/api")

# Load RapidAPI credentials from env
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HEADERS = {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key": RAPIDAPI_KEY,
}


@user_bp.route("/account", methods=["POST", "OPTIONS"])
@jwt_required()
def setup_account():
    if request.method == "OPTIONS":
        return "", 204  # allow CORS preflight

    verify_jwt_in_request()
    email = get_jwt_identity()
    user_login = UserLogin.query.filter_by(email=email).first()

    user = User.query.filter_by(user_id=user_login.user_id).first()
    if not user:
        user = User(user_id=user_login.user_id)
        db.session.add(user)

    name = request.form.get("name")
    date_of_birth = request.form.get("date_of_birth")
    fav_team = request.form.get("fav_team")
    fav_player = request.form.get("fav_player")
    profile_file = request.files.get("profile")

    if not all([name, date_of_birth, fav_team, fav_player]):
        return jsonify({"msg": "All fields except profile image are required"}), 400

    profile_filename = save_uploaded_file(profile_file, subdir="profiles")

    # Update user profile
    user.name = name
    user.date_of_birth = date_of_birth
    user.fav_team = fav_team
    user.fav_player = fav_player
    if profile_filename:
        user.profile = profile_filename
    user.point = 0
    user.edited_at = datetime.utcnow()

    db.session.commit()
    return jsonify({"msg": "Account setup complete"}), 200


@user_bp.route("/leagues")
def get_all_leagues():
    url = f"https://{RAPIDAPI_HOST}/football-get-all-leagues-with-countries"
    response = requests.get(url, headers=HEADERS)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch leagues"}), 500

    data = response.json()
    result = []

    for item in data.get("response", {}).get("leagues", []):
        for league in item.get("leagues", []):
            result.append({
                "id": league["id"],
                "name": league.get("localizedName") or league.get("name"),
                "country": item.get("name")
            })

    return jsonify(result)


@user_bp.route("/teams")
def get_teams():
    league_id = request.args.get("league_id")
    if not league_id:
        return jsonify({"error": "Missing league_id parameter"}), 400

    url = f"https://{RAPIDAPI_HOST}/football-get-list-all-team"
    params = {"leagueid": league_id}
    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch teams"}), 500

    data = response.json()
    result = [{
        "id": team.get("id"),
        "name": team.get("name"),
        "logo": team.get("logo")
    } for team in data.get("response", {}).get("list", [])]

    return jsonify(result)


@user_bp.route("/players/search")
def search_players():
    search = request.args.get("search")
    if not search:
        return jsonify({"error": "Missing search parameter"}), 400

    url = f"https://{RAPIDAPI_HOST}/football-players-search"
    params = {"search": search}
    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch players"}), 500

    data = response.json()
    suggestions = data.get("response", {}).get("suggestions", [])
    result = [{
        "id": player.get("id"),
        "name": player.get("name"),
        "teamName": player.get("teamName")
    } for player in suggestions]

    return jsonify(result)


@user_bp.route("/me", methods=["GET"])
@jwt_required()
def get_user_profile():
    email = get_jwt_identity()
    login_user = UserLogin.query.filter_by(email=email).first()

    if not login_user:
        return jsonify({"msg": "User not found"}), 404

    user_profile = User.query.filter_by(user_id=login_user.user_id).first()

    return jsonify({
        "user": {
            "name": user_profile.name if user_profile else "",
            "date_of_birth": user_profile.date_of_birth if user_profile else "",
            "fav_team": user_profile.fav_team if user_profile else "",
            "fav_player": user_profile.fav_player if user_profile else "",
            "profile": user_profile.profile if user_profile else None,
            "point": user_profile.point if user_profile else 0
        },
        "login": {
            "email": login_user.email,
            "user_id": login_user.user_id
        }
    }), 200


@user_bp.route("/update-login", methods=["POST"])
@jwt_required()
def update_login():
    email = get_jwt_identity()
    data = request.get_json()
    new_password = data.get("password")

    if not new_password:
        return jsonify({"msg": "Password is required"}), 400

    user = UserLogin.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"msg": "Password updated successfully"}), 200


@user_bp.route("/stadium")
def get_stadium():
    team_id = request.args.get("team_id")
    if not team_id:
        return jsonify({"error": "Missing team_id parameter"}), 400

    url = f"https://{RAPIDAPI_HOST}/football-league-team"
    params = {"teamid": team_id}
    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch stadium"}), 500

    data = response.json()
    details = data.get("response", {}).get("details", {})
    sportsTeam = details.get("sportsTeamJSONLD", {})
    stadium = sportsTeam.get("location", {}).get("name")

    return jsonify({"stadium": stadium})

