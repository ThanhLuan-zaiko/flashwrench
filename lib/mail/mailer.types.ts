// Transport-agnostic message shape. The OTP templates produce one of these;
// the mailer knows nothing about OTP business rules.

export type MailMessage = {
  to: string;
  subject: string;
  /** Plain-text alternative. Always provided so the mail never renders as HTML source. */
  text: string;
  html: string;
};
