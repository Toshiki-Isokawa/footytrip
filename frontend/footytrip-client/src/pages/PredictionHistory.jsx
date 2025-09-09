import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import PredictionCard from "../components/PredictionCard";

const PredictionHistory = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch logged-in userId
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user_id");
        const data = await res.json();
        setUserId(data.user_id);
      } catch (err) {
        console.error("Error fetching user_id:", err);
        setError("Failed to load user data.");
      }
    };

    if (token) fetchUserId();
  }, [token]);

  // Fetch prediction for given week
  useEffect(() => {
    if (!userId || !currentWeek) return;

    const fetchPrediction = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:5000/api/predictions/fetch?user_id=${userId}&week=${currentWeek}`,
          { method: "GET" },
        );
        if (!res.ok) {
          setPrediction(null);
          return;
        }
        const data = await res.json();
        setPrediction(data);
      } catch (err) {
        console.error("Error fetching prediction:", err);
        setError("Failed to fetch prediction.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [userId, currentWeek]);

  // Get latest week once userId is known
  useEffect(() => {
    if (!userId) return;
    const fetchLatestWeek = async () => {
      try {
        // Call without week param to get current week default
        const res = await fetch(
          `http://127.0.0.1:5000/api/predictions/fetch?user_id=${userId}`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            method: "GET",
         }
        );
        if (res.ok) {
          const data = await res.json();
          setCurrentWeek(data.week);
          setPrediction(data);
        }
      } catch (err) {
        console.error("Error fetching latest week:", err);
      }
    };
    fetchLatestWeek();
  }, [userId, token]);

  const handlePrevWeek = () => {
    setCurrentWeek((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleNextWeek = () => {
    setCurrentWeek((prev) => prev + 1);
  };

  if (!token) return <p>Please log in to view predictions.</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Week Selector */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        <button
          onClick={handlePrevWeek}
          className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ◀
        </button>
        <span className="text-xl font-bold">Week {currentWeek}</span>
        <button
          onClick={handleNextWeek}
          className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ▶
        </button>
      </div>

      {/* Prediction Content */}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : prediction ? (
        <PredictionCard prediction={prediction} />
      ) : (
        <p className="text-center text-gray-600">
          No prediction found for this week.
        </p>
      )}

      {/* Navigate to Prediction Main Page */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate("/prediction")}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
        >
          Go to Prediction Page
        </button>
      </div>
    </div>
  );
};

export default PredictionHistory;