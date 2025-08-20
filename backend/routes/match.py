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

    title = request.form.get("title")
    home_team = request.form.get("home_team")
    away_team = request.form.get("away_team")
    home_score = request.form.get("home_score")
    away_score = request.form.get("away_score")
    favorite_player = request.form.get("favorite_player")
    comments = request.form.get("comments")
    photo = request.files.get("photo")

    if not all([home_team, away_team, home_score, away_score, favorite_player]):
        return jsonify({"msg": "Missing required fields"}), 400
    
    photo_filename = save_uploaded_file(photo, subdir="trips") if photo else None

    match = Match(
        title=title,
        trip_id=trip.trip_id,
        home_team=home_team,
        away_team=away_team,
        home_score=int(home_score),
        away_score=int(away_score),
        favorite_player=favorite_player,
        comments=comments,
        photo=photo_filename,
    )

    db.session.add(match)
    db.session.commit()

    return jsonify({"msg": "Match created successfully", "match_id": match.match_id}), 201


# -----------------------------
# GET /api/trips/:tripId/match
# -----------------------------
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
        "title": match.title,
        "home_team": match.home_team,
        "away_team": match.away_team,
        "home_score": match.home_score,
        "away_score": match.away_score,
        "favorite_player": match.favorite_player,
        "comments": match.comments,
        "photo": match.photo,
        "created_at": match.created_at.isoformat(),
        "edited_at": match.edited_at.isoformat()
    }), 200


# -----------------------------
# PUT /api/trips/:tripId/match
# -----------------------------
@match_bp.route("/trips/<int:trip_id>/match", methods=["PUT"])
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
    home_team = request.form.get("home_team", match.home_team)
    away_team = request.form.get("away_team", match.away_team)
    home_score = request.form.get("home_score")
    away_score = request.form.get("away_score")
    favorite_player = request.form.get("favorite_player", match.favorite_player)
    comments = request.form.get("comments", match.comments)
    photo = request.files.get("photo")

    photo_filename = save_uploaded_file(photo, subdir="trips") if photo else match.photo

    match.title = title
    match.home_team = home_team
    match.away_team = away_team
    match.home_score = int(home_score) if home_score is not None else match.home_score
    match.away_score = int(away_score) if away_score is not None else match.away_score
    match.favorite_player = favorite_player
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
