from flask import Flask, request, jsonify
from flask_migrate import Migrate
from models import db, UserLogin
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

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

    return jsonify({"msg": "User registered"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = UserLogin.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.hashed_password, password):
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

if __name__ == "__main__":
    app.run(debug=True)