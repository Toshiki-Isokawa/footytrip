from flask import Flask, jsonify
from flask_migrate import Migrate
from models import db
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy()
db.init_app(app)

CORS(app)

@app.route("/api/trips/recent")
def get_recent_trips():
    dummy_data = [
        {
            "trip_id": 1,
            "title": "El Clásico Weekend",
            "photo_url": "https://example.com/photos/elclasico.jpg",
            "city": "Madrid",
            "country": "Spain",
            "username": "user1"
        },
        {
            "trip_id": 2,
            "title": "Dortmund Derby Night",
            "photo_url": "https://example.com/photos/dortmund.jpg",
            "city": "Dortmund",
            "country": "Germany",
            "username": "user2"
        }
    ]
    return jsonify(dummy_data)
