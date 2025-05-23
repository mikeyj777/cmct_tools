from flask import Flask, jsonify
from flask_cors import CORS

from controllers.rad_analysis_controller import radiation_analysis
from controllers.blast_analysis_controller import flammable_envelope, flammable_mass, vce_overpressure_results, pv_burst_results

import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# cors
app = Flask(__name__)
CORS(app, resources={
    r"/*": {  # This specifically matches your API routes
        "origins": ["http://localhost:3000", "http://WSSAFER02:8082", "http://localhost:8082", "http://WSSAFER02"],
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

@app.route('/api/vce_get_overpressure_results', methods=['POST'])
def vce_overpressure_route():
    logging.debug("vce flask app.")
    return vce_overpressure_results()

@app.route('/api/get_pv_burst_results', methods=['POST'])
async def pv_burst_overpressure_route():
    logging.debug("pv burst")
    return pv_burst_results()

