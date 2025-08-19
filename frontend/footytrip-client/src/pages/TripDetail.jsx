import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";

function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/trips/${id}`)
      .then(res => res.json())
      .then(data => setTrip(data))
      .catch(err => console.error("Error fetching trip:", err));
  }, [id]);

  if (!trip) return <p className="text-center mt-6">Loading...</p>;

  return (
    <>
      <Header />
      <NaviBar />
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">{trip.title}</h2>
        {trip.photo && (
          <img
            src={`http://127.0.0.1:5000/static/uploads/trips/${trip.photo}`}
            alt={trip.title}
            className="w-full rounded-lg mb-4"
          />
        )}
        <p><strong>Country:</strong> {trip.country}</p>
        <p><strong>City:</strong> {trip.city}</p>
        <p><strong>Stadium:</strong> {trip.stadium}</p>
        <p><strong>Date:</strong> {trip.date}</p>
        <p><strong>Comments:</strong> {trip.comments}</p>

        <div className="flex gap-4 mt-6">
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
            Edit
          </button>
          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg">
            Favorite
          </button>
          <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">
            Delete
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            Back to Trips
          </button>
        </div>
      </div>
    </>
  );
}

export default TripDetail;
