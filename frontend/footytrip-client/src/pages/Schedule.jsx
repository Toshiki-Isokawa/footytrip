// Schedule.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import Select from "react-select";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import LoginModal from "../components/LoginModal";


const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeagues, setSelectedLeagues] = useState([]);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  };

  useEffect(() => {
  
    fetch("http://127.0.0.1:5000/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.login) {
          setUser(data);
        } else {
          setShowModal(true);
          throw new Error();
        }
      })
      .catch(() => {
        setShowModal(true);
      });
  }, [token]);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const dateStr = formatDate(selectedDate);
        const res = await axios.get(`/api/schedule?date=${dateStr}`);
        if (res.data.status === "success") {
          setSchedule(res.data.schedule);
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedDate]);

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await axios.get("/api/leagues");
        setLeagues(
          res.data.map((l) => ({
            value: l.id,
            label: `${l.name} (${l.country})`,
          }))
        );
      } catch (err) {
        console.error("Error fetching leagues:", err);
      }
    };
    fetchLeagues();
  }, []);

  const filteredSchedule =
    selectedLeagues.length === 0
      ? schedule
      : schedule.filter((league) =>
          selectedLeagues.some((sl) => sl.value.toString() === league.leagueId.toString())
        );

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  if (!user) {
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
        <div className="p-4">
        {/* Sticky filter bar */}
        <div className="sticky top-[120px] bg-[#a0ddd6] z-10 py-2 shadow-sm mb-4">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 px-4">
            {/* Date Picker */}
            <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="dd/MM/yyyy"
                className="border rounded px-3 py-2"
            />

            {/* League Multi-Select */}
            <div className="flex-1 w-full">
                <Select
                isMulti
                options={leagues}
                value={selectedLeagues}
                onChange={setSelectedLeagues}
                placeholder="Filter by league..."
                />
            </div>

            {/* Clear Filter Button */}
            <button
                onClick={() => setSelectedLeagues([])}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded"
            >
                Clear
            </button>
            </div>
        </div>

        {/* Loading indicator */}
        {loading && <p className="text-center">Loading matches...</p>}

        {/* Display schedule */}
        <div className="max-w-4xl mx-auto px-4">
            {!loading &&
            filteredSchedule.map((league) => (
                <div key={league.leagueId} className="mb-6">
                <h2 className="text-xl font-bold mb-2">{league.leagueName}</h2>
                {league.matches.map((match) => (
                    <div
                    key={match.id}
                    className="flex justify-between border p-2 rounded mb-1"
                    >
                    {/* Home */}
                    <div className="flex items-center space-x-2">
                        <img
                        src={match.home.logo}
                        alt={match.home.name}
                        className="w-6 h-6 object-contain"
                        />
                        <span>{match.home.name}</span>
                    </div>

                    {/* Score */}
                    <div className="w-1/3 text-center font-semibold">
                        {match.scoreStr ? match.scoreStr : "vs"}
                    </div>

                    {/* Away */}
                    <div className="flex items-center space-x-2">
                        <img
                        src={match.away.logo}
                        alt={match.away.name}
                        className="w-6 h-6 object-contain"
                        />
                        <span>{match.away.name}</span>
                    </div>
                    </div>
                ))}
                </div>
            ))}
        </div>
        </div>
    </>
  );
};

export default Schedule;
