import tkinter as tk
from tkinter import filedialog as fd


def get_json_file_path():

    root = tk.Tk()
    root.withdraw()

    file_to_run = fd.askopenfilename(parent=root, title='Choose file to run')

    return file_to_run