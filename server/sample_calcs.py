import os
import math
import json
import numpy as np
import pandas as pd
from random import randint
import datetime
from datetime import datetime as dt
import logging

from pypws.entities import ResultCode

from py_lopa.model_interface import Model_Interface
from py_lopa.data.tests_enum import Tests_Enum
from py_lopa.data.tables import Tables
from py_lopa.calcs import helpers
from py_lopa.calcs.consts import Consts
from py_lopa.calcs.thermo_pio import nbp_deg_K
from py_lopa.kml_processing.kml_generator import Kml_Generator
from py_lopa.calcs.get_phys_props import Get_Phys_Props

cd = Consts().CONSEQUENCE_DATA

google_earth_flag = False

def run_gpp(m_io):

    # chem_mix, chem_composition, molar_basis, temp_C, press_psig
    
    # self.inputs['chemical_mix'] = chemical_mix
    # self.inputs['composition'] = composition
    # self.inputs['comp_is_moles'] = comp_is_moles
    # self.inputs['max_hole_size_in'] = max_hole_size_in
    # self.inputs['pressure_psig'] = pressure_psig
    # self.inputs['temp_deg_c'] = temp_deg_c
    
    chem_mix = m_io.inputs['chemical_mix']
    chem_composition = m_io.inputs['composition']
    molar_basis = m_io.inputs['comp_is_moles']
    temp_C = m_io.inputs['temp_deg_c']
    press_psig = m_io.inputs['pressure_psig']

    gpp = Get_Phys_Props(chem_mix=chem_mix, chem_composition=chem_composition, molar_basis=molar_basis, temp_C=temp_C, press_psig=press_psig)
    gpp.run()

    print(gpp.data)


