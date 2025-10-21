import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar"
import PredictionMatchForm from "../components/PredictionMatchForm";
import ExplainPredictionRule from "../components/ExplainPredictionRule";  

const PredictionCreate = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showRule, setShowRule] = useState(false);

  // API data
  const [userId, setUserId] = useState(null);
  const [availableMatches, setAvailableMatches] = useState([]);
  const [allLeagues, setAllLeagues] = useState([]);

  // UI state
  const [leagueSearch, setLeagueSearch] = useState("");
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch leagues + available matches
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesRes, leaguesRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_BASE_URL}/api/predictions/available-matches`),
          fetch(`${process.env.REACT_APP_API_BASE_URL}/api/leagues`),
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

  // Fetch user_id and existing prediction
  useEffect(() => {
    const fetchUserAndPrediction = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/check`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user_id");
        const data = await res.json();
        setUserId(data.user_id);

        // Fetch existing prediction
        const predRes = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/predictions/fetch?user_id=${data.user_id}`
        );
        if (predRes.ok) {
          const predData = await predRes.json();
          if (predData.matches && predData.matches.length > 0) {
            setIsEditing(true);
            setMatches(
              predData.matches.map((m) => ({
                match_id: m.match_id,
                home_team: m.home_team,
                away_team: m.away_team,
              }))
            );

            const loadedPredictions = {};
            predData.matches.forEach((m) => {
              loadedPredictions[m.match_id] = {
                result_prediction: m.result_prediction,
                score_home_prediction: m.score_home_prediction,
                score_away_prediction: m.score_away_prediction,
                total_goals_prediction: m.total_goals_prediction,
                red_card_prediction: m.red_card_prediction,
              };
            });
            setPredictions(loadedPredictions);
          }
        }
      } catch (err) {
        console.error("Error fetching user or prediction:", err);
        alert("Please log in again");
        navigate("/login");
      }
    };

    fetchUserAndPrediction();
  }, [token, navigate]);

  // Filter leagues based on search and available matches
  const filteredLeagues = allLeagues.filter(
    (l) =>
      availableMatches.some((m) => m.league_id === l.id) &&
      (l.name.toLowerCase().includes(leagueSearch.toLowerCase()) ||
        l.country.toLowerCase().includes(leagueSearch.toLowerCase()))
  );

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
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

        const url = isEditing
        ? `${process.env.REACT_APP_API_BASE_URL}/api/predictions/update`
        : `${process.env.REACT_APP_API_BASE_URL}/api/predictions/create`;

        const res = await fetch(url, {
            method: isEditing? "PUT" : "POST", // usually updates use POST with same payload
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, matches: matchesPayload }),
        });

        if (!res.ok) throw new Error("Failed to submit predictions");

        alert("Predictions submitted successfully!");
        navigate("/prediction");
    } catch (err) {
        console.error(err);
        alert("Error submitting predictions");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
        <Header />
        <NaviBar />
        <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
            {isEditing ? "Edit Prediction" : "Create Prediction"}
        </h1>

        {/* Button to show prediction rules */}
        <div className="mb-6">
          <button
            onClick={() => setShowRule(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            View Prediction Rules
          </button>
        </div>

        {/* Modal */}
        <ExplainPredictionRule
          isOpen={showRule}
          onClose={() => setShowRule(false)}
        />

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
                    {m.kickoff_time}
                    </option>
                ))}
                </select>
            )}
            </div>
        )}

        {matches.map((match) => (
            <PredictionMatchForm
            key={match.match_id}
            match={match}
            initialData={predictions[match.match_id] || {}}
            onChange={handleMatchChange}
            onRemove={handleRemoveMatch}
            />
        ))}

        {matches.length > 0 && (
            <div className="flex justify-end mt-6">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg shadow text-white transition ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Submitting..."
                  : isEditing
                    ? "Update Predictions"
                    : "Submit Predictions"}
              </button>
            </div>
        )}
        </div>
    </>
  );
};

export default PredictionCreate;
