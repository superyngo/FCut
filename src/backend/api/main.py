from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Path to the directory containing index.html
ui_dist_path = Path(r"./src/ui/dist").resolve()
asgiapp = StaticFiles(directory=ui_dist_path, html=True)


# Mount the static files directory
app.mount("/", asgiapp)


# @app.get("/")
# async def serve_index():
#     return FileResponse(os.path.join(ui_dist_path, "index.html"))


# @app.get("/api/hello")
# async def read_root():
#     return {"message": "Hello from Backend!"}


# You can add more API endpoints here
