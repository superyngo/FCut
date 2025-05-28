export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type InstanceTypeOf<T> = T extends new (...args: any) => infer R
  ? R
  : never;

// 音樂檔案副檔名
export enum AudioExtensions {
  MP3 = "mp3",
  WAV = "wav",
  FLAC = "flac",
  AAC = "aac",
  OGG = "ogg",
  M4A = "m4a",
  WMA = "wma",
}

// 影片檔案副檔名
export enum VideoExtensions {
  MP4 = "mp4",
  AVI = "avi",
  MOV = "mov",
  MKV = "mkv",
  WMV = "wmv",
  FLV = "flv",
  WEBM = "webm",
  M4V = "m4v",
}

// 檔案類型
export enum FileType {
  AUDIO = "audio",
  VIDEO = "video",
  UNKNOWN = "unknown",
}

// 根據副檔名判斷檔案類型的工具函數
export function getFileType(filename: string): FileType {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) return FileType.UNKNOWN;

  if (Object.values(AudioExtensions).includes(extension as AudioExtensions)) {
    return FileType.AUDIO;
  }

  if (Object.values(VideoExtensions).includes(extension as VideoExtensions)) {
    return FileType.VIDEO;
  }

  return FileType.UNKNOWN;
}

// 從檔名中提取副檔名
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export class Result<T, E> {
  private constructor(
    private readonly _ok: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  static ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  static err<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  isOk(): this is { _ok: true; _value: T } {
    return this._ok;
  }

  isErr(): this is { _ok: false; _error: E } {
    return !this._ok;
  }

  unwrap(): T {
    if (!this._ok) {
      throw new Error("Tried to unwrap an Err");
    }
    return this._value!;
  }

  unwrapErr(): E {
    if (this._ok) {
      throw new Error("Tried to unwrapErr on Ok");
    }
    return this._error!;
  }

  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    return this._ok ? handlers.ok(this._value!) : handlers.err(this._error!);
  }
}
