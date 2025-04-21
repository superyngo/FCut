import sys
import os
from pathlib import Path
from enum import StrEnum, auto, Enum
from .mytypes import PathEnum
from pydantic import AnyUrl


class DEV_INFO(StrEnum):
    APP_NAME = "FCut"
    AUTHOR = "Wenyang Tai"
    COMPANY = "WENANKO"
    APP_VERSION = "0.1.0"
    ADDRESS = "6F.-1, No. 442, Changchun Rd., Songshan Dist., Taipei City 105, Taiwan (R.O.C.)"
    EMAIL = "superyngo@gmail.com"


# set app base path
class APP_PATHS(PathEnum):
    USERPROFILE = Path(os.environ["USERPROFILE"])
    RUNTIME_PATH = Path(os.path.abspath(sys.argv[0])).parent
    BIN = RUNTIME_PATH / "bin"
    PROGRAM_DATA = Path(os.environ["PROGRAMDATA"]) / DEV_INFO.APP_NAME  # C:\ProgramData
    APP_DATA = (
        Path(os.environ["APPDATA"]) / DEV_INFO.APP_NAME
    )  # C:\Users\user\AppData\Roaming
    LOGS = APP_DATA / "Logs"


class ACTIONS(StrEnum):
    """_summary_

    Args:
        StrEnum (_type_): _description_
    """

    Custom = auto()
    Cut = auto()
    Speedup = auto()
    Jumpcut = auto()
    CutSilence = auto()
    CutMotionless = auto()


class CONFIG(Enum):
    UI_HOST = (_UI_HOST := "127.0.0.1")
    UI_PORT = (_UI_PORT := 5173)
    UI_URL = AnyUrl.build(scheme="http", host=_UI_HOST, port=_UI_PORT, path="/")
