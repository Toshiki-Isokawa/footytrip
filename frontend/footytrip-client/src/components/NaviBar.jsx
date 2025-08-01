import React, { useState } from "react";
import { Menu, X } from "lucide-react";

const NaviBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const buttons = [
    "Prediction",
    "Schedule",
    "Find Footy",
    "Post Trip",
    "Make a Trip Plan",
    "Setting",
  ];

  return (
    <div className="bg-[#a0ddd6] shadow-md sticky top-[64px] z-40 rounded-xl mx-4 mt-4">
      {/* Mobile Toggle */}
      <div className="flex justify-between items-center px-4 py-3 md:hidden">
        <h2 className="text-lg font-semibold">Menu</h2>
        <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Buttons - hidden on mobile unless open */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } md:flex md:justify-between md:px-4 md:py-2`}
      >
        {buttons.map((label, index) => (
          <button
            key={index}
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
