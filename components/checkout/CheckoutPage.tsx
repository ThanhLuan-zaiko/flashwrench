"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { PromoTeaser } from "@/components/promotions/PromoTeaser";
import { useMe } from "@/hooks/auth";
import { useCart } from "@/hooks/cart";
import { useCheckout } from "@/hooks/orders";
import { useBentoReveal } from "@/hooks/useBentoReveal";
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
import { CheckoutContactFields } from "./CheckoutContactFields";
import { CheckoutExtras } from "./CheckoutExtras";
import { CheckoutFulfillmentFields } from "./CheckoutFulfillmentFields";
import { CheckoutNotices } from "./CheckoutNotices";
import { CheckoutSummary } from "./CheckoutSummary";
import { accountRecipient } from "./checkout-utils";

// Shared /checkout for customers and guests: shipping form plus an
// immutable summary of the cart being purchased. Signed-in accounts keep
// verified name/phone read-only; guests type the contact trio instead —
// it lands on the order snapshot only, never on an account.
export function CheckoutPage() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const router = useRouter();
  const me = useMe();
  const cart = useCart();
  const checkout = useCheckout();
  const fieldId = useId();

  const guest = me.isSuccess && me.data === null;
  const account = accountRecipient(me.data ?? null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  // Customer fields mirror the verified account row; guest fields are
  // local form state the guest fills in themselves.
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

  const submit = (event: React.FormEvent) => {
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
          if (error instanceof AuthApiError) {
            setErrors(error.errors as OrderFieldErrors);
          } else {
            setErrors({ form: "Không đặt được đơn hàng. Vui lòng thử lại." });
          }
        },
      },
    );
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Đặt hàng"
        title="Thông tin nhận hàng."
        subtitle="Chọn giao tận nơi hoặc nhận tại xưởng — nhân viên sẽ xác nhận đơn trước khi đóng gói."
      />

      {me.isSuccess && (
        <CheckoutNotices
          isStaff={Boolean(me.data && me.data.role !== "customer")}
          cartEmpty={Boolean(
            (me.data === null || me.data.role === "customer") &&
              cartView &&
              cartView.items.length === 0,
          )}
        />
      )}

      <PromoTeaser />

      {me.isSuccess &&
        (me.data === null || me.data.role === "customer") &&
        cartView &&
        cartView.items.length > 0 && (
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-6"
          >
            <div
              data-reveal
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 md:col-span-3 dark:border-zinc-800 dark:bg-zinc-950"
            >
              {errors.form && <FormAlert message={errors.form} />}
              <CheckoutContactFields
                fieldId={fieldId}
                guest={guest}
                recipientName={recipientName}
                phone={phone}
                email={guestEmail}
                errors={errors}
                disabled={submitting}
                onName={setGuestName}
                onPhone={setGuestPhone}
                onEmail={setGuestEmail}
              />
              <CheckoutFulfillmentFields
                fieldId={fieldId}
                fulfillment={fulfillment}
                address={address}
                addressLat={addressLat}
                addressLng={addressLng}
                errors={errors}
                disabled={submitting}
                onFulfillment={handleFulfillment}
                onAddress={setAddress}
                onCoords={(lat, lng) => {
                  setAddressLat(lat);
                  setAddressLng(lng);
                }}
                onGeocode={handleGeocode}
              />
              <CheckoutExtras
                fieldId={fieldId}
                guest={guest}
                subtotal={cartView.subtotal}
                walletId={walletId}
                walletError={errors.walletId}
                note={note}
                disabled={submitting}
                onWallet={(next) => {
                  setWalletId(next);
                  setErrors((prev) => ({
                    ...prev,
                    walletId: undefined,
                    form: undefined,
                  }));
                }}
                onNote={setNote}
              />
            </div>

            <CheckoutSummary
              cart={cartView}
              fulfillment={fulfillment}
              paymentMethod={paymentMethod}
              discount={walletDiscount}
              errors={errors}
              submitting={submitting}
              onPaymentMethod={setPaymentMethod}
            />
          </form>
        )}
    </div>
  );
}
