# routes/trip.py
import os
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Trip, Follow, Favorite
from utils import save_uploaded_file, get_current_user

trip_bp = Blueprint("trip", __name__, url_prefix="/api")

# -----------------------------
# POST /api/trips
# -----------------------------
@trip_bp.route("/trips", methods=["POST"])
@jwt_required()
def create_trip():
    user = get_current_user()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    title = request.form.get("title")
    country = request.form.get("country")
    city = request.form.get("city")
    stadium = request.form.get("stadium")
    date = request.form.get("date")
    comments = request.form.get("comments")
    photo = request.files.get("photo")

    if not all([title, country, city, stadium, date]):
        return jsonify({"msg": "Missing required fields"}), 400

    photo_filename = save_uploaded_file(photo, subdir="trips") if photo else None

    trip = Trip(
        user_id=user.user_id,
        title=title,
        country=country,
        city=city,
        stadium=stadium,
        date=datetime.strptime(date, "%Y-%m-%d"),
        comments=comments,
        photo=photo_filename,
    )

    db.session.add(trip)
    db.session.commit()

    return jsonify({"msg": "Trip created successfully", "trip_id": trip.trip_id}), 201


# -----------------------------
# GET /api/trips/<id>
# -----------------------------
@trip_bp.route("/trips/<int:trip_id>", methods=["GET"])
def get_trip(trip_id):
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"msg": "Trip not found"}), 404

    return jsonify({
        "trip_id": trip.trip_id,
        "title": trip.title,
        "photo": trip.photo,
        "country": trip.country,
        "city": trip.city,
        "stadium": trip.stadium,
        "date": trip.date.isoformat(),
        "comments": trip.comments,
        "user_id": trip.user_id,
    }), 200


# -----------------------------
# GET /api/users/<id>/trips
# -----------------------------
@trip_bp.route("/users/<int:user_id>/trips", methods=["GET"])
def get_user_trips(user_id):
    trips = Trip.query.filter_by(user_id=user_id).order_by(Trip.date.desc()).all()
    return jsonify([
        {
            "trip_id": t.trip_id,
            "title": t.title,
            "photo": t.photo,
            "country": t.country,
            "city": t.city,
            "stadium": t.stadium,
            "date": t.date.isoformat(),
            "comments": t.comments,
        }
        for t in trips
    ]), 200


# -----------------------------
# GET /api/users/<id>/feed
# -----------------------------
@trip_bp.route("/users/<int:user_id>/feed", methods=["GET"])
@jwt_required()
def get_user_feed(user_id):
    # find users that this user follows
    follows = Follow.query.filter_by(follower_id=user_id).all()
    followed_ids = [f.followed_id for f in follows]

    if not followed_ids:
        return jsonify([]), 200

    trips = (
        Trip.query.filter(Trip.user_id.in_(followed_ids))
        .order_by(Trip.created_at.desc())
        .all()
    )

    return jsonify([
        {
            "trip_id": t.trip_id,
            "title": t.title,
            "photo": t.photo,
            "country": t.country,
            "city": t.city,
            "stadium": t.stadium,
            "date": t.date.isoformat(),
            "comments": t.comments,
            "user_id": t.user_id,
        }
        for t in trips
    ]), 200


# -----------------------------
# POST /api/trips/<id>/favorite
# -----------------------------
@trip_bp.route("/trips/<int:trip_id>/favorite", methods=["POST"])
@jwt_required()
def favorite_trip(trip_id):
    user = get_current_user()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # check if already favorited
    existing = Favorite.query.filter_by(user_id=user.user_id, trip_id=trip_id).first()
    if existing:
        return jsonify({"msg": "Already favorited"}), 400

    fav = Favorite(user_id=user.user_id, trip_id=trip_id)
    db.session.add(fav)
    db.session.commit()

    return jsonify({"msg": "Trip favorited"}), 201


# -----------------------------
# DELETE /api/trips/<id>/favorite
# -----------------------------
@trip_bp.route("/trips/<int:trip_id>/favorite", methods=["DELETE"])
@jwt_required()
def unfavorite_trip(trip_id):
    user = get_current_user()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    fav = Favorite.query.filter_by(user_id=user.user_id, trip_id=trip_id).first()
    if not fav:
        return jsonify({"msg": "Favorite not found"}), 404

    db.session.delete(fav)
    db.session.commit()
    return jsonify({"msg": "Unfavorited"}), 200


# -----------------------------
# GET /api/users/<id>/favorites
# -----------------------------
@trip_bp.route("/users/<int:user_id>/favorites", methods=["GET"])
def get_user_favorites(user_id):
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    trip_ids = [f.trip_id for f in favorites]

    trips = Trip.query.filter(Trip.trip_id.in_(trip_ids)).all()
    return jsonify([
        {
            "trip_id": t.trip_id,
            "title": t.title,
            "photo": t.photo,
            "country": t.country,
            "city": t.city,
            "stadium": t.stadium,
            "date": t.date.isoformat(),
            "comments": t.comments,
        }
        for t in trips
    ]), 200


# -----------------------------
# PUT /api/trips/<id>
# -----------------------------
@trip_bp.route("/trips/<int:trip_id>", methods=["PUT"])
@jwt_required()
def update_trip(trip_id):
    user = get_current_user()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"msg": "Trip not found"}), 404

    if trip.user_id != user.user_id:
        return jsonify({"msg": "Unauthorized"}), 403

    data = request.form or request.json
    trip.title = data.get("title", trip.title)
    trip.country = data.get("country", trip.country)
    trip.city = data.get("city", trip.city)
    trip.stadium = data.get("stadium", trip.stadium)
    trip.date = data.get("date", trip.date)
    trip.comments = data.get("comments", trip.comments)

    # handle photo update
    photo_file = request.files.get("photo")
    if photo_file:
        filename = save_uploaded_file(photo_file, subdir="trips")
        trip.photo = filename

    db.session.commit()
    return jsonify({"msg": "Trip updated"}), 200


# -----------------------------
# DELETE /api/trips/<id>
# -----------------------------
@trip_bp.route("/trips/<int:trip_id>", methods=["DELETE"])
@jwt_required()
def delete_trip(trip_id):
    user = get_current_user()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"msg": "Trip not found"}), 404

    if trip.user_id != user.user_id:
        return jsonify({"msg": "Unauthorized"}), 403

    db.session.delete(trip)
    db.session.commit()
    return jsonify({"msg": "Trip deleted"}), 200


# -----------------------------
# GET /api/trips/<id>/favorite
# -----------------------------
@trip_bp.route("trips/<int:trip_id>/favorite", methods=["GET"])
@jwt_required()
def check_favorite(trip_id):
    user = get_current_user()

    if not user:
        return jsonify({"msg": "User not found"}), 404

    favorite = Favorite.query.filter_by(user_id=user.user_id, trip_id=trip_id).first()

    return jsonify({"is_favorite": bool(favorite)}), 200