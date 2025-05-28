/**
 * 訊息佇列的輔助函數
 * 用於在應用程式的任何地方顯示臨時訊息
 */

import { useAppState } from "../stores/stores";

/**
 * 顯示一個臨時訊息，會在MessageBar中顯示2秒後自動消失
 * @param message 要顯示的訊息內容
 */
export function showMessage(message: string) {
  const appState = useAppState();
  appState.addMessage(message);
}

/**
 * 顯示成功訊息
 * @param message 成功訊息內容
 */
export function showSuccessMessage(message: string) {
  showMessage(`✅ ${message}`);
}

/**
 * 顯示錯誤訊息
 * @param message 錯誤訊息內容
 */
export function showErrorMessage(message: string) {
  showMessage(`❌ ${message}`);
}

/**
 * 顯示警告訊息
 * @param message 警告訊息內容
 */
export function showWarningMessage(message: string) {
  showMessage(`⚠️ ${message}`);
}

/**
 * 顯示資訊訊息
 * @param message 資訊訊息內容
 */
export function showInfoMessage(message: string) {
  showMessage(`ℹ️ ${message}`);
}

/**
 * 截斷過長的檔案路徑，在檔名中間使用省略號
 * @param filePath 完整的檔案路徑
 * @param maxLength 最大顯示長度（預設80字符）
 * @returns 截斷後的檔案路徑
 */
export function truncateFilePath(
  filePath: string,
  maxLength: number = 80
): string {
  if (filePath.length <= maxLength) {
    return filePath;
  }

  // 分離目錄路徑和檔名
  const lastSlashIndex = Math.max(
    filePath.lastIndexOf("/"),
    filePath.lastIndexOf("\\")
  );

  if (lastSlashIndex === -1) {
    // 沒有路徑分隔符，只有檔名
    return truncateFileName(filePath, maxLength);
  }

  const dirPath = filePath.substring(0, lastSlashIndex + 1);
  const fileName = filePath.substring(lastSlashIndex + 1);

  // 如果目錄路徑本身就超過最大長度，則截斷目錄路徑
  if (dirPath.length >= maxLength - 10) {
    const truncatedDir = truncateDirectoryPath(
      dirPath,
      maxLength - fileName.length - 3
    );
    return truncatedDir + "..." + fileName;
  }

  // 如果加起來超過最大長度，截斷檔名
  if (dirPath.length + fileName.length > maxLength) {
    const availableForFileName = maxLength - dirPath.length;
    const truncatedFileName = truncateFileName(fileName, availableForFileName);
    return dirPath + truncatedFileName;
  }

  return filePath;
}

/**
 * 截斷檔名，保留副檔名
 * @param fileName 檔名
 * @param maxLength 最大長度
 * @returns 截斷後的檔名
 */
function truncateFileName(fileName: string, maxLength: number): string {
  if (fileName.length <= maxLength) {
    return fileName;
  }

  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1 || lastDotIndex === 0) {
    // 沒有副檔名或隱藏檔案
    const half = Math.floor((maxLength - 3) / 2);
    return (
      fileName.substring(0, half) +
      "..." +
      fileName.substring(fileName.length - half)
    );
  }

  const baseName = fileName.substring(0, lastDotIndex);
  const extension = fileName.substring(lastDotIndex);

  // 確保有足夠空間顯示副檔名和省略號
  const availableForBaseName = maxLength - extension.length - 3;

  if (availableForBaseName <= 0) {
    // 如果副檔名太長，只能截斷整個檔名
    const half = Math.floor((maxLength - 3) / 2);
    return (
      fileName.substring(0, half) +
      "..." +
      fileName.substring(fileName.length - half)
    );
  }

  const half = Math.floor(availableForBaseName / 2);
  return (
    baseName.substring(0, half) +
    "..." +
    baseName.substring(baseName.length - half) +
    extension
  );
}

/**
 * 截斷目錄路徑
 * @param dirPath 目錄路徑
 * @param maxLength 最大長度
 * @returns 截斷後的目錄路徑
 */
function truncateDirectoryPath(dirPath: string, maxLength: number): string {
  if (dirPath.length <= maxLength) {
    return dirPath;
  }

  // 保留開頭和結尾的路徑部分
  const half = Math.floor((maxLength - 3) / 2);
  return (
    dirPath.substring(0, half) +
    "..." +
    dirPath.substring(dirPath.length - half)
  );
}

/**
 * 為檔案類型錯誤創建格式化的警告訊息
 * @param filePath 檔案路徑
 * @param maxLength 最大顯示長度
 * @returns 格式化的警告訊息
 */
export function createFileTypeWarningMessage(
  filePath: string,
  maxLength: number = 80
): string {
  const truncatedPath = truncateFilePath(filePath, maxLength);
  return `${truncatedPath} 不是媒體檔案`;
}

// 使用範例：
// import { showSuccessMessage, showErrorMessage } from '../utils/messageHelpers';
//
// // 在任務完成時顯示成功訊息
// showSuccessMessage('影片渲染完成！');
//
// // 在發生錯誤時顯示錯誤訊息
// showErrorMessage('渲染失敗，請檢查檔案格式');
