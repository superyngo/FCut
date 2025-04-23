import webview
from src.shared import constants, logger
from src.backend.api.api import Api
import os
from pathlib import Path


def windows_webview_server():
    # Give the server a moment to start
    logger.info(f"Backend server should be running on {constants.CONFIG.UI_URL.value}")
    logger.info(
        f"Creating pywebview window pointing to {constants.CONFIG.UI_URL.value}..."
    )
    # Create the pywebview window
    api_instance = Api()  # Create an instance of the API class
    # Create a directory for session storage

    webview.create_window(
        constants.DEV_INFO.APP_NAME.value,
        str(constants.CONFIG.UI_URL.value),
        js_api=api_instance,  # Expose the API instance to JavaScript
    )

    # Start the pywebview event loop
    webview.start(debug=True, private_mode=False)  # Enable debug for more detailed logs
