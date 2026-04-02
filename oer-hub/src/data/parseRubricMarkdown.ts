/**
 * Extracts "Exemplifies Established Standards of Quality" (middle column) text
 * from Open4 single-point rubric markdown tables.
 */
export function extractProficientTextsFromRubricMd(md: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const line of md.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const m = trimmed.match(/\*\*Criteria\s+(\d+)\s*:/i);
    if (!m) continue;
    const num = Number.parseInt(m[1]!, 10);
    const parts = line.split("|");
    const proficient = parts[4]?.trim() ?? "";
    if (proficient.length > 0 && !/^\*\*Criteria\s+\d+/i.test(proficient)) {
      map.set(num, proficient);
    }
  }
  return map;
}

export function criterionIdToIndex(criterionId: string): number {
  const m = /^C(\d+)$/i.exec(criterionId.trim());
  return m ? Number.parseInt(m[1]!, 10) : 0;
}
