import type { IconType } from "react-icons";
import type { SelectOption } from "./category-filter";

export type SelectDropdownProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  allLabel?: string;
  listLabel?: string;
  searchPlaceholder?: string;
  searchThreshold?: number;
  unitName?: string;
  emptyTitle?: string;
  emptyHint?: string;
  icon?: IconType;
  className?: string;
  id?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
};
