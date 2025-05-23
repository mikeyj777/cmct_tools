import os
import sys
import math
import json
import pickle
import asyncio
import pandas as pd
from functools import reduce
from flask import request, jsonify

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))



from utils.json_data_loader import get_json_file_path
from utils.log_output import log_to_file

from pypws.calculations import DispersionCalculation, VesselLeakCalculation, JetFireCalculation, RadiationTransectCalculation
from pypws.entities import FlammableParameters, FlammableOutputConfig, Transect, LocalPosition
from pypws.enums import ContourType, ResultCode

from py_lopa.model_interface import Model_Interface
from py_lopa.classes.vce import VCE

import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

async def flammable_envelope(path_to_json_file=None):

    m_io = Model_Interface()
    data=None
    if path_to_json_file is None:
        data = request.get_json()
        m_io.set_inputs_from_json(json_data=json.dumps(data))
    else:
        m_io.set_inputs_from_json(path_to_json_file=path_to_json_file)
    logging.debug(f'in flammable env method.  data to be modeled in py_lopa:  {data}')
    m_io.inputs['vapor_cloud_explosion'] = True
    # m_io.inputs['log_handler'] = log_to_file
    
    
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
        max_dist_m = int(resp['maximum_downwind_extent'])
        flash_data = resp['flash_data']

        logging.debug(f'data successful.  first few records:  {recs[:min(5, len(recs))]}')

        ans = {
            'flam_env_data':{
                'flammable_envelope_list_of_dicts' : recs,
                'maximum_downwind_extent' : max_dist_m,
                'flash_data' : flash_data,
            }}

        if path_to_json_file is not None:
            return ans

        return jsonify(ans), 200

    except Exception as e:
        logging.debug(f'exception caused from vce endpoint.  error info: {e}')
        return jsonify({'error': 'Internal Server Error'}), 500

def flammable_mass():
    data = request.get_json()
    x_min = data['xMin']
    x_max = data['xMax']
    y_min = data['yMin']
    y_max = data['yMax']
    z_min = data['zMin']
    z_max = data['zMax']
    flammable_envelope_list_of_dicts = data['flammable_envelope_list_of_dicts']
    flash_data = data['flash_data']
    stoich_mol_o2_to_mol_fuel = data['stoich_mol_o2_to_mol_fuel']

    vce = VCE()
    try:
        resp = vce.get_flammable_mass(x_min, x_max, y_min, y_max, z_min, z_max, flammable_envelope_list_of_dicts = flammable_envelope_list_of_dicts, cv = None, stoich_moles_o2_to_fuel = stoich_mol_o2_to_mol_fuel, flash_data = flash_data)
        return jsonify({'flammable_mass_g':resp['flammable_mass_g']}), 200
    except Exception as e:
        logging.debug(f'exception caused from flammable mass endpoint.  error info: {e}')
        return jsonify({'error': 'Internal Server Error'}), 500

def vce_overpressure_results():
    data = request.get_json()
    flash_data = data['flash_data']
    buildings = data['buildings']
    congested_volumes = data['volumes']
    # logging.debug(f"*** data: {data}\n\n\n*** flash data: {flash_data}\n\n\n***buidings: {buildings}\n\n\n***congested volumes: {congested_volumes}")
    vce = VCE(logging=logging)
    
    try:
        updated_buildings = vce.get_blast_overpressures_at_buildings_from_congested_volumes_store_highest_pressure_at_each_building_return_updated_buildings(buildings=buildings, congested_volumes=congested_volumes, flash_data=flash_data)
        return jsonify({'updatedBuildings':updated_buildings}), 200
    except Exception as e:
        logging.debug(f'exception caused from building overpressure calculation.  error info: {e}')
        return jsonify({'error': 'Internal Server Error'}), 500

def pv_burst_results(path_to_json_file=None):

    m_io = Model_Interface()
    data=None
    if path_to_json_file is None:
        data = request.get_json()
        m_io.set_inputs_from_json(json_data=json.dumps(data))
    else:
        m_io.set_inputs_from_json(path_to_json_file=path_to_json_file)
    logging.debug(f'in flammable env method.  data to be modeled in py_lopa:  {data}')
    m_io.inputs['vapor_cloud_explosion'] = False
    m_io.inputs['pv_burst'] = True
    m_io.inputs['catastrophic_vessel_failure'] = True
    m_io.inputs['inhalation'] = False

    try:
        res = m_io.run()
        if res != ResultCode.SUCCESS:
            logging.debug(f'Pv Burst model model did not complete successfully.  Result Code:  {res.name}')
            return jsonify({'error': 'Internal Server Error'}), 500
        bldgs = []

        for bldg in m_io.mc.mi.bldgs:
            bldgs.append({
                'name': bldg.num,
                'occupancy': bldg.occupancy,
                'dist_m': bldg.dist_m,
                'pv_burst_overpressure_psi': bldg.pv_burst_overpressure_psi,
            })

        logging.debug(f'pv burst data successful.  bldg results:  {bldgs}')

        ans = {'bldgs': bldgs}

        if path_to_json_file is not None:
            return ans

        return jsonify(ans), 200

    except Exception as e:
        logging.debug(f"error with calcuating pv burst consequence: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500

def main():
    path = get_json_file_path()
    bldg_data_w_pv_burst_impact = asyncio.run(pv_burst_results(path_to_json_file = path))
    apple = 1

if __name__ == '__main__':
    main()

    