export type MenuCategory = 
  | 'all'
  | 'signature'
  | 'manual-brew'
  | 'espresso'
  | 'non-coffee'
  | 'food'
  | 'beans';

export interface MenuItem {
  id: string;
  name: string;
  category: 'signature' | 'manual-brew' | 'espresso' | 'non-coffee' | 'food' | 'beans';
  price: number;
  costPrice?: number;
  description: string;
  image: string;
  tag?: string;
  origin?: string;
  tastingNotes?: string[];
  isHotAvailable?: boolean;
  isIcedAvailable?: boolean;
  defaultTemp?: 'hot' | 'iced';
  dietary?: ('vegan' | 'dairy-free' | 'low-sugar' | 'gluten-free')[];
  rating: number;
  reviewCount: number;
  caffeineLevel?: 'Tinggi' | 'Sedang' | 'Rendah' | 'Bebas Kafein';
}

export interface CustomizationOptions {
  size: 'reguler' | 'large';
  temperature: 'iced' | 'hot';
  sugarLevel: 'normal' | '50%' | '25%' | '0%' | 'stevia';
  iceLevel: 'normal' | 'less' | 'no-ice';
  milkChoice: 'fresh-milk' | 'oat' | 'almond' | 'soy' | 'none';
  grindSize?: 'whole-bean' | 'v60' | 'french-press' | 'espresso' | 'tubruk';
  extraShots: number;
  addons: string[];
  notes: string;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  quantity: number;
  customization: CustomizationOptions;
  unitPrice: number;
  totalPrice: number;
}

export type OrderType = 'dine-in' | 'pickup' | 'delivery';
export type PaymentMethod = 'qris' | 'bca' | 'mandiri' | 'cash';

export interface CustomerDetails {
  name: string;
  phone: string;
  tableNumber?: string;
  deliveryAddress?: string;
  pickupTime?: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  cashChange?: number;
  notes?: string;
}

export interface CoffeeOrigin {
  id: string;
  region: string;
  island: string;
  altitude: string;
  variety: string;
  process: string;
  notes: string[];
  acidity: number;
  body: number;
  sweetness: number;
  story: string;
  partnerFarmer: string;
  image: string;
}

export interface StoreLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  hours: string;
  phone: string;
  wifiSpeed: string;
  features: string[];
  mapsUrl: string;
}

export interface BrewMethod {
  id: string;
  name: string;
  iconName: string;
  defaultDose: number;
  defaultRatio: number;
  waterTemp: string;
  grindDescription: string;
  brewTime: string;
  steps: { time: string; action: string; desc: string }[];
}

// ========================
// SISTEM INVENTARIS, KASIR & MANAJEMEN TOKO
// ========================

export type WarehouseCategory = 
  | 'biji-kopi'
  | 'susu-sirup'
  | 'makanan-pastry'
  | 'kemasan-cup'
  | 'produk-retail';

export interface WarehouseItem {
  id: string;
  sku: string;
  name: string;
  category: WarehouseCategory;
  unit: string; // e.g. 'Porsi / Cup', 'Kg', 'Liter', 'Pack', 'Pcs'
  currentStock: number;
  minStockThreshold: number; // Notification fires if stock <= minStockThreshold
  costPrice: number; // Harga Pokok Penjualan (HPP)
  sellingPrice: number;
  linkedMenuItemId?: string; // Links sale of menu item to auto-reduce this warehouse stock
  supplier?: string;
  lastRestocked: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'sale' | 'restock' | 'adjustment' | 'waste';
  quantity: number; // positive for restock, negative for sale/waste
  beforeStock: number;
  afterStock: number;
  timestamp: string;
  referenceId?: string; // invoice number or restock note
  staffName: string;
  note?: string;
}

export interface TransactionItem {
  itemId: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice: number;
  customizationSummary?: string;
}

export interface SaleTransaction {
  id: string;
  invoiceNumber: string; // e.g. "INV-SK-20261025-001"
  timestamp: string;
  customerName: string;
  cashierStaffName: string;
  orderType: OrderType;
  tableNumber?: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  totalCost: number; // Total HPP
  grossProfit: number; // totalAmount - totalCost
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  cashChange?: number;
  status: 'completed' | 'cancelled';
  notes?: string;
}

export type StaffRole = 'owner' | 'manager' | 'barista' | 'warehouse';

export interface StaffPermissions {
  canAccessPos: boolean;
  canAccessWarehouse: boolean;
  canAdjustStock: boolean;
  canAccessReports: boolean;
  canAccessFinancials: boolean;
  canManageStaff: boolean;
  canManageSettings: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  pin: string;
  phone: string;
  status: 'active' | 'inactive';
  permissions: StaffPermissions;
  lastLogin?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  qrisNmid: string;
  receiptHeader: string;
  receiptFooter: string;
  taxPercentage: number;
  autoPrintReceipt: boolean;
  lowStockAlertSound: boolean;
  printerPaperWidth: '58mm' | '80mm';
}

export type AppActiveView = 
  | 'customer-menu'
  | 'dashboard'
  | 'pos'
  | 'warehouse'
  | 'sales-report'
  | 'staff-access'
  | 'settings';
