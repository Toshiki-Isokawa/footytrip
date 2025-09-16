import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import FavoriteTrips from "../components/FavoriteTrips";
import LoginModal from "../components/LoginModal";

const Trip = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const { token, loading } = useContext(AuthContext);
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.login) {
          setUser(data);
        } else {
          setShowModal(true);
          throw new Error();
        }
      })
      .catch(() => {
        setShowModal(true);
      });
  }, [token, navigate]);

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  if (loading) return null; 

  if (!user) {
    return (
      <div className="min-h-screen bg-[#a0ddd6] flex items-center justify-center">
        {showModal && <LoginModal onClose={handleCloseModal} />}
        {!showModal && <p className="text-lg">Loading...</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#a0ddd6]">
      <Header />
      <NaviBar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Create new trip button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => navigate("/trips/new")}
            className="px-4 py-2 bg-gray text-white font-semibold rounded-lg hover:bg-[#89c9c1]"
          >
            + Create New Trip
          </button>
        </div>

        {/* Favorite trips */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Favorite Trips</h2>
        <FavoriteTrips />
      </main>
    </div>
  );
};

export default Trip;
