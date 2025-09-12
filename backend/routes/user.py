import os
import requests
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from extensions import db
from models import User, UserLogin
from utils import save_uploaded_file, get_current_user
from flask_cors import cross_origin

user_bp = Blueprint("user", __name__, url_prefix="/api")

# Load RapidAPI credentials from env
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HEADERS = {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key": RAPIDAPI_KEY,
}


@user_bp.route("/account", methods=["POST", "OPTIONS"])
@cross_origin()
@jwt_required()
def setup_account():
    if request.method == "OPTIONS":
        return jsonify({"msg": "CORS preflight OK"}), 200
    email = get_jwt_identity()
    user_login = UserLogin.query.filter_by(email=email).first()
    if not user_login:
        return jsonify({"msg": "User login not found"}), 404

    if User.query.filter_by(user_id=user_login.user_id).first():
        return jsonify({"msg": "Account already exists"}), 400

    name = request.form.get("name")
    date_of_birth = request.form.get("date_of_birth")
    league = request.form.get("league")
    league_id = request.form.get("league_id")
    fav_team = request.form.get("fav_team")
    fav_player = request.form.get("fav_player")
    profile_file = request.files.get("profile")

    if not all([name, date_of_birth, fav_team, fav_player]):
        return jsonify({"msg": "All fields except profile image are required"}), 400

    profile_filename = save_uploaded_file(profile_file, subdir="profiles")

    user = User(
        user_id=user_login.user_id,
        profile=profile_filename,
        name=request.form.get("name"),
        league=league,
        league_id=league_id,
        fav_team=request.form.get("fav_team"),
        fav_player=request.form.get("fav_player"),
        date_of_birth=request.form.get("date_of_birth"),
    )

    db.session.add(user)
    db.session.commit()
    return jsonify({"msg": "Account setup complete"}), 200


@user_bp.route("/account/edit", methods=["PUT"])
@jwt_required()
def update_account():
    user = get_current_user()
    if not user:
        return jsonify({"msg": "Account not found"}), 404
    
    profile_file = request.files.get("profile")
    if profile_file:
        profile_filename = save_uploaded_file(profile_file, subdir="profiles")
        user.profile = profile_filename

    user.name = request.form.get("name", user.name)
    user.league = request.form.get("league", user.league)
    user.league_id = request.form.get("league_id", user.league_id)
    user.fav_team = request.form.get("fav_team", user.fav_team)
    user.fav_player = request.form.get("fav_player", user.fav_player)
    user.date_of_birth = request.form.get("date_of_birth", user.date_of_birth)
    user.point = user.point 

    db.session.commit()
    return jsonify({"msg": "Account updated successfully"}), 200


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


@user_bp.route("/players")
def search_players_by_team():
    team_id = request.args.get("team_id")
    if not team_id:
        return jsonify({"error": "Missing search parameter"}), 400
    
    url = f"https://{RAPIDAPI_HOST}/football-get-list-player"
    params = {"teamid": team_id}
    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch players"}), 500

    data = response.json()
    squad = data.get("response", {}).get("list", {}).get("squad", [])
    players = []

    for group in squad:
        members = group.get("members", [])
        for player in members:
            players.append({"id": player.get("id"), "name": player.get("name")})

    return jsonify(players)
    


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
            "league": user_profile.league if user_profile else "",
            "league_id": user_profile.league_id if user_profile else None,
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


def fetch_stadium_helper(team_id):
    if not team_id:
        return None

    url = f"https://{RAPIDAPI_HOST}/football-league-team"
    params = {"teamid": team_id}
    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code != 200:
        return None

    data = response.json()
    details = data.get("response", {}).get("details", {})
    sportsTeam = details.get("sportsTeamJSONLD", {})
    stadium = sportsTeam.get("location", {}).get("name")

    return stadium


@user_bp.route("/stadium")
def get_stadium():
    team_id = request.args.get("team_id")
    if not team_id:
        return jsonify({"error": "Missing team_id parameter"}), 400

    stadium = fetch_stadium_helper(team_id)
    if not stadium:
        return jsonify({"error": "Failed to fetch stadium"}), 500

    print("Stadium:", stadium)  # Debugging line
    return jsonify({"stadium": stadium})
