// Diacritics-insensitive Vietnamese search normalization: strips combining
// marks, maps đ/Đ to d, and lowercases so "den pha" matches "Đèn pha".
export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLocaleLowerCase("vi");
}

// Upper bound for any staff list search query.
export const MAX_LIST_SEARCH_LENGTH = 80;

// Every whitespace-separated word of the query must appear in at least one
// field. Fields are joined with a space, so a word never spans two fields.
export function matchesSearch(
  query: string,
  fields: readonly (string | null | undefined)[],
): boolean {
  const words = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fields
    .map((field) => normalizeSearchText(field ?? ""))
    .join(" ");
  return words.every((word) => haystack.includes(word));
}
