/**
 * Normalize Material.keyMetrics (array | object | string | null) into a string[]
 * for pill rendering. The collector/AI output is not guaranteed to be an array
 * (e.g. Alibaba deepseek emits a dict like {"rebateAmount": "RM4,000"}); guard
 * every .map() consumer against non-array input. Mirrors src/server/geminiService.ts
 * formatKeyMetrics, but returns an array for frontend pill/map rendering.
 *
 * - array    -> elements coerced to string (object elements JSON.stringify)
 * - object   -> Object.entries => ["k: v", ...]
 * - string   -> [string]
 * - null/undefined/empty -> []
 */
export function formatKeyMetricsArr(keyMetrics: unknown): string[] {
  if (Array.isArray(keyMetrics)) {
    return keyMetrics.map((k) => (typeof k === "object" && k !== null ? JSON.stringify(k) : String(k)));
  }
  if (keyMetrics && typeof keyMetrics === "object") {
    return Object.entries(keyMetrics as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`);
  }
  const s = String(keyMetrics ?? "").trim();
  return s.length > 0 ? [s] : [];
}
