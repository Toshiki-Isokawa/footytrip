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
    league = db.Column(db.String(100), nullable=True)
    league_id = db.Column(db.Integer, nullable=True)
    fav_team = db.Column(db.String(100), nullable=True)
    fav_player = db.Column(db.String(100), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    profile = db.Column(db.String(255), nullable=True)  # store image URL or filename
    point = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    edited_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    following = db.relationship("Follow", foreign_keys="Follow.follower_id", backref="follower", lazy="dynamic", cascade="all, delete-orphan")
    followers = db.relationship("Follow", foreign_keys="Follow.followed_id", backref="followed", lazy="dynamic", cascade="all, delete-orphan")
    favorites = db.relationship("Favorite", backref="user", cascade="all, delete-orphan", lazy="dynamic")
    
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

    __table_args__ = (db.UniqueConstraint("follower_id", "followed_id", name="unique_follow"),)


class Favorite(db.Model):
    __tablename__ = "favorites"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey("trip.trip_id", ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (db.UniqueConstraint("user_id", "trip_id", name="unique_favorite"),)



class Match(db.Model):
    __tablename__ = "match"
    match_id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trip.trip_id", ondelete="CASCADE"), nullable=False, unique=True)
    title = db.Column(db.String(200), nullable=False)
    photo = db.Column(db.String(255), nullable=True)
    home_team_league = db.Column(db.String(100), nullable=True)
    away_team_league = db.Column(db.String(100), nullable=True)
    home_team_league_id = db.Column(db.Integer, nullable=True)
    away_team_league_id = db.Column(db.Integer, nullable=True)
    home_team_id = db.Column(db.Integer, nullable=False)
    home_team = db.Column(db.String(100), nullable=False)
    away_team_id = db.Column(db.Integer, nullable=False)
    away_team = db.Column(db.String(100), nullable=False)
    score_home = db.Column(db.Integer, nullable=False)
    score_away = db.Column(db.Integer, nullable=False)
    favorite_side = db.Column(db.String(20), nullable=True)
    favorite_players = db.Column(db.Text, nullable=True)
    comments = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    edited_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    trip = db.relationship("Trip", back_populates="match", uselist=False)


class TeamLogo(db.Model):
    __tablename__ = "team_logos"
    team_id = db.Column(db.Integer, primary_key=True)
    team_name = db.Column(db.String(255))
    logo_url = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Prediction(db.Model):
    __tablename__ = "prediction"

    prediction_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    week = db.Column(db.Integer, nullable=False)

    # Total points for the week
    obtained_points = db.Column(db.Integer, default=0)

    status = db.Column(db.String, default="pending")  # pending | locked | scored

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.Index("idx_user_week", "user_id", "week"),
    )


class PredictionMatch(db.Model):
    __tablename__ = "prediction_match"

    id = db.Column(db.Integer, primary_key=True)
    prediction_id = db.Column(db.Integer, db.ForeignKey("prediction.prediction_id"), nullable=False)

    match_id = db.Column(db.Integer, nullable=False)
    home_team = db.Column(db.String, nullable=False)
    home_team_id = db.Column(db.Integer, nullable=False)
    away_team = db.Column(db.String, nullable=False)
    away_team_id = db.Column(db.Integer, nullable=False)

    # Multi-factor predictions
    result_prediction = db.Column(db.String, nullable=False)   # "home", "away", "draw"
    score_home_prediction = db.Column(db.Integer, nullable=True)
    score_away_prediction = db.Column(db.Integer, nullable=True)
    total_goals_prediction = db.Column(db.Integer, nullable=True)
    red_card_prediction = db.Column(db.Boolean, nullable=True)

    result_actual = db.Column(db.String(10), nullable=True)
    score_home_actual = db.Column(db.Integer, nullable=True)
    score_away_actual = db.Column(db.Integer, nullable=True)
    total_goals_actual = db.Column(db.Integer, nullable=True)
    red_card_actual = db.Column(db.Integer, nullable=True)

    # Points earned for this match
    obtained_points = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)