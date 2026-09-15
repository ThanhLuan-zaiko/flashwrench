"use client";

type ServiceItemSupportFieldsProps = {
  isHomeSupported: boolean;
  isEmergencySupported: boolean;
  onHomeSupported: (value: boolean) => void;
  onEmergencySupported: (value: boolean) => void;
};

// Support toggles for the service form: home visit vs emergency rescue.
// Extracted to keep ServiceItemDialog under the 250-line limit.
export function ServiceItemSupportFields({
  isHomeSupported,
  isEmergencySupported,
  onHomeSupported,
  onEmergencySupported,
}: ServiceItemSupportFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border border-zinc-300 px-3 py-2 transition-colors duration-200 hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-zinc-500 dark:border-zinc-700 dark:hover:bg-zinc-900">
        <input
          type="checkbox"
          checked={isHomeSupported}
          onChange={(e) => onHomeSupported(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-zinc-900 dark:accent-white"
        />
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Hỗ trợ tại nhà
          </span>
          <span className="block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
            Thợ đến tận nơi sửa chữa
          </span>
        </span>
      </label>
      <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border border-zinc-300 px-3 py-2 transition-colors duration-200 hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-zinc-500 dark:border-zinc-700 dark:hover:bg-zinc-900">
        <input
          type="checkbox"
          checked={isEmergencySupported}
          onChange={(e) => onEmergencySupported(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-zinc-900 dark:accent-white"
        />
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Hỗ trợ cứu hộ
          </span>
          <span className="block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
            Nhận ca khẩn cấp ngoài giờ
          </span>
        </span>
      </label>
    </div>
  );
}
