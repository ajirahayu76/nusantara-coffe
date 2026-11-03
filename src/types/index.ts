export interface User {
  id: number;
  uid?: string | null;
  username: string;
  fullName: string;
  role: 'owner' | 'manager' | 'cashier' | string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: string;
}

export interface Product {
  id: number;
  sku: string;
  barcode?: string | null;
  name: string;
  categoryId?: number | null;
  categoryName?: string | null;
  costPrice: string | number;
  sellPrice: string | number;
  stock: number;
  unit: string;
  imageUrl?: string | null;
  minStock: number;
  location?: string | null;
  isActive: boolean;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface SaleItem {
  id?: number;
  saleId?: number;
  productId: number;
  productSku: string;
  productName: string;
  unit: string;
  costPrice: string | number;
  sellPrice: string | number;
  quantity: number;
  subtotal: string | number;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  cashierId?: number | null;
  cashierName: string;
  subtotal: string | number;
  discountType: 'nominal' | 'percentage';
  discountValue: string | number;
  discountAmount: string | number;
  taxPercentage: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  totalCostPrice: string | number;
  paymentMethod: 'TUNAI' | 'QRIS' | 'TRANSFER';
  amountPaid: string | number;
  changeAmount: string | number;
  paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED';
  paymentRef?: string | null;
  isDemo?: boolean;
  notes?: string | null;
  createdAt: string;
  items?: SaleItem[];
}

export interface StoreSettings {
  id?: number;
  storeName: string;
  storeTagline?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  taxPercentage: string;
  invoicePrefix: string;
  minStockAlertDefault: number;
  receiptHeader?: string;
  receiptFooter?: string;
  printerWidth: '58mm' | '80mm';
  enableQris: boolean;
  enableCash: boolean;
  enableTransfer: boolean;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  qrisMerchantName?: string;
  qrisNmid?: string;
}

export interface NotificationItem {
  id: number;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'SALE_SUCCESS' | 'PAYMENT_STATUS' | 'USER_ACTIVITY' | string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  productName?: string;
  productSku?: string;
  unit?: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'SALE_CANCEL';
  quantity: number;
  previousStock: number;
  currentStock: number;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface PurchaseRecord {
  id: number;
  purchaseNumber: string;
  supplierName: string;
  totalAmount: string | number;
  status: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId?: number | null;
  userName: string;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}
