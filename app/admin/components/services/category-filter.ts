// Pure helpers for dropdown search. Matching is diacritics-insensitive
// so "bao duong" matches "Bảo dưỡng".

export type CategoryOption = { id: string; name: string };

export type SelectOption = { value: string; label: string };

export function normalizeVi(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export function filterCategoryOptions(
  options: CategoryOption[],
  keyword: string,
): CategoryOption[] {
  const needle = normalizeVi(keyword.trim());
  if (!needle) return options;
  return options.filter((option) => normalizeVi(option.name).includes(needle));
}

export function filterSelectOptions(
  options: SelectOption[],
  keyword: string,
): SelectOption[] {
  const needle = normalizeVi(keyword.trim());
  if (!needle) return options;
  return options.filter((option) => normalizeVi(option.label).includes(needle));
}
