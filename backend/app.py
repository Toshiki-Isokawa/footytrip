from flask import Flask, request, jsonify
from flask_migrate import Migrate
from models import db, UserLogin, User
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

    if user and bcrypt.check_password_hash(user.hashed_password, password):
        access_token = create_access_token(identity=user.email)
        return jsonify(accsess_token=access_token), 200
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

    profile_filename = None
    if profile_file:
        filename = secure_filename(profile_file.filename)
        profile_path = os.path.join("static/profiles", filename)
        os.makedirs(os.path.dirname(profile_path), exist_ok=True)
        profile_file.save(profile_path)
        profile_filename = filename

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

if __name__ == "__main__":
    app.run(debug=True)