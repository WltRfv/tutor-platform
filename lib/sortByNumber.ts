/**
 * Сортирует массив по номеру в начале title.
 * Поддерживает: "1. ...", "12. ...", "§ 5. ...", "Глава 1. ..."
 * Элементы без номера уходят в конец.
 */
export function sortByNumber<T extends { title: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const na = extractNumber(a.title);
    const nb = extractNumber(b.title);
    if (na !== nb) return na - nb;
    return a.title.localeCompare(b.title, 'ru');
  });
}

function extractNumber(title: string): number {
  const m = title.match(/^(?:§\s*|Глава\s*)?(\d+)/i);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}