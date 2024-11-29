export interface Response<T> {
    status: boolean;
    value: T;
    msg: string | null;
  }
  