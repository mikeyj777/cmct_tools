import os
import sys
import math
import json
import pickle
import asyncio
import pandas as pd
from functools import reduce

from flask import request, jsonify

from pypws.calculations import DispersionCalculation, VesselLeakCalculation, JetFireCalculation, RadiationTransectCalculation
from pypws.entities import FlammableParameters, FlammableOutputConfig, Transect, LocalPosition
from pypws.enums import ContourType, ResultCode

from py_lopa.model_interface import Model_Interface
from py_lopa.classes.vce import VCE

import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

async def flammable_envelope():

    data = request.get_json()
    m_io = Model_Interface()
    logging.debug(f'in flammable env method.  data to be modeled in py_lopa:  {data}')
    m_io.set_inputs_from_json(json_data=json.dumps(data))
    m_io.inputs['vapor_cloud_explosion'] = True
    
    try:
        res = m_io.run()
        if res != ResultCode.SUCCESS:
            logging.debug(f'VCE model for flammable envelope model did not complete successfully.  Result Code:  {res.name}')
            return jsonify({'error': 'Internal Server Error'}), 500
        resp = m_io.vce_data

        # return {
        #     'flammable_envelope_list_of_dicts': self.flammable_envelope_list_of_dicts,
        #     'maximum_downwind_extent': self.max_dw_extent,
        # }

        recs = resp['flammable_envelope_list_of_dicts']

        logging.debug(f'data successful.  first few records:  {recs[:min(5, len(recs))]}')

        return jsonify({'flam_env_data':resp}), 200

    except Exception as e:
        logging.debug(f'exception caused from radiation_analysis endpoint.  error info: {e}')
        return jsonify({'error': 'Internal Server Error'}), 500

def flammable_mass():
    data = request.get_json()
    vce = VCE()
    try:
        resp = vce.get_flammable_mass(data)
        return jsonify({'flammable_mass_g':resp['flammable_mass_g']}), 200
    except Exception as e:
        logging.debug(f'exception caused from flammable mass endpoint.  error info: {e}')
        return jsonify({'error': 'Internal Server Error'}), 500

