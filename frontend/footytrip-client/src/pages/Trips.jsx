import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import FavoriteTrips from "../components/FavoriteTrips";
import TripCard from "../components/TripCard";
import LoginModal from "../components/LoginModal";

const Trip = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [userTrips, setUserTrips] = useState([]);
  const { token, loading } = useContext(AuthContext);
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.login) {
          setUser(data);

          // Fetch logged-in user trips
          fetch(`${process.env.REACT_APP_API_BASE_URL}/api/trips/footy/${data.login.user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((trips) => setUserTrips(trips))
            .catch((err) => console.error("Error fetching user trips:", err));
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

        {/* User's own trips */}
        <div className="mt-12"> {/* space between sections */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Trips</h2>
          {userTrips.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {userTrips.map((trip) => (
                <div
                  key={trip.trip_id}
                  onClick={() => navigate(`/trips/${trip.trip_id}`)}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <TripCard {...trip} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">You haven’t created any trips yet.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Trip;