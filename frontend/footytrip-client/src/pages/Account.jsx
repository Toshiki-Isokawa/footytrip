// src/pages/Account.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";

function Account() {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [selectedLeague, setSelectedLeague] = useState("");
    const [teams, setTeams] = useState([]);
    const [leagueSearch, setLeagueSearch] = useState("");
    const [allLeagues, setAllLeagues] = useState([]);
    const [favTeam, setFavTeam] = useState("");
    const [playerQuery, setPlayerQuery] = useState("");
    const [playerOptions, setPlayerOptions] = useState([]);
    const [favPlayer, setFavPlayer] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return isNaN(date) ? "" : date.toISOString().slice(0, 10);
    };

    // Fetch leagues once 
    useEffect(() => {
        fetch("http://127.0.0.1:5000/api/leagues")
            .then((res) => res.json())
            .then((data) => setAllLeagues(data))
            .catch((err) => console.error("Failed to fetch leagues:", err));
    }, []);

    const filteredLeagues = allLeagues.filter(
        (l) =>
            l.name.toLowerCase().includes(leagueSearch.toLowerCase()) ||
            l.country.toLowerCase().includes(leagueSearch.toLowerCase())
    );

    //  Fetch user info 
    useEffect(() => {
        if (!token) return;

        fetch("http://127.0.0.1:5000/api/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    const u = data.user;
                    setIsEditing(true);
                    setName(u.name || "");
                    setDob(formatDate(u.date_of_birth));
                    setFavTeam(u.fav_team || "");
                    setFavPlayer(u.fav_player || "");
                    setSelectedLeague(u.league_id || "");
                    setLeagueSearch(u.league || "");

                    // Handle both uploaded profile names and Google URLs
                    if (u.profile) {
                        setPreviewUrl(
                            u.profile.startsWith("http")
                                ? u.profile
                                : `http://127.0.0.1:5000/static/uploads/profiles/${u.profile}`
                        );
                    }
                } else {
                    setIsEditing(false);
                }
            })
            .catch((err) => console.error("Failed to fetch user account:", err));
    }, [token]);

    // Fetch teams when league selected 
    useEffect(() => {
        if (!selectedLeague) return;
        fetch(`http://127.0.0.1:5000/api/teams?league_id=${selectedLeague}`)
            .then((res) => res.json())
            .then((data) => setTeams(data))
            .catch((err) => console.error("Failed to fetch teams:", err));
    }, [selectedLeague]);

    //  Player search 
    const handleSearchPlayer = () => {
        if (!playerQuery.trim()) return;
        fetch(
            `http://127.0.0.1:5000/api/players/search?search=${encodeURIComponent(playerQuery)}`
        )
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setPlayerOptions(data);
                } else {
                    console.warn("Unexpected response format", data);
                    setPlayerOptions([]);
                }
            })
            .catch((err) => console.error("Failed to fetch players:", err));
    };

    //  Image change 
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setProfileImage(file);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    //  Submit form 
    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", name);
        formData.append("date_of_birth", dob);
        formData.append("league", leagueSearch);
        formData.append("league_id", selectedLeague);
        formData.append("fav_team", favTeam);
        formData.append("fav_player", favPlayer);
        if (profileImage) formData.append("profile", profileImage);

        const endpoint = isEditing
            ? "http://127.0.0.1:5000/api/account/edit"
            : "http://127.0.0.1:5000/api/account";

        const res = await fetch(endpoint, {
            method: isEditing ? "PUT" : "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        const data = await res.json();
        if (res.ok) {
            alert("Profile saved successfully!");
            navigate("/");
        } else {
            alert(data.msg || "Failed to save profile");
        }
    };

    return (
        <>
            <Header />
            <NaviBar />
            <div className="p-6 max-w-xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center">
                    {isEditing ? "Edit Your Profile" : "Complete Your Profile"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Profile Image */}
                    <div className="flex flex-col items-center space-y-2">
                        {previewUrl && (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-24 h-24 rounded-full object-cover border"
                            />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block"
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full border p-2 rounded"
                    />

                    {/* League Search */}
                    <input
                        type="text"
                        value={leagueSearch}
                        onChange={(e) => setLeagueSearch(e.target.value)}
                        placeholder="Search League"
                        className="w-full border p-2 rounded"
                    />

                    {filteredLeagues.length > 0 && (
                        <select
                            value={selectedLeague}
                            onChange={(e) => {
                                const leagueId = e.target.value;
                                setSelectedLeague(leagueId);
                                const leagueObj = allLeagues.find(
                                    (l) => l.id === parseInt(leagueId)
                                );
                                setLeagueSearch(leagueObj?.name || "");
                                setFavTeam("");
                            }}
                            className="w-full border p-2 rounded mt-2"
                        >
                            <option value="">-- Select a league --</option>
                            {filteredLeagues.map((league) => (
                                <option key={league.id} value={league.id}>
                                    {league.name} ({league.country})
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Team Dropdown */}
                    {selectedLeague && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Select Team</label>
                            <select
                                value={favTeam}
                                onChange={(e) => setFavTeam(e.target.value)}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">-- Select a team --</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.name}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Player Search */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Search Player</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={playerQuery}
                                onChange={(e) => setPlayerQuery(e.target.value)}
                                placeholder="Enter player name (e.g., Messi)"
                                className="flex-1 border p-2 rounded"
                            />
                            <button
                                type="button"
                                onClick={handleSearchPlayer}
                                className="bg-blue-600 text-white px-3 py-2 rounded"
                            >
                                Search
                            </button>
                        </div>

                        {playerOptions.length > 0 && (
                            <div className="space-y-2 mt-2">
                                <label className="block text-sm font-medium">
                                    Select Player
                                </label>
                                <select
                                    value={favPlayer}
                                    onChange={(e) => setFavPlayer(e.target.value)}
                                    className="w-full border p-2 rounded"
                                >
                                    <option value="">-- Choose a player --</option>
                                    {playerOptions.map((p) => (
                                        <option key={p.id} value={p.name}>
                                            {p.name} ({p.teamName})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                    >
                        {isEditing ? "Update" : "Submit"}
                    </button>
                </form>
            </div>
        </>
    );
}

export default Account;
