// src/components/TripCard.jsx
import React from 'react';

const TripCard = ({ country, city, stadium, date, photo }) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <img
        src={`${process.env.REACT_APP_API_BASE_URL}/static/uploads/trips/${photo}`}
        alt="Trip"
        className="h-48 w-full object-cover"
      />
      <div className="p-4">
        <h2 className="text-lg font-semibold truncate" title={stadium}>
          {stadium}
        </h2>
        <p className="text-sm text-gray-600 truncate">
          {city}, {country}
        </p>
        <p className="text-xs text-gray-500 mt-2">{date}</p>
      </div>
    </div>
  );
};


export default TripCard;
