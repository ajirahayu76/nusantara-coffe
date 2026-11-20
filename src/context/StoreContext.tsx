import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  WarehouseItem,
  SaleTransaction,
  StaffUser,
  StoreSettings,
  AppActiveView,
  StockMovement,
  TransactionItem,
  OrderType,
  PaymentMethod,
} from '../types';
import {
  INITIAL_WAREHOUSE_ITEMS,
  INITIAL_STAFF_USERS,
  INITIAL_STORE_SETTINGS,
  INITIAL_TRANSACTIONS,
  MONTHLY_FINANCIAL_SERIES,
} from '../data/inventoryData';

interface RecordTransactionPayload {
  customerName: string;
  orderType: OrderType;
  tableNumber?: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  cashChange?: number;
  notes?: string;
}

interface StoreContextType {
  activeView: AppActiveView;
  setActiveView: (view: AppActiveView) => void;
  warehouseItems: WarehouseItem[];
  stockMovements: StockMovement[];
  transactions: SaleTransaction[];
  staffUsers: StaffUser[];
  currentStaffUser: StaffUser;
  setCurrentStaffUser: (user: StaffUser) => void;
  storeSettings: StoreSettings;
  lowStockItems: WarehouseItem[];
  monthlyFinancials: typeof MONTHLY_FINANCIAL_SERIES;
  lastCompletedTransaction: SaleTransaction | null;
  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (open: boolean) => void;
  openReceiptModal: (tx: SaleTransaction) => void;
  recordTransaction: (
    payload: RecordTransactionPayload,
    options?: { openReceipt?: boolean }
  ) => SaleTransaction;
  restockWarehouseItem: (itemId: string, addQty: number, note?: string) => void;
  adjustWarehouseStock: (itemId: string, newStock: number, reason: string) => void;
  addWarehouseItem: (item: Omit<WarehouseItem, 'id'>) => void;
  updateWarehouseItem: (id: string, updates: Partial<WarehouseItem>) => void;
  deleteWarehouseItem: (id: string) => void;
  addStaffUser: (user: Omit<StaffUser, 'id'>) => void;
  updateStaffUser: (id: string, updates: Partial<StaffUser>) => void;
  deleteStaffUser: (id: string) => void;
  updateStoreSettings: (updates: Partial<StoreSettings>) => void;
  resetToDefaultData: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WAREHOUSE: 'salamkopi_warehouse_items_v2',
  MOVEMENTS: 'salamkopi_stock_movements_v2',
  TRANSACTIONS: 'salamkopi_transactions_v2',
  STAFF: 'salamkopi_staff_users_v2',
  SETTINGS: 'salamkopi_settings_v2',
  CURRENT_STAFF: 'salamkopi_current_staff_id_v2',
  THEME: 'salamkopi_theme',
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<AppActiveView>('customer-menu');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load warehouse
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WAREHOUSE);
      return saved ? JSON.parse(saved) : INITIAL_WAREHOUSE_ITEMS;
    } catch {
      return INITIAL_WAREHOUSE_ITEMS;
    }
  });

  // Stock movements log
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sales transactions
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Staff users
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
      return saved ? JSON.parse(saved) : INITIAL_STAFF_USERS;
    } catch {
      return INITIAL_STAFF_USERS;
    }
  });

  // Current staff user
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_STAFF);
      const found = INITIAL_STAFF_USERS.find((s) => s.id === savedId);
      return found || INITIAL_STAFF_USERS[0];
    } catch {
      return INITIAL_STAFF_USERS[0];
    }
  });

  // Store settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_STORE_SETTINGS;
    } catch {
      return INITIAL_STORE_SETTINGS;
    }
  });

  const [lastCompletedTransaction, setLastCompletedTransaction] = useState<SaleTransaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WAREHOUSE, JSON.stringify(warehouseItems));
    } catch { /* ignore */ }
  }, [warehouseItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(stockMovements));
    } catch { /* ignore */ }
  }, [stockMovements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch { /* ignore */ }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffUsers));
    } catch { /* ignore */ }
  }, [staffUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_STAFF, currentStaffUser.id);
    } catch { /* ignore */ }
  }, [currentStaffUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(storeSettings));
    } catch { /* ignore */ }
  }, [storeSettings]);

  // Real-time synchronization across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === STORAGE_KEYS.WAREHOUSE && e.newValue) {
        setWarehouseItems(JSON.parse(e.newValue));
      }
      if (e.key === STORAGE_KEYS.TRANSACTIONS && e.newValue) {
        setTransactions(JSON.parse(e.newValue));
      }
      if (e.key === STORAGE_KEYS.MOVEMENTS && e.newValue) {
        setStockMovements(JSON.parse(e.newValue));
      }
      if (e.key === STORAGE_KEYS.STAFF && e.newValue) {
        setStaffUsers(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter low-stock items
  const lowStockItems = useMemo(() => {
    return warehouseItems.filter((item) => item.currentStock <= item.minStockThreshold);
  }, [warehouseItems]);

  // Dynamic monthly financial chart series
  const monthlyFinancials = useMemo(() => {
    const base = [...MONTHLY_FINANCIAL_SERIES];
    // Calculate current month extra from real-time transactions
    const currentMonthTransactions = transactions.filter((t) => t.timestamp.startsWith('2026-10'));
    const totalCurrentMonthRevenue = currentMonthTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
    const totalCurrentMonthCost = currentMonthTransactions.reduce((acc, t) => acc + t.totalCost, 0);

    // Update the last month in the series
    const lastIdx = base.length - 1;
    base[lastIdx] = {
      ...base[lastIdx],
      revenue: base[lastIdx].revenue + totalCurrentMonthRevenue,
      cost: base[lastIdx].cost + totalCurrentMonthCost,
      profit: (base[lastIdx].revenue + totalCurrentMonthRevenue) - (base[lastIdx].cost + totalCurrentMonthCost),
      transactions: base[lastIdx].transactions + currentMonthTransactions.length,
    };
    return base;
  }, [transactions]);

  // Core Real-Time Transaction Function
  const recordTransaction = (
    payload: RecordTransactionPayload,
    options?: { openReceipt?: boolean }
  ): SaleTransaction => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `INV-SK-${dateStr}-${randomSuffix}`;
    const timestampFormatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let totalCost = 0;
    const enrichedItems: TransactionItem[] = payload.items.map((item) => {
      // Find matching warehouse item to calculate real HPP
      const foundWh = warehouseItems.find(
        (wh) => wh.id === item.itemId || (item.menuItemId && wh.linkedMenuItemId === item.menuItemId)
      );
      const costPrice = foundWh ? foundWh.costPrice : Math.round(item.unitPrice * 0.4);
      totalCost += costPrice * item.quantity;
      return {
        ...item,
        costPrice,
      };
    });

    const newTransaction: SaleTransaction = {
      id: `tx-${Date.now()}`,
      invoiceNumber,
      timestamp: timestampFormatted,
      customerName: payload.customerName || 'Pelanggan Walk-In',
      cashierStaffName: currentStaffUser.name,
      orderType: payload.orderType,
      tableNumber: payload.tableNumber,
      items: enrichedItems,
      subtotal: payload.subtotal,
      discount: payload.discount,
      tax: payload.tax,
      totalAmount: payload.totalAmount,
      totalCost,
      grossProfit: payload.totalAmount - totalCost,
      paymentMethod: payload.paymentMethod,
      cashGiven: payload.cashGiven,
      cashChange: payload.cashChange,
      status: 'completed',
      notes: payload.notes,
    };

    // ALUR INTEGRASI NYATA:
    // 1. Kurangi stok barang di gudang secara real-time
    const newMovements: StockMovement[] = [];
    setWarehouseItems((prevItems) => {
      return prevItems.map((whItem) => {
        // Find if this warehouse item was sold
        const soldMatch = payload.items.find(
          (sold) => sold.itemId === whItem.id || (sold.menuItemId && whItem.linkedMenuItemId === sold.menuItemId)
        );

        if (soldMatch) {
          const beforeStock = whItem.currentStock;
          const afterStock = Math.max(0, beforeStock - soldMatch.quantity);

          newMovements.push({
            id: `mov-${Date.now()}-${whItem.id}`,
            itemId: whItem.id,
            itemName: whItem.name,
            type: 'sale',
            quantity: -soldMatch.quantity,
            beforeStock,
            afterStock,
            timestamp: timestampFormatted,
            referenceId: invoiceNumber,
            staffName: currentStaffUser.name,
            note: `Penjualan Kasir (${payload.orderType})`,
          });

          return {
            ...whItem,
            currentStock: afterStock,
          };
        }
        return whItem;
      });
    });

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }

    // 2. Tambahkan transaksi ke state penjualan (memperbarui grafik keuangan & laporan real-time)
    setTransactions((prev) => [newTransaction, ...prev]);

    // 3. Simpan transaksi untuk auto-print struk
    setLastCompletedTransaction(newTransaction);
    const shouldOpenReceipt = options?.openReceipt !== undefined
      ? options.openReceipt
      : storeSettings.autoPrintReceipt;
    if (shouldOpenReceipt) {
      setIsReceiptModalOpen(true);
    }

    return newTransaction;
  };

  const openReceiptModal = (tx: SaleTransaction) => {
    setLastCompletedTransaction(tx);
    setIsReceiptModalOpen(true);
  };

  // Restock action
  const restockWarehouseItem = (itemId: string, addQty: number, note?: string) => {
    const now = new Date();
    const timestampFormatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setWarehouseItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const beforeStock = item.currentStock;
          const afterStock = beforeStock + addQty;

          const mov: StockMovement = {
            id: `mov-${Date.now()}`,
            itemId: item.id,
            itemName: item.name,
            type: 'restock',
            quantity: addQty,
            beforeStock,
            afterStock,
            timestamp: timestampFormatted,
            staffName: currentStaffUser.name,
            note: note || 'Penerimaan Stok Masuk (Restock)',
          };
          setStockMovements((m) => [mov, ...m]);

          return {
            ...item,
            currentStock: afterStock,
            lastRestocked: now.toISOString().split('T')[0],
          };
        }
        return item;
      })
    );
  };

  // Adjust stock action
  const adjustWarehouseStock = (itemId: string, newStock: number, reason: string) => {
    const now = new Date();
    const timestampFormatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setWarehouseItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const beforeStock = item.currentStock;
          const diff = newStock - beforeStock;

          const mov: StockMovement = {
            id: `mov-${Date.now()}`,
            itemId: item.id,
            itemName: item.name,
            type: diff >= 0 ? 'adjustment' : 'waste',
            quantity: diff,
            beforeStock,
            afterStock: newStock,
            timestamp: timestampFormatted,
            staffName: currentStaffUser.name,
            note: `Penyesuaian Fisik Opname: ${reason}`,
          };
          setStockMovements((m) => [mov, ...m]);

          return {
            ...item,
            currentStock: newStock,
          };
        }
        return item;
      })
    );
  };

  const addWarehouseItem = (itemData: Omit<WarehouseItem, 'id'>) => {
    const newItem: WarehouseItem = {
      ...itemData,
      id: `wh-custom-${Date.now()}`,
    };
    setWarehouseItems((prev) => [newItem, ...prev]);
  };

  const updateWarehouseItem = (id: string, updates: Partial<WarehouseItem>) => {
    setWarehouseItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteWarehouseItem = (id: string) => {
    setWarehouseItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addStaffUser = (userData: Omit<StaffUser, 'id'>) => {
    const newStaff: StaffUser = {
      ...userData,
      id: `staff-${Date.now()}`,
    };
    setStaffUsers((prev) => [...prev, newStaff]);
  };

  const updateStaffUser = (id: string, updates: Partial<StaffUser>) => {
    setStaffUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
  };

  const deleteStaffUser = (id: string) => {
    setStaffUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const updateStoreSettings = (updates: Partial<StoreSettings>) => {
    setStoreSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetToDefaultData = () => {
    setWarehouseItems(INITIAL_WAREHOUSE_ITEMS);
    setTransactions(INITIAL_TRANSACTIONS);
    setStaffUsers(INITIAL_STAFF_USERS);
    setStoreSettings(INITIAL_STORE_SETTINGS);
    setStockMovements([]);
    localStorage.clear();
  };

  return (
    <StoreContext.Provider
      value={{
        activeView,
        setActiveView,
        warehouseItems,
        stockMovements,
        transactions,
        staffUsers,
        currentStaffUser,
        setCurrentStaffUser,
        storeSettings,
        lowStockItems,
        monthlyFinancials,
        lastCompletedTransaction,
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        openReceiptModal,
        recordTransaction,
        restockWarehouseItem,
        adjustWarehouseStock,
        addWarehouseItem,
        updateWarehouseItem,
        deleteWarehouseItem,
        addStaffUser,
        updateStaffUser,
        deleteStaffUser,
        updateStoreSettings,
        resetToDefaultData,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
