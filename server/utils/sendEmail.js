const nodemailer = require('nodemailer');
const dns = require('dns');

// ─── Resolve smtp.gmail.com to IPv4 (Node TLS ignores `family` option) ───────
const resolveIPv4 = (hostname) =>
    new Promise((resolve, reject) =>
        dns.lookup(hostname, { family: 4 }, (err, address) =>
            err ? reject(err) : resolve(address)
        )
    );

// ─── Transporter ─────────────────────────────────────────────────────────────
const createTransporter = async () => {
    const smtpHostname = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpIPv4 = await resolveIPv4(smtpHostname);
    console.log(`[Email] Resolved ${smtpHostname} → ${smtpIPv4} (IPv4)`);

    return nodemailer.createTransport({
        host:    smtpIPv4,
        port:    Number(process.env.SMTP_PORT) || 465,
        secure:  process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            servername: smtpHostname,
            rejectUnauthorized: true,
        },
        connectionTimeout: 10_000,
        greetingTimeout:   10_000,
        socketTimeout:     15_000,
    });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (n) =>
    `₹${Number(n || 0).toLocaleString('en-IN')}`;

const formatDate = (d) =>
    new Date(d || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });

// ─── HTML Email Template — Flipkart style ─────────────────────────────────────
const buildOrderEmailHTML = (order, recipientType = 'customer') => {
    const isAdmin = recipientType === 'admin';
    const addr    = order.shippingAddress || {};
    const items   = order.orderItems || [];
    const shortId = order._id?.toString().slice(-8).toUpperCase();

    // ── Order status stepper ─────────────────────────────────────────────────
    const steps = ['Placed', 'Packed', 'Shipped', 'Delivered'];
    const activeStep = order.orderStatus === 'cancelled' ? -1
        : order.orderStatus === 'delivered' ? 3
        : order.orderStatus === 'shipped'   ? 2
        : order.orderStatus === 'packed'    ? 1
        : 0; // confirmed / pending

    const stepperCells = steps.map((step, i) => {
        const done   = i <= activeStep;
        const active = i === activeStep;
        const circleBg   = done  ? '#9A3412' : '#e5e7eb';
        const circleText = done  ? '#ffffff'  : '#9ca3af';
        const labelColor = active ? '#9A3412'  : done ? '#374151' : '#9ca3af';
        const labelWt    = active ? '700' : '400';
        // connector line after each step except last
        const connector = i < steps.length - 1
            ? `<td style="width:100%;vertical-align:middle;padding-bottom:18px;">
                 <div style="height:2px;background:${i < activeStep ? '#9A3412' : '#e5e7eb'};"></div>
               </td>`
            : '';

        return `
        <td style="text-align:center;white-space:nowrap;vertical-align:top;">
          <div style="width:28px;height:28px;border-radius:50%;background:${circleBg};
                      color:${circleText};font-size:12px;font-weight:700;
                      line-height:28px;text-align:center;margin:0 auto;">
            ${done ? '✓' : ''}
          </div>
          <p style="margin:5px 0 0;font-size:11px;color:${labelColor};
                    font-weight:${labelWt};">${step}</p>
        </td>
        ${connector}`;
    }).join('');

    // ── Product rows ─────────────────────────────────────────────────────────
    const productRows = items.map(item => `
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="width:72px;vertical-align:top;">
              ${item.image
                ? `<img src="${item.image}" width="64" height="64"
                        style="border-radius:6px;border:1px solid #e5e7eb;
                               object-fit:cover;display:block;" alt="${item.name}"/>`
                : `<div style="width:64px;height:64px;background:#fef3c7;border-radius:6px;
                              border:1px solid #fde68a;text-align:center;
                              line-height:64px;font-size:26px;">🧣</div>`
              }
            </td>
            <td style="padding-left:14px;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;
                        color:#111827;line-height:1.4;">${item.name}</p>
              <p style="margin:0 0 2px;font-size:12px;color:#6b7280;">
                Seller: Kumaran Silks
              </p>
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">
                Qty: ${item.qty}
              </p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#9A3412;">
                ${formatPrice(item.price * item.qty)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${isAdmin ? 'New Order' : 'Order Placed'} – Kumaran Silks</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;
             font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f3f4f6;padding:20px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;">

        <!-- ══ HEADER ══════════════════════════════════════════════════ -->
        <tr>
          <td style="background:#9A3412;border-radius:4px 4px 0 0;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:14px 20px;">
                  <span style="font-size:20px;font-weight:700;color:#ffffff;
                               font-family:Georgia,serif;letter-spacing:0.5px;">
                    Kumaran Silks
                  </span>
                  <span style="font-size:11px;color:#fcd9b6;margin-left:8px;
                               font-style:italic;font-family:Georgia,serif;">
                    Premium Silk Sarees
                  </span>
                </td>
                <td style="padding:14px 20px;text-align:right;">
                  <span style="font-size:14px;font-weight:600;color:#ffffff;">
                    ${isAdmin ? 'New Order Received 🛒' : 'Order Placed ✅'}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ MAIN CARD ════════════════════════════════════════════════ -->
        <tr>
          <td style="background:#ffffff;padding:20px 20px 0;">

            <!-- Greeting -->
            <p style="margin:0 0 4px;font-size:15px;color:#111827;font-weight:600;">
              Hi ${addr.fullName || (isAdmin ? 'Admin' : 'Valued Customer')},
            </p>
            <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">
              ${isAdmin
                ? `A new order has been placed.`
                : `Your order has been successfully placed.`}
            </p>

            <!-- Order date + ID row -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="margin-bottom:16px;">
              <tr>
                <td style="font-size:12px;color:#6b7280;">
                  Order placed on &nbsp;
                  <strong style="color:#111827;">
                    ${formatDate(order.createdAt || order.paidAt)}
                  </strong>
                </td>
                <td style="font-size:12px;color:#6b7280;text-align:right;">
                  Order ID &nbsp;
                  <strong style="color:#111827;word-break:break-all;">
                    ${order._id?.toString().toUpperCase() || shortId}
                  </strong>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ══ ORDER DETAIL BOX ══════════════════════════════════════════ -->
        <tr>
          <td style="background:#ffffff;padding:0 20px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">

              <!-- Stepper -->
              <tr>
                <td style="padding:20px 16px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr valign="middle">
                      ${stepperCells}
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td>
                  <hr style="border:none;border-top:1px solid #f3f4f6;margin:0;"/>
                </td>
              </tr>

              <!-- Delivery info LEFT + Address RIGHT -->
              <tr>
                <td style="padding:0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>

                      <!-- Left col: delivery & payment -->
                      <td style="padding:16px 18px;vertical-align:top;
                                 width:52%;border-right:1px solid #f3f4f6;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-bottom:12px;">
                              <p style="margin:0;font-size:12px;color:#9ca3af;">Delivery</p>
                              <p style="margin:4px 0 0;font-size:13px;
                                        font-weight:600;color:#16a34a;">
                                Expected in 5–7 business days
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:12px;">
                              <p style="margin:0;font-size:12px;color:#9ca3af;">Amount Paid</p>
                              <p style="margin:4px 0 0;font-size:15px;
                                        font-weight:700;color:#9A3412;">
                                ${formatPrice(order.totalPrice)}
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:14px;">
                              <p style="margin:0;font-size:12px;color:#9ca3af;">Payment</p>
                              <p style="margin:4px 0 0;font-size:13px;color:#374151;">
                                ${order.paymentMethod === 'cod'
                                  ? 'Cash on Delivery'
                                  : 'Online Payment (Stripe)'}
                              </p>
                            </td>
                          </tr>
                          <!-- Track Order button -->
                          <tr>
                            <td>
                              <a href="http://localhost:5173/track-order"
                                 style="display:inline-block;background:#9A3412;
                                        color:#ffffff;font-size:13px;font-weight:600;
                                        text-decoration:none;padding:9px 18px;
                                        border-radius:3px;letter-spacing:0.3px;">
                                Track Your Order
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>

                      <!-- Right col: delivery address -->
                      <td style="padding:16px 18px;vertical-align:top;width:48%;">
                        <p style="margin:0 0 10px;font-size:13px;font-weight:700;
                                  color:#111827;">Delivery Address</p>
                        <p style="margin:0 0 3px;font-size:13px;font-weight:600;
                                  color:#111827;">${addr.fullName || ''}</p>
                        <p style="margin:0 0 3px;font-size:12px;color:#4b5563;
                                  line-height:1.6;">${addr.address || ''}</p>
                        <p style="margin:0 0 3px;font-size:12px;color:#4b5563;">
                          ${addr.city || ''}, ${addr.state || ''} – ${addr.postalCode || ''}
                        </p>
                        <p style="margin:0 0 10px;font-size:12px;color:#4b5563;">
                          ${addr.country || ''}
                        </p>
                        ${addr.phone ? `
                        <p style="margin:0 0 2px;font-size:12px;color:#9ca3af;">
                          SMS updates sent to
                        </p>
                        <p style="margin:0;font-size:13px;font-weight:600;color:#111827;">
                          ${addr.phone}
                        </p>` : ''}
                      </td>

                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Notice bar -->
              <tr>
                <td style="background:#f9fafb;padding:11px 18px;
                           border-top:1px solid #f3f4f6;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    You will receive the next update when your item is
                    packed/shipped by our team.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- ══ PRODUCT LIST ══════════════════════════════════════════════ -->
        <tr>
          <td style="background:#ffffff;padding:0 20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e5e7eb;border-radius:4px;
                          overflow:hidden;margin-bottom:16px;">
              ${productRows}
            </table>
          </td>
        </tr>

        <!-- ══ AMOUNT SUMMARY ════════════════════════════════════════════ -->
        <tr>
          <td style="background:#ffffff;padding:4px 20px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#6b7280;padding-bottom:5px;">
                  Subtotal
                </td>
                <td style="font-size:13px;color:#374151;text-align:right;
                           padding-bottom:5px;">
                  ${formatPrice(order.itemsPrice)}
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#6b7280;padding-bottom:5px;">
                  Shipping
                </td>
                <td style="font-size:13px;text-align:right;padding-bottom:5px;
                           color:${order.shippingPrice === 0 ? '#16a34a' : '#374151'};
                           font-weight:${order.shippingPrice === 0 ? '600' : '400'};">
                  ${order.shippingPrice === 0 ? 'FREE' : formatPrice(order.shippingPrice)}
                </td>
              </tr>
              ${order.discountAmount > 0 ? `
              <tr>
                <td style="font-size:13px;color:#6b7280;padding-bottom:5px;">
                  Discount
                </td>
                <td style="font-size:13px;color:#16a34a;font-weight:600;
                           text-align:right;padding-bottom:5px;">
                  − ${formatPrice(order.discountAmount)}
                </td>
              </tr>` : ''}
              <tr>
                <td colspan="2">
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:6px 0;"/>
                </td>
              </tr>
              <tr>
                <td style="font-size:14px;font-weight:700;color:#111827;">
                  Amount Paid
                </td>
                <td style="font-size:16px;font-weight:700;color:#9A3412;
                           text-align:right;">
                  ${formatPrice(order.totalPrice)}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ THANK YOU ═════════════════════════════════════════════════ -->
        <tr>
          <td style="background:#ffffff;padding:16px 20px;
                     border-top:1px solid #f3f4f6;">
            <p style="margin:0 0 5px;font-size:14px;font-weight:600;color:#111827;">
              Thank you for shopping with Kumaran Silks!
            </p>
            <p style="margin:0;font-size:13px;color:#6b7280;">
              Got Questions? Please get in touch with our
              <a href="mailto:harinin055@gmail.com"
                 style="color:#9A3412;font-weight:600;text-decoration:none;">
                24×7 Customer Care
              </a>
            </p>
          </td>
        </tr>

        <!-- ══ FOOTER ════════════════════════════════════════════════════ -->
        <tr>
          <td style="background:#f9fafb;padding:14px 20px;
                     border-top:1px solid #e5e7eb;border-radius:0 0 4px 4px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <span style="font-size:16px;font-weight:700;color:#9A3412;
                               font-family:Georgia,serif;">
                    Kumaran Silks
                  </span>
                  <p style="margin:3px 0 0;font-size:11px;color:#9ca3af;">
                    © ${new Date().getFullYear()} Kumaran Silks. All rights reserved.
                  </p>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <a href="mailto:harinin055@gmail.com"
                     style="font-size:11px;color:#9A3412;text-decoration:none;">
                    harinin055@gmail.com
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
};

// ─── Main send function ───────────────────────────────────────────────────────
/**
 * Send order confirmation emails after a delay.
 * - Customer receives a "Thank you" email (if their email is available)
 * - Admin (harinin055@gmail.com) always receives a new-order notification
 *
 * @param {Object} order           - The saved Mongoose order document
 * @param {string} customerEmail   - Customer's email address
 * @param {number} delayMs         - Delay in milliseconds (default: 30 000)
 */
const sendOrderConfirmationEmails = (order, customerEmail, delayMs) => {
    const ADMIN_EMAIL  = process.env.ADMIN_EMAIL     || 'harinin055@gmail.com';
    const FROM_NAME    = process.env.EMAIL_FROM_NAME || 'Kumaran Silks';
    const FROM_ADDR    = process.env.EMAIL_USER;
    const DELAY        = delayMs ?? Number(process.env.EMAIL_DELAY_MS || 30_000);

    console.log(`[Email] Scheduled for order #${order._id?.toString().slice(-8).toUpperCase()} — fires in ${DELAY / 1000}s`);

    setTimeout(async () => {
        try {
            const transporter = await createTransporter();

            await transporter.verify();
            console.log(`[Email] SMTP OK ✓  ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || 465}`);

            const shortId = order._id?.toString().slice(-8).toUpperCase();
            const sends = [];

            // 1️⃣  Customer confirmation email
            if (customerEmail) {
                sends.push(
                    transporter.sendMail({
                        from: `"${FROM_NAME}" <${FROM_ADDR}>`,
                        to: customerEmail,
                        subject: `✅ Order Placed – #${shortId} | ${FROM_NAME}`,
                        html: buildOrderEmailHTML(order, 'customer'),
                    }).then(() => console.log(`[Email] ✓ Customer confirmation → ${customerEmail}`))
                );
            } else {
                console.warn(`[Email] ⚠ No customer email for order #${shortId} — skipping customer email`);
            }

            // 2️⃣  Admin new-order notification
            sends.push(
                transporter.sendMail({
                    from: `"${FROM_NAME} Orders" <${FROM_ADDR}>`,
                    to: ADMIN_EMAIL,
                    subject: `🛒 New Order #${shortId} – ${formatPrice(order.totalPrice)} | ${FROM_NAME}`,
                    html: buildOrderEmailHTML(order, 'admin'),
                }).then(() => console.log(`[Email] ✓ Admin notification → ${ADMIN_EMAIL}`))
            );

            await Promise.all(sends);
            console.log(`[Email] All done for order #${shortId}`);

        } catch (err) {
            console.error('[Email] ✗ Send failed:', err.message);
            if (err.code === 'EAUTH') {
                console.error('[Email]   → Auth error. Check EMAIL_USER / EMAIL_PASS in .env');
                console.error('[Email]   → App Password: https://myaccount.google.com/apppasswords');
            }
        }
    }, DELAY);
};

module.exports = { sendOrderConfirmationEmails };
