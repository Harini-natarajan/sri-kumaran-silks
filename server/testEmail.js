const nodemailer = require('nodemailer');
const dns = require('dns');
require('dotenv').config();

const { sendOrderConfirmationEmails } = require('./utils/sendEmail');

// ── Fake order for preview ────────────────────────────────────────────────────
const fakeOrder = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    orderStatus: 'confirmed',
    paymentMethod: 'cod',
    itemsPrice: 4500,
    shippingPrice: 0,
    totalPrice: 4500,
    discountAmount: 0,
    createdAt: new Date(),
    shippingAddress: {
        fullName: 'Harini Natarajan',
        phone: '7418526489',
        address: '10/1-179 Gandhi street, JKS Theatre opposite',
        city: 'Salem',
        state: 'Tamil Nadu',
        postalCode: '636451',
        country: 'India',
    },
    orderItems: [
        {
            name: 'Kanjivaram Silk Saree – Royal Blue',
            qty: 1,
            price: 4500,
            image: 'https://via.placeholder.com/64x64/9A3412/ffffff?text=KS',
        },
    ],
};

// ── Send via the actual sendEmail utility (fires immediately with delay=0) ──
console.log('Sending test email...');
sendOrderConfirmationEmails(fakeOrder, process.env.ADMIN_EMAIL, 0);

// Give time for the async send to complete
setTimeout(() => process.exit(0), 20000);
