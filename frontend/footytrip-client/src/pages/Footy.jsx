import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar"
import TripCard from "../components/TripCard";
import LoginModal from "../components/LoginModal";

function Footy() {
  const { userId } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [userInfo, setUserInfo] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [trips, setTrips] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("trips");
  const [me, setMe] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch profile info & current user once
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [infoRes, meRes] = await Promise.all([
          fetch(`http://127.0.0.1:5000/api/users/${userId}`),
          fetch(`http://127.0.0.1:5000/api/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const userData = await infoRes.json();
        const meData = await meRes.json();

        setUserInfo(userData);
        setMe(meData);
        if (!meData.login || !meData.user) {
          setShowModal(true);
        };
      } catch (err) {
        setShowModal(true);
        console.error("Error fetching base user profile:", err);
      }
    };

    fetchBaseData();
  }, [userId, token]);

  useEffect(() => {
    const checkFollowing = async () => {
      if (!me?.login?.user_id || !userInfo?.id) return;

      try {
        const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}/followers`);
        const data = await res.json();

        const amIFollowing = data.some((f) => f.id === me.login.user_id);
        setIsFollowing(amIFollowing);
      } catch (err) {
        console.error("Error checking following status:", err);
      }
    };

    checkFollowing();
  }, [me, userInfo, userId]);

  // Fetch tab data every time tab changes
  useEffect(() => {
    const fetchTabData = async () => {
      try {
        if (activeTab === "followers") {
          const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}/followers`);
          const data = await res.json();
          setFollowers(data);

          if (me) {
            const amIFollowing = data.some((f) => f.id === me.login.user_id);
            setIsFollowing(amIFollowing);
          }
        }
        if (activeTab === "following") {
          const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}/following`);
          setFollowing(await res.json());
        }
        if (activeTab === "trips") {
          const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}/trips`);
          setTrips(await res.json());
        }
        if (activeTab === "favorites") {
          const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}/favorites`);
          setFavorites(await res.json());
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab} data:`, err);
      }
    };
    fetchTabData();
  }, [activeTab, userId, me]);

  // Toggle follow/unfollow
  const toggleFollow = async () => {
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(
        `http://127.0.0.1:5000/api/follow/${userId}`,
        {
          method,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setIsFollowing(!isFollowing);
      } else {
        console.error("Failed to toggle follow");
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB"); // dd-mm-yyyy
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  if (!userInfo) return <p className="text-center mt-6">Loading...</p>;

  if (!me) {
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
      {userInfo && (
        <>
          {/* User name */}
          <h1 className="text-5xl font-bold text-center mb-6">{userInfo.name}</h1>

          {/* Profile Section */}
            <div className="relative mb-8">
                <div className="flex justify-center items-center gap-6">
                    <img
                    src={
                        userInfo.profile
                        ? `http://127.0.0.1:5000/static/uploads/profiles/${userInfo.profile}`
                        : "/default-avatar.png"
                    }
                    alt="Profile"
                    className="w-48 h-48 rounded-full object-cover border"
                    />

                    <div className="flex flex-col justify-center text-center md:text-left">
                    <p className="text-2xl"><strong>Fav Team:</strong> {userInfo.fav_team}</p>
                    <p className="text-2xl"><strong>Fav Player:</strong> {userInfo.fav_player}</p>
                    <p className="text-2xl"><strong>Date of Birth:</strong> {formatDate(userInfo.date_of_birth)}</p>
                    <p className="text-2xl"><strong>Point:</strong> {userInfo.point}</p>
                    </div>
                </div>

                {/* Follow Button (top-right corner) */}
                {me?.login?.user_id !== userInfo?.id && (
                    <button
                        onClick={toggleFollow}
                        className={`absolute top-0 right-0 px-4 py-2 rounded-lg shadow ${
                        isFollowing ? "bg-red-500" : "bg-blue-500"
                        } text-white`}
                    >
                        {isFollowing ? "Unfollow" : "Follow"}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b mb-6 flex justify-center gap-8">
            {["following", "followers", "trips", "favorites"].map((tab) => (
                <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 text-lg font-medium ${
                    activeTab === tab
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500"
                }`}
                >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
            </div>

          {/* Tab Content */}
          <div>
            {activeTab === "trips" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trips.map((trip) => (
                  <div
                    key={trip.trip_id}
                    onClick={() => navigate(`/trips/${trip.trip_id}`)}
                    className="cursor-pointer"
                >
                    <TripCard {...trip} />
                </div>
                ))}
              </div>
            )}
            {activeTab === "favorites" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((trip) => (
                  <div
                    key={trip.trip_id}
                    onClick={() => navigate(`/trips/${trip.trip_id}`)}
                    className="cursor-pointer"
                >
                    <TripCard {...trip} />
              </div>
                ))}
              </div>
            )}
            {activeTab === "followers" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {followers.map((f) => (
                  <div key={f.user_id} className="text-center" onClick={() => navigate(`/footy/${f.id}`)}>
                    <img
                      src={
                        f.profile
                          ? `http://127.0.0.1:5000/static/uploads/profiles/${f.profile}`
                          : "/default-avatar.png"
                      }
                      alt="Follower"
                      className="w-20 h-20 mx-auto rounded-full object-cover"
                    />
                    <p className="mt-2">{f.name}</p>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "following" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {following.map((f) => (
                  <div key={f.user_id} className="text-center" onClick={() => navigate(`/footy/${f.id}`)}>
                    <img
                      src={
                        f.profile
                          ? `http://127.0.0.1:5000/static/uploads/profiles/${f.profile}`
                          : "/default-avatar.png"
                      }
                      alt="Following"
                      className="w-20 h-20 mx-auto rounded-full object-cover"
                    />
                    <p className="mt-2">{f.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Back Button */}
            <div className="mt-6 flex justify-center">
                <button
                onClick={() => navigate(from)}
                className="px-4 py-2 bg-gray-200 rounded-lg shadow hover:bg-gray-300 transition"
                >
                ← Back
                </button>
            </div>
        </>
      )}
    </div>
    </>
  );
}

export default Footy;
