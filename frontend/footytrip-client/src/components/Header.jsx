import React from 'react';
import { GlobeAltIcon } from "@heroicons/react/24/outline";

const Header = () => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[#a0ddd6]">
            <GlobeAltIcon className="h-6 w-6 text-[#a0ddd6]" />
            FootyTrip
        </h1>
        <nav className="space-x-4 text-sm md:text-base">
          <a href="#" className="hover:text-blue-600">Login</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
