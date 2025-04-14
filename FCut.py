import threading
from backend.api.ui_uvicorn import run_uvicorn  # Import the FastAPI app
from backend.api.windows_webview import (
    windows_webview_server,
)  # Import the webview server

if __name__ == "__main__":
    print("Starting backend server...")
    # Start the backend server in a separate thread
    uvicorn_thread = threading.Thread(target=run_uvicorn, daemon=True)
    uvicorn_thread.start()

    windows_webview_server()

    print("Application closed.")
