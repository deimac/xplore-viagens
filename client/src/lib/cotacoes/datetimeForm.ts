/** Helpers para campos de data/hora separados no formulário de peças. */

export function isValidTimeString(value?: string | null): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value || "");
}

export function splitStoredDatetime(value: string | Date | null | undefined): { date: string; time: string } {
    if (!value) return { date: "", time: "" };

    if (typeof value === "string") {
        const raw = value.trim();
        if (!raw) return { date: "", time: "" };

        // Preserve local datetime strings exactly as entered (no timezone conversion).
        const localMatch = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,6})?)?)?$/);
        if (localMatch) {
            return {
                date: localMatch[1],
                time: localMatch[2] && localMatch[3] ? `${localMatch[2]}:${localMatch[3]}` : "",
            };
        }
    }

    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return { date: "", time: "" };
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
}

export function splitIsoDatetime(iso: string | null | undefined): { date: string; time: string } {
    if (!iso) return { date: "", time: "" };
    const match = iso.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
    if (match) return { date: match[1], time: match[2] ?? "" };
    return splitStoredDatetime(iso);
}

/** Combina data + hora para envio ao backend (DATETIME). */
export function combineDateTimeForSubmit(date: string, time: string): string {
    const d = date.trim();
    if (!d) return "";
    const t = time.trim();
    if (!t) return `${d}T00:00`;
    if (isValidTimeString(t)) return `${d}T${t}`;
    return `${d}T00:00`;
}
