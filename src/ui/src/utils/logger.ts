import { pywebview } from "../services/pywebview";

export class logger {
  // 新增顏色常量
  private static COLORS = {
    DEBUG: "color:rgb(148, 170, 250)", // 灰色
    ERROR: "color: #FF0000; font-weight: bold", // 紅色加粗
    WANING: "color: #FFA500", // 橙色
    INFO: "color:rgb(92, 244, 107)", // 藍色
  };

  private static formatMessage(...args: any[]): string {
    return args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      )
      .join(" ");
  }

  static debug(...args: any[]): void {
    const message = this.formatMessage(...args);
    console.log(
      `%c[DEBUG] ${new Date().toISOString()}: ${message}`,
      this.COLORS.DEBUG
    );
    pywebview.api.logger_debug(message);
  }

  static error(...args: any[]): void {
    const message = this.formatMessage(...args);
    console.log(
      `%c[ERROR] ${new Date().toISOString()}: ${message}`,
      this.COLORS.ERROR
    );
    pywebview.api.logger_error(message);
  }

  static warning(...args: any[]): void {
    const message = this.formatMessage(...args);
    console.log(
      `%c[WANING] ${new Date().toISOString()}: ${message}`,
      this.COLORS.WANING
    );
    pywebview.api.logger_warning(message);
  }

  static info(...args: any[]): void {
    const message = this.formatMessage(...args);
    console.log(
      `%c[INFO] ${new Date().toISOString()}: ${message}`,
      this.COLORS.INFO
    );
    pywebview.api.logger.debug(message);
  }
}
