import webview
import uvicorn
import threading
import time
from pydantic import AnyUrl  # Ensure you have this import for URL validation
from src.backend.api.main import app as fastapi_app  # Import the FastAPI app

# Configuration
UVICORN_HOST = "127.0.0.1"
UVICORN_PORT = 8000  # Port for the backend API server
UI_URL = AnyUrl.build(
    scheme="http", host=UVICORN_HOST, port=UVICORN_PORT, path="/"
)  # URL for the UI


def run_uvicorn():
    """Runs the Uvicorn server in a separate thread."""
    uvicorn.run(fastapi_app, host=UVICORN_HOST, port=UVICORN_PORT, log_level="info")


if __name__ == "__main__":
    print("Starting backend server...")
    # Start the backend server in a separate thread
    uvicorn_thread = threading.Thread(target=run_uvicorn, daemon=True)
    uvicorn_thread.start()

    # Give the server a moment to start
    time.sleep(2)
    print(f"Backend server should be running on http://{UVICORN_HOST}:{UVICORN_PORT}")

    print(f"Creating pywebview window pointing to {UI_URL}...")
    # Create the pywebview window
    # Pass the FastAPI app instance if needed for direct Python <-> JS bridge later
    window = webview.create_window(
        "FCut Application",
        str(UI_URL),
        # js_api=api_instance  # Example if using pywebview's JS API bridge
    )

    # Start the pywebview event loop
    webview.start(debug=False)  # Enable debug for more detailed logs

    print("Application closed.")
