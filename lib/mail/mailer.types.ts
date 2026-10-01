// Transport-agnostic message shape. The OTP templates produce one of these;
// the mailer knows nothing about OTP business rules.

export type MailAttachment = {
  filename: string;
  /** Absolute path on disk — nodemailer streams the file from here. */
  path: string;
  /** Content-ID the html body references via <img src="cid:...">. */
  cid: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  /** Plain-text alternative. Always provided so the mail never renders as HTML source. */
  text: string;
  html: string;
  /** Inline images (CID) — e.g. the brand logo in the shared email shell. */
  attachments?: MailAttachment[];
};
