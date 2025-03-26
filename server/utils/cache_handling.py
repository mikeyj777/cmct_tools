import os
import logging

from py_lopa.calcs import helpers

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def _get_data_path():
    path = os.path.dirname(os.path.abspath(__file__))
    parent = os.path.dirname(path)
    data_path = os.path.join(parent, 'data')
    return data_path

def store_cache(vlc, json_file_name, case_num):
    data_path = _get_data_path()
    json_file_name = helpers.replace_chars_in_string_prior_to_naming_windows_text_file(json_file_name)
    _ = helpers.save_object_as_pickle_return_path_and_file_name(obj=vlc, descr=f'vlc-{json_file_name}-{case_num}',out_dir=data_path, use_time_stamp=False)

def get_cache(json_file_name, case_num):
    data_path = _get_data_path()
    json_file_name = helpers.replace_chars_in_string_prior_to_naming_windows_text_file(json_file_name)
    vlc = helpers.load_pickled_object(file_nm=f'{data_path}/vlc-{json_file_name}-{case_num}.pickle')
    return vlc