# helpers/prompt_builder.py
from flask import current_app
import json
from routes.prediction import fetch_available_matches, fetch_all_predictions_by_user, overall_leaderboard
from routes.footy import fetch_user_detail
from datetime import datetime

def build_prediction_prompt(user_id, user_message):
    """
    Build a personalized AI prompt for the Prediction Helper.
    Includes user's profile, prediction history, available matches, and their message.
    """

    # Get user detail
    user_info = fetch_user_detail(user_id)
    user_name = user_info["name"]
    fav_team = user_info["fav_team"]
    fav_player = user_info["fav_player"]
    points = user_info["point"]

    # Get available matches for this week
    matches = fetch_available_matches()

    try:
        history = fetch_all_predictions_by_user(user_id)
    except Exception:
        history = []

    # Format the context data neatly
    match_summary = "\n".join(
        [f"- {m['home_team']} vs {m['away_team']} on {m['kickoff_time']}" for m in matches]
    ) if matches else "No upcoming matches found."

    if history:
        for h in history:
            print("DEBUG: prediction history item =", h)
        history_summary = "\n".join(
            [
                f"- {h.get('match', 'Unknown Match')} → You predicted {h.get('predicted_result', 'N/A')} (Actual: {h.get('actual_result', 'N/A')})"
                for h in history
            ]
        )
    else:
        history_summary = "No prediction history found."

    prompt = f"""
    You are an AI Football Prediction Assistant for the web app "FootyTrip".
    Your task is to help the user make reasonable predictions based on upcoming matches.

    User details:
    - Name: {user_name}
    - Favorite Team: {fav_team}
    - Favorite Player: {fav_player}
    - Total Points: {points}

    Current date: {datetime.utcnow().strftime('%Y-%m-%d')}
    Upcoming Matches:
    {match_summary}

    User's Prediction History:
    {history_summary}

    User's Request:
    "{user_message}"

    Based on all of the above, please:
    - Mainly answer to the user's request.
    - Explain your reasoning briefly.
    - Keep your tone friendly and insightful.
    """
    return prompt

def build_analyzer_prompt(user_id):
    """
    Builds a detailed performance analysis prompt comparing
    the user's prediction history with the top leaderboard users.
    """

    # Get User Info
    user_info = fetch_user_detail(user_id)

    user_history = fetch_all_predictions_by_user(user_id)

    # Get leaderboard data
    leaderboard_resp, _ = overall_leaderboard()
    leaderboard = leaderboard_resp.get_json() if hasattr(leaderboard_resp, "get_json") else leaderboard_resp

    # Fetch each leaderboard user’s prediction history
    leaderboard_histories = []
    for lb_user in leaderboard:
        lb_user_id = lb_user["user_id"]
        lb_history = fetch_all_predictions_by_user(lb_user_id)
        leaderboard_histories.append({
            "user": lb_user,
            "history": lb_history
        })

    # Construct a structured and human-readable summary for the AI
    prompt = f"""
You are an expert football analytics assistant for the app "FootyTrip".

Your task is to **analyze and compare** the performance of a specific user and top leaderboard players.

Here is the detailed context:

---
### USER INFORMATION
{json.dumps(user_info, indent=2)}

---
### USER PREDICTION HISTORY
Below are all predictions made by the user. Each includes weekly matches, predicted scores, and obtained points (if scored).
{json.dumps(user_history, indent=2)}

---
### LEADERBOARD TOP 10 USERS
Each includes user info and all their prediction histories.
{json.dumps(leaderboard_histories, indent=2)}

---
### YOUR TASK:
1. Evaluate this user's prediction accuracy and consistency.
2. Compare their tendencies (such as bias toward certain teams or outcomes) against top players.
3. Identify where this user can improve (e.g., overestimation, weak areas like red cards or total goals).
4. Provide a short professional summary (2-3 paragraphs max) with actionable insights.
5. Optionally, rank this user's performance compared to the leaderboard.

Write your analysis in an engaging, coach-like tone.
"""

    return prompt


def build_personal_chat_prompt(user_id, user_message):
    """
    Builds a personalized AI prompt for general football chat.
    Includes user profile info to make responses more relevant and personal.
    """

    # Get user details
    user_info = fetch_user_detail(user_id)

    prompt = f"""
You are a friendly and knowledgeable football assistant for the app "FootyTrip".

Below is the profile of the user you're chatting with:
{json.dumps(user_info, indent=2)}

The user has sent the following message:
"{user_message}"

Your task:
1. Reply conversationally and naturally, as if chatting with a football fan.
2. Make your answer insightful, accurate, and engaging.
3. Reference the user's favorite team or player where appropriate to make it more personal.
4. Keep your tone friendly and enthusiastic — you are their football buddy!

Now, write your answer below:
"""

    return prompt