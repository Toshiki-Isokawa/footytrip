import { Link } from "react-router-dom";

const Welcome = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-50 text-center px-4">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Welcome to FootyTrip</h1>
      <p className="mb-6 text-gray-700">Plan your football adventures around the world!</p>
      <div className="flex gap-4">
        <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded">
          Log In
        </Link>
        <Link to="/register" className="bg-green-500 text-white px-4 py-2 rounded">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Welcome;