def get_model_interface_to_test(test):
    m_io = Model_Interface()

    if test == Tests_Enum.SMALL_CATASTROPHIC_RELEASE_CL2:
        m_io.set_inputs_as_arguments(
            catastrophic_vessel_failure=True,
            storage_volume_m3=9,
            bldg_nums_low_med_high = ['18', '215', '54D'],
            bldg_dists_low_med_high = [7, 10, 20],
            bldg_hts_low_med_high = [0, 0, 0],
            bldg_ach_low_med_high = [10,10, 10],
            chemical_mix = ['chlorine'],
            composition = [1],
        )

    if test == Tests_Enum.CATASTROPHIC_RELEASE_NH3:
        m_io.set_inputs_as_arguments(
            catastrophic_vessel_failure=True,
            storage_volume_m3=90,
            bldg_nums_low_med_high = ['18', '215', '54D'],
            bldg_dists_low_med_high = [70, 160, 250],
            bldg_hts_low_med_high = [9, 5, 8],
            bldg_ach_low_med_high = [10,10, 10],
        )

    if test == Tests_Enum.LARGE_CONTINUOUS_NH3:
        m_io.set_inputs_as_arguments(
            max_hole_size_in = 3,
            storage_volume_m3 = 50000,
            release_elevation_m = 0,
        )

    if test == Tests_Enum.ELEVATED_VAPOR_RELIEF_NH3:
        m_io.set_inputs_as_arguments(
            max_hole_size_in = 3, 
            pressure_psig = 130, 
            temp_deg_c = 25, 
            release_elevation_m = 10, 
            storage_volume_m3 = 50000, 
            release_angle_degrees_from_horizontal = 90
        )

    if test == Tests_Enum.FLAM_AND_TOX_MIXTURE_BENZENE_AMMONIA:
        m_io.set_inputs_as_arguments(
            chemical_mix = 'benzene|ammonia', 
            composition = '30|70', 
            comp_is_moles = True, 
            max_hole_size_in = 6, 
            pressure_psig = 50,
            temp_deg_c = 25, 
            release_elevation_m = 3, 
            bldg_dists_low_med_high = '10|20|30', 
            bldg_hts_low_med_high = '5|10|15', 
            offsite_dist_m = 200, 
            relief_phase = 'let model decide', 
            storage_volume_m3 = 500, 
            release_angle_degrees_from_horizontal = 0
        )

    if test == Tests_Enum.LARGE_CONTINUOUS_RELEASE_CL2:
        m_io.set_inputs_as_arguments(
            pressure_psig = 90, 
            temp_deg_c = 25, 
            max_hole_size_in=6,
            storage_volume_m3 = 500000, 
            chemical_mix = ['chlorine'],
        )

    if test == Tests_Enum.INDOOR_CHLORINE_LARGE:
        m_io.set_inputs_as_arguments(
            pressure_psig = 90, 
            temp_deg_c = 25, 
            max_hole_size_in=6,
            storage_volume_m3 = 500000, 
            chemical_mix = ['chlorine'],
            offsite_dist_m=np.inf,
            release_indoors=True,
            room_vol_m3=50000000,
            production_area_ach=10,
            room_vent_diameter_in = 48,
            room_vent_release_angle_degrees_from_horizontal = 0,
            room_vent_elevation_m = 3,
        )

    if test == Tests_Enum.LARGE_CATASTROPHIC_RELEASE_CL2:
        m_io.set_inputs_as_arguments(
            pressure_psig = 90, 
            temp_deg_c = 25, 
            max_hole_size_in=6,
            storage_volume_m3 = 500000, 
            chemical_mix = ['chlorine'],
            offsite_dist_m=np.inf,
            catastrophic_vessel_failure=True
        )

    if test == Tests_Enum.FLAMMABLE_ONLY_LOW_FP_MATERIAL:
        m_io.set_inputs_as_arguments(
            pressure_psig = 90, 
            temp_deg_c = -10, 
            max_hole_size_in=6,
            storage_volume_m3 = 50000, 
            chemical_mix = '3-methylheptane',
            offsite_dist_m=30,

        )

    if test == Tests_Enum.INERT_CHEMICAL:
        m_io.set_inputs_as_arguments( 
            chemical_mix = 'water',
        )
    
    if test == Tests_Enum.TEST_NULLABLE_CONDITIONS:
        m_io.set_inputs_as_arguments(
            release_angle_degrees_from_horizontal=90,
            relief_calc_rate_lb_hr = 5,
            temp_deg_c=10,
            relief_calc_available = True,
            bldg_ach_low_med_high = 'None|None|None',
            bldg_hvac_shutoff_min_low_med_high = 'None|None|None',
            bldg_dists_low_med_high = '3|6|9',
            release_latitude_degree_decimal = None, 
            release_longitude_degree_decimal = None,
            max_hole_size_in = 4,
            release_elevation_m=5,
            available_pool_area_m2 = None
        )

    if test == Tests_Enum.TEST_LIST_BASED_INPUTS:
        m_io.set_inputs_as_arguments(
            chemical_mix = ['n-heptane', 'methanol'],
            composition = [1, 1],
            comp_is_moles = True,
            max_hole_size_in = -1,
            pressure_psig = 50,
            temp_deg_c = 80,
            release_elevation_m = 10,
            flash_fire = True,
            inhalation = True,
            bldg_nums_low_med_high = ['18', '215', '54D'],
            bldg_dists_low_med_high = '10|20|30',
            bldg_hts_low_med_high = [5, 10, 15],
            bldg_ach_low_med_high = '10|30|59',
            bldg_hvac_shutoff_min_low_med_high = [60, 60, 60],
        )

    if test == Tests_Enum.HYDROGEN:
        m_io.set_inputs_as_arguments(
            chemical_mix = ['hydrogen'],
            storage_mass_kg=50000,
            composition = [1],
            comp_is_moles = True,
            max_hole_size_in = 6,
            pressure_psig = 50,
            temp_deg_c = 80,
            release_elevation_m = 10,
            release_angle_degrees_from_horizontal=0,
            flash_fire = True,
            inhalation = False,
            bldg_nums_low_med_high = ['18', '215', '54D'],
            bldg_dists_low_med_high = '10|20|30',
            bldg_hts_low_med_high = [4.1, 10, 20],
            bldg_ach_low_med_high = '10|30|59',
            bldg_hvac_shutoff_min_low_med_high = [60, 60, 60],
        )
    
    if test == Tests_Enum.VAPOR_RELIEF:
        m_io.set_inputs_as_arguments(
            chemical_mix = ['hydrogen'],
            storage_mass_kg=50000,
            composition = [1],
            comp_is_moles = True,
            relief_phase = 'vapor',
            relief_calc_available = True,
            relief_calc_rate_lb_hr = 9537.651,
            max_hole_size_in = 6,
            pressure_psig = 50,
            temp_deg_c = 80,
            release_elevation_m = 10,
            release_angle_degrees_from_horizontal=0,
            flash_fire = True,
            inhalation = False,
            bldg_nums_low_med_high = ['18', '215', '54D'],
            bldg_dists_low_med_high = '10|20|30',
            bldg_hts_low_med_high = [4.1, 10, 20],
            bldg_ach_low_med_high = '10|30|59',
            bldg_hvac_shutoff_min_low_med_high = [60, 60, 60],
        )

    if test == Tests_Enum.NO_DISCHARGE:

        m_io.set_inputs_as_arguments(
            flash_fire = True,
            inhalation = True,
            relief_calc_available = False,
            pressure_psig = 0.001,
            temp_deg_c = -30,
            relief_calc_rate_lb_hr = 106980.9,
            catastrophic_vessel_failure = False, # <------------------
            release_indoors = False,
            max_hole_size_in = 0.001,
            release_elevation_m = 0.1,
            release_angle_degrees_from_horizontal = 0,
            relief_phase = 'let model decide',
            available_pool_area_m2 = 1,
            storage_volume_m3 = None,
            storage_mass_kg = 100,
            display_diagnostic_information=True,
            personnel_working_at_elevation_near_release_point=False,
            offsite_dist_m = 30,
            personnel_per_10k_m2 = 3,
            release_latitude_degree_decimal = 36.520141,
            release_longitude_degree_decimal = -82.547886,
            bldg_nums_low_med_high = [574, 384, 348],
            bldg_dists_low_med_high = [12.33, 245.51, 224.83],
            bldg_hts_low_med_high = [5, 2, 8],
            bldg_ach_low_med_high = [10, 10, 10],
            bldg_hvac_shutoff_min_low_med_high = [60, 60, 60],
            log_handler=print,
            kml_handler=print,
            chemical_mix = ['3-methylheptane'],
            comp_is_moles = False,
            composition = [1]
        )

    if test == Tests_Enum.TWO_PHASE_MODELED_AS_VAPOR:

        # generates a harmless warning from vessel leak calc that release is from
        # vapor portion of vessel, which is intended.

        m_io.set_inputs_as_arguments(
            flash_fire = True,
            inhalation = True,
            relief_calc_available = False,
            pressure_psig = 500,
            temp_deg_c = 40,
            relief_calc_rate_lb_hr = False,
            catastrophic_vessel_failure = False, # <------------------
            release_indoors = False,
            max_hole_size_in = 6,
            release_elevation_m = 0,
            release_angle_degrees_from_horizontal = 0,
            relief_phase = 'vapor',
            available_pool_area_m2 = None,
            storage_volume_m3 = None,
            storage_mass_kg = 1000,
            display_diagnostic_information=True,
            personnel_working_at_elevation_near_release_point=False,
            offsite_dist_m = 100,
            personnel_per_10k_m2 = 5,
            release_latitude_degree_decimal = 30.249988,
            release_longitude_degree_decimal = -91.093636,
            bldg_nums_low_med_high = [1, 2, 3],
            bldg_dists_low_med_high = [91.44, 137.16, 100],
            bldg_hts_low_med_high = [20, 6, 3],
            bldg_ach_low_med_high = [1, 1, 1],
            bldg_hvac_shutoff_min_low_med_high = [60, 60, 60],
            log_handler=print,
            kml_handler=print,
            chemical_mix = ['isopropyl acetate'],
            comp_is_moles = False,
            composition = [1]
        )

    if test == Tests_Enum.INDOOR_MODELING_B7R_EVAPORATOR_1:

        m_io.set_inputs_as_arguments(
            flash_fire = True,
            inhalation = True,
            relief_calc_available = False,
            pressure_psig = 20,
            temp_deg_c = 150,
            relief_calc_rate_lb_hr = None,
            catastrophic_vessel_failure = True, # <------------------
            release_indoors = True,
            max_hole_size_in = 4,
            release_elevation_m = 3,
            release_angle_degrees_from_horizontal = 0,
            relief_phase = 'let model decide',
            available_pool_area_m2 = None,
            storage_volume_m3 = None,
            storage_mass_kg = 37100,
            personnel_working_at_elevation_near_release_point=False,
            display_diagnostic_information=True,
            use_one_met_condition_worst_case=False,
            offsite_dist_m = 243,
            personnel_per_10k_m2 = 5,
            personnel_per_10k_m2_night = 3,
            release_latitude_degree_decimal = 36.525397,
            release_longitude_degree_decimal = -82.544488,
            bldg_nums_low_med_high = ['27A', '29', '12A'],
            bldg_nighttime_occupancy = [cd.KEYS_BLDG_UNOCCUPIED, cd.KEYS_BLDG_LOW_OCC, cd.KEYS_BLDG_LOW_OCC],
            bldg_dists_low_med_high = [30.99, 36.57, 122.35],
            bldg_hts_low_med_high = [4, 11, 14],
            bldg_ach_low_med_high = [2, 2, 2],
            bldg_hvac_shutoff_min_low_med_high = [60, 60, 60],
            # bldg_nums_low_med_high = ['MATALA', 'Control Room', 'Power Plant'],
            # bldg_nighttime_occupancy = [cd.KEYS_BLDG_UNOCCUPIED, cd.KEYS_BLDG_LOW_OCC, cd.KEYS_BLDG_LOW_OCC],
            # bldg_dists_low_med_high = [44, 90, 123],
            # bldg_hts_low_med_high = [3, 8, 10],
            # bldg_ach_low_med_high = [10, 10, 10],
            # bldg_hvac_shutoff_min_low_med_high = [60, 60, 60],
            log_handler=print,
            kml_handler=print,
            chemical_mix=['acetic acid'],
            # chemical_mix = ['hydrogen', 'nitrogen', 'carbon monoxide', 'argon', 'methane', 'water'],
            comp_is_moles = False,
            composition=[1],
            # composition = [908, 115, 9756, 176, 141, 10],
            room_vol_m3 = 148688/(3.28084**3),
            production_area_ach = 13.07,
            room_vent_diameter_in = 48,
            room_vent_release_angle_degrees_from_horizontal = 0,
            room_vent_elevation_m = 3,
        )

    if test == Tests_Enum.IT_TEST_INPUTS:

        m_io.set_inputs_as_arguments(
            flash_fire = True,
            inhalation = True,
            relief_calc_available = False,
            pressure_psig = 10,
            temp_deg_c = 30,
            relief_calc_rate_lb_hr = None,
            catastrophic_vessel_failure = True, # <------------------
            release_indoors = False,
            max_hole_size_in = 8,
            release_elevation_m = 2,
            release_angle_degrees_from_horizontal = 0,
            relief_phase = 'let model decide',
            available_pool_area_m2 = 3,
            storage_volume_m3 = None,
            storage_mass_kg = 200,
            personnel_working_at_elevation_near_release_point=False,
            display_diagnostic_information=True,
            use_one_met_condition_worst_case=False,
            offsite_dist_m = 100,
            personnel_per_10k_m2 = 5,
            personnel_per_10k_m2_night = 3,
            release_latitude_degree_decimal = 30.591485,
            release_longitude_degree_decimal = -87.136385,
            bldg_nums_low_med_high = [
                'DIMLA Loading Condo', 
                'Maintenance',
                'N/A'
                ],
            bldg_nighttime_occupancy = [cd.KEYS_BLDG_UNOCCUPIED, cd.KEYS_BLDG_UNOCCUPIED, cd.KEYS_BLDG_UNOCCUPIED],
            bldg_dists_low_med_high = [10, 20, 30],
            bldg_hts_low_med_high = [8, 2, 5],
            bldg_ach_low_med_high = [10, 10, 10],
            bldg_hvac_shutoff_min_low_med_high = [60, 60, 60],
            log_handler=print,
            kml_handler=print,
            chemical_mix=['ammonia'],
            comp_is_moles = False,
            composition=[1],
            room_vol_m3 = 19414.07317,
            production_area_ach = 8,
            room_vent_diameter_in = 87.7527935,
            room_vent_release_angle_degrees_from_horizontal = 0,
            room_vent_elevation_m = 31.7,
            exit_vapor_mass_fraction = None,
        )

    if test == Tests_Enum.VCE_TESTING:

        m_io.set_inputs_as_arguments(
            flash_fire = True,
            inhalation = False,
            relief_calc_available = False,
            pressure_psig = 1000,
            temp_deg_c = 25,
            relief_calc_rate_lb_hr = 20896.42 * 2.2,
            catastrophic_vessel_failure = False, # <------------------
            release_indoors = False,
            max_hole_size_in = 10,
            release_elevation_m = 0,
            release_angle_degrees_from_horizontal = 0,
            relief_phase = 'let model decide',
            available_pool_area_m2 = None,
            storage_volume_m3 = None,
            storage_mass_kg = 20896.42 / 5, # less than 15 min of flow.
            personnel_working_at_elevation_near_release_point=False,
            display_diagnostic_information=True,
            use_one_met_condition_worst_case=False,
            offsite_dist_m = 29,
            personnel_per_10k_m2 = 5,
            personnel_per_10k_m2_night = 2,
            release_latitude_degree_decimal = 65.03513,
            release_longitude_degree_decimal = 25.522005,
            bldg_nums_low_med_high = [
                '316A', 
                '359',
                '300'
                ],
            bldg_nighttime_occupancy = [cd.KEYS_BLDG_UNOCCUPIED, cd.KEYS_BLDG_MED_OCC, cd.KEYS_BLDG_MED_OCC],
            bldg_dists_low_med_high = [132.533723, 112.8, 248.27],
            bldg_hts_low_med_high = [6, 5, 9],
            bldg_ach_low_med_high = [10.0, 3.57, 0.69],
            bldg_hvac_shutoff_min_low_med_high = [60, 60, 60],
            log_handler=print,
            kml_handler=print,
            chemical_mix=['acetylene'],
            comp_is_moles = False,
            composition=[1],
            room_vol_m3 = 19414.07317,
            production_area_ach = 8,
            room_vent_diameter_in = 87.7527935,
            room_vent_release_angle_degrees_from_horizontal = 0,
            room_vent_elevation_m = 31.7,
            exit_vapor_mass_fraction = None,
            vapor_cloud_explosion=True,
            # quick_test=True
        )

    if test == Tests_Enum.AD_HOC:

        # chem_list_len = randint(2,10)

        # chem_info = helpers.get_dataframe_from_csv(Tables().CHEM_INFO)
        # chem_sublist = chem_info.sample(chem_list_len)
        # cas_ids = chem_sublist['cas_no'].to_list()
        # chem_mol_ratios = np.float64(np.random.randint(1,5,chem_list_len))
        # chem_mol_fracts = helpers.normalize_fractions(chem_mol_ratios)
        # chem_mol_fracts = list(chem_mol_fracts)

        # print([helpers.get_chem_name(x) for x in cas_ids])
        # print(chem_mol_fracts)
        
        # nbp_k = nbp_deg_K(chems = None, x0 = 298.15, mixture_cas_nos = cas_ids, mixture_molfs = chem_mol_fracts, cheminfo = chem_info)

        # temp_c = nbp_k - 273.15
        # press_psig = 20

        m_io.set_inputs_as_arguments(
            flash_fire = True,
            inhalation = True,
            relief_calc_available = False,
            pressure_psig = 500,
            temp_deg_c = 25,
            relief_calc_rate_lb_hr = None,
            catastrophic_vessel_failure = True, # <------------------
            release_indoors = False,
            max_hole_size_in = 30,
            release_elevation_m = 0,
            release_angle_degrees_from_horizontal = 0,
            relief_phase = 'let model decide',
            available_pool_area_m2 = None,
            storage_volume_m3 = None,
            storage_mass_kg = 30000000*8.7/2.2,
            personnel_working_at_elevation_near_release_point=False,
            display_diagnostic_information=False,
            use_one_met_condition_worst_case=True,
            offsite_dist_m = 100,
            personnel_per_10k_m2 = 5,
            personnel_per_10k_m2_night = 2,
            release_latitude_degree_decimal = 36.52,
            release_longitude_degree_decimal = -82.54,
            bldg_nums_low_med_high = [
                '316A', 
                '359',
                '300'
                ],
            bldg_nighttime_occupancy = [cd.KEYS_BLDG_UNOCCUPIED, cd.KEYS_BLDG_MED_OCC, cd.KEYS_BLDG_MED_OCC],
            bldg_dists_low_med_high = [10, 20, 30],
            bldg_hts_low_med_high = [15, 24, 33],
            bldg_ach_low_med_high = [10.0, 3.57, 0.69],
            bldg_hvac_shutoff_min_low_med_high = [60, 60, 60],
            log_handler=print,
            kml_handler=print,
            chemical_mix=["hydrogen"],
            comp_is_moles = False,
            composition=[1],
            room_vol_m3 = 46171,
            production_area_ach = 0.0001,
            room_vent_diameter_in = 12,
            room_vent_release_angle_degrees_from_horizontal = 0,
            jet_fire_analysis = False,
            jet_fire_only = False,
            vapor_cloud_explosion=True,
            pv_burst = False,
            get_phast_discharge_only = False,
        )

    return m_io

