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

from py_lopa.calcs import helpers
from py_lopa.phast_io.phast_dispersion import Phast_Dispersion
from py_lopa.phast_io.phast_prep import prep_weather, prep_substrate
from py_lopa.calcs.consts import Wx_Enum
from py_lopa.model_interface import Model_Interface

from utils.cache_handling import get_cache, store_cache

import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def run_py_lopa_get_vlc(py_lopa_inputs):
    m_io = Model_Interface()
    m_io.set_inputs_from_json(json_data=json.dumps(py_lopa_inputs))
    m_io.inputs['get_phast_discharge_only'] = True
    res = m_io.run()
    if res != ResultCode.SUCCESS:
        return None
    p_disch_dict = m_io.phast_discharge
    max_duration = -1
    p_disch = None
    for k, v in p_disch_dict.items():
        if k > max_duration:
            p_disch = v
    vlc = p_disch.vesselLeakCalculation

    return vlc
    

def load_vlc():
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'vlc.pickle')
    vlc:VesselLeakCalculation
    with open(file_path, 'rb') as f:
        vlc = pickle.load(f)
    return vlc

def run_jet_fire_calc(vlc, stack_height_m, ws_mph = 3.3554):
    material = vlc.exit_material
    discharge_records = vlc.discharge_records
    discharge_record_count = 0
    if discharge_records is not None:
        discharge_record_count = len(discharge_records)
    discharge_result = vlc.discharge_result
    discharge_result.height = stack_height_m
    weather = prep_weather() # defaults to nighttime stable wx condition
    
    weather.wind_speed = ws_mph * 1.5 / 3.3554

    substrate = prep_substrate() # defaults to concrete with no containment
    flammable_parameters = FlammableParameters()

    jetFireCalc = JetFireCalculation(
        material=material, 
        discharge_records=discharge_records, 
        discharge_record_count=discharge_record_count, 
        discharge_result=discharge_result, 
        weather=weather, 
        substrate=substrate, 
        flammable_parameters=flammable_parameters
    )

    res:ResultCode = jetFireCalc.run()

    if res != ResultCode.SUCCESS:
        logging.debug(f'Jet fire calc failed.  response code: {res.name}\nresponses:  {jetFireCalc.messages}')

    return jetFireCalc

def prep_flammable_output_config(flare_position, start_position, final_position):
    #flam output config inputs:  
        # position: Optional[LocalPosition]=LocalPosition(), 
        # radiation_type: Optional[RadiationType]=RadiationType.INTENSITY,
        # contour_type: Optional[ContourType]=ContourType.FOOTPRINT_ELLIPSE, 
        # radiation_level: Optional[float]=4000, 
        # radiation_resolution: Optional[Resolution]=Resolution.MEDIUM, 
        # transect: Optional[Transect]=Transect(), 
        # fixed_orientation: Optional[int]=0, 
        # orientation: Optional[float]=0, 
        # fixed_inclination: Optional[int]=0, 
        # inclination: Optional[float]=0
    
    flam_output_config = FlammableOutputConfig()
    flam_output_config.position = flare_position
    flam_output_config.contour_type = ContourType.SIDEVIEW
    # 2 kW/m2 is current target for analysis.  I'm not sure how this works with the transect, which is at a specific distance.  Going to try with None to see if it can report along transect alone.
    flam_output_config.radiation_level = None
    transect = Transect(transect_start_point=start_position, transect_end_point=final_position)
    flam_output_config.transect = transect

    return flam_output_config

async def run_radiation_transect(jetFireCalc, flam_output_config):
    flame_result = jetFireCalc.flame_result
    flame_records = jetFireCalc.flame_records
    flame_record_count = 0
    if flame_records is not None:
        flame_record_count = len(flame_records)
    weather = jetFireCalc.weather
    flammable_parameters = jetFireCalc.flammable_parameters

    radiation_transect = RadiationTransectCalculation(
        flame_result=flame_result, 
        flame_records=flame_records, 
        flame_record_count=flame_record_count, 
        weather=weather, 
        flammable_parameters=flammable_parameters, 
        flammable_output_config=flam_output_config)

    res = await asyncio.to_thread(radiation_transect.run)

    if res != ResultCode.SUCCESS:
        logging.debug(f'Radiation transect calc failed.  response code: {res.name}\nresponses:  {radiation_transect.messages}')
    return radiation_transect

def reducer(acc = [], item= None):
    acc.append({
        'x': item.position.x,
        'y': item.position.y,
        'z': item.position.z,
        'rad_level_w_m2': item.radiation_result
    })
    return acc

apple = 1

async def radiation_analysis():

    data = request.get_json()
    py_lopa_inputs = data['py_lopa_inputs']
    cache_ready = False
    if 'cache' in data:
        cache = data['cache']
        ready_1 = False
        ready_2 = False
        if 'json_file_name' in cache:
            json_file_name = cache['json_file_name']
            ready_1 = json_file_name is not None
        if 'case_num' in cache:
            case_num = cache['case_num']
            ready_2 = case_num is not None
        cache_ready = ready_1 and ready_2
        
    coords_and_met = data['coordsAndMet']
    ws_mph = coords_and_met['windSpeedMph']
    x_flare_m = float(coords_and_met.get('xFlare', 45)) / 3.28084
    y_flare_m = float(coords_and_met.get('yFlare', 0)) / 3.28084
    z_flare_m = float(coords_and_met.get('zFlare', 50)) / 3.28084
    flare_position = LocalPosition(x = x_flare_m, y = y_flare_m, z = z_flare_m)

    transect_start_x_m = float(coords_and_met.get('xTransectStart', 0)) / 3.28084
    transect_start_y_m = float(coords_and_met.get('yTransectStart', 0)) / 3.28084
    transect_start_z_m = float(coords_and_met.get('zTransectStart', 0)) / 3.28084
    transect_start_pos = LocalPosition(x=transect_start_x_m, y=transect_start_y_m, z=transect_start_z_m)

    transect_final_x_m = float(coords_and_met.get('xTransectFinal', 0)) / 3.28084
    transect_final_y_m = float(coords_and_met.get('yTransectFinal', 0)) / 3.28084
    transect_final_z_m = float(coords_and_met.get('zTransectFinal', 200)) / 3.28084
    transect_final_pos = LocalPosition(x=transect_final_x_m, y=transect_final_y_m, z=transect_final_z_m)
    
    try:
        vlc = None
        if cache_ready:
            vlc = get_cache(json_file_name=json_file_name, case_num=case_num)
        if vlc is None:
            vlc = run_py_lopa_get_vlc(py_lopa_inputs)
        jetFireCalc = run_jet_fire_calc(vlc, stack_height_m=z_flare_m, ws_mph = ws_mph)
        if cache_ready:
            store_cache(vlc=vlc, json_file_name=json_file_name, case_num=case_num)
        # pipe racks have heights between 7 m (23 ft) and 13 m (43 ft)
        flammable_output_config = prep_flammable_output_config(flare_position=flare_position, start_position=transect_start_pos, final_position=transect_final_pos)

        radiation_transect = await run_radiation_transect(jetFireCalc=jetFireCalc, flam_output_config=flammable_output_config)
        rad_recs = radiation_transect.radiation_records
        rad_list_of_dicts = reduce(reducer, rad_recs, [])
        
        return jsonify({'rad_data':rad_list_of_dicts}), 200

    except Exception as e:
        logging.debug(f'exception caused from radiation_analysis endpoint.  error info: {e}')
        return jsonify({'error': 'Internal Server Error'}), 500
