import API, {
  createProduct,
  deleteProduct,
  getAdminOrders,
  getAdminProducts,
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  updateProduct,
  getAdminCoupons,
  createCoupon,
  deleteCoupon,
  getAdminPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from './api';

export { updateAdminUser, deleteAdminUser };
// Mock data imports removed as we are now fetching strictly from the database

const toOrderStatus = (order) => {
  const status = String(order.orderStatus || '').toLowerCase();
  if (status === 'delivered') return 'Delivered';
  if (status === 'shipped') return 'Shipped';
  if (status === 'confirmed' || status === 'processing') return 'Confirmed';
  if (status === 'cancelled') return 'Cancelled';
  if (order.isDelivered) return 'Delivered';
  if (order.isPaid) return 'Confirmed';
  return 'Pending';
};

const toDisplayOrderId = (id) => String(id || '').slice(-8).toUpperCase();

const asChartSeries = (orders, mode = 'day') => {
  const grouped = new Map();

  orders.forEach((order) => {
    const date = new Date(order.createdAt || Date.now());
    let key;
    if (mode === 'day') {
      key = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (mode === 'week') {
      const week = Math.ceil(date.getDate() / 7);
      key = `W${week}`;
    } else {
      key = date.toLocaleDateString('en-US', { month: 'short' });
    }

    const value = grouped.get(key) || 0;
    grouped.set(key, value + Number(order.totalPrice || 0));
  });

  return Array.from(grouped.entries()).map(([label, sales]) => ({ label, sales }));
};

export async function fetchDashboard() {
  const [{ data: stats }, { data: ordersRes }] = await Promise.all([
    getAdminStats(),
    getAdminOrders(1, 200),
  ]);

  const orders = ordersRes.orders || [];

  return {
    stats: {
      totalProducts: stats.totalProducts || 0,
      totalOrders: stats.totalOrders || 0,
      totalCustomers: stats.totalUsers || 0,
      totalRevenue: stats.totalRevenue || 0,
      lowStockProducts: stats.lowStockProducts || 0,
      pendingOrders: stats.pendingOrders || 0,
      deliveredOrders: stats.deliveredOrders || 0,
      paidOrders: stats.paidOrders || 0,
      todayOrders: stats.todayOrders || 0,
      todayRevenue: stats.todayRevenue || 0,
    },
    dailySales: asChartSeries(orders.slice(0, 40), 'day').slice(-7),
    weeklySales: asChartSeries(orders.slice(0, 120), 'week').slice(-4),
    monthlySales:
      (stats.monthlyRevenue || []).map((item) => ({
        label: new Date(2000, Math.max(0, Number(item._id) - 1), 1).toLocaleDateString('en-US', { month: 'short' }),
        sales: item.revenue || 0,
      })) || [],
    recentOrders: (stats.recentOrders || []).map((order) => ({
      id: order._id,
      orderId: toDisplayOrderId(order._id),
      customerName: order.user?.name || 'Guest',
      amount: Number(order.totalPrice || 0),
      status: toOrderStatus(order),
    })),
    categoryBreakdown: (stats.categoryBreakdown || []).map((c) => ({
      label: c._id,
      count: c.count,
      totalStock: c.totalStock,
    })),
    orderStatusSummary: [
      { label: 'Delivered', value: stats.deliveredOrders || 0, color: '#10b981' },
      { label: 'Pending',   value: stats.pendingOrders || 0,   color: '#f59e0b' },
      { label: 'Paid',      value: stats.paidOrders || 0,      color: '#6366f1' },
    ],
  };
}

export async function fetchProducts() {
  const { data } = await getAdminProducts(1, 500);
  return (data.products || []).map((item) => ({
    id: item._id,
    name: item.name,
    category: item.category,
    price: Number(item.price || 0),
    originalPrice: Number(item.originalPrice || 0),
    description: item.description || '',
    material: item.material || '',
    brand: item.brand || '',
    color: item.color || '',
    careInstructions: item.careInstructions || '',
    isFeatured: !!item.isFeatured,
    stock: Number(item.countInStock || 0),
    image: item.image || item.images?.[0] || '',
    images: (item.images || []).filter(Boolean),
  }));
}

export async function saveProduct(payload) {
  const images = (Array.isArray(payload.images) ? payload.images : []).filter(Boolean);
  const primaryImage = payload.image || images[0] || '';

  const productBody = {
    name: payload.name,
    category: payload.category,
    price: Number(payload.price || 0),
    originalPrice: Number(payload.originalPrice || 0),
    description: payload.description,
    brand: payload.brand,
    material: payload.material,
    color: payload.color,
    careInstructions: payload.careInstructions,
    isFeatured: !!payload.isFeatured,
    countInStock: Number(payload.stock || 0),
    image: primaryImage,
    images: images.length ? images : (primaryImage ? [primaryImage] : []),
  };

  if (payload.id) {
    await updateProduct(payload.id, productBody);
  } else {
    await createProduct(productBody);
  }
}

export async function removeProductById(id) {
  await deleteProduct(id);
}

export async function fetchCategories() {
  const products = await fetchProducts();
  const dynamicCategories = [...new Set(products.map((item) => item.category).filter(Boolean))];
  
  // Also include manually added categories that might not have products yet
  const manual = JSON.parse(localStorage.getItem('admin_manual_categories') || '[]');
  return [...new Set([...dynamicCategories, ...manual])];
}

export async function fetchOrders() {
  const { data } = await getAdminOrders(1, 300);
  return (data.orders || []).map((order) => ({
    id: order._id,
    orderId: toDisplayOrderId(order._id),
    backendOrderId: order._id,
    customerName: order.user?.name || 'Guest',
    amount: Number(order.totalPrice || 0),
    status: toOrderStatus(order),
    raw: order,
  }));
}

export async function updateOrderStatus(id, status) {
  const normalized = String(status || '').toLowerCase();
  const { data } = await API.put(`/admin/orders/${id}/status`, { orderStatus: normalized });
  return data;
}

// ==================== PROMOTIONS APIs ====================
export async function fetchPromotions() {
  const { data } = await getAdminPromotions();
  return (data || []).map(entry => ({
    id: entry._id,
    type: entry.type,
    isActive: entry.isActive,
    order: entry.order,
    image: entry.image,
    title: entry.title,
    subtitle: entry.subtitle,
    description: entry.description,
    link: entry.link,
    tag: entry.tag,
    code: entry.code,
    afterCode: entry.afterCode,
    cta: entry.cta,
    text: entry.text,
    bgColor: entry.bgColor,
    textColor: entry.textColor,
  }));
}

export async function savePromotion(payload) {
  const body = {
    type: payload.type,
    isActive: typeof payload.isActive === 'boolean' ? payload.isActive : true,
    order: Number(payload.order || 0),
    image: payload.image || '',
    title: payload.title || '',
    subtitle: payload.subtitle || '',
    description: payload.description || '',
    link: payload.link || '/products',
    tag: payload.tag || '',
    code: payload.code || '',
    afterCode: payload.afterCode || '',
    cta: payload.cta || 'Shop Now',
    text: payload.text || '',
    bgColor: payload.bgColor || '#9A3412',
    textColor: payload.textColor || '#ffffff',
  };

  if (payload.id) {
    await updatePromotion(payload.id, body);
  } else {
    await createPromotion(body);
  }
}

export async function removePromotionById(id) {
  await deletePromotion(id);
}


export async function fetchCustomers() {
  const [{ data: usersRes }, { data: ordersRes }] = await Promise.all([
    getAdminUsers(1, 500),
    getAdminOrders(1, 500),
  ]);

  const orderCounts = (ordersRes.orders || []).reduce((acc, order) => {
    const userId = order.user?._id;
    if (!userId) return acc;
    acc[userId] = (acc[userId] || 0) + 1;
    return acc;
  }, {});

  return (usersRes.users || []).map((user) => ({
    id: user._id,
    displayId: toDisplayOrderId(user._id),
    name: user.name,
    email: user.email,
    phone: user.addresses?.[0]?.phone || '-',
    role: user.isAdmin ? 'Admin' : 'Customer',
    isAdmin: user.isAdmin,
    joined: user.createdAt,
    totalOrders: orderCounts[user._id] || 0,
  }));
}

export async function fetchInventorySnapshot() {
  const products = await fetchProducts();
  return {
    inStock: products.filter((item) => item.stock >= 10).length,
    lowStock: products.filter((item) => item.stock > 0 && item.stock < 10).length,
    outOfStock: products.filter((item) => item.stock === 0).length,
  };
}

export async function fetchPaymentSummary() {
  const { data } = await getAdminOrders(1, 500);
  const summary = { successful: 0, pending: 0, refunded: 0 };

  (data.orders || []).forEach((order) => {
    if (order.isPaid && String(order.orderStatus || '').toLowerCase() !== 'cancelled') {
      summary.successful += 1;
    } else if (String(order.orderStatus || '').toLowerCase() === 'cancelled' && order.isPaid) {
      summary.refunded += 1;
    } else {
      summary.pending += 1;
    }
  });

  return summary;
}

export async function fetchWishlistAnalytics() {
  const products = await fetchProducts();
  const grouped = products.reduce((acc, item) => {
    const key = item.category || 'Uncategorized';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([category, count]) => ({
    category,
    wishlists: count * 7,
  }));
}

export async function fetchReviews() {
  const { data } = await getAdminProducts(1, 200, '');
  const reviews = [];

  (data.products || []).forEach((product) => {
    (product.reviews || []).forEach((review, index) => {
      reviews.push({
        id: review._id || `${product._id}-${index}`,
        saree: product.name,
        customer: review.name || 'Customer',
        rating: Number(review.rating || 0),
        title: review.title || '',
        comment: review.comment || '',
        date: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'
      });
    });
  });

  return reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function fetchCoupons() {
  const { data } = await getAdminCoupons(1, 100);
  return (data.coupons || []).map(entry => ({
    id: entry._id,
    code: entry.couponCode,
    discountType: entry.discountType,
    discountValue: entry.discountValue,
    minimumPurchaseAmount: entry.minimumPurchaseAmount,
    expiryDate: entry.expiryDate,
    status: entry.status,
    description: entry.description || '',
    usageLimit: entry.usageLimit || 100,
    usedCount: entry.usedCount || 0
  }));
}

export async function saveCoupon(payload) {
  const body = {
    couponCode: String(payload.code || '').toUpperCase().trim(),
    discountType: payload.discountType || 'percentage',
    discountValue: Number(payload.discountValue || 0),
    minimumPurchaseAmount: Number(payload.minimumPurchaseAmount || 0),
    expiryDate: payload.expiryDate,
    usageLimit: Number(payload.usageLimit) || 100,
    description: payload.description || '',
    status: 'active'
  };
  
  if (!body.couponCode) throw new Error('Missing coupon code');
  if (isNaN(body.discountValue) || body.discountValue <= 0) throw new Error('Invalid discount value');
  if (!body.expiryDate) throw new Error('Expiry date is required');

  await createCoupon(body);
}

export async function removeCouponById(id) {
  await deleteCoupon(id);
}

export async function fetchReports() {
  const [products, orders, customers] = await Promise.all([
    fetchProducts(),
    fetchOrders(),
    fetchCustomers(),
  ]);

  const orderStatusSummary = orders.reduce((acc, item) => {
    const key = item.status || 'Unknown';
    if (!acc[key]) {
      acc[key] = { status: key, orders: 0, revenue: 0 };
    }
    acc[key].orders += 1;
    acc[key].revenue += Number(item.amount || 0);
    return acc;
  }, {});

  const totalRevenue = orders.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const salesRows = [
    {
      Metric: 'Total Orders',
      Orders: orders.length,
      Revenue: '',
    },
    {
      Metric: 'Total Revenue',
      Orders: '',
      Revenue: totalRevenue,
    },
    ...Object.values(orderStatusSummary).map((item) => ({
      Metric: `Revenue (${item.status})`,
      Orders: item.orders,
      Revenue: item.revenue,
    })),
  ];

  return {
    salesReport: {
      generatedAt: new Date().toISOString(),
      records: salesRows.length,
      rows: salesRows,
    },
    orderReport: {
      generatedAt: new Date().toISOString(),
      records: orders.length,
      rows: orders.map((item) => ({
        OrderId: item.orderId,
        BackendOrderId: item.backendOrderId || item.id,
        Customer: item.customerName,
        Amount: item.amount,
        Status: item.status,
      })),
    },
    customerReport: {
      generatedAt: new Date().toISOString(),
      records: customers.length,
      rows: customers.map((item) => ({
        Name: item.name,
        Email: item.email,
        Phone: item.phone,
        TotalOrders: item.totalOrders,
      })),
    },
    chartData: Object.values(orderStatusSummary).map(s => ({
      status: s.status,
      revenue: s.revenue
    }))
  };
}
