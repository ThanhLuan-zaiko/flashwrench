// Voucher grant mail: subject, body and wallet link.
import { describe, expect, test } from "bun:test";
import { buildVoucherGrantedEmail } from "@/lib/mail/voucher-email";

describe("buildVoucherGrantedEmail", () => {
  test("names the campaign and the saving in every part", () => {
    const content = buildVoucherGrantedEmail({
      campaignName: "Chao mung tai khoan moi",
      discountLabel: "Giảm 50.000đ",
      minOrderLabel: "Áp dụng cho đơn từ 100.000đ",
      expiresLabel: null,
    });
    expect(content.subject).toContain("khuyến mãi mới");
    expect(content.subject).toContain("Chao mung tai khoan moi");
    expect(content.text).toContain("Giảm 50.000đ");
    expect(content.text).toContain("100.000đ");
    expect(content.text).toContain("/vouchers");
    expect(content.html).toContain("Mở ví voucher");
  });

  test("escapes campaign names before inlining them as html", () => {
    const content = buildVoucherGrantedEmail({
      campaignName: "<b>Voucher</b>",
      discountLabel: "Miễn phí công sửa",
      minOrderLabel: null,
      expiresLabel: "Hạn dùng đến 01/01/2027",
    });
    expect(content.html).not.toContain("<b>Voucher</b>");
    expect(content.html).toContain("&lt;b&gt;Voucher&lt;/b&gt;");
    expect(content.text).toContain("Miễn phí công sửa");
  });
});
