import nodemailer from "nodemailer";
import type { BeatPurchase, Booking, MembershipPlan, MembershipSubscription, User } from "@shared/schema";

type MailMessage = {
  from: string;
  replyTo?: string;
  to: string;
  subject: string;
  text: string;
};

type MailTransport = {
  sendMail(message: MailMessage): Promise<unknown>;
  verify(): Promise<unknown>;
};

function zeptoAuthorization(token: string) {
  const trimmed = token.trim();
  return /^Zoho-enczapikey\s/i.test(trimmed) ? trimmed : `Zoho-enczapikey ${trimmed}`;
}

function createZeptoApiTransport(token: string, senderAddress: string, senderName: string): MailTransport {
  return {
    async sendMail(message) {
      const response = await fetch("https://api.zeptomail.com/v1.1/email", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: zeptoAuthorization(token),
        },
        body: JSON.stringify({
          from: { address: senderAddress, name: senderName },
          to: [{ email_address: { address: message.to } }],
          ...(message.replyTo ? { reply_to: [{ address: message.replyTo }] } : {}),
          subject: message.subject,
          textbody: message.text,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const details = (await response.text()).slice(0, 500);
        throw new Error(`ZeptoMail API returned ${response.status}${details ? `: ${details}` : ""}`);
      }

      return response.json();
    },
    async verify() {
      if (!token.trim() || !senderAddress.trim()) {
        throw new Error("ZeptoMail API email is not configured");
      }
    },
  };
}

function mailConfiguration() {
  const host = process.env.ZOHO_SMTP_HOST;
  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASSWORD;
  const senderAddress = process.env.EMAIL_FROM_ADDRESS || user;
  const senderName = process.env.EMAIL_FROM_NAME || "Music Life Studios";
  const zeptoToken = process.env.ZEPTOMAIL_API_TOKEN
    || (host?.toLowerCase().includes("zeptomail") ? pass : undefined);
  if (!senderAddress) return null;

  let transport: MailTransport;
  if (zeptoToken) {
    transport = createZeptoApiTransport(zeptoToken, senderAddress, senderName);
  } else {
    if (!host || !user || !pass) return null;
    const port = Number(process.env.ZOHO_SMTP_PORT || 465);
    const smtp = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: { user, pass },
    });
    transport = {
      sendMail: (message) => smtp.sendMail(message),
      verify: () => smtp.verify(),
    };
  }

  return {
    transport,
    from: `"${senderName}" <${senderAddress}>`,
    replyTo: process.env.EMAIL_REPLY_TO || senderAddress,
    admin: process.env.ADMIN_NOTIFICATION_EMAIL || senderAddress,
  };
}

function bookingSummary(booking: Booking) {
  const sessionDate = new Date(booking.date);
  return {
    date: sessionDate.toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }),
    time: sessionDate.toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }),
    duration: `${booking.duration / 60} hour${booking.duration === 60 ? "" : "s"}`,
    amount: `$${(booking.amount / 100).toFixed(2)}`,
  };
}

export function isEmailConfigured() {
  return Boolean(mailConfiguration());
}

export async function verifyEmailConnection() {
  const config = mailConfiguration();
  if (!config) throw new Error("Transactional email is not configured");
  await config.transport.verify();
}

export async function sendWelcomeEmail(user: Pick<User, "email" | "firstName" | "username">) {
  const config = mailConfiguration();
  if (!config) return false;
  await config.transport.sendMail({
    from: config.from, replyTo: config.replyTo, to: user.email,
    subject: "Welcome to Music Life Studios",
    text: `Hi ${user.firstName || user.username},\n\nWelcome to Music Life Studios! Your account is ready. You can sign in to book studio time and manage your sessions.\n\nIf you have questions, reply to this email.\n\nMusic Life Studios`,
  });
  return true;
}

