from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from extensions import db
from models import Trip, Match
from utils import save_uploaded_file, get_current_user

match_bp = Blueprint("match", __name__, url_prefix="/api")

# -----------------------------
# POST /api/trips/:tripId/match
# -----------------------------
@match_bp.route("/trips/<int:trip_id>/match", methods=["POST"])
@jwt_required()
def create_match(trip_id):
    user = get_current_user()
    
    if not user:
        return jsonify({"msg": "User not found"}), 404

    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"msg": "Trip not found"}), 404

    if trip.user_id != user.user_id:
        return jsonify({"msg": "You are not authorized to add a match to this trip"}), 403
    
    print("Request data:", request.form)  # Debugging line to check incoming data

    title = request.form.get("title")
    home_team_league = request.form.get("home_team_league")
    away_team_league = request.form.get("away_team_league")
    home_team_league_id = request.form.get("home_team_league_id")
    away_team_league_id = request.form.get("away_team_league_id")
    home_team_id = request.form.get("home_team_id")
    away_team_id = request.form.get("away_team_id")
    home_team = request.form.get("home_team")
    away_team = request.form.get("away_team")
    score_home = request.form.get("score_home")
    score_away = request.form.get("score_away")
    favorite_side = request.form.get("favorite_side")
    favorite_players = request.form.get("favorite_player")
    comments = request.form.get("comments")
    photo = request.files.get("photo")

    if not all([home_team_id, away_team_id, home_team, away_team, score_away, score_home, favorite_players]):
        return jsonify({"msg": "Missing required fields"}), 400
    
    photo_filename = save_uploaded_file(photo, subdir="match") if photo else None

    match = Match(
        title=title,
        trip_id=trip.trip_id,
        home_team_league=home_team_league,
        away_team_league=away_team_league,
        home_team_league_id=int(home_team_league_id) if home_team_league_id else None,
        away_team_league_id=int(away_team_league_id) if away_team_league_id else None,
        home_team_id=int(home_team_id),
        home_team=home_team,
        away_team_id=int(away_team_id),
        away_team=away_team,
        score_home=int(score_home),
        score_away=int(score_away),
        favorite_side=favorite_side,
        favorite_players=favorite_players,
        comments=comments,
        photo=photo_filename,
    )

    db.session.add(match)
    db.session.commit()

    return jsonify({"msg": "Match created successfully", "match_id": match.match_id}), 201


# ----------------------------
# GET /api/trips/:tripId/match
# ----------------------------
@match_bp.route("/trips/<int:trip_id>/match", methods=["GET"])
def get_match(trip_id):
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"msg": "Trip not found"}), 404

    match = trip.match
    if not match:
        return jsonify({"msg": "No match found for this trip"}), 404

    return jsonify({
        "match_id": match.match_id,
        "trip_user_id": match.trip.user_id,
        "title": match.title,
        "home_team_league": match.home_team_league,
        "away_team_league": match.away_team_league,
        "home_team_league_id": match.home_team_league_id,
        "away_team_league_id": match.away_team_league_id,
        "home_team": match.home_team,
        "home_team_id": match.home_team_id,
        "away_team": match.away_team,
        "away_team_id": match.away_team_id,
        "score_home": match.score_home,
        "score_away": match.score_away,
        "favorite_side": match.favorite_side,
        "favorite_player": match.favorite_players,
        "comments": match.comments,
        "photo": match.photo,
        "created_at": match.created_at.isoformat(),
        "edited_at": match.edited_at.isoformat()
    }), 200


# --------------------------------
# PUT /api/trips/:tripId/match/edit
# --------------------------------
@match_bp.route("/trips/<int:trip_id>/match/edit", methods=["PUT"])
@jwt_required()
def update_match(trip_id):
    user = get_current_user()
    
    if not user:
        return jsonify({"msg": "User not found"}), 404

    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"msg": "Trip not found"}), 404

    if trip.user_id != user.user_id:
        return jsonify({"msg": "You are not authorized to update this match"}), 403

    match = trip.match
    if not match:
        return jsonify({"msg": "No match found for this trip"}), 404

    title = request.form.get("title", match.title)
    home_team_league = request.form.get("home_team_league", match.home_team_league)
    away_team_league = request.form.get("away_team_league", match.away_team_league)
    home_team_league_id = request.form.get("home_team_league_id", match.home_team_league_id)
    away_team_league_id = request.form.get("away_team_league_id", match.away_team_league_id)
    home_team_id = request.form.get("home_team_id", match.home_team_id)
    away_team_id = request.form.get("away_team_id", match.away_team_id)
    home_team = request.form.get("home_team", match.home_team)
    away_team = request.form.get("away_team", match.away_team)
    score_home = request.form.get("score_home", match.score_home)
    score_away = request.form.get("score_away", match.score_away)
    favorite_side = request.form.get("favorite_side", match.favorite_side)
    favorite_players = request.form.get("favorite_player", match.favorite_players)
    comments = request.form.get("comments", match.comments)
    photo = request.files.get("photo")

    photo_filename = save_uploaded_file(photo, subdir="trips") if photo else match.photo

    match.title = title
    match.home_team_league = home_team_league
    match.away_team_league = away_team_league
    match.home_team_league_id = int(home_team_league_id) if home_team_league_id else match.home_team_league_id
    match.away_team_league_id = int(away_team_league_id) if away_team_league_id else match.away_team_league_id
    match.home_team_id = int(home_team_id) if home_team_id else match.home_team_id
    match.away_team_id = int(away_team_id) if away_team_id else match
    match.home_team = home_team
    match.away_team = away_team
    match.score_home = int(score_home) if score_home is not None else match.score_home
    match.score_away = int(score_away) if score_away is not None else match.score_away
    match.favorite_side = favorite_side
    match.favorite_players = favorite_players
    match.comments = comments
    match.photo = photo_filename

    db.session.commit()

    return jsonify({"msg": "Match updated successfully", "match_id": match.match_id}), 200


# -------------------------------
# DELETE /api/trips/:tripId/match
# -------------------------------
@match_bp.route("/trips/<int:trip_id>/match", methods=["DELETE"])
@jwt_required()
def delete_match(trip_id):
    user = get_current_user()
    
    if not user:
        return jsonify({"msg": "User not found"}), 404

    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"msg": "Trip not found"}), 404

    if trip.user_id != user.user_id:
        return jsonify({"msg": "You are not authorized to delete this match"}), 403

    match = trip.match
    if not match:
        return jsonify({"msg": "No match found for this trip"}), 404

    db.session.delete(match)
    db.session.commit()

    return jsonify({"msg": "Match deleted successfully", "match_id": match.match_id}), 200
