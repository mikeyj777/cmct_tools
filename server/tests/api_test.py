import os
import sys
import requests
import json
import asyncio
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from utils.json_data_loader import get_json_data_from_file

from py_lopa.model_interface import Model_Interface

# Base URL of your Flask API
BASE_URL = "http://WSSAFER02:8090" # Change this to match your Flask server

def test_radiation_analysis():
    endpoint = f"{BASE_URL}/api/radiation_analysis"

    # Sample request data - replace with your actual data structure
    payload = {
    # Add your test data here
    "source_term": "example",
    "parameters": {}
    }

    try:
        response = requests.post(endpoint, json=payload)
        logger.info(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            logger.info("Radiation Analysis - Success")
            logger.info(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            logger.error(f"Radiation Analysis - Failed: {response.text}")

    except Exception as e:
        logger.error(f"Error in radiation analysis test: {str(e)}")

def test_flammable_envelope():
    endpoint = f"{BASE_URL}/api/vce_get_flammable_envelope"

    json_data = get_json_data_from_file()

    try:
        response = requests.post(endpoint, json=json_data)
        logger.debug(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            logger.debug("Flammable Envelope - Success")
            logger.debug(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            logger.error(f"Flammable Envelope - Failed: {response.text}")

    except Exception as e:
        logger.error(f"Error in flammable envelope test: {str(e)}")

def test_flammable_mass():

    flammable_envelope_list_of_dicts = [{'x': 689.4546768540164, 'y': 0.0, 'z': 0.0, 'conc_ppm': 49997.58938945453, 'conc_g_m3': 32.80715927080537}, {'x': 689.4546768540164, 'y': 0.0, 'z': 0.0, 'conc_ppm': 49997.58938945453, 'conc_g_m3': 32.80715927080537}, {'x': 689.1739279681154, 'y': 6.142869020910783, 'z': 0.0, 'conc_ppm': 49997.58938945453, 'conc_g_m3': 32.80715927080537}, {'x': 688.8524989959814, 'y': 17.8112993705708, 'z': 0.0, 'conc_ppm': 49997.58938945453, 'conc_g_m3': 32.80715927080537}, {'x': 688.569033894889, 'y': 23.991181216829194, 'z': 0.0, 'conc_ppm': 49997.58938945453, 'conc_g_m3': 32.80715927080537}]
    data = {
        'xMin': -100,
        'xMax': 100,
        'yMin': -100,
        'yMax': 100,
        'zMin': -100,
        'zMax': 100,
        'flammable_envelope_list_of_dicts': flammable_envelope_list_of_dicts,
    }

    endpoint = f"{BASE_URL}/api/vce_get_flammable_mass"

    try:
        response = requests.post(endpoint, json=data)
        logger.info(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            logger.info("Flammable Mass - Success")
            logger.info(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            logger.error(f"Flammable Mass - Failed: {response.text}")

    except Exception as e:
        logger.error(f"Error in flammable mass test: {str(e)}")

def test_building_overpressure():

    endpoint = f"{BASE_URL}/api/vce_get_building_overpressure_results"

    # Sample request data - replace with your actual data structure
    payload = {
        # Add your test data here
        "buildings": [],
        "parameters": {}
    }

    try:
        response = requests.post(endpoint, json=payload)
        logger.info(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            logger.info("Building Overpressure - Success")
            logger.info(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            logger.error(f"Building Overpressure - Failed: {response.text}")

    except Exception as e:
        logger.error(f"Error in building overpressure test: {str(e)}")

# Run all tests
def run_all_tests():
    logger.info("Starting API Tests")

    test_radiation_analysis()
    test_flammable_envelope()
    test_flammable_mass()
    test_building_overpressure()

    logger.info("Completed API Tests")

if __name__ == "__main__":
    test_flammable_envelope()