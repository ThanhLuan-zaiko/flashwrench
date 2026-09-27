"use client";

import { useState } from "react";
import { useToast } from "@/components/toast/useToast";
import { useCreateRescue } from "@/hooks/rescue";
import { validateCreateRescueInput } from "@/lib/rescue/rescue.validation";
import type { MapAddressValues } from "@/services/geocode.api";
import type { CreatedRescue, RescueFieldErrors } from "@/services/rescue.api";
import { RescueApiError } from "@/services/rescue.api";
import type { MapPoint } from "../booking/MapPicker";

const EMPTY_ERRORS: RescueFieldErrors = {};

export type RescueAddressValues = {
  address: string;
  province: string;
  district: string;
  ward: string;
  street: string;
};

export type RescueVehicleValues = {
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
};

export function emptyRescueAddress(): RescueAddressValues {
  return { address: "", province: "", district: "", ward: "", street: "" };
}

export function emptyRescueVehicle(): RescueVehicleValues {
  return { vehiclePlate: "", vehicleBrand: "", vehicleModel: "" };
}

// All rescue form state and submit logic. Client validation mirrors
// POST /api/rescue for instant feedback; the API stays source of truth.
export function useRescueForm() {
  const toast = useToast();
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
      fullName,
      phone,
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
        toast.success(
          "Đã gửi yêu cầu cứu hộ",
          "Thợ trực sẽ gọi lại ngay cho bạn.",
        );
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
    pending: createRescue.isPending,
    clearError,
    handleMapAddress,
    handleSubmit,
    resetCreated,
  };
}

export type UseRescueForm = ReturnType<typeof useRescueForm>;
