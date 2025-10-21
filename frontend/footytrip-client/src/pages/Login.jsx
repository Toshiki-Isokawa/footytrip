import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import NaviBar from "../components/NaviBar";


function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/";
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("Login response data:", data);
        console.log("Login response data:", data.access_token);
        if (res.ok) {
            login(data.access_token);
            console.log("Login successful, navigating to:", from);      
            navigate(from); 
        } else {
            alert(data.msg || "Login failed");
        }
    };

    const handleGoogleLoginError = () => {
      alert("Google Sign-In failed. Please try again.");
    };

    const handleGoogleLoginSuccess = async (credentialResponse) => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id_token: credentialResponse.credential, 
            mode: "login"
          }),
        });

        const data = await res.json();

        if (res.status === 404 && data.not_registered) {
          alert("No account found for this Google user. Please register first.");
          navigate("/register");
          return;
        }

        if (res.ok) {
          login(data.access_token); 
          navigate("/"); 
        } else {
          alert(data.msg || "Google Sign-In failed");
        }
      } catch (err) {
        console.error("Google login error:", err);
      }
    };

  return (
    <>
      <Header />
      <NaviBar />
      <div className="p-4 max-w-sm mx-auto">
        <h2 className="text-xl font-bold mb-4">Login</h2>
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
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Log In
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center justify-center mb-4">
          <hr className="w-1/3 border-gray-300" />
          <span className="px-2 text-gray-500">or</span>
          <hr className="w-1/3 border-gray-300" />
        </div>

        {/* Google Login */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
          />
        </div>
      </div>
    </>
  );
}

export default Login;
