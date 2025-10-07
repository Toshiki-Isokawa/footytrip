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
import FindFooty from "./pages/FindFooty";
import Footy from "./pages/Footy";
import Schedule from "./pages/Schedule";
import { AuthProvider } from "./contexts/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import MatchDetail from "./pages/MatchDetail";
import Prediction from "./pages/Prediction";
import PredictionCreate from "./pages/PredictionCreate";
import PredictionHistory from "./pages/PredictionHistory";
import Leaderboard from "./pages/Leaderboard";

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
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
            <Route path="/find" element={<FindFooty />} />
            <Route path="/footy/:userId" element={<Footy />}/>
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/prediction/create" element={<PredictionCreate />} />
            <Route path="/prediction/edit" element={<PredictionCreate />} />
            <Route path="/prediction/history" element={<PredictionHistory />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
export default App;