export async function sendEmailVerificationEmail(user: Pick<User, "email" | "firstName" | "username">, url: string) {
  const config = mailConfiguration();
  if (!config) return false;
  await config.transport.sendMail({
    from: config.from, replyTo: config.replyTo, to: user.email,
    subject: "Verify your Music Life Studios email",
    text: `Hi ${user.firstName || user.username},\n\nVerify your email address using this secure link:\n${url}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this message.\n\nMusic Life Studios`,
  });
  return true;
}

export async function sendPasswordResetEmail(user: Pick<User, "email" | "firstName" | "username">, url: string) {
  const config = mailConfiguration();
  if (!config) return false;
  await config.transport.sendMail({
    from: config.from, replyTo: config.replyTo, to: user.email,
    subject: "Reset your Music Life Studios password",
    text: `Hi ${user.firstName || user.username},\n\nReset your password using this secure link:\n${url}\n\nThis link expires in 30 minutes and stops working after your password changes. If you did not request this, you can ignore this message.\n\nMusic Life Studios`,
  });
  return true;
}

export async function sendClientConfirmationEmail(booking: Booking, transactionId: string, amountPaid?: number) {
  const config = mailConfiguration();
  if (!config) {
    console.info(`[EMAIL DISABLED] Booking confirmation not sent for booking ${booking.id}`);
    return false;
  }

  const summary = bookingSummary(booking);
  await config.transport.sendMail({
    from: config.from,
    replyTo: config.replyTo,
    to: booking.email,
    subject: `Music Life Studios ${booking.paymentStatus === "deposit_paid" ? "deposit received" : "payment received"} #${booking.id}`,
    text: `Hi ${booking.name},\n\nWe received your ${booking.paymentStatus === "deposit_paid" ? "booking deposit" : "booking payment"}.\n\nDate: ${summary.date}\nTime: ${summary.time} CT\nDuration: ${summary.duration}\nBooking total: ${summary.amount}\n${amountPaid === undefined ? "" : `Paid in this payment: $${(amountPaid / 100).toFixed(2)}\n`}Remaining booking balance: $${(booking.paymentStatus === "deposit_paid" ? (booking.amount - Math.round(booking.amount * 0.5)) / 100 : 0).toFixed(2)}\nTransaction: ${transactionId}\n\nPlease contact us at least 24 hours in advance if you need to cancel or reschedule.\n\nMusic Life Studios`,
  });
  return true;
}

export async function sendBalancePaymentEmail(booking: Booking, paymentUrl: string, remainingAmount: number) {
  const config = mailConfiguration();
  if (!config) return false;
  const summary = bookingSummary(booking);
  await config.transport.sendMail({
    from: config.from,
    replyTo: config.replyTo,
    to: booking.email,
    subject: `Music Life Studios remaining balance #${booking.id}`,
    text: `Hi ${booking.name},\n\nYour session is complete. Your remaining balance is $${(remainingAmount / 100).toFixed(2)}.\n\nSession: ${summary.date} at ${summary.time} CT\nComplete payment securely here:\n${paymentUrl}\n\nThis secure link expires in 30 days.\n\nMusic Life Studios`,
  });
  return true;
}

export async function sendAppointmentReminderEmail(booking: Booking, reminderLabel: "24-hour" | "2-hour") {
  const config = mailConfiguration();
  if (!config) return false;
  const summary = bookingSummary(booking);
  await config.transport.sendMail({
    from: config.from,
    replyTo: config.replyTo,
    to: booking.email,
    subject: `${reminderLabel === "24-hour" ? "Tomorrow's" : "Upcoming"} Music Life Studios session #${booking.id}`,
    text: `Hi ${booking.name},\n\nThis is your ${reminderLabel} reminder for your Music Life Studios session.\n\nDate: ${summary.date}\nTime: ${summary.time} CT\nDuration: ${summary.duration}\n\nIf you need help, reply to this email.\n\nMusic Life Studios`,
  });
  return true;
}

