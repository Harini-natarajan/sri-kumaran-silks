export const dashboardStats = {
  totalProducts: 128,
  totalOrders: 864,
  totalCustomers: 529,
  totalRevenue: 2438000,
};

export const dailySales = [
  { label: 'Mon', sales: 48000 },
  { label: 'Tue', sales: 52000 },
  { label: 'Wed', sales: 61000 },
  { label: 'Thu', sales: 59000 },
  { label: 'Fri', sales: 72000 },
  { label: 'Sat', sales: 81000 },
  { label: 'Sun', sales: 67000 },
];

export const weeklySales = [
  { label: 'W1', sales: 268000 },
  { label: 'W2', sales: 301000 },
  { label: 'W3', sales: 292000 },
  { label: 'W4', sales: 336000 },
];

export const monthlySales = [
  { label: 'Jan', sales: 980000 },
  { label: 'Feb', sales: 1040000 },
  { label: 'Mar', sales: 1120000 },
  { label: 'Apr', sales: 1180000 },
  { label: 'May', sales: 1240000 },
  { label: 'Jun', sales: 1310000 },
];

export const categoriesSeed = [
  'Kanchipuram Silk',
  'Banarasi Silk',
  'Soft Silk',
  'Bridal Collection',
  'Designer Sarees',
];

export const productsSeed = [
  {
    id: 'PRD-1001',
    name: 'Royal Kanchipuram Zari Saree',
    category: 'Kanchipuram Silk',
    price: 18999,
    description: 'Traditional pure silk saree with rich gold zari border.',
    stock: 18,
    image:
      'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 'PRD-1002',
    name: 'Banarasi Heritage Weave',
    category: 'Banarasi Silk',
    price: 15999,
    description: 'Handloom Banarasi silk with floral jaal pattern.',
    stock: 7,
    image:
      'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 'PRD-1003',
    name: 'Soft Silk Pastel Grace',
    category: 'Soft Silk',
    price: 8999,
    description: 'Lightweight soft silk saree for festive and office wear.',
    stock: 0,
    image:
      'https://images.unsplash.com/photo-1610189022404-8f2678e22f3a?auto=format&fit=crop&w=600&q=60',
  },
];

export const recentOrdersSeed = [
  { id: 'ORD-7841', customerName: 'Ananya Iyer', amount: 18999, status: 'Delivered' },
  { id: 'ORD-7842', customerName: 'Meera Sharma', amount: 15999, status: 'Shipped' },
  { id: 'ORD-7843', customerName: 'Lakshmi Rao', amount: 22999, status: 'Confirmed' },
  { id: 'ORD-7844', customerName: 'Priya Nair', amount: 8999, status: 'Pending' },
];

export const customersSeed = [
  { id: 'CUS-901', name: 'Ananya Iyer', email: 'ananya@sample.com', phone: '+91 98765 43210', totalOrders: 14 },
  { id: 'CUS-902', name: 'Meera Sharma', email: 'meera@sample.com', phone: '+91 99876 54321', totalOrders: 9 },
  { id: 'CUS-903', name: 'Lakshmi Rao', email: 'lakshmi@sample.com', phone: '+91 98989 12345', totalOrders: 22 },
  { id: 'CUS-904', name: 'Priya Nair', email: 'priya@sample.com', phone: '+91 98670 11555', totalOrders: 5 },
];

export const reviewsSeed = [
  { id: 'REV-1', saree: 'Royal Kanchipuram Zari Saree', customer: 'Divya M', rating: 5, comment: 'Excellent weave and finish.' },
  { id: 'REV-2', saree: 'Banarasi Heritage Weave', customer: 'Saranya P', rating: 4, comment: 'Beautiful pallu and color.' },
  { id: 'REV-3', saree: 'Soft Silk Pastel Grace', customer: 'Reshma T', rating: 3, comment: 'Good product but delayed delivery.' },
];

export const paymentSummarySeed = {
  successful: 623,
  pending: 41,
  refunded: 18,
};
