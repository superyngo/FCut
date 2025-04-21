import threading
import subprocess
import os

# from src.backend.services.ui_flask import run_flask  # Import the FastAPI app
from src.backend.services.windows_webview import (
    windows_webview_server,
)

if __name__ == "__main__":
    print("Starting backend server...")
    # Start the backend server in a separate thread
    # ui_server_thread = threading.Thread(target=run_flask, daemon=True)
    # ui_server_thread.start()

    # Create a flag for thread termination
    ui_dev_process = None
    stop_ui_thread = threading.Event()

    # Update the function to handle termination
    def run_ui_dev_server():
        global ui_dev_process
        ui_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "ui")
        ui_dev_process = subprocess.Popen(
            ["pnpm", "run", "dev"], cwd=ui_dir, shell=True
        )

        # Wait for stop signal
        while not stop_ui_thread.is_set():
            if ui_dev_process.poll() is not None:  # Process ended
                break
            threading.Event().wait(0.5)  # Small sleep to prevent CPU hogging

    ui_dev_thread = threading.Thread(target=run_ui_dev_server, daemon=True)
    ui_dev_thread.start()

    windows_webview_server()

    print("Application closed.")
