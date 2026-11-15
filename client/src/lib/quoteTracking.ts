const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/** UTMs da URL atual, repassados ao pedido de cotação. */
export function readUtm(): Record<string, string> {
  try {
    const params = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) out[k] = v.slice(0, 200);
    }
    return out;
  } catch {
    return {};
  }
}
