import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import LoginModal from "../components/LoginModal";
import PredictionCard from "../components/PredictionCard";
import ExplainPredictionRule from "../components/ExplainPredictionRule";  

const PredictionHistory = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialWeek = query.get("week");
  const [userId, setUserId] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [realCurrentWeek, setRealCurrentWeek] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(initialWeek ? Number(initialWeek) : null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRule, setShowRule] = useState(false);

  useEffect(() => {
    const fetchRealWeek = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/predictions/week`, {
          method: "GET",
        });
        if (!res.ok) throw new Error("Failed to fetch real week");
        const data = await res.json();
        if (typeof data.week === "number") {
          setRealCurrentWeek(data.week);
          // if currentWeek not set yet, default it to real week
          setCurrentWeek((prev) => (prev == null ? data.week : prev));
        }
      } catch (err) {
        console.error("Error fetching real current week:", err);
      }
    };
    fetchRealWeek();
  }, []);

  useEffect(() => {
    if (!token) {
      // not logged in -> show modal
      setShowModal(true);
      return;
    }

    const fetchUserId = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/check`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setShowModal(true);
          throw new Error("Failed to fetch user_id");
        }
        const data = await res.json();
        setUserId(data.user_id);
      } catch (err) {
        setShowModal(true);
        console.error("Error fetching user_id:", err);
      }
    };

    fetchUserId();
  }, [token]);

  useEffect(() => {
    if (!userId || currentWeek == null) return;

    const fetchPrediction = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/predictions/fetch?user_id=${userId}&week=${currentWeek}`,
          { method: "GET", headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          // no prediction for that week or server returned error
          setPrediction(null);
          return;
        }
        const data = await res.json();
        setPrediction(data);
      } catch (err) {
        console.error("Error fetching prediction:", err);
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [userId, currentWeek, token]);

  const handlePrevWeek = () => {
    setCurrentWeek((prev) => (typeof prev === "number" ? Math.max(1, prev - 1) : prev));
  };

  const handleNextWeek = () => {
    setCurrentWeek((prev) => (typeof prev === "number" ? prev + 1 : prev));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#a0ddd6] flex items-center justify-center">
        {showModal && <LoginModal onClose={handleCloseModal} />}
        {!showModal && <p className="text-lg">Loading...</p>}
      </div>
    );
  }

  return (
    <>
      <Header />
      <NaviBar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Week Selector */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <button onClick={handlePrevWeek} className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">
            ◀
          </button>
          <span className="text-xl font-bold">
            Week {currentWeek != null ? currentWeek : "—"}
          </span>
          <button onClick={handleNextWeek} className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">
            ▶
          </button>
        </div>

        {/* Button to show prediction rules */}
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowRule(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            View Prediction Rules
          </button>
        </div>

        {/* Modal */}
        <ExplainPredictionRule
          isOpen={showRule}
          onClose={() => setShowRule(false)}
        />

        {/* Prediction Content */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : prediction ? (
          <PredictionCard prediction={prediction} />
        ) : (
          <p className="text-center text-gray-600">No prediction found for this week.</p>
        )}

        {/* Calculate Points Button */}
        {prediction &&
          prediction.status !== "scored" &&
          realCurrentWeek != null &&
          typeof prediction.week === "number" &&
          prediction.week < realCurrentWeek && (
            <div className="text-center mt-4">
              <button
                className={`px-6 py-2 rounded-lg text-white transition ${
                  isCalculating ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={isCalculating}
                onClick={async () => {
                  setIsCalculating(true);
                  try {
                    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/predictions/calc-points`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert("Calculation completed successfully!");
                      // Refresh current prediction
                      const refreshRes = await fetch(
                        `${process.env.REACT_APP_API_BASE_URL}/api/predictions/fetch?user_id=${userId}&week=${prediction.week}`,
                        { method: "GET", headers: { Authorization: `Bearer ${token}` } }
                      );
                      if (refreshRes.ok) {
                        const refreshedData = await refreshRes.json();
                        setPrediction(refreshedData);
                      }
                    } else {
                      alert(data.error || "Calculation failed.");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Failed to calculate points.");
                  } finally {
                    setIsCalculating(false);
                  }
                }}
              >
                {isCalculating ? "Calculating..." : "Calculate Points"}
              </button>
            </div>
          )}

        {/* Navigate to Prediction Main Page */}
        <div className="mt-8 text-center">
          <button onClick={() => navigate("/prediction")} className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition">
            Go to Prediction Page
          </button>
        </div>
      </div>
    </>
  );
};

export default PredictionHistory;
