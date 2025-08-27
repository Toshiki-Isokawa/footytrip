from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Follow, Trip, Favorite
from utils import get_current_user

footy_bp = Blueprint("footy", __name__, url_prefix="/api")


# -----------------------------
# GET /api/users
# -----------------------------
@footy_bp.route("/users", methods=["GET"])
def get_users():
    users = User.query.all()
    data = [
        {
            "user_id": u.user_id,
            "name": u.name,
            "profile": u.profile,
            "fav_team": u.fav_team,
            "fav_player": u.fav_player,
        }
        for u in users
    ]
    return jsonify(data), 200

# -----------------------------
# GET /api/users/<id>
# -----------------------------
@footy_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user_detail(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    followers_count = Follow.query.filter_by(followed_id=user_id).count()
    following_count = Follow.query.filter_by(follower_id=user_id).count()

    data = {
        "id": user.user_id,
        "name": user.name,
        "profile": user.profile,
        "fav_team": user.fav_team,
        "fav_player": user.fav_player,
        "date_of_birth": user.date_of_birth.isoformat(),
        "point": user.point,
        "followers_count": followers_count,
        "following_count": following_count,
    }
    return jsonify(data), 200


# -----------------------------
# POST /api/follow/<user_id>
# -----------------------------
@footy_bp.route("/follow/<int:user_id>", methods=["POST"])
@jwt_required()
def follow_user(user_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"msg": "User not found"}), 404

    if current_user.user_id == user_id:
        return jsonify({"msg": "You cannot follow yourself"}), 400

    # prevent duplicate follow
    if Follow.query.filter_by(follower_id=current_user.user_id, followed_id=user_id).first():
        return jsonify({"msg": "Already following"}), 400

    new_follow = Follow(follower_id=current_user.user_id, followed_id=user_id)
    db.session.add(new_follow)
    db.session.commit()

    return jsonify({"msg": "Followed successfully"}), 201


# -----------------------------
# DELETE /api/follow/<user_id>
# -----------------------------
@footy_bp.route("/follow/<int:user_id>", methods=["DELETE"])
@jwt_required()
def unfollow_user(user_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"msg": "User not found"}), 404

    follow = Follow.query.filter_by(follower_id=current_user.user_id, followed_id=user_id).first()
    if not follow:
        return jsonify({"msg": "You are not following this user"}), 400

    db.session.delete(follow)
    db.session.commit()

    return jsonify({"msg": "Unfollowed successfully"}), 200


# -----------------------------
# GET /api/users/<id>/followers
# -----------------------------
@footy_bp.route("/users/<int:user_id>/followers", methods=["GET"])
def get_followers(user_id):
    followers = (
        db.session.query(User)
        .join(Follow, Follow.follower_id == User.user_id)
        .filter(Follow.followed_id == user_id)
        .all()
    )

    data = [
        {
            "id": u.user_id,
            "name": u.name,
            "profile": u.profile,
        }
        for u in followers
    ]
    return jsonify(data), 200


# -----------------------------
# GET /api/users/<id>/following
# -----------------------------
@footy_bp.route("/users/<int:user_id>/following", methods=["GET"])
def get_following(user_id):
    following = (
        db.session.query(User)
        .join(Follow, Follow.followed_id == User.user_id)
        .filter(Follow.follower_id == user_id)
        .all()
    )

    data = [
        {
            "id": u.user_id,
            "name": u.name,
            "profile": u.profile,
        }
        for u in following
    ]
    return jsonify(data), 200

# -----------------------------
# GET /api/users/<id>/favorites
# -----------------------------
@footy_bp.route("/users/<int:user_id>/favorites", methods=["GET"])
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
# GET /api/users/<id>/trips
# -----------------------------
@footy_bp.route("/users/<int:user_id>/trips", methods=["GET"])
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