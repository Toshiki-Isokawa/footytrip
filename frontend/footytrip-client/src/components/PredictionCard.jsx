import { useEffect, useState } from "react";

const PredictionCard = ({ prediction }) => {
  const [logos, setLogos] = useState({}); // { teamId: logoUrl }

  useEffect(() => {
    const fetchLogos = async () => {
      const newLogos = {};
      for (const match of prediction.matches) {
        const homeId = match.home_team.id;
        const awayId = match.away_team.id;

        if (!newLogos[homeId]) {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/logo?team_id=${homeId}`);
          const data = await res.json();
          newLogos[homeId] = data.logo_url;
        }

        if (!newLogos[awayId]) {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/logo?team_id=${awayId}`);
          const data = await res.json();
          newLogos[awayId] = data.logo_url;
        }
      }
      setLogos(newLogos);
    };

    fetchLogos();
  }, [prediction]);

  return (
    <div className="bg-white shadow-md rounded-2xl p-2 sm:p-4 w-full max-w-3xl mx-auto mb-6">
      <h2 className="text-lg sm:text-xl font-bold text-center mb-4">
        Week {prediction.week} ({prediction.status})
      </h2>

      <div className="space-y-4">
        {prediction.matches.map((match) => {
          return (
            <div
              key={match.match_id}
              className="flex flex-col md:flex-row items-center justify-between border rounded-xl p-3 space-y-2 md:space-y-0"
            >
              {/* Home team */}
              <div className="flex items-center space-x-2 w-full md:w-1/3 justify-center md:justify-start">
                <img
                  src={logos[match.home_team.id]}
                  alt={match.home_team.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
                <span className="font-medium text-sm sm:text-base">
                  {match.home_team.name}
                </span>
              </div>

              {/* Predicted vs Actual Scores */}
              <div className="flex flex-col items-center w-full md:w-1/3">
                <span className="text-xs sm:text-sm text-gray-500">Prediction</span>
                <span className="font-bold text-base sm:text-lg">
                  {match.score_home_prediction} - {match.score_away_prediction}
                </span>

                {prediction.status === "scored" && (
                  <>
                    <span className="text-xs sm:text-sm text-gray-500 mt-1">Actual</span>
                    <span className="font-bold text-green-600 text-base sm:text-lg">
                      {match.score_home_actual} - {match.score_away_actual}
                    </span>
                  </>
                )}
              </div>

              {/* Away team */}
              <div className="flex items-center space-x-2 w-full md:w-1/3 justify-center md:justify-end">
                <img
                  src={logos[match.away_team.id]}
                  alt={match.away_team.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
                <span className="font-medium text-sm sm:text-base">{match.away_team.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with points */}
      {prediction.status === "scored" && (
        <div className="text-center mt-4">
          <p className="font-semibold text-sm sm:text-base">
            Total Points:{" "}
            <span className="text-blue-600">{prediction.obtained_points}</span>
          </p>
        </div>
      )}
    </div>
  );

};

export default PredictionCard;
