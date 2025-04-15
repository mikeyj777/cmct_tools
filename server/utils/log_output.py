from datetime import datetime

def log_to_file(message, file_nm = "C:/cmct_tools/server/flask_log.txt"):
    level="DEBUG"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(file_nm, "a") as f:
        f.write(f"[{timestamp}] [{level}] {message}\n")
