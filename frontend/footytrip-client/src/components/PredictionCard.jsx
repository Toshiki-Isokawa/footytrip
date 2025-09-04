import { useEffect, useState } from "react";

const PredictionCard = ({ prediction }) => {
  const [logos, setLogos] = useState({}); // { teamId: logoUrl }
  const [results, setResults] = useState({}); // { matchId: actualResult }

  useEffect(() => {
    const fetchLogos = async () => {
      const newLogos = {};
      for (const match of prediction.matches) {
        const homeId = match.home_team.id;
        const awayId = match.away_team.id;

        if (!newLogos[homeId]) {
          const res = await fetch(`http://127.0.0.1:5000/api/logo?team_id=${homeId}`);
          const data = await res.json();
          newLogos[homeId] = data.logo_url;
        }

        if (!newLogos[awayId]) {
          const res = await fetch(`http://127.0.0.1:5000/api/logo?team_id=${awayId}`);
          const data = await res.json();
          newLogos[awayId] = data.logo_url;
        }
      }
      setLogos(newLogos);
    };

    fetchLogos();
  }, [prediction]);

  useEffect(() => {
    const fetchResults = async () => {
      if (prediction.status !== "scored") return;

      const newResults = {};
      for (const match of prediction.matches) {
        try {
          const res = await fetch(
            `http://127.0.0.1:5000/api/predictions/results?event_id=${match.match_id}`
          );
          const data = await res.json();
          if (data) {
            newResults[match.match_id] = data;
          }
        } catch (err) {
          newResults[match.match_id] = null;
        }
      }
      setResults(newResults);
    };

    fetchResults();
  }, [prediction]);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 w-full max-w-3xl mx-auto mb-6">
      <h2 className="text-xl font-bold text-center mb-4">
        Week {prediction.week} ({prediction.status})
      </h2>

      <div className="space-y-4">
        {prediction.matches.map((match) => {
          const actual = results[match.match_id];
          return (
            <div
              key={match.match_id}
              className="flex items-center justify-between border rounded-xl p-3"
            >
              {/* Home team */}
              <div className="flex items-center space-x-2 w-1/3">
                <img
                  src={logos[match.home_team.id]}
                  alt={match.home_team.name}
                  className="w-10 h-10 object-contain"
                />
                <span className="font-medium">{match.home_team.name}</span>
              </div>

              {/* Predicted vs Actual Scores */}
              <div className="flex flex-col items-center w-1/3">
                <span className="text-sm text-gray-500">Prediction</span>
                <span className="font-bold">
                  {match.score_home_prediction} - {match.score_away_prediction}
                </span>

                {prediction.status === "scored" && actual && (
                  <>
                    <span className="text-sm text-gray-500 mt-1">Actual</span>
                    <span className="font-bold text-green-600">
                      {actual.home_score} - {actual.away_score}
                    </span>
                  </>
                )}
              </div>

              {/* Away team */}
              <div className="flex items-center justify-end space-x-2 w-1/3">
                <span className="font-medium">{match.away_team.name}</span>
                <img
                  src={logos[match.away_team.id]}
                  alt={match.away_team.name}
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with points */}
      {prediction.status === "scored" && (
        <div className="text-center mt-4">
          <p className="font-semibold">
            Total Points:{" "}
            <span className="text-blue-600">{prediction.obtained_points}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default PredictionCard;
