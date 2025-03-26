import os
from flask import jsonify
import logging

from pypws.entities import DischargeRecord, DischargeResult, Material

from py_lopa.calcs import helpers

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class EmptyObj:

    def __init__(self) -> None:
        pass

def list_of_objects_to_list_of_dicts(obj_list):
    dict_list = []
    for obj in obj_list:
        curr_dict = object_to_dict(obj)
        dict_list.append(curr_dict)
    return dict_list

def list_of_dicts_to_list_of_objects(dict_list):
    obj_list = []
    for curr_dict in dict_list:
        obj = dict_to_obj(curr_dict)
        obj_list.append(obj)
    return obj_list

def object_to_dict(obj):
    curr_dict = vars(obj)
    return curr_dict

def dict_to_obj(curr_dict):
    obj = None
    obj = EmptyObj()
    for k, v in curr_dict.items():
        setattr(obj, k, v)
    return obj

def cache_to_objects(cache):
    cache['discharge_records'] = list_of_dicts_to_list_of_objects(cache['discharge_records'])
    cache['exit_material'] = dict_to_obj(cache['exit_material'])
    cache['discharge_result'] = dict_to_obj(cache['discharge_result'])

    return cache

def cache_to_dicts(cache):
    cache['discharge_records'] = list_of_objects_to_list_of_dicts(cache['discharge_records'])
    cache['exit_material'] = object_to_dict(cache['exit_material'])
    cache['discharge_result'] = object_to_dict(cache['discharge_result'])

    return cache

if __name__ == "__main__":
    path = os.path.dirname(os.path.abspath(__file__))
    parent = os.path.dirname(path)
    data_path = os.path.join(parent, 'data')
    vlc = helpers.load_pickled_object(f'{data_path}/vlc.pickle')
    cache = {
        'exit_material': vlc.exit_material,
        'discharge_records': vlc.discharge_records,
        'discharge_result': vlc.discharge_result,
    }
    curr_dict = object_to_dict(cache['exit_material'])
    obj = dict_to_obj(curr_dict)
    j_obj = jsonify({'data': obj})
    apple = 1