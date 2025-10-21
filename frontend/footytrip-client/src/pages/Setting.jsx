import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import AccountInfoCard from "../components/AccountInfoCard";
import LoginInfoCard from "../components/LoginInfoCard";
import LoginModal from "../components/LoginModal";

function Setting() {
    const { token, loading } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {

      fetch(`${process.env.REACT_APP_API_BASE_URL}/api/me`, {
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
    }, [loading, token]);

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  if (loading) return null; 

  if (!user) {
    return (
      <div className="min-h-screen bg-[#a0ddd6] flex items-center justify-center">
        {showModal && <LoginModal onClose={handleCloseModal} />}
        {!showModal && <p className="text-lg">Loading...</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#a0ddd6]">
      <Header />
      <NaviBar />
        <main className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-center">Account Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AccountInfoCard user={user.user} />
            <LoginInfoCard login={user.login} />
          </div>
        </main>
    </div>
  );
}

export default Setting;
