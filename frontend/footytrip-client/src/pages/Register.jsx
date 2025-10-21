import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";


function Register() {
  const { token } = useContext(AuthContext);
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const loginInfo = location.state?.login || {};
  const [email, setEmail] = useState(loginInfo.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state
  const navigate = useNavigate();
  const isEditMode = location.state?.from === "/settings";

  useEffect(() => {
    if (loginInfo?.email) {
      setEmail(loginInfo.email);
    }
  }, [loginInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const endpoint = isEditMode
    ? `${process.env.REACT_APP_API_BASE_URL}/api/update-login`
    : `${process.env.REACT_APP_API_BASE_URL}/api/register`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.msg);
      if (isEditMode) {
        localStorage.setItem("access_token", data.access_token);
        navigate("/settings");
      } else {
        localStorage.setItem("access_token", data.access_token);
        navigate("/account");
      }
    } else {
      alert(data.msg || "Registration failed");
    }
  };

  return (
    <>
      <Header />
      <NaviBar />
      <div className="p-4 max-w-sm mx-auto">
        <h2 className="text-xl font-bold mb-4">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
            Register
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center justify-center mb-4">
          <hr className="w-1/3 border-gray-300" />
          <span className="px-2 text-gray-500">or</span>
          <hr className="w-1/3 border-gray-300" />
        </div>

        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const id_token = credentialResponse.credential;

            try {
              const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  id_token: id_token,
                  mode: "register"
                }),
              });

              const data = await res.json();

              if (res.status === 409 && data.existing_user) {
                alert("You already have an account. Please log in instead.");
                navigate("/login");
                return;
              }
              if (res.ok) {
                login(data.access_token);
                navigate("/account");
              } else {
                alert(data.msg || "Google registration failed");
              }
            } catch (err) {
              console.error("Google login error:", err);
              alert("Something went wrong with Google login");
            }
          }}
          onError={() => {
            console.log("Google Login Failed");
            alert("Google Login Failed");
          }}
        />
      </div>
    </>
  );
}

export default Register;
