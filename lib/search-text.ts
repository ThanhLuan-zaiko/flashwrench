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
