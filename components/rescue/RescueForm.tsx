"use client";

import { FiLifeBuoy } from "react-icons/fi";
import { FormAlert } from "@/components/auth/FormAlert";
import { BookingMapSection } from "../booking/BookingMapSection";
import { RescueContactSection } from "./RescueContactSection";
import { RescueIssueSection } from "./RescueIssueSection";
import { RescueLocationSection } from "./RescueLocationSection";
import { RescueVehicleSection } from "./RescueVehicleSection";
import type { UseRescueForm } from "./useRescueForm";

type RescueFormProps = {
  form: UseRescueForm;
};

// Rescue form layout: contact first (guests file logged-out), then the
// breakdown, then map plus address, then vehicle. State and submit live
// in useRescueForm; success swaps to the confirmation panel in place.
export function RescueForm({ form }: RescueFormProps) {
  const {
    fullName,
    setFullName,
    phone,
    setPhone,
    email,
    setEmail,
    issueType,
    setIssueType,
    description,
    setDescription,
    coords,
    setCoords,
    address,
    setAddress,
    vehicle,
    setVehicle,
    errors,
    contact,
    contactLoading,
    loggedIn,
    pending,
    clearError,
    handleMapAddress,
    handleSubmit,
  } = form;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Gửi yêu cầu cứu hộ"
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 lg:grid lg:grid-cols-2 lg:gap-x-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {errors.form && (
        <div className="lg:col-span-2">
          <FormAlert message={errors.form} />
        </div>
      )}

      <div className="lg:col-span-2">
        <RescueContactSection
          fullName={fullName}
          phone={phone}
          contact={contact}
          loading={contactLoading}
          errors={errors}
          disabled={pending}
          onFullName={(v) => {
            setFullName(v);
            clearError("fullName");
          }}
          onPhone={(v) => {
            setPhone(v);
            clearError("phone");
          }}
          email={email}
          onEmail={(v) => {
            setEmail(v);
            clearError("email");
          }}
        />
      </div>

      <div>
        <RescueIssueSection
          issueType={issueType}
          description={description}
          errors={errors}
          disabled={pending}
          onIssueType={(v) => {
            setIssueType(v);
            clearError("issueType");
          }}
          onDescription={(v) => {
            setDescription(v);
            clearError("description");
          }}
        />
      </div>

      <div className="lg:row-span-2">
        <BookingMapSection
          lat={coords?.lat ?? null}
          lng={coords?.lng ?? null}
          error={errors.location}
          labels={{
            title: "Vị trí xe trên bản đồ",
            searchPlaceholder: "Tìm nơi xe đang dừng…",
            pinnedHint: "Đã ghim xe",
            emptyHint: "Chạm lên bản đồ để ghim nơi xe đang dừng.",
          }}
          onCoords={(point) => {
            setCoords(point);
            clearError("location");
          }}
          onAddress={handleMapAddress}
        />
      </div>

      <div>
        <RescueLocationSection
          values={address}
          errors={errors}
          disabled={pending}
          onChange={(field, v) => {
            setAddress((prev) => ({ ...prev, [field]: v }));
            clearError(field);
          }}
        />
      </div>

      <div className="lg:col-span-2">
        <RescueVehicleSection
          values={vehicle}
          errors={errors}
          disabled={pending}
          onChange={(field, v) => {
            setVehicle((prev) => ({ ...prev, [field]: v }));
            clearError(field);
          }}
        />
      </div>

      <div className="flex flex-col items-center lg:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-8 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-60 motion-safe:active:scale-[0.99] sm:w-auto sm:min-w-64 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
        >
          <FiLifeBuoy
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-none"
          />
          {pending ? "Đang gửi yêu cầu…" : "Gửi yêu cầu cứu hộ ngay"}
        </button>
        <p className="mt-2 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
          {loggedIn
            ? "Đã đăng nhập — yêu cầu sẽ gắn với tài khoản của bạn."
            : "Không cần đăng nhập. Thợ trực gọi lại ngay sau khi bạn gửi."}
        </p>
      </div>
    </form>
  );
}
