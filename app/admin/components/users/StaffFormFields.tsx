"use client";

import { SelectDropdown } from "../services/SelectDropdown";

export const CREATE_ROLE_OPTIONS = [
  { value: "mechanic", label: "Thợ" },
  { value: "dispatcher", label: "Điều phối" },
];

export const EDIT_ROLE_OPTIONS = [
  { value: "customer", label: "Khách hàng" },
  ...CREATE_ROLE_OPTIONS,
];

type StaffFormFieldsProps = {
  fullName: string;
  phone: string;
  email: string;
  role: string;
  isCreate: boolean;
  inputClass: string;
  labelClass: string;
  fieldError: (field: string) => string | undefined;
  onFullName: (value: string) => void;
  onPhone: (value: string) => void;
  onEmail: (value: string) => void;
  onRole: (value: string) => void;
};

function FieldMessage({ text }: { text: string | undefined }) {
  if (!text) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{text}</p>;
}

// Name/phone/email/role inputs shared by create and edit. Create offers
// mechanic/dispatcher only (customers self-register); edit keeps the
// customer option so existing customers stay manageable.
export function StaffFormFields({
  fullName,
  phone,
  email,
  role,
  isCreate,
  inputClass,
  labelClass,
  fieldError,
  onFullName,
  onPhone,
  onEmail,
  onRole,
}: StaffFormFieldsProps) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      <div>
        <label htmlFor="staff-fullname" className={labelClass}>
          Họ và tên
        </label>
        <input
          id="staff-fullname"
          value={fullName}
          onChange={(e) => onFullName(e.target.value)}
          placeholder="Trần Văn Thợ"
          autoComplete="off"
          className={inputClass}
        />
        <FieldMessage text={fieldError("fullName")} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="staff-phone" className={labelClass}>
            Số điện thoại
          </label>
          <input
            id="staff-phone"
            value={phone}
            onChange={(e) => onPhone(e.target.value)}
            placeholder="0901111222"
            inputMode="tel"
            autoComplete="off"
            className={inputClass}
          />
          <FieldMessage text={fieldError("phone")} />
        </div>
        <div>
          <label htmlFor="staff-email" className={labelClass}>
            Email
          </label>
          <input
            id="staff-email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="tho@example.com"
            inputMode="email"
            autoComplete="off"
            className={inputClass}
          />
          <FieldMessage text={fieldError("email")} />
        </div>
      </div>
      <SelectDropdown
        label="Vai trò"
        value={role}
        options={isCreate ? CREATE_ROLE_OPTIONS : EDIT_ROLE_OPTIONS}
        onChange={onRole}
        listLabel="Chọn vai trò"
        unitName="vai trò"
      />
      {fieldError("role") && (
        <p className="-mt-1 text-xs text-red-600 dark:text-red-400">
          {fieldError("role")}
        </p>
      )}
    </div>
  );
}
