import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";
import AccountInfoCard from "../components/AccountInfoCard";
import LoginInfoCard from "../components/LoginInfoCard";

function Setting() {
    const { token, loading } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!token) {
      navigate("/login", { state: { from: "/settings" } });
      return;
    }

    fetch("http://127.0.0.1:5000/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.login) {
          setUser(data);
        } else {
          throw new Error();
        }
      })
      .catch(() => {
        alert("Please log in again");
        navigate("/login", { state: { from: "/settings" } });
      });
  }, [loading, token]);

  if (!user) return <div>Loading...</div>;

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
