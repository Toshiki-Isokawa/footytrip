from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from extensions import db, bcrypt, jwt
from routes.trip import trip_bp
from routes.auth import auth_bp
from routes.user import user_bp
from routes.match import match_bp
from routes.footy import footy_bp

def create_app():
    app = Flask(__name__)
    load_dotenv()

    # Configs
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    # init extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate = Migrate(app, db)

    # Routes
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(trip_bp)
    app.register_blueprint(match_bp)
    app.register_blueprint(footy_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)