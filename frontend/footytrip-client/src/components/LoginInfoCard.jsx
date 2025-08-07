// src/components/LoginInfoCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

function LoginInfoCard({ login }) {
    const navigate = useNavigate();
  return (
    <div className="border rounded-lg p-6 w-full max-w-md mx-auto shadow-md bg-white">
      <h3 className="text-xl font-semibold mb-4 text-center">Login Info</h3>
      <div className="w-full space-y-2">
        {[
          { label: "Email", value: login.email },
          { label: "Password", value: "●●●●●●●●" },
        ].map((item, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-left font-medium">{<strong>{item.label}</strong>}:</span>
            <span className="text-right">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => navigate("/register", { state: { login, from: "/settings" } })}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default LoginInfoCard;