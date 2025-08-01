import React from 'react';

const TopPredictor = ({ name, profileIcon, correctRate, favTeam }) => {
  return (
    <div className="mx-4 md:mx-12 bg-white shadow-md rounded-xl p-4 flex items-center space-x-4 my-4">
      <img
        src={profileIcon}
        alt={name}
        className="w-14 h-14 rounded-full object-cover border border-gray-300"
      />
      <div className="flex-1">
        <h4 className="text-md font-semibold text-gray-800">{name}</h4>
        <p className="text-sm text-gray-500">Fav Team: {favTeam}</p>
      </div>
      <div className="text-sm text-right">
        <p className="text-blue-600 font-semibold">{correctRate}%</p>
        <p className="text-xs text-gray-400">Accuracy</p>
      </div>
    </div>
  );
};

export default TopPredictor;
