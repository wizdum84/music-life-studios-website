import nodemailer from "nodemailer";
import type { BeatPurchase, Booking, MembershipPlan, MembershipSubscription, User } from "@shared/schema";

function mailConfiguration() {
  const host = process.env.ZOHO_SMTP_HOST;
  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASSWORD;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.ZOHO_SMTP_PORT || 465);
  return {
    transport: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: { user, pass },
    }),
    from: `"${process.env.EMAIL_FROM_NAME || "Music Life Studios"}" <${user}>`,
    replyTo: process.env.EMAIL_REPLY_TO || user,
    admin: process.env.ADMIN_NOTIFICATION_EMAIL || user,
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
  return Boolean(process.env.ZOHO_SMTP_HOST && process.env.ZOHO_SMTP_USER && process.env.ZOHO_SMTP_PASSWORD);
}

export async function verifyEmailConnection() {
  const config = mailConfiguration();
  if (!config) throw new Error("Zoho SMTP is not configured");
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

export async function sendBeatLicensePaymentEmails(purchase: BeatPurchase, beatTitle: string) {
  const config = mailConfiguration();
  if (!config) return false;
  const price = `$${(purchase.price / 100).toFixed(2)}`;
  await Promise.all([
    config.transport.sendMail({
      from: config.from, replyTo: config.replyTo, to: purchase.customerEmail,
      subject: `Beat license payment received: ${beatTitle}`,
      text: `Hi ${purchase.customerName},\n\nYour ${price} payment for the ${purchase.licenseType} license for “${beatTitle}” was verified. Your license is active. Music Life Studios will send the applicable audio files and fulfillment instructions separately.\n\nMusic Life Studios`,
    }),
    config.transport.sendMail({
      from: config.from, replyTo: purchase.customerEmail, to: config.admin,
      subject: `Beat license paid: ${beatTitle}`,
      text: `Customer: ${purchase.customerName}\nEmail: ${purchase.customerEmail}\nBeat: ${beatTitle}\nLicense: ${purchase.licenseType}\nPaid: ${price}\nTransaction: ${purchase.transactionId}`,
    }),
  ]);
  return true;
}

export default {
  sendClientConfirmationEmail,
  sendAdminNotificationEmail
};
