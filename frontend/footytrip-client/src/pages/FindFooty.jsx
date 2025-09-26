import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import LoginModal from "../components/LoginModal";

function FindFooty() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch all users + logged in user
  useEffect(() => {
    const fetchData = async () => {
        try {
        const [usersRes, meRes] = await Promise.all([
            fetch("http://127.0.0.1:5000/api/users"),
            fetch("http://127.0.0.1:5000/api/me", {
            headers: { Authorization: `Bearer ${token}` },
            }),
        ]);

        const usersData = await usersRes.json();
        const meData = await meRes.json();

        setAllUsers(usersData);

        const mergedUser = {
            ...meData.user,
            ...meData.login,
        };
        setLoggedInUser(mergedUser);
        if (meData.login || meData.user) {
          setUser(mergedUser);
        }
        if (!meData.login || !meData.user) {
          setShowModal(true);
        }

        } catch (err) {
          setShowModal(true);
          console.error("Error fetching users:", err);
        }
    };

    fetchData();
    }, [token]);

  // Filtered search results
  const filteredUsers = allUsers.filter((u) =>
    u.user_id !== loggedInUser.user_id &&
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Recommendations
  const sameFavPlayer = loggedInUser
    ? allUsers.filter(
        (u) =>
          u.user_id !== loggedInUser.user_id &&
          u.fav_player === loggedInUser.fav_player
      ) 
    : [];

  const sameFavTeam = loggedInUser
    ? allUsers.filter(
        (u) =>
          u.user_id !== loggedInUser.user_id &&
          u.fav_team === loggedInUser.fav_team
      )
    : [];

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  if (!user ) {
    return (
      <div className="min-h-screen bg-[#a0ddd6] flex items-center justify-center">
        {showModal && <LoginModal onClose={handleCloseModal} />}
        {!showModal && <p className="text-lg">Loading...</p>}
      </div>
    );
  }

  return (
    <>
      <Header />
      <NaviBar />
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Find Footy</h2>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border rounded p-2 mb-6"
        />

        {/* Search Results */}
        {searchQuery && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Search Results</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {filteredUsers.map((u) => (
                <div
                  key={u.user_id}
                  onClick={() => navigate(`/footy/${u.user_id}`)}
                  className="flex-shrink-0 w-28 flex flex-col items-center p-2 cursor-pointer"
                >
                  <img
                    src={
                      u.profile
                        ? `http://127.0.0.1:5000/static/uploads/profiles/${u.profile}`
                        : "/default-avatar.png"
                    }
                    alt={u.name}
                    className="w-16 h-16 rounded-full object-cover mb-1"
                  />
                  <p className="text-xs font-medium text-center">{u.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation: Same Favorite Player */}
        {sameFavPlayer.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">
              Footies who also like {loggedInUser?.fav_player}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {sameFavPlayer.map((u) => (
                <div
                  key={u.user_id}
                  onClick={() => navigate(`/footy/${u.user_id}`)}
                  className="flex-shrink-0 w-28 flex flex-col items-center p-2 cursor-pointer"
                >
                  <img
                    src={
                      u.profile
                        ? `http://127.0.0.1:5000/static/uploads/profiles/${u.profile}`
                        : "/default-avatar.png"
                    }
                    alt={u.name}
                    className="w-16 h-16 rounded-full object-cover mb-1"
                  />
                  <p className="text-xs font-medium text-center">{u.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation: Same Favorite Team */}
        {sameFavTeam.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">
              Footies who also support {loggedInUser?.fav_team}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {sameFavTeam.map((u) => (
                <div
                  key={u.user_id}
                  onClick={() => navigate(`/footy/${u.user_id}`)}
                  className="flex-shrink-0 w-28 flex flex-col items-center p-2 cursor-pointer"
                >
                  <img
                    src={
                      u.profile
                        ? `http://127.0.0.1:5000/static/uploads/profiles/${u.profile}`
                        : "/default-avatar.png"
                    }
                    alt={u.name}
                    className="w-16 h-16 rounded-full object-cover mb-1"
                  />
                  <p className="text-xs font-medium text-center">{u.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default FindFooty;