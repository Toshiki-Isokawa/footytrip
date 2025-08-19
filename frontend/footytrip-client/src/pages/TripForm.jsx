import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";


function TripForm() {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [stadium, setStadium] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    photo: null,
    country: "",
    city: "",
    league: "",
    team: "",
    date: "",
    comments: ""
  });

  const navigate = useNavigate();

  // Fetch leagues
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/leagues")
      .then(res => res.json())
      .then(data => setLeagues(data))
      .catch(err => console.error("Error fetching leagues:", err));
  }, []);

  // Fetch teams when league changes
  useEffect(() => {
    if (!formData.league) return;
    fetch(`http://127.0.0.1:5000/api/teams?league_id=${formData.league}`)
      .then(res => res.json())
      .then(data => setTeams(data))
      .catch(err => console.error("Error fetching teams:", err));
  }, [formData.league]);

  // Fetch stadium when team changes
  useEffect(() => {
    if (!formData.team) return;
    fetch(`http://127.0.0.1:5000/api/stadium?team_id=${formData.team}`)
      .then(res => res.json())
      .then(data => setStadium(data.stadium || ""))
      .catch(err => console.error("Error fetching stadium:", err));
  }, [formData.team]);

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
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");
    const submitData = new FormData();
    submitData.append("title", formData.title);
    if (formData.photo) submitData.append("photo", formData.photo);
    submitData.append("country", formData.country);
    submitData.append("city", formData.city);
    submitData.append("stadium", stadium);
    submitData.append("date", formData.date);
    submitData.append("comments", formData.comments);

    const res = await fetch("http://127.0.0.1:5000/api/trips", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: submitData
    });

    if (res.ok) {
      const newTrip = await res.json();
      navigate(`/trips/${newTrip.trip_id}`); // redirect to detail page
    } else {
      alert("Failed to create trip.");
    }
  };

  return (
    <>
      <Header />
      <NaviBar />
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Create a New Trip</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>

          <input
            type="text"
            name="title"
            placeholder="Trip Title"
            value={formData.title}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            required
          />

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

          <input
            type="text"
            name="country"
            placeholder="Country"
            value={formData.country}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            required
          />

          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            required
          />

          {/* League Dropdown */}
          <select
            name="league"
            value={formData.league}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            required
          >
            <option value="">Select League</option>
            {leagues.map(league => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>

          {/* Team Dropdown */}
          <select
            name="team"
            value={formData.team}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            disabled={!formData.league}
            required
          >
            <option value="">Select Team</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          {/* Stadium Display */}
          <input
            type="text"
            value={stadium}
            className="border rounded p-2 w-full bg-gray-100"
            readOnly
            placeholder="Stadium will appear here"
          />

          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            required
          />

          <textarea
            name="comments"
            placeholder="Comments"
            value={formData.comments}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            rows="4"
          ></textarea>

          <button
            type="submit"
            className="bg-blue-500 text-white rounded p-2 w-full hover:bg-blue-600"
          >
            Submit
          </button>
        </form>
      </div>
    </>
  );
}

export default TripForm;
