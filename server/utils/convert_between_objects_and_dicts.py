import logging

from pypws.entities import DischargeRecord, DischargeResult, Material

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def list_of_objects_to_list_of_dicts(obj_list):
    dict_list = []
    for obj in obj_list:
        curr_dict = object_to_dict(obj)
        dict_list.append(curr_dict)
    return dict_list

def list_of_dicts_to_list_of_objects(dict_list, obj_class):
    obj_list = []
    for curr_dict in dict_list:
        obj = dict_to_obj(curr_dict)
        obj_list.append(obj)
    return obj_list

def object_to_dict(obj):
    return vars(obj)

def dict_to_obj(curr_dict, obj_class):
    obj = None
    if hasattr(obj_class, 'initialise_from_dictionary'):
        obj = obj_class.initialise_from_dictionary(curr_dict)
    else:
        logging.debug(f"***{obj_class} has no method initialise_from_dictionary.")
    return obj

def cache_to_objects(cache):
    cache['discharge_records'] = list_of_dicts_to_list_of_objects(cache['discharge_records'], obj_class=DischargeRecord)
    cache['exit_material'] = dict_to_obj(cache['exit_material'], obj_class=Material)
    cache['discharge_result'] = dict_to_obj(cache['discharge_result'], obj_class=DischargeResult)

def cache_to_dicts(cache):
    cache['discharge_records'] = list_of_dicts_to_list_of_objects(cache['discharge_records'], obj_class=DischargeRecord)
    cache['exit_material'] = dict_to_obj(cache['exit_material'], obj_class=Material)
    cache['discharge_result'] = dict_to_obj(cache['discharge_result'], obj_class=DischargeResult)

    return cache