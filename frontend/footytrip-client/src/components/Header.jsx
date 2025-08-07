import React from "react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/");         // Navigate home
    window.location.reload();  // Force full reload to reset state (Home reads updated token)
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-2xl font-bold text-[#a0ddd6] hover:text-[#c6ece7] focus:outline-none"
        >
          <GlobeAltIcon className="h-6 w-6 text-[#a0ddd6] hover:text-[#c6ece7]" />
          FootyTrip
        </button>
        <nav className="space-x-4 text-sm md:text-base">
          {!token ? (
            <>
              <a href="/login" className="hover:text-blue-600">Login</a>
              <a href="/register" className="hover:text-blue-600">Register</a>
            </>
          ) : (
            <button onClick={handleLogout} className="hover:text-red-600">Logout</button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
