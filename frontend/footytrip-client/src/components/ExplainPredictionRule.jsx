import React from "react";

const ExplainPredictionRule = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto rounded-xl shadow-lg p-6 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl font-bold"
          >
            ×
          </button>

          <h2 className="text-2xl font-bold mb-4 text-center">Prediction Rules</h2>
          <p className="mb-4">
            Here is how your weekly points are calculated for predictions:
          </p>

          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Correct match winner:</strong> +10 points if you correctly predict the winner of a match.
            </li>
            <li>
              <strong>Exact score:</strong> +50 points if you correctly predict both home and away scores.
            </li>
            <li>
              <strong>Total goals:</strong> +30 points if you correctly predict the total number of goals.
            </li>
            <li>
              <strong>Red card prediction:</strong> +20 points if you correctly predict whether a red card occurs in the match.
            </li>
          </ul>

          <p className="mt-4">
            <strong>Bonus:</strong> If you predicted exactly 3 matches and all predictions are correct, you earn an additional <span className="text-blue-600 font-semibold">100 points</span>.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Points are calculated weekly for all locked predictions.
          </p>
        </div>
      </div>
    </>
  );
};

export default ExplainPredictionRule;
