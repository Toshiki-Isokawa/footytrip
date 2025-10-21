import { useNavigate } from "react-router-dom";

const TopPredictor = ({ userId, name, profileIcon, point, favTeam, favPlayer, clickable = false, onClick }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (clickable) {
      if (onClick) {
        onClick();
      } else {
        navigate(`/footy/${userId}`);
      }
    }
  };

  return (
    <div
      className={`mx-4 md:mx-12 bg-white shadow-md rounded-xl p-4 flex items-center space-x-4 my-4 ${
        clickable ? "cursor-pointer hover:bg-gray-50" : ""
      }`}
      onClick={handleClick}
    >
      <img
        src={`${process.env.REACT_APP_API_BASE_URL}/static/uploads/profiles/${profileIcon}`}
        alt={name}
        className="w-14 h-14 rounded-full object-cover border border-gray-300"
      />
      <div className="flex-1">
        <h4 className="text-md font-semibold text-gray-800">{name}</h4>
        <p className="text-sm text-gray-500">Favorite Team: {favTeam}</p>
        <p className="text-sm text-gray-500">Favorite Player: {favPlayer}</p>
      </div>
      <div className="text-sm text-right">
        <p className="text-blue-600 font-semibold">{point}</p>
        <p className="text-xs text-gray-400">Points</p>
      </div>
    </div>
  );
};

export default TopPredictor;
