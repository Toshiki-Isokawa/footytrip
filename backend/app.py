from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for React

@app.route("/")
def hello():
    return jsonify({"message": "FootyTrip Flask backend is running!"})

if __name__ == "__main__":
    app.run(debug=True)
