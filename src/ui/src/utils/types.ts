export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type InstanceTypeOf<T> = T extends new (...args: any) => infer R
  ? R
  : never;

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
