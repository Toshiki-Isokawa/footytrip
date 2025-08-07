import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";


function Register() {
  const location = useLocation();
  const login = location.state?.login || {};
  const [email, setEmail] = useState(login.email || "");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const isEditMode = location.state?.from === "/settings";

  useEffect(() => {
    if (login?.email) {
      setEmail(login.email);
    }
  }, [login]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Register page loaded");
    console.log("location.state:", location.state);
    console.log("login:", login);
    console.log("isEditMode:", isEditMode);

    const endpoint = isEditMode
    ? "http://127.0.0.1:5000/api/update-login"
    : "http://127.0.0.1:5000/api/register";

    console.log("Selected endpoint:", endpoint);

    const token = localStorage.getItem("access_token");

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
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;
