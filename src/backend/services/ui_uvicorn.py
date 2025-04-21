import uvicorn
from pydantic import AnyUrl  # Ensure you have this import for URL validation
from .ui_fastapi import ui_app

# Configuration
UVICORN_HOST = "127.0.0.1"
UVICORN_PORT = 8000  # Port for the backend API server
UI_URL = AnyUrl.build(
    scheme="http", host=UVICORN_HOST, port=UVICORN_PORT, path="/"
)  # URL for the UI


def run_uvicorn():
    """Runs the Uvicorn server in a separate thread."""
    uvicorn.run(ui_app, host=UVICORN_HOST, port=UVICORN_PORT, log_level="info")
