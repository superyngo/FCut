import webview
from src.shared import logger, constants
from typing import Sequence, Any

import inspect
from enum import EnumMeta


class Api:
    def ping(self) -> str:
        return "pong"

    def open_file_dialog(self) -> Sequence[str] | None:
        file_types = ("Video Files (*.mp4;*.mpeg;*.mpg;*.avi;*.mkv)", "All files (*.*)")

        result = webview.windows[0].create_file_dialog(
            webview.OPEN_DIALOG, allow_multiple=True, file_types=file_types
        )
        return result

    def logger_info(self, message) -> None:
        logger.info(message)

    def logger_warning(self, message) -> None:
        logger.warning(message)

    def logger_error(self, message) -> None:
        logger.error(message)

    def logger_debug(self, message: str) -> None:
        logger.debug(message)

    def get_constants(self) -> dict[str, Any]:
        # 1️⃣ Names → values
        all_enum_dicts = {
            enum_name: {m.name: str(m.value) for m in enum_cls}
            for enum_name, enum_cls in inspect.getmembers(
                constants, lambda o: isinstance(o, EnumMeta)
            )
        }

        return all_enum_dicts
