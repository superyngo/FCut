import threading
from src.backend.api.ui_flask import run_flask  # Import the FastAPI app
from src.backend.api.windows_webview import (
    windows_webview_server,
)

if __name__ == "__main__":
    print("Starting backend server...")
    # Start the backend server in a separate thread
    ui_server_thread = threading.Thread(target=run_flask, daemon=True)
    ui_server_thread.start()

    windows_webview_server()

    print("Application closed.")
