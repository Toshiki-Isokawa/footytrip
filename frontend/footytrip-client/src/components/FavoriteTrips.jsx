import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FavoriteTrips = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // Get user info first
        const token = localStorage.getItem("access_token");
        const resUser = await fetch("http://127.0.0.1:5000/api/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await resUser.json();

        // Fetch favorites
        const resFav = await fetch(
          `http://127.0.0.1:5000/api/users/${userData.user_id}/favorites`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await resFav.json();
        setFavorites(data);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  if (loading) return <p>Loading favorites...</p>;
  if (favorites.length === 0) return <p>No favorite trips yet.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {favorites.map((trip) => (
        <div
          key={trip.trip_id}
          className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg cursor-pointer flex flex-col transform transition-transform hover:scale-105"
          onClick={() => navigate(`/trips/${trip.trip_id}`)}
        >
          {trip.photo && (
            <img
              src={`http://127.0.0.1:5000/static/uploads/trips/${trip.photo}`}
              alt={trip.title}
              className="w-full h-40 object-cover"
            />
          )}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <h3 className="text-lg font-bold text-gray-800 truncate">
              {trip.title}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {trip.stadium}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(trip.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FavoriteTrips;
