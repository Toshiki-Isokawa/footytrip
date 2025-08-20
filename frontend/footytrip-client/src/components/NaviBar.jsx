import React, { useContext, useState } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const NaviBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const buttons = [
    "Prediction",
    "Schedule",
    "Find Footy",
    "Post Trip",
    "Make a Trip Plan",
    "Setting",
    ];

    const handleClick = (label) => {
        const routeMap = {
        "Prediction": "/prediction",
        "Schedule": "/schedule",
        "Find Footy": "/find",
        "Post Trip": "/trips",
        "Make a Trip Plan": "/make-trip",
        "Setting": "/settings",
        };
        const path = routeMap[label];

        if (!token) {
            navigate("/login", { state: { from: path } }); 
        } else if (path) {
            navigate(path);
        }
    };
  return (
    <div className="bg-[#a0ddd6] shadow-md sticky top-[64px] z-40 rounded-xl mx-4 mt-4">
      {/* Mobile Toggle */}
      <div className="flex justify-between items-center px-4 py-3 md:hidden">
        <h2 className="text-lg font-semibold">Menu</h2>
        <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Buttons */}
      <div className={`${isOpen ? "block" : "hidden"} md:flex md:justify-between md:px-4 md:py-2`}>
        {buttons.map((label, index) => (
          <button
            key={index}
            onClick={() => handleClick(label)}
            className="w-full md:w-auto text-sm font-medium text-gray-700 hover:text-white hover:bg-teal-500 py-2 px-2 md:mx-1 rounded transition duration-200 text-left md:text-center"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NaviBar;
