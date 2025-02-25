from flask import Flask, jsonify
from flask_cors import CORS

from controllers.pypws_controller import radiation_analysis

import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# cors
app = Flask(__name__)
CORS(app, resources={
    r"/*": {  # This specifically matches your API routes
        "origins": ["http://localhost:3000", "http://WSSAFER02:8082", "http://localhost:8082", "http://localhost:8082/rad"],
        "methods": ["GET", "POST", "OPTIONS"],  # Explicitly allow methods
        "allow_headers": ["Content-Type"]  # Allow common headers
    }
})

# endpoint - need radiation analysis
@app.route('/api/radiation_analysis', methods=['POST'])
async def rad_route():
    logging.debug("here on the back end.")
    return await radiation_analysis()