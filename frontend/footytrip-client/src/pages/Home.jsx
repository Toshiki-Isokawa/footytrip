// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import MatchPreview from "../components/MatchPreview";
import TopPredictor from '../components/TopPredictor';
import TripCard from '../components/TripCard';
import Welcome from '../components/Welcom';

const Home = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [trips, setTrips] = useState([]);
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [topUser, setTopUser] = useState(null);
    const [upcomingMatch, setUpcomingMatch] = useState(null);

    useEffect(() => {
        const fetchUpcomingMatch = async () => {
        try {
            const res = await fetch("http://127.0.0.1:5000/api/upcoming");
            const data = await res.json();

            if (res.ok && data.status === "success") {
                setUpcomingMatch(data.match);
            } else {
                console.warn("No upcoming match found:", data);
            }
        } catch (err) {
            console.error("Failed to fetch upcoming match", err);
        }
        };

        fetchUpcomingMatch();
    }, []);

    useEffect(() => {
        setIsLoggedIn(!!token);

        if (token) {
            // Fetch the logged-in user's ID first
            fetch("http://127.0.0.1:5000/api/me", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then(res => res.json())
            .then(data => {
                const userId = data.login.user_id;
                // Fetch trips of followed users
                return fetch(`http://127.0.0.1:5000/api/users/${userId}/feed`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            })
            .then(res => res.json())
            .then(feedTrips => setTrips(feedTrips))
            .catch(err => console.error("Failed to fetch feed trips:", err));
        }
    }, []);

    useEffect(() => {
        const fetchTopUser = async () => {
            try {
            const res = await fetch("http://127.0.0.1:5000/api/predictions/leaderboard/overall");
            const data = await res.json();
            if (res.ok && data.length > 0) {
                setTopUser(data[0]); // top 1 user
            }
            } catch (err) {
            console.error("Failed to fetch top user", err);
            }
        };

        fetchTopUser();
    }, []);

    if (!isLoggedIn) {
        return (
            <>
            <Header />
            <NaviBar />
            <Welcome />
            </>
        );
    }

    return (
        <div className="home-container">
            <Header />
            <NaviBar />

            <h2 className="text-xl font-bold text-center mt-8 mb-4">Upcoming Matches</h2>
                {upcomingMatch ? (
                    <MatchPreview
                        home={upcomingMatch.home_team.name}
                        away={upcomingMatch.away_team.name}
                        homeLogo={upcomingMatch.home_team.logo}
                        awayLogo={upcomingMatch.away_team.logo}
                        stadium={upcomingMatch.stadium || "TBD"}
                        date={new Date(upcomingMatch.kickoff_time).toLocaleString()}
                        clickable={true}
                        onClick={() => navigate(`/prediction`)}
                    />
                ) : (
                    <p className="text-center text-gray-500">Loading match...</p>
                )}
            <h2 className="text-xl font-bold ml-4 mt-8 mb-4">Top Predictor</h2>
            {topUser ? (
                <TopPredictor
                    userId={topUser.user_id}
                    name={topUser.name}
                    profileIcon={topUser.profile}
                    point={topUser.total_points}
                    favTeam={topUser.fav_team || "N/A"}
                    favPlayer={topUser.fav_player || "N/A"}
                    clickable={true}
                    onClick={() => navigate("/leaderboard")}
                />
            ) : (
            <p className="text-center text-gray-600">No top predictor available.</p>
            )}

            <section>
                <h2 className="text-xl font-bold ml-4 mt-8 mb-4">Following Users' Trips</h2>
                <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {trips.length > 0 ? (
                        trips.map((trip) => (
                        <div
                            key={trip.trip_id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/trips/${trip.trip_id}`)}
                        >
                            <TripCard {...trip} />
                        </div>
                        ))
                    ) : (
                        <p className="text-center col-span-full">No trips from followed users yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
