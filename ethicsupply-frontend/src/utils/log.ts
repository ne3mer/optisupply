// Lightweight logging utility: silences noisy logs in production.
// In production builds (import.meta.env.PROD), debug/info/warn are no-ops.
// error still forwards to console.error to aid user-facing error reporting.

type AnyFn = (...args: any[]) => void;

const noop: AnyFn = () => {};

const isProd = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;

export const log: AnyFn = isProd ? noop : (...args: any[]) => console.log(...args);
export const info: AnyFn = isProd ? noop : (...args: any[]) => console.info(...args);
export const warn: AnyFn = isProd ? noop : (...args: any[]) => console.warn(...args);
export const error: AnyFn = (...args: any[]) => console.error(...args);

export default { log, info, warn, error };

