import { useNavigate } from "react-router-dom";

const MatchPreview = ({ home, away, date, stadium, homeLogo, awayLogo, clickable = false, onClick }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (clickable) {
      if (onClick) {
        onClick();
      } else {
        navigate(`/prediction`);
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-16">
        <div className={`max-w-2xl mx-auto bg-white shadow-md rounded-xl p-6 my-6 text-center ${
        clickable ? "cursor-pointer hover:bg-gray-50" : ""
      }`} 
      onClick={handleClick}>
            {/* Responsive team layout */}
            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6 mb-4">
                {/* Home team */}
                <div className="flex items-center space-x-2">
                <img src={homeLogo} alt="Home" className="w-8 h-8" />
                <span className="text-md font-semibold text-gray-700">{home}</span>
                </div>

                {/* VS */}
                <div className="text-gray-500 font-medium">vs</div>

                {/* Away team */}
                <div className="flex items-center space-x-2 md:space-x-2 md:space-x-reverse md:flex-row-reverse">
                <img src={awayLogo} alt="Away" className="w-8 h-8" />
                <span className="text-md font-semibold text-gray-700">{away}</span>
                </div>
            </div>

            <p className="text-sm text-gray-600">{stadium}</p>
            <p className="text-sm text-gray-500">{date}</p>
        </div>
    </div>
  );
};

export default MatchPreview;

