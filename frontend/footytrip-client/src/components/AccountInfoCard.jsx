// src/components/AccountInfoCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

function AccountInfoCard({ user }) {
    const navigate = useNavigate();
  return (
    <div className="border rounded-lg p-6 w-full max-w-md mx-auto shadow-md bg-white">
      <h3 className="text-xl font-semibold mb-4 text-center">Account Info</h3>
      <div className="flex flex-col items-center space-y-3">
        {user.profile ? (
          <img
            src={`http://127.0.0.1:5000/static/profiles/${user.profile}`}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
            No Image
          </div>
        )}

        <div className="w-full space-y-2">
          {[
            { label: "Name", value: user.name },
            { label: "Date of Birth", value: new Date(user.date_of_birth).toISOString().split("T")[0] },
            { label: "Favorite Team", value: user.fav_team },
            { label: "Favorite Player", value: user.fav_player },
            { label: "Point", value: user.point },
          ].map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-left font-medium">{<strong>{item.label}</strong>}:</span>
              <span className="text-right">{item.value}</span>
            </div>
          ))}
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
          onClick={() => navigate("/account", { state: { user, from: "/settings" } })}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default AccountInfoCard;

