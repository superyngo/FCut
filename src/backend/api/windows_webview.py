import webview
from src.shared import constants, logger


def windows_webview_server():
    # Give the server a moment to start
    logger.info(f"Backend server should be running on {constants.CONFIG.UI_URL.value}")
    logger.info(
        f"Creating pywebview window pointing to {constants.CONFIG.UI_URL.value}..."
    )
    # Create the pywebview window
    # Pass the FastAPI app instance if needed for direct Python <-> JS bridge later
    api_instance = Api()  # Create an instance of the API class
    webview.create_window(
        "FCut Application",
        str(constants.CONFIG.UI_URL.value),
        js_api=api_instance,  # Expose the API instance to JavaScript
    )

    # Start the pywebview event loop
    webview.start(debug=True)  # Enable debug for more detailed logs


class Api:
    def ping(self):
        return "pong"

    def open_file_dialog(self):
        file_types = ("Image Files (*.bmp;*.jpg;*.gif)", "All files (*.*)")

        result = webview.windows[0].create_file_dialog(
            webview.OPEN_DIALOG, allow_multiple=True, file_types=file_types
        )
        return result
