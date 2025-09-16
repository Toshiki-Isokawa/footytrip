import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";

function MatchDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [match, setMatch] = useState(null);
  const { token } = useContext(AuthContext);

  // Fetch logged-in user
  useEffect(() => {
    if (token) {
      fetch("http://127.0.0.1:5000/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setUser(data.login))
        .catch((err) => console.error("Error fetching user:", err));
        alert("Please log in again");
        navigate("/login");
    }
  }, [token, navigate]);

  // Fetch match
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/trips/${tripId}/match`)
      .then((res) => res.json())
      .then((data) => setMatch(data))
      .catch((err) => console.error("Error fetching match:", err));
  }, [tripId]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this match?")) {
      return;
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/trips/${tripId}/match`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to delete match");

      alert("Match deleted successfully");
      navigate(`/trips/${tripId}`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (!match) return <p className="text-center mt-6">Loading...</p>;

  const isOwner = user && match.trip_user_id === user.user_id;

  return (
    <>
      <Header />
      <NaviBar />
      <div className="max-w-4xl mx-auto p-6">
        {/* Title */}
        <h2 className="text-4xl font-extrabold text-center mb-8">
          {match.title}
        </h2>

        {/* Photo + Details side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {match.photo && (
            <img
              src={`http://127.0.0.1:5000/static/uploads/match/${match.photo}`}
              alt={match.title}
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
          )}
          <div className="flex flex-col justify-center space-y-2 text-lg">
            <p>
              <strong>Home Team:</strong> {match.home_team}
            </p>
            <p>
              <strong>Away Team:</strong> {match.away_team}
            </p>
            <p>
              <strong>Match Score:</strong> {match.score_home} -{" "}
              {match.score_away}
            </p>
            <p>
              <strong>Favorite Player:</strong> {match.favorite_player}
            </p>
          </div>
        </div>

        {/* Comments */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Comments</h3>
          <p className="text-gray-700 text-lg whitespace-pre-line">
            {match.comments}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          {isOwner && (
            <button
              onClick={() => navigate(`/trips/${tripId}/match/edit`)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Edit
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
            >
              Delete
            </button>
          )}
          <button
            onClick={() => navigate(`/trips/${tripId}`)}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            Back to Trip
          </button>
        </div>
      </div>
    </>
  );
}

export default MatchDetail;