# helpers/ai_client.py
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_ai_response(prompt):
    """
    Send a prompt to the OpenAI API and return the assistant's reply.
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert football prediction assistant who analyzes football data, statistics, and trends to make insightful predictions."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=800,
    )
    return response.choices[0].message.content.strip()