export async function sendFeedbackRequestEmail(booking: Booking, feedbackUrl: string) {
  const config = mailConfiguration();
  if (!config) return false;
  await config.transport.sendMail({
    from: config.from,
    replyTo: config.replyTo,
    to: booking.email,
    subject: `How was your Music Life Studios session?`,
    text: `Hi ${booking.name},\n\nThank you for working with Music Life Studios. Please rate your experience using this secure link:\n${feedbackUrl}\n\nThe link expires in 30 days.\n\nMusic Life Studios`,
  });
  return true;
}

export async function sendMembershipLifecycleEmail(
  user: Pick<User, "email" | "firstName" | "username">,
  plan: MembershipPlan,
  kind: "renewal" | "payment_failed" | "cancelled",
  effectiveDate?: Date,
) {
  const config = mailConfiguration();
  if (!config) return false;
  const name = user.firstName || user.username;
  const formattedDate = effectiveDate?.toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" });
  const content = kind === "renewal"
    ? { subject: `${plan.name} renews soon`, body: `Hi ${name},\n\nYour ${plan.name} membership is scheduled to renew${formattedDate ? ` on ${formattedDate}` : " soon"}. You can review your membership from your Music Life Studios account.\n\nMusic Life Studios` }
    : kind === "payment_failed"
      ? { subject: `${plan.name} payment needs attention`, body: `Hi ${name},\n\nWe could not verify the latest payment for your ${plan.name} membership. Please contact Music Life Studios so we can help keep your benefits active.\n\nMusic Life Studios` }
      : { subject: `${plan.name} membership cancelled`, body: `Hi ${name},\n\nYour ${plan.name} membership has been cancelled${formattedDate ? ` effective ${formattedDate}` : ""}. Reply if you have questions.\n\nMusic Life Studios` };
  await config.transport.sendMail({ from: config.from, replyTo: config.replyTo, to: user.email, subject: content.subject, text: content.body });
  return true;
}

export async function sendRewardExpirationEmail(
  user: Pick<User, "email" | "firstName" | "username">,
  rewardName: string,
  deadline: Date,
) {
  const config = mailConfiguration();
  if (!config) return false;
  const formattedDate = deadline.toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" });
  await config.transport.sendMail({
    from: config.from,
    replyTo: config.replyTo,
    to: user.email,
    subject: `Your Music Life Studios reward expires soon`,
    text: `Hi ${user.firstName || user.username},\n\nYour ${rewardName} expires on ${formattedDate}. Contact Music Life Studios before the deadline to redeem it.\n\nMusic Life Studios`,
  });
  return true;
}

export async function sendAdminNotificationEmail(booking: Booking, transactionId: string, amountPaid?: number) {
  const config = mailConfiguration();
  if (!config) {
    console.info(`[EMAIL DISABLED] Admin notification not sent for booking ${booking.id}`);
    return false;
  }

  const summary = bookingSummary(booking);
  await config.transport.sendMail({
    from: config.from,
    replyTo: booking.email,
    to: config.admin,
    subject: `Booking ${booking.paymentStatus === "deposit_paid" ? "deposit" : "payment"} received #${booking.id}: ${booking.name}`,
    text: `A booking payment was verified.\n\nCustomer: ${booking.name}\nEmail: ${booking.email}\nDate: ${summary.date}\nTime: ${summary.time} CT\nDuration: ${summary.duration}\nBooking total: ${summary.amount}\n${amountPaid === undefined ? "" : `Paid in this payment: $${(amountPaid / 100).toFixed(2)}\n`}Payment status: ${booking.paymentStatus}\nTransaction: ${transactionId}\n\nNotes: ${booking.details || "None provided"}`,
  });
  return true;
}

export async function sendMembershipConfirmationEmail(
  user: Pick<User, "email" | "firstName" | "username">,
  plan: MembershipPlan,
  membership: MembershipSubscription,
) {
  const config = mailConfiguration();
  if (!config) return false;
  const paidThrough = new Date(membership.paidThroughDate).toLocaleDateString("en-US", {
    timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric",
  });
  await config.transport.sendMail({
    from: config.from, replyTo: config.replyTo, to: user.email,
    subject: `${plan.name} membership activated`,
    text: `Hi ${user.firstName || user.username},\n\nYour ${plan.name} membership is active. Your current paid-through date is ${paidThrough}. You can view your membership and included benefits from your Music Life Studios account.\n\nIf you have questions, reply to this email.\n\nMusic Life Studios`,
  });
  return true;
}

