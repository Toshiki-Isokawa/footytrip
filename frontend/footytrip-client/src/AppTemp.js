import { useEffect, useState } from "react";
import Home from "./pages/Home";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/")
      .then((res) => res.json())
      .then((data) => setMsg(data.message));
  }, []);

  return (
    <div>
      <Home />
    </div>
  );
}

export default App;
