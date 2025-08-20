from flask import Flask
from extensions import db, bcrypt, jwt
from datetime import datetime


class UserLogin(db.Model):
    __tablename__ = 'user_login'

    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    hashed_password = db.Column(db.String(256), nullable=False)
    add_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    edit_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def set_password(self, password):
        self.hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.hashed_password, password)

    def __repr__(self):
        return f"<UserLogin {self.email}>"
    

class User(db.Model):
    __tablename__ = "user"

    user_id = db.Column(db.Integer, db.ForeignKey("user_login.user_id"), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    fav_team = db.Column(db.String(100), nullable=True)
    fav_player = db.Column(db.String(100), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    profile = db.Column(db.String(255), nullable=True)  # store image URL or filename
    point = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    edited_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<User {self.name}>"


class Trip(db.Model):
    __tablename__ = "trip"

    trip_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    photo = db.Column(db.String(255), nullable=True)
    country = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    stadium = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)
    comments = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    edited_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref=db.backref("trips", lazy=True))
    favorites = db.relationship("Favorite", backref="trip", cascade="all, delete-orphan", passive_deletes=True)
    match = db.relationship("Match", back_populates="trip", cascade="all, delete-orphan", uselist=False)

    def __repr__(self):
        return f"<Trip {self.title} by User {self.user_id}>"
    
class Follow(db.Model):
    __tablename__ = "follows"
    
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    followed_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class Favorite(db.Model):
    __tablename__ = "favorites"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey("trip.trip_id", ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Match(db.Model):
    __tablename__ = "match"
    match_id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trip.trip_id", ondelete="CASCADE"), nullable=False, unique=True)
    title = db.Column(db.String(200), nullable=False)
    photo = db.Column(db.String(255), nullable=True)
    home_team = db.Column(db.String(100), nullable=False)
    away_team = db.Column(db.String(100), nullable=False)
    score_home = db.Column(db.Integer, nullable=False)
    score_away = db.Column(db.Integer, nullable=False)
    favorite_players = db.Column(db.Text, nullable=True)
    comments = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    edited_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    trip = db.relationship("Trip", back_populates="match", uselist=False)
