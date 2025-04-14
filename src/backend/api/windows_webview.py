import webview
from .ui_uvicorn import UI_URL  # Import the UI URL from the Uvicorn config


def windows_webview_server():
    # Give the server a moment to start
    print(f"Backend server should be running on {UI_URL}")

    print(f"Creating pywebview window pointing to {UI_URL}...")
    # Create the pywebview window
    # Pass the FastAPI app instance if needed for direct Python <-> JS bridge later
    webview.create_window(
        "FCut Application",
        str(UI_URL),
        # js_api=api_instance  # Example if using pywebview's JS API bridge
    )

    # Start the pywebview event loop
    webview.start(debug=False)  # Enable debug for more detailed logs
