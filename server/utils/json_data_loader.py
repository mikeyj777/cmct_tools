import json
import tkinter as tk
from tkinter import filedialog as fd


def get_json_file_path():

    root = tk.Tk()
    root.withdraw()

    file_to_run = fd.askopenfilename(parent=root, title='Choose file to run')

    return file_to_run

def get_json_data_from_file():

    d = None

    path_to_json_file = get_json_file_path()
    if path_to_json_file is not None:
        with open(path_to_json_file) as f:
            d = json.load(f)
    
    return d
