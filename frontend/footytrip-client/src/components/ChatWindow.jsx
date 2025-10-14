import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { X, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChatWindow({ onClose }) {
  const { token } = useContext(AuthContext);
  const [mode, setMode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [fetchingUserId, setFetchingUserId] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserId = async () => {
      if (!token) {
        setError("Not authenticated");
        return;
      }
      setFetchingUserId(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/api/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError("Failed to fetch user info. Please log in again.");
          setFetchingUserId(false);
          return;
        }
        const data = await res.json();
        if (data && data.user_id) {
          setUserId(data.user_id);
        } else {
          setError("Unable to determine user id.");
        }
      } catch (err) {
        console.error("Error fetching user_id:", err);
        setError("Network error while fetching user info.");
      } finally {
        setFetchingUserId(false);
      }
    };

    fetchUserId();
  }, [token]);

  const handleModeSelect = async (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === "analyzer") {
      setLoading(true);
      setMessages([{ sender: "bot", text: "Analyzing your performance..." }]);
      await sendMessage("", selectedMode);
    } else {
      const greeting =
        selectedMode === "prediction"
          ? "How do you want me to help predict?"
          : "Talk to me anything about football!";
      setMessages([{ sender: "bot", text: greeting }]);
    }
  };

  const sendMessage = async (message, currentMode = mode) => {
    if (!userId) {
      // try to re-fetch user id once
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/api/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError("Failed to fetch user info. Please log in again.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data && data.user_id) setUserId(data.user_id);
        else {
          setError("Unable to get user id.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error fetching user_id:", err);
        setError("Network error fetching user info.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    // if analyzer and message is empty, we still send a special payload
    const payloadMessage = currentMode === "analyzer" ? (message || "analyze") : message;

    // Prevent empty user message for non-analyzer modes
    if (currentMode !== "analyzer" && (!payloadMessage || payloadMessage.trim() === "")) return;

    if (currentMode !== "analyzer") {
      setMessages((prev) => [...prev, { sender: "user", text: payloadMessage }]);
      setUserInput("");
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          message: payloadMessage,
          mode: currentMode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
      } else {
        const msg = data?.error || data?.msg || "AI request failed.";
        setMessages((prev) => [...prev, { sender: "bot", text: msg }]);
      }
    } catch (err) {
      console.error("Chat API error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Network error. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMenu = () => {
    setMode(null);
    setMessages([]);
    setUserInput("");
  };

  return (
    <div
    className="
        fixed bottom-20 right-4
        bg-white border rounded-2xl shadow-lg flex flex-col
        w-[90vw] max-w-[380px] h-[70vh] max-h-[520px]
        sm:bottom-24 sm:right-6
        transition-all duration-300
    "
    >
    {/* Header */}
    <div className="flex items-center justify-between p-3 border-b">
        {mode ? (
        <button onClick={handleBackToMenu} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
        </button>
        ) : (
        <div />
        )}
        <h2 className="font-semibold text-gray-800 text-lg">FootyTrip AI</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <X size={20} />
        </button>
    </div>

    {/* Mode Selection */}
    {!mode && (
        <div className="flex flex-col items-center justify-center flex-1 p-4 space-y-3">
        <button
            onClick={() => handleModeSelect("prediction")}
            className="bg-blue-500 text-white w-full py-2 rounded-lg hover:bg-blue-600 text-sm sm:text-base"
        >
            Prediction Helper
        </button>
        <button
            onClick={() => handleModeSelect("analyzer")}
            className="bg-green-500 text-white w-full py-2 rounded-lg hover:bg-green-600 text-sm sm:text-base"
        >
            Analytics Assistant
        </button>
        <button
            onClick={() => handleModeSelect("personal_chat")}
            className="bg-purple-500 text-white w-full py-2 rounded-lg hover:bg-purple-600 text-sm sm:text-base"
        >
            Personal Chat
        </button>
        </div>
    )}

    {/* Chat Area */}
    {mode && (
        <>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
            <div
                key={i}
                className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
            >
                <div
                className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm sm:text-base ${
                    msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
                >
                {msg.text}
                </div>
            </div>
            ))}
            {loading && (
            <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-3 py-2 rounded-2xl text-sm">
                <Loader2 className="animate-spin" size={16} />
                <span>Thinking...</span>
                </div>
            </div>
            )}
        </div>

        {/* Input Area */}
        {mode !== "analyzer" && (
            <form
            onSubmit={(e) => {
                e.preventDefault();
                sendMessage(userInput);
            }}
            className="flex items-center border-t p-2"
            >
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border rounded-lg p-2 mr-2 text-sm sm:text-base"
            />
            <button
                type="submit"
                className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm sm:text-base"
                disabled={loading || !userInput.trim()}
            >
                Send
            </button>
            </form>
        )}
        </>
    )}
    </div>
  );
}
