import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";

function MatchForm() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const location = useLocation();
  const isEditing = Boolean(location.pathname.includes("edit"));

  const [formData, setFormData] = useState({
    photo: null,
    title: "",
    homeLeagueSearch: "",
    awayLeagueSearch: "",
    homeLeague: "",
    homeLeagueName: "",
    awayLeague: "",
    awayLeagueName: "",
    homeTeam: "",
    homeTeamId: "",
    awayTeam: "",
    awayTeamId: "",
    homeScore: 0,
    awayScore: 0,
    favoriteSide: "",
    favoritePlayer: "",
    comments: "",
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [allLeagues, setAllLeagues] = useState([]);
  const [homeLeagues, setHomeLeagues] = useState([]);
  const [awayLeagues, setAwayLeagues] = useState([]);
  const [homeTeams, setHomeTeams] = useState([]);
  const [awayTeams, setAwayTeams] = useState([]);
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

  // Fetch existing trip if editing
  useEffect(() => {
    if (isEditing) {
      fetch(`${process.env.REACT_APP_API_BASE_URL}/api/trips/${tripId}/match`)
        .then((res) => res.json())
        .then((data) => {
        setFormData({
          title: data.title,
          photo: null,
          homeLeague: data.home_team_league_id,
          homeLeagueName: data.home_team_league,
          awayLeague: data.away_team_league_id,
          awayLeagueName: data.away_team_league,
          homeTeam: data.home_team,
          homeTeamId: data.home_team_id,
          awayTeam: data.away_team,
          awayTeamId: data.away_team_id,
          homeScore: data.score_home,
          awayScore: data.score_away,
          favoritePlayer: data.favorite_player || "",
          favoriteSide: data.favorite_side || "",
          comments: data.comments || "",
        });

        if (data.photo) {
          setPhotoPreview(`${process.env.REACT_APP_API_BASE_URL}/static/uploads/match/${data.photo}`);
        }

        if (data.home_team_league_id) {
          fetchTeams(data.home_team_league_id, setHomeTeams);
        }
        if (data.away_team_league_id) {
          fetchTeams(data.away_team_league_id, setAwayTeams);
        }

        // fetch players for favorite side
        if (data.favorite_side === "home" && data.home_team_id) {
          fetchPlayers(data.home_team_id);
        } else if (data.favorite_side === "away" && data.away_team_id) {
          fetchPlayers(data.away_team_id);
        }
      })
        .catch((err) => console.error("Error fetching trip for edit:", err));
    }
  }, [tripId, isEditing]);

  // Search leagues
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/leagues`);
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
        `${process.env.REACT_APP_API_BASE_URL}/api/teams?league_id=${leagueId}`
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
      `${process.env.REACT_APP_API_BASE_URL}/api/players?team_id=${team_id}`
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
      submitData.append("home_team_league", formData.homeLeagueName);
      submitData.append("away_team_league", formData.awayLeagueName);
      submitData.append("home_team_league_id", formData.homeLeague);
      submitData.append("away_team_league_id", formData.awayLeague);
      submitData.append("home_team_id", formData.homeTeamId);
      submitData.append("away_team_id", formData.awayTeamId);
      submitData.append("home_team", formData.homeTeam);
      submitData.append("away_team", formData.awayTeam);
      submitData.append("score_home", formData.homeScore);
      submitData.append("score_away", formData.awayScore);
      submitData.append("favorite_side", formData.favoriteSide);
      submitData.append("favorite_player", formData.favoritePlayer);
      submitData.append("comments", formData.comments);

      const res = await fetch(
        isEditing
          ? `${process.env.REACT_APP_API_BASE_URL}/api/trips/${tripId}/match/edit`
          : `${process.env.REACT_APP_API_BASE_URL}/api/trips/${tripId}/match`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: submitData,
        }
      );

      if (res.ok) {
        navigate(`/trips/${tripId}/match`);
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
        <h2 className="text-2xl font-bold text-center mb-6">
          {isEditing ? "Edit Match" : "Create Match"}
        </h2>
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
                const q = e.target.value;
                setFormData((prev) => ({ ...prev, homeLeagueSearch: q }));
                searchLeagues(q, setHomeLeagues);
              }}
              className="border rounded p-2 w-full"
            />

            {homeLeagues.length > 0 && (
              <select
                className="border rounded p-2 w-full mt-2"
                value={formData.homeLeague || ""}
                onChange={(e) => {
                  const leagueId = parseInt(e.target.value);
                  const selected = allLeagues.find((l) => l.id === leagueId);
                  setFormData((prev) => ({
                    ...prev,
                    homeLeague: leagueId,
                    homeLeagueName: selected?.name || "",
                    // reset team when league changes
                    homeTeamId: "",
                    homeTeam: "",
                  }));
                  setHomeTeams([]);
                  if (leagueId) fetchTeams(leagueId, setHomeTeams);
                }}
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
                value={formData.homeTeamId || ""}
                onChange={(e) => {
                  const teamId = parseInt(e.target.value);
                  const selected = homeTeams.find((t) => t.id === teamId);
                  setFormData((prev) => ({
                    ...prev,
                    homeTeamId: selected?.id || "",
                    homeTeam: selected?.name || "",
                  }));
                  // Refresh players if favorite side is home
                  if (formData.favoriteSide === "home" && teamId) {
                    fetchPlayers(teamId);
                  }
                }}
                className="border rounded p-2 w-full mt-2"
                required={!isEditing}
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
                const q = e.target.value;
                setFormData((prev) => ({ ...prev, awayLeagueSearch: q }));
                searchLeagues(q, setAwayLeagues);
              }}
              className="border rounded p-2 w-full"
            />

            {awayLeagues.length > 0 && (
              <select
                className="border rounded p-2 w-full mt-2"
                value={formData.awayLeague || ""}
                onChange={(e) => {
                  const leagueId = parseInt(e.target.value);
                  const selected = allLeagues.find((l) => l.id === leagueId);
                  setFormData((prev) => ({
                    ...prev,
                    awayLeague: leagueId,
                    awayLeagueName: selected?.name || "",
                    // reset team when league changes
                    awayTeamId: "",
                    awayTeam: "",
                  }));
                  setAwayTeams([]);
                  if (leagueId) fetchTeams(leagueId, setAwayTeams);
                }}
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
                value={formData.awayTeamId || ""}
                onChange={(e) => {
                  const teamId = parseInt(e.target.value);
                  const selected = awayTeams.find((t) => t.id === teamId);
                  setFormData((prev) => ({
                    ...prev,
                    awayTeamId: selected?.id || "",
                    awayTeam: selected?.name || "",
                  }));
                  // Refresh players if favorite side is away
                  if (formData.favoriteSide === "away" && teamId) {
                    fetchPlayers(teamId);
                  }
                }}
                className="border rounded p-2 w-full mt-2"
                required={!isEditing}
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
                  checked={formData.favoriteSide === "home"}
                  onChange={() => {
                    setFormData((prev) => ({ ...prev, favoriteSide: "home" }));
                    if (formData.homeTeamId) {
                      fetchPlayers(formData.homeTeamId);
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
                  checked={formData.favoriteSide === "away"}
                  onChange={() => {
                    setFormData((prev) => ({ ...prev, favoriteSide: "away" }));
                    if (formData.awayTeamId) {
                      fetchPlayers(formData.awayTeamId);
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
            {isEditing ? "Update Match" : "Create Match"}
          </button>
        </form>
      </div>
    </>
  );
}

export default MatchForm;
