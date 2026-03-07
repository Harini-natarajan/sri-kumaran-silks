import { jsPDF } from 'jspdf';

/**
 * Generate and download a PDF invoice for an order
 * @param {Object} order - The order object
 */
export const generateInvoice = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Helper to format currency
    const formatCurrency = (amount) => `Rs. ${(amount || 0).toLocaleString('en-IN')}`;

    // Colors
    const primaryColor = [128, 0, 0]; // Maroon
    const goldColor = [198, 148, 31];
    const grayColor = [100, 100, 100];
    const darkColor = [30, 30, 30];

    // Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('KUMARAN SILKS', 20, 25);

    // Tagline
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Silk Sarees Since 1965', 20, 35);

    // Invoice Title
    doc.setFontSize(12);
    doc.text('TAX INVOICE', pageWidth - 20, 25, { align: 'right' });

    // Reset text color
    doc.setTextColor(...darkColor);

    // Invoice Details Section
    let yPos = 60;

    // Order Number Box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, yPos - 5, 85, 25, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.text('Invoice Number', 20, yPos + 3);
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${order._id?.slice(-8).toUpperCase() || 'N/A'}`, 20, yPos + 13);

    // Date Box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(105, yPos - 5, 85, 25, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text('Order Date', 110, yPos + 3);
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) : new Date().toLocaleDateString('en-IN');
    doc.text(orderDate, 110, yPos + 13);

    yPos += 40;

    // Shipping Address
    doc.setFillColor(...primaryColor);
    doc.rect(15, yPos, 3, 40, 'F');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIP TO', 23, yPos + 8);

    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const shipping = order.shippingAddress || {};
    doc.text(shipping.fullName || 'N/A', 23, yPos + 18);
    doc.text(shipping.address || '', 23, yPos + 26);
    doc.text(`${shipping.city || ''}, ${shipping.state || ''} - ${shipping.postalCode || ''}`, 23, yPos + 34);
    if (shipping.phone) {
        doc.text(`Phone: ${shipping.phone}`, 23, yPos + 42);
        yPos += 8;
    }

    yPos += 55;

    // Items Table Header
    doc.setFillColor(...primaryColor);
    doc.rect(15, yPos, pageWidth - 30, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCT', 20, yPos + 7);
    doc.text('QTY', 120, yPos + 7);
    doc.text('PRICE', 145, yPos + 7);
    doc.text('TOTAL', 175, yPos + 7);

    yPos += 15;

    // Items
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'normal');

    const items = order.orderItems || [];
    items.forEach((item, index) => {
        // Alternate row background
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, yPos - 4, pageWidth - 30, 12, 'F');
        }

        doc.setFontSize(9);
        // Truncate long product names
        const productName = item.name?.length > 35 ? item.name.substring(0, 35) + '...' : item.name;
        doc.text(productName || 'Product', 20, yPos + 3);
        doc.text(String(item.qty || 1), 120, yPos + 3);
        doc.text(formatCurrency(item.price), 145, yPos + 3);
        doc.text(formatCurrency((item.price || 0) * (item.qty || 1)), 175, yPos + 3);

        yPos += 12;
    });

    yPos += 10;

    // Totals Section
    doc.setDrawColor(200, 200, 200);
    doc.line(120, yPos, pageWidth - 15, yPos);

    yPos += 10;

    // Subtotal
    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.text('Subtotal:', 130, yPos);
    doc.setTextColor(...darkColor);
    doc.text(formatCurrency(order.itemsPrice), 175, yPos);

    yPos += 8;

    // Shipping
    doc.setTextColor(...grayColor);
    doc.text('Shipping:', 130, yPos);
    doc.setTextColor(...darkColor);
    doc.text(order.shippingPrice === 0 ? 'FREE' : formatCurrency(order.shippingPrice), 175, yPos);

    yPos += 8;

    // Tax
    doc.setTextColor(...grayColor);
    doc.text('GST (5%):', 130, yPos);
    doc.setTextColor(...darkColor);
    doc.text(formatCurrency(order.taxPrice), 175, yPos);

    yPos += 12;

    // Total
    doc.setFillColor(...primaryColor);
    doc.rect(120, yPos - 5, pageWidth - 135, 14, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL:', 130, yPos + 4);
    doc.text(formatCurrency(order.totalPrice), 175, yPos + 4);

    yPos += 25;

    // Payment Info
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information', 20, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);

    const paymentMethod = order.paymentMethod === 'stripe' ? 'Card Payment (Stripe)' :
        order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod;
    doc.text(`Method: ${paymentMethod}`, 20, yPos);

    yPos += 6;
    doc.text(`Status: ${order.isPaid ? 'Paid' : 'Pending'}`, 20, yPos);

    if (order.paidAt) {
        yPos += 6;
        doc.text(`Paid on: ${new Date(order.paidAt).toLocaleDateString('en-IN')}`, 20, yPos);
    }

    // Footer
    yPos = pageHeight - 30;

    doc.setDrawColor(...goldColor);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 10;
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for choosing Kumaran Silks!', pageWidth / 2, yPos, { align: 'center' });

    yPos += 5;
    doc.text('For any queries, contact us at support@kumaransilks.com', pageWidth / 2, yPos, { align: 'center' });

    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });

    // Download the PDF
    const fileName = `Kumaran_Silks_Invoice_${order._id?.slice(-8).toUpperCase() || 'ORDER'}.pdf`;
    doc.save(fileName);
};

export default generateInvoice;
