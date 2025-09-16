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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }

            try {
                // Check if token is valid
                const res = await fetch("http://127.0.0.1:5000/api/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Invalid token");

                const data = await res.json();
                setIsLoggedIn(true);

                const feedRes = await fetch(
                    `http://127.0.0.1:5000/api/users/${data.login.user_id}/feed`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (feedRes.ok) {
                    setTrips(await feedRes.json());
                }

                const upcomingRes = await fetch("http://127.0.0.1:5000/api/upcoming");
                if (upcomingRes.ok) {
                const matchData = await upcomingRes.json();
                if (matchData.status === "success") {
                    setUpcomingMatch(matchData.match);
                }
                }

                const leaderboardRes = await fetch(
                    "http://127.0.0.1:5000/api/predictions/leaderboard/overall"
                );
                if (leaderboardRes.ok) {
                    const leaderboard = await leaderboardRes.json();
                if (leaderboard.length > 0) {
                    setTopUser(leaderboard[0]);
                }
                }
            } catch (err) {
                console.warn("User not logged in or token invalid:", err);
                setIsLoggedIn(false);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    if (loading) {
        return <p className="text-center mt-6">Loading...</p>;
    }


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
