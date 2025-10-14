import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import ChatWindow from "./ChatWindow";
import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function ChatWidget() {
  const { token } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close chat automatically on page navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window or Login Prompt */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 sm:w-96 z-50">
          {token ? (
            <ChatWindow onClose={() => setIsOpen(false)} />
          ) : (
            <div className="bg-white border rounded-2xl shadow-lg p-4">
              <p className="text-gray-700 mb-3">
                Please log in to start a conversation with me!
              </p>
              <button
                onClick={() => (window.location.href = "/login")}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all w-full"
              >
                Go to Login Page
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
