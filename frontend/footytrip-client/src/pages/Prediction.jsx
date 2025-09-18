import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar"
import { useNavigate } from "react-router-dom";
import PredictionCard from "../components/PredictionCard";
import LoginModal from "../components/LoginModal";

const Prediction = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [realCurrentWeek, setRealCurrentWeek] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [lastPrediction, setLastPrediction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/check", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUserId(data.user_id);
        } else {
          console.error("Failed to fetch user_id");
          setShowModal(true);
        }
      } catch (err) {
        setShowModal(true);
      }
    };

    if (token) fetchUserId();
  }, [token, navigate]);

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  useEffect(() => {
    const fetchWeek = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/predictions/week");
        if (res.ok) {
          const data = await res.json();
          setRealCurrentWeek(data.week);
        }
      } catch (err) {
        console.error("Failed to fetch current week", err);
      }
    };
    fetchWeek();
  }, []);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!userId) return;

      try {
        const [currentRes, lastRes] = await Promise.all([
          fetch(`http://127.0.0.1:5000/api/predictions/current?user_id=${userId}`),
          fetch(`http://127.0.0.1:5000/api/predictions/last?user_id=${userId}`),
        ]);

        if (currentRes.ok) {
          setCurrentPrediction(await currentRes.json());
        }
        if (lastRes.ok) {
          setLastPrediction(await lastRes.json());
        }
      } catch (err) {
        console.error("Error fetching predictions:", err);
      }
    };

    fetchPredictions();
  }, [userId]);


  const today = new Date().getDay();
  const isDisabled = today === 5 || today === 6 || today === 0;

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
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Your Predictions</h1>

            {/* Current Prediction */}
            {currentPrediction ? (
                <PredictionCard prediction={currentPrediction} />
            ) : (
                <p>You have not predicted yet for this week.</p>
            )}

            {/* Create Prediction button */}
            <div className="mt-8 text-center">
            {currentPrediction ? (
                <button
                    onClick={() => !isDisabled && navigate("/prediction/edit")}
                    disabled={isDisabled}
                    className={`px-6 py-3 rounded-xl shadow transition ${
                        isDisabled
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    Edit Prediction
                </button>
                ) : (
                    <button
                        onClick={() => !isDisabled && navigate("/prediction/create")}
                        disabled={isDisabled}
                        className={`px-6 py-3 rounded-xl shadow transition ${
                            isDisabled
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                        Create New Prediction
                    </button>
                )}
            </div>

            {/* Last Week Prediction */}
            {lastPrediction ? (
                <div>
                <h2 className="text-xl font-semibold mt-6">Last Week</h2>
                <PredictionCard prediction={lastPrediction} />
                </div>
            ) : (
                <p>No prediction found for last week.</p>
            )}

            {/* Link to history page */}
            <a href={`/prediction/history?week=${realCurrentWeek}`} className="text-blue-600 underline block mt-4">
              Click here to see more prediction histories
            </a>

        </div>
    </>
  );
};

export default Prediction;
