import webview
from src.shared import logger, constants
from typing import Sequence, Any

import inspect
from enum import EnumMeta


class Api:
    def open_file_dialog(self) -> Sequence[str] | None:
        file_types = (
            "Media Files (*.mp4;*.mpeg;*.mpg;*.avi;*.mkv;*.mp3;*.aac)",
            "All files (*.*)",
        )

        result = webview.windows[0].create_file_dialog(
            webview.OPEN_DIALOG, allow_multiple=True, file_types=file_types
        )
        return result

    def open_folder_dialog(self) -> str | None:
        """開啟資料夾選擇對話框"""
        result = webview.windows[0].create_file_dialog(webview.FOLDER_DIALOG)
        if result and len(result) > 0:
            return result[0]
        return None

    def get_default_downloads_path(self) -> str:
        """獲取系統預設 Downloads 資料夾路徑"""
        from pathlib import Path

        # Windows 系統的 Downloads 路徑
        downloads_path = Path.home() / "Downloads"
        return str(downloads_path)

    def logger_info(self, message) -> None:
        logger.info(message)

    def logger_warn(self, message) -> None:
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
