from flask import Flask, send_from_directory
from pathlib import Path
from src.shared.constants import CONFIG

ui_app = Flask(__name__, static_folder=Path(r"./src/ui/dist").resolve())


@ui_app.route("/<path:path>")
def serve_static(path):
    """Serve static files from the UI dist directory."""
    return send_from_directory(ui_app.static_folder, path)


@ui_app.route("/")
def serve_index():
    """Serve the index.html file for the root route."""
    return send_from_directory(ui_app.static_folder, "index.html")


def run_flask():
    ui_app.run(host=CONFIG.UI_HOST.value, port=CONFIG.UI_PORT.value)


if __name__ == "__main__":
    ui_app.run(host=CONFIG.UI_HOST.value, port=CONFIG.UI_PORT.value)
