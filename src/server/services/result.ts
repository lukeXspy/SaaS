export type ServiceResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function serviceOk<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function serviceError(error: string): ServiceResult<never> {
  return { ok: false, error };
}
