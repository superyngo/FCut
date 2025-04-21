from logging import Logger
import os
from . import constants
from . import my_logger

__all__ = ["logger", "constants"]

# Create App directories if they don't exist
# constants.AppPaths.PROGRAM_DATA.mkdir(parents=True, exist_ok=True)
constants.APP_PATHS.APP_DATA.mkdir(parents=True, exist_ok=True)

# Create logger
logger: Logger = my_logger.init_logger(
    log_dir=constants.APP_PATHS.LOGS.value, app_name=constants.DEV_INFO.APP_NAME
)
logger.info(f"Logger file: {logger.handlers[1].baseFilename}")
my_logger.clean_logs(log_dir=constants.APP_PATHS.LOGS.value, days_count=10)

os.environ["PYTHONUTF8"] = "1"
os.environ["PATH"] = os.pathsep.join(
    [
        str(constants.APP_PATHS.RUNTIME_PATH),
        str(constants.APP_PATHS.BIN),
        os.environ["PATH"],
    ]
)
