import { useEffect, useState } from "react";
import { X } from "lucide-react";
import MatchPreview from "./MatchPreview";

const PredictionMatchForm = ({ match, onChange, onRemove, initialData, removable }) => {
  const [logos, setLogos] = useState({ home: null, away: null });
  const [stadium, setStadium] = useState(null);
  const [formData, setFormData] = useState({
    score_home_prediction: "",
    score_away_prediction: "",
    result_prediction: "",
    total_goals_prediction: "",
    red_card_prediction: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        score_home_prediction: initialData.score_home_prediction || "",
        score_away_prediction: initialData.score_away_prediction || "",
        result_prediction: initialData.result_prediction || "",
        total_goals_prediction: initialData.total_goals_prediction || "",
        red_card_prediction: initialData.red_card_prediction || false,
      });
    }
  }, [initialData]);

  // Fetch team logos + stadium
  useEffect(() => {
    const fetchLogosAndStadium = async () => {
      try {
        // Home logo
        const homeRes = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/logo?team_id=${match.home_team.id}`
        );
        const homeData = await homeRes.json();

        // Away logo
        const awayRes = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/logo?team_id=${match.away_team.id}`
        );
        const awayData = await awayRes.json();

        setLogos({
          home: homeData.logo_url,
          away: awayData.logo_url,
        });

        // Stadium (home team id)
        const stadiumRes = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/stadium?team_id=${match.home_team.id}`
        );
        const stadiumData = await stadiumRes.json();
        setStadium(stadiumData.stadium || "Unknown stadium");
      } catch (err) {
        console.error("Error fetching logos/stadium:", err);
      }
    };

    fetchLogosAndStadium();
  }, [match.home_team.id, match.away_team.id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updated = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(updated);
    onChange(match.match_id, updated); // Pass back to parent
  };

  return (
    <div className="relative bg-white shadow-md rounded-2xl p-4 my-6">

        {/* Close button */}
        <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            type="button"
            onClick={() => onRemove(match.match_id)}
        >
            <X size={18} />
        </button>


      {/* Match preview */}
      <MatchPreview
        home={match.home_team.name}
        away={match.away_team.name}
        date={match.date}
        stadium={stadium}
        homeLogo={logos.home}
        awayLogo={logos.away}
      />

      {/* Prediction inputs */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="block mb-1">Home Score</label>
          <input
            type="number"
            name="score_home_prediction"
            value={formData.score_home_prediction}
            onChange={handleChange}
            className="w-full border rounded-lg px-2 py-1"
          />
        </div>
        <div>
          <label className="block mb-1">Away Score</label>
          <input
            type="number"
            name="score_away_prediction"
            value={formData.score_away_prediction}
            onChange={handleChange}
            className="w-full border rounded-lg px-2 py-1"
          />
        </div>
        <div>
          <label className="block mb-1">Result</label>
          <select
            name="result_prediction"
            value={formData.result_prediction}
            onChange={handleChange}
            className="w-full border rounded-lg px-2 py-1"
          >
            <option value="">Select</option>
            <option value="home">Home</option>
            <option value="draw">Draw</option>
            <option value="away">Away</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Total Goals</label>
          <input
            type="number"
            name="total_goals_prediction"
            value={formData.total_goals_prediction}
            onChange={handleChange}
            className="w-full border rounded-lg px-2 py-1"
          />
        </div>
        <div className="col-span-2 flex items-center space-x-2">
          <input
            type="checkbox"
            name="red_card_prediction"
            checked={formData.red_card_prediction}
            onChange={handleChange}
          />
          <label>Predict Red Card</label>
        </div>
      </div>
    </div>
  );
};

export default PredictionMatchForm;
