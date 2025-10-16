"""from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
"""

import logging
import sys
from app import create_app

# Configure logging to stdout so Render can capture it
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
logger = logging.getLogger(__name__)

try:
    logger.info("Starting Flask app...")
    app = create_app()
    logger.info("Flask app created successfully")
except Exception as e:
    logger.exception("Failed to create Flask app")
    # Exit so Gunicorn knows the process failed
    sys.exit(1)

if __name__ == "__main__":
    # Use debug=True only for local testing
    logger.info("Running Flask app locally...")
    app.run(debug=True, host="0.0.0.0", port=5000)
