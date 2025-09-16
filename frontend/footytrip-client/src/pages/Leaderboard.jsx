import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import TopPredictor from "../components/TopPredictor";
import LoginModal from "../components/LoginModal";


const Leaderboard = () => {
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weeklyLeaders, setWeeklyLeaders] = useState([]);
  const [overallLeaders, setOverallLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!token) {
      setShowModal(true);
    }
  }, [token]);

  // Fetch current week from backend
  useEffect(() => {
    const fetchCurrentWeek = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/predictions/week");
        const weekNum = await res.json();
        setCurrentWeek(weekNum.week);
      } catch (err) {
        console.error("Failed to fetch current week", err);
      }
    };
    fetchCurrentWeek();
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    if (!currentWeek) return;

    const fetchLeaderboards = async () => {
      setLoading(true);
      try {
        const weeklyRes = await fetch(
          `http://127.0.0.1:5000/api/predictions/leaderboard/weekly?week=${currentWeek}`
        );
        const overallRes = await fetch("http://127.0.0.1:5000/api/predictions/leaderboard/overall");

        if (weeklyRes.ok) {
          const data = await weeklyRes.json();
          setWeeklyLeaders(data.slice(0, 5)); // top 5
        }
        if (overallRes.ok) {
          const data = await overallRes.json();
          setOverallLeaders(data.slice(0, 10)); // top 10
        }
      } catch (err) {
        console.error("Failed to fetch leaderboards", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, [currentWeek]);

  const handlePrevWeek = () => {
    if (currentWeek > 1) setCurrentWeek((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    setCurrentWeek((prev) => prev + 1);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  if (!token) {
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

        {loading ? (
          <p className="text-center">Loading leaderboards...</p>
        ) : (
          <>
            {/* Weekly Top 5 */}
            <h2 className="text-2xl font-bold mb-4 text-center">Top 5 Weekly</h2>
            {weeklyLeaders.length > 0 ? (
              weeklyLeaders.map((user) => (
                <TopPredictor
                  key={user.user_id}
                  userId={user.user_id}
                  name={user.name}
                  profileIcon={user.profile}
                  point={user.obtained_points} // points for weekly
                  favTeam={user.fav_team || "N/A"}
                  favPlayer={user.fav_player || "N/A"}
                  clickable={true}
                />
              ))
            ) : (
              <p className="text-center text-gray-600">No weekly leaderboard data.</p>
            )}

            {/* Overall Top 10 */}
            <h2 className="text-2xl font-bold mt-8 mb-4 text-center">
              Top 10 Overall
            </h2>
            {overallLeaders.length > 0 ? (
              overallLeaders.map((user) => (
                <TopPredictor
                  key={user.user_id}
                  userId={user.user_id}
                  name={user.name}
                  profileIcon={user.profile}
                  point={user.total_points} // points for overall
                  favTeam={user.fav_team || "N/A"}
                  favPlayer={user.fav_player || "N/A"}
                  clickable={true}
                />
              ))
            ) : (
              <p className="text-center text-gray-600">No overall leaderboard data.</p>
            )}
          </>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-center space-x-6">
          <button
            onClick={() => navigate("/prediction")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
          >
            Go to Prediction Page
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl shadow hover:bg-gray-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </>
  );
};

export default Leaderboard;