test = Tests_Enum.AD_HOC

m_io = get_model_interface_to_test(test)

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

m_io.inputs['log_handler'] = logging.debug
show_phys_props_data = False

if show_phys_props_data:
    run_gpp(m_io)

data = None

res = m_io.run()

if res == ResultCode.SUCCESS:
    data = m_io.get_data()
    print(data)
    output_folder = os.path.join(os.getcwd(), 'model_run_output')
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    helpers.output_variable_to_textfile(data, file_nm = output_folder + '/model_run_data')
    # data_json = json.loads(data)
    # df = pd.json_normalize(data_json)
    # helpers.df_to_csv(df, output_folder + '/model_run_data.csv')
    images_pillow = m_io.dispersion_plots_pillow
    images_json = m_io.dispersion_plots_json
    debug_data = m_io.debug_data
    # m_io.timings.to_csv('py_lopa/output/timings.csv')
    dispersion_dicts = m_io.dispersion_dicts

    # debug xxx apple
    # helpers.save_object_as_pickle_return_path_and_file_name(obj = m_io, descr = 'output/m_io', use_time_stamp=False)
    # helpers.save_object_as_pickle_return_path_and_file_name(obj = dispersion_dicts, descr = 'output/disp_dicts', use_time_stamp=False)
    # helpers.save_object_as_pickle_return_path_and_file_name(obj = m_io.mi, descr = 'output/mi', use_time_stamp=False)

    # launch kml generator

    output_folder = os.path.join(os.getcwd(), 'google_earth_output')
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    run_info = m_io.time_stamp_utc
    kml_handler = m_io.mi.KML_HANDLER
    kml_gen = Kml_Generator(dispersion_dicts=m_io.dispersion_dicts, mi=m_io.mi, save_all_disps_locally=False, save_merged_output_locally=True, output_folder=output_folder, run_info=run_info, send_to_kml_hander=False, kml_handler=kml_handler)
    # kml_gen.run()

t1 = dt.now(datetime.UTC)
delta_t = t1 - m_io.t0
print(f'Start Time {m_io.t0}  End time {t1}  time to run {delta_t}')

pass

# test