export async function sendBeatLicenseRequestEmails(purchase: BeatPurchase, beatTitle: string) {
  const config = mailConfiguration();
  if (!config) return false;
  const price = `$${(purchase.price / 100).toFixed(2)}`;
  await Promise.all([
    config.transport.sendMail({
      from: config.from, replyTo: config.replyTo, to: purchase.customerEmail,
      subject: `Beat license request received: ${beatTitle}`,
      text: `Hi ${purchase.customerName},\n\nWe received your ${purchase.licenseType} license request for “${beatTitle}” at ${price}. No payment has been collected and the license is not active yet. We’ll contact you with verified checkout and fulfillment instructions.\n\nMusic Life Studios`,
    }),
    config.transport.sendMail({
      from: config.from, replyTo: purchase.customerEmail, to: config.admin,
      subject: `New ${purchase.licenseType} beat license request: ${beatTitle}`,
      text: `Customer: ${purchase.customerName}\nEmail: ${purchase.customerEmail}\nBeat: ${beatTitle}\nLicense: ${purchase.licenseType}\nPrice: ${price}\nStatus: pending payment`,
    }),
  ]);
  return true;
}

export async function sendBeatLicensePaymentEmails(purchase: BeatPurchase, beatTitle: string, deliveryReady: boolean, amountPaidCents = purchase.price) {
  const config = mailConfiguration();
  if (!config) return false;
  const price = `$${(amountPaidCents / 100).toFixed(2)}`;
  await Promise.all([
    config.transport.sendMail({
      from: config.from, replyTo: config.replyTo, to: purchase.customerEmail,
      subject: `Beat license payment received: ${beatTitle}`,
      text: deliveryReady
        ? `Hi ${purchase.customerName},\n\nYour ${price} payment for the ${purchase.licenseType} license for “${beatTitle}” was verified. Your license is active and your files are ready to download from your Music Life Studios account.\n\nMusic Life Studios`
        : `Hi ${purchase.customerName},\n\nYour ${price} payment for the ${purchase.licenseType} license for “${beatTitle}” was verified. Your files are being prepared, and the license will show as active when the package is uploaded. We will email you as soon as it is ready to download from your Music Life Studios account.\n\nMusic Life Studios`,
    }),
    config.transport.sendMail({
      from: config.from, replyTo: purchase.customerEmail, to: config.admin,
      subject: deliveryReady ? `Beat license paid: ${beatTitle}` : `ACTION REQUIRED: Prepare ${purchase.licenseType} files for ${beatTitle}`,
      text: `Customer: ${purchase.customerName}\nEmail: ${purchase.customerEmail}\nBeat: ${beatTitle}\nLicense: ${purchase.licenseType}\nPaid: ${price}\nTransaction: ${purchase.transactionId}\nDelivery: ${deliveryReady ? "ready for customer download" : "package must be bounced and uploaded in the admin Beat Catalog"}`,
    }),
  ]);
  return true;
}

export async function sendBeatLicenseDeliveryReadyEmail(purchase: BeatPurchase, beatTitle: string) {
  const config = mailConfiguration();
  if (!config) return false;
  await config.transport.sendMail({
    from: config.from,
    replyTo: config.replyTo,
    to: purchase.customerEmail,
    subject: `Your beat files are ready: ${beatTitle}`,
    text: `Hi ${purchase.customerName},\n\nYour ${purchase.licenseType} audio package for “${beatTitle}” is now ready. Sign in to your Music Life Studios account and open Beat License Requests to download it securely.\n\nMusic Life Studios`,
  });
  return true;
}

export default {
  sendClientConfirmationEmail,
  sendAdminNotificationEmail
};
