import React from "react";
//import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Setting from "./pages/Setting";
import Trip from "./pages/Trips";
import TripForm from "./pages/TripForm";
import TripDetail from "./pages/TripDetail";
import MatchForm from "./pages/MatchForm";
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider
import MatchDetail from "./pages/MatchDetail";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Account />} />
          <Route path="/account/edit" element={<Account />} />
          <Route path="/settings" element={<Setting />} />
          <Route path="/trips" element={<Trip />} />
          <Route path="/trips/new" element={<TripForm />} />
          <Route path="/trips/:id" element={<TripDetail />} />
          <Route path="/trips/:id/edit" element={<TripForm />} />
          <Route path="/trips/:tripId/match/new" element={<MatchForm />} />
          <Route path="/trips/:tripId/match/" element={<MatchDetail />} />
          <Route path="/trips/:tripId/match/edit" element={<MatchForm />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;