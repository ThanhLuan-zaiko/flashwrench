"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useMe } from "@/hooks/auth";
import { useCart } from "@/hooks/cart";
import { useCheckout } from "@/hooks/orders";
import { useSessionExpired } from "@/hooks/useSessionExpired";
import { useMyWallets } from "@/hooks/useVouchers";
import type {
  FulfillmentType,
  OrderFieldErrors,
} from "@/lib/orders/orders.types";
import {
  defaultPaymentMethodFor,
  type OrderPaymentMethod,
  paymentMethodsFor,
} from "@/lib/payments/order-payment.types";
import { clampVoucherDiscount } from "@/lib/vouchers/voucher-discount";
import { AuthApiError } from "@/services/auth.api";
import type { MapAddressValues } from "@/services/geocode.api";
import { accountRecipient } from "./checkout-utils";

// All /checkout form state and the submit flow. Signed-in accounts keep
// verified name/phone read-only; guests type the contact trio instead —
// it lands on the order snapshot only, never on an account.
export function useCheckoutForm() {
  const router = useRouter();
  const me = useMe();
  const cart = useCart();
  const checkout = useCheckout();
  const sessionExpired = useSessionExpired();

  const guest = me.isSuccess && me.data === null;
  const account = accountRecipient(me.data ?? null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const recipientName = guest ? guestName : account.recipientName;
  const phone = guest ? guestPhone : account.phone;
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>("cod");
  const [address, setAddress] = useState("");
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLng, setAddressLng] = useState<number | null>(null);
  const [addressParts, setAddressParts] = useState({
    province: "",
    district: "",
    ward: "",
    street: "",
  });
  const [note, setNote] = useState("");
  const [walletId, setWalletId] = useState<string | null>(null);
  const [errors, setErrors] = useState<OrderFieldErrors>({});

  const cartView = cart.data?.cart ?? null;
  const submitting = checkout.isPending;
  const isAccount = me.isSuccess && me.data?.role === "customer";
  const myWallets = useMyWallets(isAccount, { limit: 100 });
  const selectedWallet =
    myWallets.data?.items.find((wallet) => wallet.id === walletId) ?? null;
  const walletDiscount = selectedWallet
    ? clampVoucherDiscount({
        discountType: selectedWallet.discountType,
        discountValue: selectedWallet.discountValue,
        maxDiscount: selectedWallet.maxDiscount,
        subtotal: cartView?.subtotal ?? 0,
      })
    : 0;

  // Pickup drops cod from the method list, so a stale selection has to be
  // coerced back to a legal method for the new fulfillment type.
  const handleFulfillment = (value: FulfillmentType) => {
    setFulfillment(value);
    if (!paymentMethodsFor(value).includes(paymentMethod)) {
      setPaymentMethod(defaultPaymentMethodFor(value));
    }
  };

  const handleGeocode = (values: MapAddressValues) => {
    setAddress(values.address);
    setAddressParts({
      province: values.province,
      district: values.district,
      ward: values.ward,
      street: values.street,
    });
  };

  const handleWallet = (next: string | null) => {
    setWalletId(next);
    setErrors((prev) => ({ ...prev, walletId: undefined, form: undefined }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    checkout.mutate(
      {
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        email: guest ? guestEmail.trim() : undefined,
        fulfillment,
        address: fulfillment === "delivery" ? address.trim() : "",
        addressLat: fulfillment === "delivery" ? addressLat : null,
        addressLng: fulfillment === "delivery" ? addressLng : null,
        province: addressParts.province,
        district: addressParts.district,
        ward: addressParts.ward,
        street: addressParts.street,
        note: note.trim() || undefined,
        paymentMethod,
        walletId: !guest && walletId ? walletId : undefined,
      },
      {
        onSuccess: (data) => {
          // Guests have no account history — their order lives behind the
          // public tracking link instead.
          router.push(
            guest
              ? `/track/order/${data.order.id}?placed=1`
              : `/orders/${data.order.id}?placed=1`,
          );
        },
        onError: (error) => {
          if (sessionExpired(error, "/checkout")) return;
          if (error instanceof AuthApiError) {
            setErrors(error.errors as OrderFieldErrors);
          } else {
            setErrors({ form: "Không đặt được đơn hàng. Vui lòng thử lại." });
          }
        },
      },
    );
  };

  return {
    me,
    guest,
    cartView,
    submitting,
    recipientName,
    phone,
    guestEmail,
    setGuestName,
    setGuestPhone,
    setGuestEmail,
    fulfillment,
    handleFulfillment,
    paymentMethod,
    setPaymentMethod,
    address,
    setAddress,
    addressLat,
    addressLng,
    setCoords: (lat: number, lng: number) => {
      setAddressLat(lat);
      setAddressLng(lng);
    },
    handleGeocode,
    note,
    setNote,
    walletId,
    handleWallet,
    walletDiscount,
    errors,
    submit,
  };
}
