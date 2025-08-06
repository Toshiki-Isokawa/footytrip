from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class UserLogin(db.Model):
    __tablename__ = 'user_login'

    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    hashed_password = db.Column(db.String(256), nullable=False)
    add_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    edit_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<UserLogin {self.email}>"
    

class User(db.Model):
    __tablename__ = "user"

    user_id = db.Column(db.Integer, db.ForeignKey("user_login.user_id"), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    fav_team = db.Column(db.String(100), nullable=True)
    fav_player = db.Column(db.String(100), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    profile = db.Column(db.String(255), nullable=False)  # store image URL or filename
    point = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    edited_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<User {self.name}>"

    """
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    nationality = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    favorite_team = db.Column(db.String(100), nullable=False)
    favorite_player = db.Column(db.String(100), nullable=False)
    profile_picture = db.Column(db.LargeBinary, nullable=True)

    trips = db.relationship('Trip', backref='user', cascade='all, delete-orphan')
    matches = db.relationship('Match', backref='user', cascade='all, delete-orphan')

class Trip(db.Model):
    __tablename__ = 'trips'
    trip_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    country = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    stadium = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    note = db.Column(db.Text, nullable=False)
    photo = db.Column(db.LargeBinary, nullable=True)

    match = db.relationship('Match', backref='trip', uselist=False, cascade='all, delete-orphan')

class Match(db.Model):
    __tablename__ = 'matches'
    match_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.trip_id'), nullable=False, unique=True)
    home_team = db.Column(db.String(100), nullable=False)
    away_team = db.Column(db.String(100), nullable=False)
    home_team_scorer = db.Column(db.Text, nullable=False)
    away_team_scorer = db.Column(db.Text, nullable=False)
    mvp = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    photo1 = db.Column(db.LargeBinary, nullable=True)
    photo2 = db.Column(db.LargeBinary, nullable=True)
    photo3 = db.Column(db.LargeBinary, nullable=True)
"""