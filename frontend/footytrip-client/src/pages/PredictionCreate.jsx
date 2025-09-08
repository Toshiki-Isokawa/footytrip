import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import PredictionMatchForm from "../components/PredictionMatchForm";

const PredictionCreate = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  // API data
  const [userId, setUserId] = useState(null);
  const [availableMatches, setAvailableMatches] = useState([]);
  const [allLeagues, setAllLeagues] = useState([]);

  // UI state
  const [leagueSearch, setLeagueSearch] = useState("");
  const [filteredLeagues, setFilteredLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matches, setMatches] = useState([]); // Prediction cards
  const [predictions, setPredictions] = useState({});

  // Fetch leagues + available matches
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesRes, leaguesRes] = await Promise.all([
          fetch("http://127.0.0.1:5000/api/predictions/available-matches"),
          fetch("http://127.0.0.1:5000/api/leagues"),
        ]);
        const matchesData = await matchesRes.json();
        const leaguesData = await leaguesRes.json();

        setAvailableMatches(matchesData.matches || []);
        setAllLeagues(leaguesData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch user_id
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserId(data.user_id);
        }
      } catch (err) {
        console.error("Error fetching user_id:", err);
      }
    };
    if (token) fetchUserId();
  }, [token]);

  // Filter leagues based on search and available matches
  useEffect(() => {
    const availableLeagueIds = new Set(
      availableMatches.map((m) => m.league_id)
    );
    const filtered = allLeagues.filter(
      (l) =>
        availableLeagueIds.has(l.id) &&
        (l.name.toLowerCase().includes(leagueSearch.toLowerCase()) ||
          l.country.toLowerCase().includes(leagueSearch.toLowerCase()))
    );
    setFilteredLeagues(filtered);
  }, [leagueSearch, allLeagues, availableMatches]);

  // Matches for selected league excluding already selected matches
  const availableMatchesForLeague = availableMatches.filter(
    (m) =>
      m.league_id === selectedLeague &&
      !matches.find((sel) => sel.match_id === m.match_id)
  );

  // Handlers
  const handleLeagueSelect = (e) => {
    setSelectedLeague(Number(e.target.value));
    setSelectedMatch(null);
    setLeagueSearch("");
  };

  const handleMatchSelect = (e) => {
    const matchId = Number(e.target.value);
    const match = availableMatches.find((m) => m.match_id === matchId);
    if (match) {
      setMatches([...matches, match]);
      setSelectedLeague(null);
      setSelectedMatch(null);
    }
  };

  const handleRemoveMatch = (matchId) => {
    setMatches(matches.filter((m) => m.match_id !== matchId));
    setPredictions((prev) => {
      const updated = { ...prev };
      delete updated[matchId];
      return updated;
    });
  };

  const handleMatchChange = (matchId, data) => {
    setPredictions((prev) => ({ ...prev, [matchId]: data }));
  };

  // Submit predictions
  const handleSubmit = async () => {
    try {
      const matchesPayload = matches
        .map((match) => {
          const pred = predictions[match.match_id];
          if (!pred) return null;
          return {
            match_id: match.match_id,
            home_team: match.home_team.name,
            home_team_id: match.home_team.id,
            away_team: match.away_team.name,
            away_team_id: match.away_team.id,
            result_prediction: pred.result_prediction,
            score_home_prediction: pred.score_home_prediction,
            score_away_prediction: pred.score_away_prediction,
            total_goals_prediction: pred.total_goals_prediction,
            red_card_prediction: pred.red_card_prediction,
          };
        })
        .filter(Boolean);

      const res = await fetch(
        "http://127.0.0.1:5000/api/predictions/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, matches: matchesPayload }),
        }
      );

      if (!res.ok) throw new Error("Failed to submit predictions");

      alert("Predictions submitted successfully!");
      navigate("/prediction");
    } catch (err) {
      console.error(err);
      alert("Error submitting predictions");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Prediction</h1>

      {/* League + Match selection */}
      {matches.length < 3 && (
        <div className="mb-6 space-y-4">
          <input
            type="text"
            value={leagueSearch}
            onChange={(e) => setLeagueSearch(e.target.value)}
            placeholder="Type to search league"
            className="border rounded-lg px-3 py-2 w-full"
          />

          {filteredLeagues.length > 0 && (
            <select
              value={selectedLeague || ""}
              onChange={handleLeagueSelect}
              className="w-full border rounded-lg px-3 py-2 mt-2"
            >
              <option value="">Select League</option>
              {filteredLeagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name} ({league.country})
                </option>
              ))}
            </select>
          )}

          {selectedLeague && availableMatchesForLeague.length > 0 && (
            <select
              value={selectedMatch || ""}
              onChange={handleMatchSelect}
              className="w-full border rounded-lg px-3 py-2 mt-2"
            >
              <option value="">Select Match</option>
              {availableMatchesForLeague.map((m) => (
                <option key={m.match_id} value={m.match_id}>
                  {m.home_team.name} vs {m.away_team.name} –{" "}
                  {new Date(m.kickoff_time).toLocaleString()}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Prediction cards */}
      {matches.map((match, idx) => (
        <PredictionMatchForm
          key={match.match_id}
          match={match}
          onChange={handleMatchChange}
          onRemove={handleRemoveMatch}
          removable={true}
        />
      ))}

      {/* Submit button */}
      {matches.length > 0 && (
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            Submit Predictions
          </button>
        </div>
      )}
    </div>
  );
};

export default PredictionCreate;
