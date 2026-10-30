"use client";

import { useId } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { PromoTeaser } from "@/components/promotions/PromoTeaser";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { CheckoutAddressFields } from "./CheckoutAddressFields";
import { CheckoutContactFields } from "./CheckoutContactFields";
import { CheckoutExtras } from "./CheckoutExtras";
import { CheckoutFulfillmentFields } from "./CheckoutFulfillmentFields";
import { CheckoutNotices } from "./CheckoutNotices";
import { CheckoutPaymentFields } from "./CheckoutPaymentFields";
import { CheckoutSummary } from "./CheckoutSummary";
import { CHECKOUT_SECTION_TITLE } from "./checkout-ui";
import { useCheckoutForm } from "./useCheckoutForm";

// Shared /checkout for customers and guests, laid out like the reference
// "check before ordering" screen: the cart lines first, then how to
// receive, how to pay, contact/address details and the totals.
export function CheckoutPage() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const fieldId = useId();
  const form = useCheckoutForm();
  const { me, cartView, errors, submitting } = form;
  const canOrder =
    me.isSuccess &&
    (me.data === null || me.data.role === "customer") &&
    cartView !== null &&
    cartView.items.length > 0;

  return (
    <div ref={rootRef} className="flex flex-col gap-5 sm:gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow={
          cartView && cartView.items.length > 0
            ? `Giỏ hàng · ${cartView.itemCount} linh kiện`
            : "Giỏ hàng"
        }
        title="Kiểm tra trước khi đặt."
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

      {canOrder && cartView && (
        <form
          onSubmit={form.submit}
          className="grid grid-cols-1 gap-6 max-md:pb-24 md:grid-cols-5"
        >
          <div className="flex flex-col gap-6 md:col-span-3">
            <ul
              aria-label="Linh kiện trong giỏ"
              className="flex flex-col gap-2.5"
            >
              {cartView.items.map((item) => (
                <CartItemRow key={item.partId} item={item} />
              ))}
            </ul>
            {errors.form && <FormAlert message={errors.form} />}
            <CheckoutFulfillmentFields
              fulfillment={form.fulfillment}
              errors={errors}
              disabled={submitting}
              onFulfillment={form.handleFulfillment}
            />
            <CheckoutPaymentFields
              fulfillment={form.fulfillment}
              paymentMethod={form.paymentMethod}
              errors={errors}
              disabled={submitting}
              onPaymentMethod={form.setPaymentMethod}
            />
            <section
              aria-labelledby={`${fieldId}-details`}
              className="flex flex-col gap-4"
            >
              <h2 id={`${fieldId}-details`} className={CHECKOUT_SECTION_TITLE}>
                Thông tin nhận hàng
              </h2>
              <CheckoutContactFields
                fieldId={fieldId}
                guest={form.guest}
                recipientName={form.recipientName}
                phone={form.phone}
                email={form.guestEmail}
                errors={errors}
                disabled={submitting}
                onName={form.setGuestName}
                onPhone={form.setGuestPhone}
                onEmail={form.setGuestEmail}
              />
              {form.fulfillment === "delivery" && (
                <CheckoutAddressFields
                  fieldId={fieldId}
                  address={form.address}
                  addressLat={form.addressLat}
                  addressLng={form.addressLng}
                  errors={errors}
                  disabled={submitting}
                  onAddress={form.setAddress}
                  onCoords={form.setCoords}
                  onGeocode={form.handleGeocode}
                />
              )}
              <CheckoutExtras
                fieldId={fieldId}
                guest={form.guest}
                subtotal={cartView.subtotal}
                walletId={form.walletId}
                walletError={errors.walletId}
                note={form.note}
                disabled={submitting}
                onWallet={form.handleWallet}
                onNote={form.setNote}
              />
            </section>
          </div>

          <CheckoutSummary
            cart={cartView}
            fulfillment={form.fulfillment}
            paymentMethod={form.paymentMethod}
            discount={form.walletDiscount}
            submitting={submitting}
          />
        </form>
      )}

      <div className="hidden sm:block">
        <PromoTeaser audience="order" />
      </div>
    </div>
  );
}
