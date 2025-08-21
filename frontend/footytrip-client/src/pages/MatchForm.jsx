import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";

function MatchForm() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    photo: null,
    title: "",
    homeLeagueSearch: "",
    awayLeagueSearch: "",
    homeLeague: "",
    awayLeague: "",
    homeTeam: "",
    awayTeam: "",
    homeScore: 0,
    awayScore: 0,
    favoritePlayer: "",
    comments: "",
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [allLeagues, setAllLeagues] = useState([]);
  const [homeLeagues, setHomeLeagues] = useState([]);
  const [awayLeagues, setAwayLeagues] = useState([]);
  const [homeTeams, setHomeTeams] = useState([]);
  const [awayTeams, setAwayTeams] = useState([]);
  const [favoriteSide, setFavoriteSide] = useState("");
  const [players, setPlayers] = useState([]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  // Search leagues
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/leagues");
        const data = await res.json();
        setAllLeagues(data); // store all leagues
      } catch (err) {
        console.error("Error fetching leagues:", err);
      }
    };
    fetchLeagues();
  }, []);

  const searchLeagues = (keyword, setState) => {
    if (!keyword) {
      setState([]);
      return;
    }
    const normalized = keyword.trim().toLowerCase();
    const filtered = allLeagues.filter(
      (l) =>
        l.name.toLowerCase().includes(normalized) ||
        l.country.toLowerCase().includes(normalized)
    );
    setState(filtered);
  };


  // Fetch teams for a league
  const fetchTeams = async (leagueId, setState) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/teams?league_id=${leagueId}`
      );
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  // Fetch players for selected side
  const fetchPlayers = async (team_id) => {
  try {
    const res = await fetch(
      `http://127.0.0.1:5000/api/players?team_id=${team_id}`
    );
    const data = await res.json();
    setPlayers(data);
  } catch (err) {
    console.error("Error fetching players:", err);
  }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      if (formData.photo) submitData.append("photo", formData.photo);
      submitData.append("home_team", formData.homeTeam);
      submitData.append("away_team", formData.awayTeam);
      submitData.append("home_score", formData.homeScore);
      submitData.append("away_score", formData.awayScore);
      submitData.append("favorite_player", formData.favoritePlayer);
      submitData.append("comments", formData.comments);

      const res = await fetch(
        `http://127.0.0.1:5000/api/trips/${tripId}/match`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: submitData,
        }
      );

      if (res.ok) {
        const data = await res.json();
        navigate(`/trips/${tripId}/match/${data.match_id}`);
      } else {
        const errData = await res.json();
        alert("Failed to create match: " + errData.msg);
      }
    } catch (err) {
      console.error("Error creating match:", err);
    }
  };

  return (
    <>
      <Header />
      <NaviBar />
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Create Match</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Photo upload */}
          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full"
          />

          {photoPreview && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-1">Preview:</p>
              <img
                src={photoPreview}
                alt="Preview"
                className="max-h-48 rounded-lg border"
              />
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            name="title"
            placeholder="Match Title"
            value={formData.title}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            required
          />

          {/* Home team selection */}
          <div>
            <label className="block mb-1 font-medium">Home Team</label>
            <input
              type="text"
              placeholder="Search League"
              value={formData.homeLeagueSearch}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  homeLeagueSearch: e.target.value,
                }));
                searchLeagues(e.target.value, setHomeLeagues);
              }}
              className="border rounded p-2 w-full"
            />
            {homeLeagues.length > 0 && (
              <select
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, homeLeague: e.target.value }));
                  fetchTeams(e.target.value, setHomeTeams);
                }}
                className="border rounded p-2 w-full mt-2"
              >
                <option value="">Select League</option>
                {homeLeagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.country})
                  </option>
                ))}
              </select>
            )}
            {homeTeams.length > 0 && (
              <select
                name="homeTeam"
                value={formData.homeTeam}
                onChange={handleChange}
                className="border rounded p-2 w-full mt-2"
                required
              >
                <option value="">Select Team</option>
                {homeTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Away team selection */}
          <div>
            <label className="block mb-1 font-medium">Away Team</label>
            <input
              type="text"
              placeholder="Search League"
              value={formData.awayLeagueSearch}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  awayLeagueSearch: e.target.value,
                }));
                searchLeagues(e.target.value, setAwayLeagues);
              }}
              className="border rounded p-2 w-full"
            />
            {awayLeagues.length > 0 && (
              <select
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, awayLeague: e.target.value }));
                  fetchTeams(e.target.value, setAwayTeams);
                }}
                className="border rounded p-2 w-full mt-2"
              >
                <option value="">Select League</option>
                {awayLeagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.country})
                  </option>
                ))}
              </select>
            )}
            {awayTeams.length > 0 && (
              <select
                name="awayTeam"
                value={formData.awayTeam}
                onChange={handleChange}
                className="border rounded p-2 w-full mt-2"
                required
              >
                <option value="">Select Team</option>
                {awayTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Home Score</label>
              <input
                type="number"
                name="homeScore"
                min="0"
                max="20"
                value={formData.homeScore}
                onChange={handleChange}
                className="border rounded p-2 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Away Score</label>
              <input
                type="number"
                name="awayScore"
                min="0"
                max="20"
                value={formData.awayScore}
                onChange={handleChange}
                className="border rounded p-2 w-full"
                required
              />
            </div>
          </div>

          {/* Favorite Player Section */}
          <div className="mb-4">
            <label className="block font-medium mb-2">Favorite Player</label>
            
            {/* Radio buttons to pick source */}
            <div className="flex gap-4 mb-2">
              <label>
                <input
                  type="radio"
                  name="favoriteSide"
                  value="home"
                  checked={favoriteSide === "home"}
                  onChange={() => {
                    setFavoriteSide("home");
                    if (formData.homeTeam) {
                      fetchPlayers(formData.homeTeam);
                    }
                  }}
                />
                Home Team
              </label>
              <label>
                <input
                  type="radio"
                  name="favoriteSide"
                  value="away"
                  checked={favoriteSide === "away"}
                  onChange={() => {
                    setFavoriteSide("away");
                    if (formData.awayTeam) {
                      fetchPlayers(formData.awayTeam);
                    }
                  }}
                />
                Away Team
              </label>
            </div>

              {/* Dropdown with players */}
              <select
                name="favoritePlayer"
                value={formData.favoritePlayer}
                onChange={handleChange}
                className="border rounded p-2 w-full"
                required
                disabled={players.length === 0}
              >
                <option value="">-- Select Player --</option>
                {players.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

          {/* Comments */}
          <textarea
            name="comments"
            placeholder="Comments"
            value={formData.comments}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          />

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Submit
          </button>
        </form>
      </div>
    </>
  );
}

export default MatchForm;
