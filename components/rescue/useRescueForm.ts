"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import { useMe } from "@/hooks/auth";
import { useCreateRescue } from "@/hooks/rescue";
import { useUnsavedNavigationConfirm } from "@/hooks/useUnsavedNavigationConfirm";
import { validateCreateRescueInput } from "@/lib/rescue/rescue.validation";
import type { MapAddressValues } from "@/services/geocode.api";
import type { CreatedRescue, RescueFieldErrors } from "@/services/rescue.api";
import { RescueApiError } from "@/services/rescue.api";
import type { MapPoint } from "../booking/MapPicker";
import {
  clearRescueDraft,
  hasRescueDraftContent,
  persistRescueDraft,
  readRescueDraft,
} from "./rescue-draft";
import {
  emptyRescueAddress,
  emptyRescueVehicle,
  isRescueFormDirty,
  type RescueAddressValues,
  type RescueVehicleValues,
  resolveRescueContact,
} from "./rescue-form-state";

const EMPTY_ERRORS: RescueFieldErrors = {};

// All rescue form state and submit logic. Client validation mirrors
// POST /api/rescue for instant feedback; the API stays source of truth.
// A signed-in account supplies name + phone so those inputs stay hidden;
// guests type both. Unsent input is mirrored to a sessionStorage draft
// (restored on mount), so refresh/tab-close/back lose nothing — only an
// in-app Link click while dirty still asks via the branded confirm.
export function useRescueForm() {
  const toast = useToast();
  const router = useRouter();
  const me = useMe();
  const createRescue = useCreateRescue();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<MapPoint | null>(null);
  const [address, setAddress] =
    useState<RescueAddressValues>(emptyRescueAddress);
  const [vehicle, setVehicle] =
    useState<RescueVehicleValues>(emptyRescueVehicle);
  const [errors, setErrors] = useState<RescueFieldErrors>(EMPTY_ERRORS);
  const [created, setCreated] = useState<CreatedRescue | null>(null);

  const account = me.data;
  const contact = resolveRescueContact(account, { fullName, phone });
  const dirty = isRescueFormDirty({
    fullName,
    phone,
    issueType,
    description,
    coords,
    address,
    vehicle,
    pending: createRescue.isPending,
  });

  const toastRef = useRef(toast);
  toastRef.current = toast;

  // One-shot restore after mount: reading sessionStorage in the first
  // render would flash a hydration mismatch, so the form paints empty
  // and the draft fills in here with a toast explaining where it came
  // from.
  useEffect(() => {
    const draft = readRescueDraft(window.sessionStorage);
    if (!draft || !hasRescueDraftContent(draft)) return;
    setFullName(draft.fullName);
    setPhone(draft.phone);
    setIssueType(draft.issueType);
    setDescription(draft.description);
    setCoords(draft.coords);
    setAddress(draft.address);
    setVehicle(draft.vehicle);
    toastRef.current.info(
      "Đã khôi phục thông tin đã nhập",
      "Dữ liệu cứu hộ bạn nhập trước đó vẫn được giữ lại.",
    );
  }, []);

  // Draft mirrors live state; every change rewrites it and an emptied
  // form frees the key. The first run is skipped so the mount commit
  // (pre-restore state) never clears a draft it has not applied yet.
  const skipFirstPersist = useRef(true);
  useEffect(() => {
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false;
      return;
    }
    persistRescueDraft(window.sessionStorage, {
      fullName,
      phone,
      issueType,
      description,
      coords,
      address,
      vehicle,
    });
  }, [fullName, phone, issueType, description, coords, address, vehicle]);

  // A confirmed in-app leave means "throw it away", so the draft dies
  // with the form; accidental exits keep it and restore on return.
  const discardDraft = useCallback(() => {
    clearRescueDraft(window.sessionStorage);
  }, []);
  const leaveConfirm = useUnsavedNavigationConfirm(
    dirty && created === null,
    discardDraft,
  );

  function clearError(field: keyof RescueFieldErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  }

  function handleMapAddress(values: MapAddressValues) {
    setAddress((prev) => ({ ...prev, ...values }));
    setErrors((prev) => ({
      ...prev,
      address: undefined,
      province: undefined,
      district: undefined,
      ward: undefined,
      street: undefined,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      fullName: contact.fullName,
      phone: contact.phone,
      issueType,
      description,
      vehiclePlate: vehicle.vehiclePlate,
      vehicleBrand: vehicle.vehicleBrand,
      vehicleModel: vehicle.vehicleModel,
      address: address.address,
      province: address.province,
      district: address.district,
      ward: address.ward,
      street: address.street,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    };
    const checked = validateCreateRescueInput(payload);
    if ("errors" in checked) {
      setErrors(checked.errors);
      return;
    }
    setErrors(EMPTY_ERRORS);
    createRescue.mutate(payload, {
      onSuccess: (data) => {
        setCreated(data.request);
        // Sent data must never come back as a draft — only unsent input
        // deserves a restore.
        clearRescueDraft(window.sessionStorage);
        toast.success(
          "Đã gửi yêu cầu cứu hộ",
          "Thợ trực sẽ gọi lại ngay cho bạn.",
        );
        // Signed-in customers track the request on their history tab;
        // guests keep the confirmation panel since /history needs auth.
        if (account?.role === "customer") {
          router.push("/history/rescue");
        }
      },
      onError: (error) => {
        if (error instanceof RescueApiError) {
          setErrors(error.errors);
          toast.error(
            "Không gửi được yêu cầu",
            error.errors.form ?? "Vui lòng kiểm tra lại thông tin.",
          );
        } else {
          setErrors({ form: "Không gửi được yêu cầu. Vui lòng thử lại." });
          toast.error("Không gửi được yêu cầu", "Vui lòng thử lại sau.");
        }
      },
    });
  }

  function resetCreated() {
    setCreated(null);
  }

  return {
    fullName,
    setFullName,
    phone,
    setPhone,
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
    created,
    contact,
    contactLoading: me.isPending,
    loggedIn: account !== null,
    pending: createRescue.isPending,
    leaveConfirm,
    clearError,
    handleMapAddress,
    handleSubmit,
    resetCreated,
  };
}

export type UseRescueForm = ReturnType<typeof useRescueForm>;
