import { pgTable, serial, text, integer, numeric, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Roles table
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // 'owner', 'manager', 'cashier'
  displayName: text('display_name').notNull(),
  description: text('description'),
});

// 2. Permissions table
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  roleName: text('role_name').notNull(),
  permission: text('permission').notNull(),
});

// 3. Users table (Supports both Firebase UID and internal staff login with bcrypt hash)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // Firebase auth UID if signed in via Firebase
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash'), // Bcrypt hash for staff credential login
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('cashier'), // 'owner', 'manager', 'cashier'
  email: text('email'),
  phone: text('phone'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode').unique(),
  name: text('name').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  sellPrice: numeric('sell_price', { precision: 12, scale: 2 }).notNull().default('0'),
  stock: integer('stock').notNull().default(0),
  unit: text('unit').notNull().default('pcs'), // 'cup', 'pack', 'kg', 'pcs', 'botol'
  imageUrl: text('image_url'),
  minStock: integer('min_stock').notNull().default(5),
  location: text('location').default('Gudang Utama'),
  isActive: boolean('is_active').notNull().default(true),
  isDemo: boolean('is_demo').notNull().default(false), // Mark demo items clearly
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Inventory details table
export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  currentStock: integer('current_stock').notNull().default(0),
  reservedStock: integer('reserved_stock').notNull().default(0),
  lastRestockedAt: timestamp('last_restocked_at'),
  notes: text('notes'),
});

// 7. Stock Movements (Barang Masuk, Barang Keluar, Penyesuaian, Penjualan)
export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id),
  movementType: text('movement_type').notNull(), // 'IN', 'OUT', 'ADJUSTMENT', 'SALE', 'SALE_CANCEL'
  quantity: integer('quantity').notNull(), // positive or negative
  previousStock: integer('previous_stock').notNull().default(0),
  currentStock: integer('current_stock').notNull().default(0),
  referenceId: text('reference_id'), // invoiceNumber or poNumber
  notes: text('notes'),
  createdBy: text('created_by').notNull().default('System'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Purchases (Riwayat Pembelian Barang / Restock Gudang)
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  purchaseNumber: text('purchase_number').notNull().unique(),
  supplierName: text('supplier_name').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('COMPLETED'), // 'COMPLETED', 'PENDING', 'CANCELLED'
  notes: text('notes'),
  createdBy: text('created_by').notNull().default('Admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Purchase Items
export const purchaseItems = pgTable('purchase_items', {
  id: serial('id').primaryKey(),
  purchaseId: integer('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
});

// 10. Sales (Transaksi Penjualan POS)
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(), // e.g., 'KN-20261103-0001'
  cashierId: integer('cashier_id').references(() => users.id),
  cashierName: text('cashier_name').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  discountType: text('discount_type').default('nominal'), // 'nominal' or 'percentage'
  discountValue: numeric('discount_value', { precision: 12, scale: 2 }).default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
  taxPercentage: numeric('tax_percentage', { precision: 5, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  totalCostPrice: numeric('total_cost_price', { precision: 12, scale: 2 }).notNull().default('0'), // For profit calculation
  paymentMethod: text('payment_method').notNull(), // 'TUNAI', 'QRIS', 'TRANSFER'
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull().default('0'),
  changeAmount: numeric('change_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentStatus: text('payment_status').notNull().default('PAID'), // 'PAID', 'PENDING', 'CANCELLED'
  paymentRef: text('payment_ref'), // Gateway transaction id / QRIS order ID
  isDemo: boolean('is_demo').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Sale Items
export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id),
  productSku: text('product_sku').notNull(),
  productName: text('product_name').notNull(),
  unit: text('unit').notNull().default('pcs'),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  sellPrice: numeric('sell_price', { precision: 12, scale: 2 }).notNull().default('0'),
  quantity: integer('quantity').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
});

// 12. Payments (Gateway/Webhook recording)
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').references(() => sales.id),
  orderId: text('order_id').notNull().unique(),
  paymentMethod: text('payment_method').notNull(), // 'QRIS', 'TUNAI', 'TRANSFER'
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('PENDING'), // 'SUCCESS', 'PENDING', 'FAILED', 'EXPIRED'
  qrString: text('qr_string'), // Raw QRIS payload for dynamic generation
  qrImageUrl: text('qr_image_url'),
  gatewayReference: text('gateway_reference'),
  payload: jsonb('payload'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Store Settings
export const storeSettings = pgTable('store_settings', {
  id: serial('id').primaryKey(),
  storeName: text('store_name').notNull().default('Kopi Nusantara'),
  storeTagline: text('store_tagline').default('Cita Rasa Asli Kopi Indonesia'),
  storeAddress: text('store_address').default('Jl. Malioboro No. 45, Yogyakarta, Indonesia'),
  storePhone: text('store_phone').default('+62 812-3456-7890'),
  storeEmail: text('store_email').default('info@kopinusantara.id'),
  taxPercentage: numeric('tax_percentage', { precision: 5, scale: 2 }).default('0'),
  invoicePrefix: text('invoice_prefix').default('KN-'),
  minStockAlertDefault: integer('min_stock_alert_default').default(5),
  receiptHeader: text('receipt_header').default('Kopi Nusantara - Kopi Asli Indonesia'),
  receiptFooter: text('receipt_footer').default('Terima kasih telah berkunjung! Nikmati seduhan kopi Nusantara.'),
  printerWidth: text('printer_width').default('80mm'), // '58mm' or '80mm'
  enableQris: boolean('enable_qris').default(true),
  enableCash: boolean('enable_cash').default(true),
  enableTransfer: boolean('enable_transfer').default(true),
  bankName: text('bank_name').default('BCA'),
  bankAccountNumber: text('bank_account_number').default('8830123987'),
  bankAccountHolder: text('bank_account_holder').default('PT Kopi Nusantara Mandiri'),
  qrisMerchantName: text('qris_merchant_name').default('KOPI NUSANTARA INDONESIA'),
  qrisNmid: text('qris_nmid').default('ID1020039482019'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 14. Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // 'LOW_STOCK', 'OUT_OF_STOCK', 'SALE_SUCCESS', 'PAYMENT_STATUS', 'USER_ACTIVITY'
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 15. Activity Logs (Audit trail)
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  userName: text('user_name').notNull(),
  action: text('action').notNull(), // 'LOGIN', 'CREATE_PRODUCT', 'SALE', 'RESTOCK', 'REFUND', etc.
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  movements: many(stockMovements),
  saleItems: many(saleItems),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  cashier: one(users, {
    fields: [sales.cashierId],
    references: [users.id],
  }),
  items: many(saleItems),
  payments: many(payments),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ many }) => ({
  items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  product: one(products, {
    fields: [purchaseItems.productId],
    references: [products.id],
  }),
}));
