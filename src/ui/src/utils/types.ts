export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type InstanceTypeOf<T> = T extends new (...args: any) => infer R
  ? R
  : never;
