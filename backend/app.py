from flask import Flask, request, jsonify
from flask_migrate import Migrate
from models import db, UserLogin, User, Trip, Follow, Favorite
from utils import save_uploaded_file
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
import requests
from datetime import datetime
from werkzeug.utils import secure_filename
from flask_jwt_extended.exceptions import NoAuthorizationError
from jwt.exceptions import DecodeError

app = Flask(__name__)
load_dotenv()

# Configs
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

# Extensions
db.init_app(app)
CORS(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if UserLogin.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = UserLogin(email=email, hashed_password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=email)
    return jsonify(access_token=access_token, msg="User registered"), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = UserLogin.query.filter_by(email=email).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=user.email)
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"msg": "Invalid credentials"}), 401

@app.route('/api/auth/check', methods=['GET'])
@jwt_required()
def check_auth():
    current_user_email = get_jwt_identity()
    user = UserLogin.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({
        "email": user.email,
        "user_id": user.user_id
    }), 200

@app.errorhandler(NoAuthorizationError)
@app.errorhandler(DecodeError)
def handle_auth_error(e):
    return jsonify({"msg": "Invalid or missing JWT token"}), 401

@app.route("/api/account", methods=["POST", "OPTIONS"])
@jwt_required()
def setup_account():
    if request.method == "OPTIONS":
        # Allow the CORS preflight to pass without JWT
        return '', 204
    
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

    # Create or update user profile
    user.name = name
    user.date_of_birth = date_of_birth
    user.fav_team = fav_team
    user.fav_player = fav_player
    if profile_filename:
        user.profile = profile_filename
    user.point = 0  # Default
    user.edited_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"msg": "Account setup complete"}), 200


RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
HEADERS = {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key": RAPIDAPI_KEY
}

@app.route("/api/leagues")
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
                "country": item.get("name")  # optional: display country if needed
            })

    return jsonify(result)

@app.route("/api/teams")
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
    result = []

    for team in data.get("response", {}).get("list", []):
        result.append({
            "id": team.get("id"),
            "name": team.get("name"),
            "logo": team.get("logo")
        })

    return jsonify(result)


@app.route("/api/players/search")
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
    result = []

    for player in suggestions:
        result.append({
            "id": player.get("id"),
            "name": player.get("name"),
            "teamName": player.get("teamName")
        })

    return jsonify(result)


@app.route("/api/me", methods=["GET"])
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
            "email": login_user.email
        }
    }), 200

@app.route("/api/update-login", methods=["POST"])
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


@app.route("/api/trips", methods=["POST"])
@jwt_required()
def create_trip():
    email = get_jwt_identity()
    user_login = UserLogin.query.filter_by(email=email).first()
    if not user_login:
        return jsonify({"msg": "User not found"}), 404

    user = User.query.filter_by(user_id=user_login.user_id).first()
    if not user:
        return jsonify({"msg": "User profile not found"}), 404

    title = request.form.get("title")
    country = request.form.get("country")
    city = request.form.get("city")
    stadium = request.form.get("stadium")
    date = request.form.get("date")
    comments = request.form.get("comments")
    photo_file = request.files.get("photo")

    if not all([title, country, city, stadium, date]):
        return jsonify({"msg": "Missing required fields"}), 400

    photo_filename = save_uploaded_file(photo_file, subdir="trips") if photo_file else None

    trip = Trip(
        user_id=user.user_id,
        title=title,
        photo=photo_filename,
        country=country,
        city=city,
        stadium=stadium,
        date=datetime.strptime(date, "%Y-%m-%d"),
        comments=comments
    )
    db.session.add(trip)
    db.session.commit()

    return jsonify({"msg": "Trip created successfully", "trip_id": trip.trip_id}), 201


@app.route("/api/trips/<int:trip_id>", methods=["GET"])
def get_trip(trip_id):
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"msg": "Trip not found"}), 404

    user = User.query.get(trip.user_id)

    return jsonify({
        "trip_id": trip.trip_id,
        "title": trip.title,
        "photo": trip.photo,
        "country": trip.country,
        "city": trip.city,
        "stadium": trip.stadium,
        "date": trip.date.strftime("%Y-%m-%d"),
        "comments": trip.comments,
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "profile": user.profile
        }
    }), 200


@app.route("/api/users/<int:user_id>/feed", methods=["GET"])
@jwt_required()
def get_user_feed(user_id):
    current_email = get_jwt_identity()
    current_user = UserLogin.query.filter_by(email=current_email).first()
    if not current_user or current_user.user_id != user_id:
        return jsonify({"msg": "Unauthorized"}), 403

    followed_ids = db.session.query(Follow.followed_id).filter_by(follower_id=user_id).all()
    followed_ids = [fid[0] for fid in followed_ids]

    if not followed_ids:
        return jsonify([]), 200

    trips = Trip.query.filter(Trip.user_id.in_(followed_ids)).order_by(Trip.created_at.desc()).all()

    results = []
    for trip in trips:
        user = User.query.get(trip.user_id)
        results.append({
            "trip_id": trip.trip_id,
            "title": trip.title,
            "photo": trip.photo,
            "stadium": trip.stadium,
            "date": trip.date.strftime("%Y-%m-%d"),
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "profile": user.profile
            }
        })

    return jsonify(results), 200


@app.route("/api/users/<int:user_id>/favorites", methods=["GET"])
@jwt_required()
def get_user_favorites(user_id):
    current_email = get_jwt_identity()
    current_user = UserLogin.query.filter_by(email=current_email).first()
    if not current_user or current_user.user_id != user_id:
        return jsonify({"msg": "Unauthorized"}), 403

    favorites = Favorite.query.filter_by(user_id=user_id).all()
    trip_ids = [fav.trip_id for fav in favorites]

    if not trip_ids:
        return jsonify([]), 200

    trips = Trip.query.filter(Trip.trip_id.in_(trip_ids)).all()
    results = []
    for trip in trips:
        user = User.query.get(trip.user_id)
        results.append({
            "trip_id": trip.trip_id,
            "title": trip.title,
            "photo": trip.photo,
            "stadium": trip.stadium,
            "date": trip.date.strftime("%Y-%m-%d"),
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "profile": user.profile
            }
        })

    return jsonify(results), 200

if __name__ == "__main__":
    app.run(debug=True)