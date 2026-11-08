# Balance Payment Setup

Updated: 2026-08-10

## What Is Ready

After a deposit is recorded, an admin can open a booking and choose **Email Balance Link** or **Copy Payment Link**.

The generated link:

- opens the existing `/complete-payment` page;
- shows the remaining balance from the stored booking amount;
- allows the customer to add an optional tip;
- uses Stripe to verify the payment server-side;
- expires after 30 days;
- is tied to that booking and its customer email;
- cannot be reused after the booking is fully paid.

The admin dialog also creates a QR code. This can be scanned at an in-person session so the customer can pay from their phone.

Customers can still use the existing booking ID and email lookup. For a deposit-paid booking, that lookup issues the same secure payment token.

## Payment Paths

1. Initial deposit: customer signs the agreement and pays the deposit.
2. Initial full payment: customer can pay the full booking amount during the first checkout.
3. Remaining balance: customer uses the secure link or QR code after the deposit.

Stripe idempotency keys prevent repeated clicks from creating duplicate payment intents for the same booking, payment type, and tip amount.

## Still External

Zoho and a real domain are not needed for the app-side flow above. They are needed for production delivery and trust:

- verified sender address and automatic email delivery;
- domain DNS records and the production `APP_ORIGIN`;
- public HTTPS Stripe webhook endpoint;
- automatic text messages, unless a separate SMS provider is connected.

Until then, the admin can copy the link into any text or email manually, or open the pre-filled email draft from the admin dashboard.

## Testing Checklist

- Complete an initial deposit in Stripe test mode.
- Confirm the booking shows `deposit_paid` in Admin.
- Generate the balance link and scan or open it in a clean browser session.
- Confirm the exact remaining balance appears.
- Complete the balance payment with a Stripe test card.
- Confirm the booking changes to `paid`.
- Reopen the old link and confirm another payment cannot be made.
- Test initial full payment separately to confirm it is not incorrectly treated as a balance payment.
