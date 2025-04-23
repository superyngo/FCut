import threading
import subprocess
import os
from src.shared import logger

# from src.backend.services.ui_flask import run_flask  # Import the FastAPI app
from src.backend.services.windows_webview import (
    windows_webview_server,
)

if __name__ == "__main__":
    logger.info("Starting ui server...")
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
            ["pnpm", "run", "dev", "--host", "0.0.0.0"], cwd=ui_dir, shell=True
        )

        # Wait for stop signal
        while not stop_ui_thread.is_set():
            if ui_dev_process.poll() is not None:  # Process ended
                break
            threading.Event().wait(0.5)  # Small sleep to prevent CPU hogging

    ui_dev_thread = threading.Thread(target=run_ui_dev_server, daemon=True)
    ui_dev_thread.start()

    logger.info("Starting backend server...")
    windows_webview_server()

    # --- Cleanup ---
    logger.info("Closing UI development server...")
    stop_ui_thread.set()  # Signal the UI server thread to stop

    if ui_dev_process and ui_dev_process.poll() is None:
        try:
            print(f"Terminating UI dev process (PID: {ui_dev_process.pid})...")
            # On Windows, terminate() is an alias for kill()
            ui_dev_process.terminate()
            ui_dev_process.wait(timeout=1)  # Wait up to 5 seconds
            print("UI dev process terminated.")
        except subprocess.TimeoutExpired:
            print("UI dev process did not terminate gracefully, killing...")
            ui_dev_process.kill()
            ui_dev_process.wait()  # Wait for kill
            print("UI dev process killed.")
        except Exception as e:
            print(f"Error terminating UI dev process: {e}")

    # Wait for the UI server thread to finish
    ui_dev_thread.join()

    print("Application closed.")
