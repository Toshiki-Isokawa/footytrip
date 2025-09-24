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
  const [userLoading, setUserLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  };

  // 🔹 Fetch user (runs in parallel)
  useEffect(() => {
    const fetchUser = async () => {
      setUserLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.user && data.login) {
          setUser(data);
        } else {
          setShowModal(true);
        }
      } catch {
        setShowModal(true);
      } finally {
        setUserLoading(false);
      }
    };

    if (token) fetchUser();
    else setShowModal(true);
  }, [token]);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const startTime = performance.now();

        const dateStr = formatDate(selectedDate);
        console.log(`[FETCH START] date=${dateStr} at ${new Date().toISOString()}`);

        const res = await axios.get(`http://127.0.0.1:5000/api/schedule?date=${dateStr}`);

        const endTime = performance.now();
        console.log(`[FETCH END] took ${(endTime - startTime).toFixed(2)} ms`);

        if (res.data.status === "success") {
          setSchedule(res.data.schedule);
          console.log(`[FETCH SUCCESS] ${res.data.schedule.length} leagues received`);
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
        const res = await axios.get("http://127.0.0.1:5000/api/leagues");
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
          selectedLeagues.some(
            (sl) => sl.value.toString() === league.leagueId.toString()
          )
        );

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

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
              className="border rounded px-3 py-2 w-full md:w-auto"
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
              className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded w-full md:w-auto"
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
                <h2 className="text-lg md:text-xl font-bold mb-2 text-center md:text-left">
                  {league.leagueName}
                </h2>
                {league.matches.map((match) => (
                  <div
                    key={match.id}
                    className="flex flex-col md:flex-row items-center justify-between border p-3 rounded mb-2"
                  >
                    {/* Home */}
                    <div className="flex items-center space-x-2">
                      <img
                        src={match.home.logo}
                        alt={match.home.name}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="text-sm md:text-base font-medium">
                        {match.home.name}
                      </span>
                    </div>

                    {/* Score / Status */}
                    <div className="text-center font-semibold my-2 md:my-0 w-full md:w-1/3">
                      {match.status === "finished" && match.scoreStr ? (
                        <span className="text-gray-900 font-bold">{match.scoreStr}</span>
                      ) : match.status === "live" ? (
                        <span className="text-red-600 font-bold animate-pulse">LIVE</span>
                      ) : (
                        <span className="text-blue-500">
                          {new Date(match.utcTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>


                    {/* Away */}
                    <div className="flex items-center space-x-2 md:justify-end">
                      <img
                        src={match.away.logo}
                        alt={match.away.name}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="text-sm md:text-base font-medium">
                        {match.away.name}
                      </span>
                    </div>
                  </div>
                ))}

              </div>
            ))}
        </div>
      </div>

      {/* Show login modal */}
      {showModal && <LoginModal onClose={handleCloseModal} />}
    </>
  );

};

export default Schedule;
