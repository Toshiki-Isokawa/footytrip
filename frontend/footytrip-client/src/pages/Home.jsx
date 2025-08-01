// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import MatchPreview from "../components/MatchPreview";
import TopPredictor from '../components/TopPredictor';
import TripCard from '../components/TripCard';

const Home = () => {
    const dummyTrips = [
        {
        country: "Spain",
        city: "Barcelona",
        stadium: "Camp Nou",
        date: "2025-05-03",
        photo: "https://source.unsplash.com/random/800x600?soccer",
        },
        {
        country: "England",
        city: "London",
        stadium: "Emirates Stadium",
        date: "2025-06-10",
        photo: "https://source.unsplash.com/random/800x601?soccer",
        },
        {
        country: "Japan",
        city: "Kobe",
        stadium: "Noevier Stadium",
        date: "2025-06-30",
        photo: "https://source.unsplash.com/random/800x601?soccer",
        },
        {
        country: "Japan",
        city: "Osaka",
        stadium: "Panasonic Stadium Suita",
        date: "2025-08-02",
        photo: "https://source.unsplash.com/random/800x601?soccer",
        },
    ];
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    // TODO: Replace this with real auth state
    setIsLoggedIn(true); // mock login

    // Fetch recent trips (replace with actual backend URL)
    fetch('http://127.0.0.1:5000/api/trips/recent')
      .then(res => res.json())
      .then(data => setTrips(data));
  }, []);

  return (
    <div className="home-container">
        <>
            <Header />
            <NaviBar />
        </>

      {isLoggedIn && (
        <>
            <h2 className="text-xl font-bold text-center mt-8 mb-4">Upcoming Matches</h2>
            <MatchPreview
                home="Barcelona"
                away="Real Madrid"
                homeLogo="https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg"
                awayLogo="https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg"
                stadium="Camp Nou"
                date="2025-05-03"
            />
            <h2 className="text-xl font-bold ml-4 mt-8 mb-4">Top Predictor</h2>
            {/*<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            </div> */}
            <TopPredictor
                name="Leo Messi"
                profileIcon="https://randomuser.me/api/portraits/men/32.jpg"
                correctRate={88}
                favTeam="Inter Miami"
            />
            <section>
            <h2 className="text-xl font-bold ml-4 mt-8 mb-4">Recent Trips</h2>
            <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {dummyTrips.map((trip, index) => (
                <TripCard key={index} {...trip} />
                ))}
            </div>
            </section>
        </>
      )}
    </div>
  );
};

export default Home;
