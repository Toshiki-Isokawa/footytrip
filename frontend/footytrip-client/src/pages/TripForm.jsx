import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";


function TripForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const isEditing = Boolean(id);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [allLeagues, setAllLeagues] = useState([]);
  const [leagueSearch, setLeagueSearch] = useState("");
  const [teams, setTeams] = useState([]);
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

  // Fetch existing trip if editing
  useEffect(() => {
    if (isEditing) {
      fetch(`http://127.0.0.1:5000/api/trips/${id}`)
        .then((res) => res.json())
        .then((data) => {
        setFormData({
          title: data.title,
          photo: null,
          country: data.country,
          city: data.city,
          stadium: data.stadium, // stadium pre-filled
          date: data.date,
          comments: data.comments,
        });

        if (data.photo) {
          setPhotoPreview(`http://127.0.0.1:5000/static/uploads/trips/${data.photo}`);
        }
      })
        .catch((err) => console.error("Error fetching trip for edit:", err));
    }
  }, [id, isEditing]);


  // Fetch leagues
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/leagues")
      .then(res => res.json())
      .then(data => setAllLeagues(data))
      .catch(err => console.error("Error fetching leagues:", err));
  }, []);

  // Filter leagues locally
  const filteredLeagues = allLeagues.filter(
    (l) =>
      l.name.toLowerCase().includes(leagueSearch.toLowerCase()) ||
      l.country.toLowerCase().includes(leagueSearch.toLowerCase())
  );

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
      .then(data =>
        setFormData(prev => ({
          ...prev,
          stadium: data.stadium || "",
        }))
      )
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
      setFormData({ ...formData, photo: file });
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = new FormData();
    submitData.append("title", formData.title);
    if (formData.photo) submitData.append("photo", formData.photo);
    submitData.append("country", formData.country);
    submitData.append("city", formData.city);
    submitData.append("stadium", formData.stadium);
    submitData.append("date", formData.date);
    submitData.append("comments", formData.comments);

    try {
      const res = await fetch(
        isEditing
          ? `http://127.0.0.1:5000/api/trips/${id}`
          : "http://127.0.0.1:5000/api/trips",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: submitData,
        }
      );
      if (!res.ok) throw new Error("Failed to save trip");

      const data = await res.json();
      navigate(`/trips/${isEditing ? id : data.trip_id}`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <>
      <Header />
      <NaviBar />
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">
          {isEditing ? "Edit Trip" : "Create New Trip"}
        </h2>
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

          {/* League Search + Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Search League</label>
            <input
              type="text"
              value={leagueSearch}
              onChange={(e) => setLeagueSearch(e.target.value)}
              placeholder="Type to search league (e.g., Japan)"
              className="border rounded p-2 w-full"
            />

            {filteredLeagues.length > 0 && (
              <select
                name="league"
                value={formData.league}
                onChange={handleChange}
                className="border rounded p-2 w-full mt-2"
                required={!isEditing}
              >
                <option value="">Select League</option>
                {filteredLeagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} ({league.country})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Team Dropdown */}
          <select
            name="team"
            value={formData.team}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            disabled={!formData.league}
            required={!isEditing}
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
            value={formData.stadium}
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
            {isEditing ? "Update Trip" : "Create Trip"}
          </button>
        </form>
      </div>
    </>
  );
}

export default TripForm;
