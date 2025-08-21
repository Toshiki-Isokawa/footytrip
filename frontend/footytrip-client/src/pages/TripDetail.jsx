import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";

function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trip, setTrip] = useState(null);
  const [match, setMatch] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
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
    }
  }, [token]);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/trips/${id}`)
      .then(res => res.json())
      .then(data => setTrip(data))
      .catch(err => console.error("Error fetching trip:", err));
  }, [id]);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/trips/${id}/match`)
      .then(res => {
        if (res.status === 404) return null;
        return res.json();
      })
      .then(data => setMatch(data))
      .catch(err => console.error("Error fetching match:", err));
  }, [id]);

  // Check if this trip is in user's favorites
  useEffect(() => {
    if (!token) return;

    fetch(`http://127.0.0.1:5000/api/trips/${id}/favorite`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setIsFavorite(data.is_favorite))
      .catch((err) => console.error("Error checking favorite:", err));
  }, [id, token]);

  // Handle favorite toggle
  const toggleFavorite = async () => {
    if (!token) {
      alert("You must be logged in to favorite trips!");
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        await fetch(`http://127.0.0.1:5000/api/trips/${id}/favorite`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorite(false);
      } else {
        // Add to favorites
        await fetch(`http://127.0.0.1:5000/api/trips/${id}/favorite`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this trip?")) {
        return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/trips/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to delete trip");

        alert("Trip deleted successfully");
        navigate("/trips"); // redirect to main trips page
    } catch (err) {
        alert("Error: " + err.message);
    }
  };

  if (!trip) return <p className="text-center mt-6">Loading...</p>;

  const isOwner = user && trip.user_id === user.user_id;

  return (
    <>
      <Header />
      <NaviBar />
      <div className="max-w-4xl mx-auto p-6">
        {/* Title */}
        <h2 className="text-4xl font-extrabold text-center mb-8">
          {trip.title}
        </h2>

        {/* Photo + Details side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {trip.photo && (
            <img
              src={`http://127.0.0.1:5000/static/uploads/trips/${trip.photo}`}
              alt={trip.title}
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
          )}
          <div className="flex flex-col justify-center space-y-2 text-lg">
            <p>
              <strong>Country:</strong> {trip.country}
            </p>
            <p>
              <strong>City:</strong> {trip.city}
            </p>
            <p>
              <strong>Stadium:</strong> {trip.stadium}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(trip.date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Comments */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Comments</h3>
          <p className="text-gray-700 text-lg whitespace-pre-line">
            {trip.comments}
          </p>
        </div>

        {/* Favorite button (heart) */}
        <div className="flex justify-center mb-8">
          <button
            onClick={toggleFavorite}
            className={`px-6 py-2 rounded-full font-semibold text-white transition ${
              isFavorite
                ? "bg-pink-600 hover:bg-pink-700"
                : "bg-pink-500 hover:bg-pink-600"
            }`}
          >
            {isFavorite ? "❤️ Loved" : "♡ Love"}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          {isOwner && (
            <button
              onClick={() => navigate(`/trips/${id}/edit`)}
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
            onClick={() => navigate("/trips")}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            Back to Trips
          </button>
          <div className="flex justify-center gap-4">
            {isOwner ? (
              match ? (
                <button
                  onClick={() => navigate(`/trips/${id}/match`)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                >
                  Check Match
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/trips/${id}/match/new`)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  Add Match
                </button>
              )
            ) : (
              match && (
                <button
                  onClick={() => navigate(`/trips/${id}/match`)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                >
                  Check Match
                </button>
              )
            )}
          </div>


        </div>
      </div>
    </>
  );
}

export default TripDetail;
