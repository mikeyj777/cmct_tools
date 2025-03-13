from flask import Flask, jsonify
from flask_cors import CORS

from controllers.rad_analysis_controller import radiation_analysis
from controllers.vce_analysis_controller import flammable_envelope, flammable_mass, updated_buildings_with_overpressure

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

@app.route('/api/vce_get_flammable_envelope', methods=['POST'])
async def vce_flammable_envelope_route():
    logging.debug("flammable envelope.")
    return await flammable_envelope()

@app.route('/api/vce_get_flammable_mass', methods=['POST'])
def vce_flammable_mass_route():
    logging.debug("flammable mass.")
    return flammable_mass()

@app.route('/api/vce_get_building_overpressure_results', methods=['POST'])
def vce_building_overpressures_route():
    logging.debug("building overpressure.")
    return updated_buildings_with_overpressure()
