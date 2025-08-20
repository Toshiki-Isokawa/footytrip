import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import FavoriteTrips from "../components/FavoriteTrips";

const Trip = () => {
  const navigate = useNavigate();

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
