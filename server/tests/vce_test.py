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
from py_lopa.calcs import helpers
from py_lopa.classes.vce import VCE

flash_data = helpers.load_pickled_object('tests/test_data/flash_data_93_mol_pct_h2_7_mol_pct_co.pickle')

vce = VCE()

# get_flammable_mass(self, x_min = None, x_max = None, y_min = None, y_max = None, z_min = None, z_max = None, flammable_envelope_list_of_dicts = None, cv = None, stoich_moles_o2_to_fuel = None, flash_data = None)

flam_mass_dict = vce.get_flammable_mass_from_stoich(x_min = -0.09805405840640749, x_max = 12.501945941593592, y_min = -2.243769042102659, y_max = 10.35623095789734, z_min = 0,  z_max = 12.6, stoich_moles_o2_to_fuel = 0.507, flash_data = flash_data)

apple = 1
