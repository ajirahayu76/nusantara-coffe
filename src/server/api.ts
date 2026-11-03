import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { db } from '../db/index.ts';
import {
  users,
  categories,
  products,
  inventory,
  stockMovements,
  purchases,
  purchaseItems,
  sales,
  saleItems,
  payments,
  storeSettings,
  notifications,
  activityLogs,
} from '../db/schema.ts';
import { eq, desc, asc, and, gte, lte, sql, ilike, or } from 'drizzle-orm';
import {
  AuthRequest,
  createStaffSession,
  revokeStaffSession,
  requireAuth,
  requireRoles,
} from './auth.ts';
import { realtimeHub } from './realtime.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

export const apiRouter = Router();

// ==========================================
// 1. REALTIME STREAM (SSE)
// ==========================================
apiRouter.get('/realtime/stream', (req, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientId = 'client_' + Math.random().toString(36).substring(2, 9);
  realtimeHub.addClient(clientId, res);

  // Send initial connected state
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ clientId, timestamp: new Date() })}\n\n`);
});

// ==========================================
// 2. AUTHENTICATION & SESSIONS
// ==========================================
// Staff username/password login
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const matchedUsers = await db.select().from(users).where(eq(users.username, username.trim().toLowerCase()));
    if (matchedUsers.length === 0) {
      return res.status(401).json({ error: 'Username atau password tidak cocok.' });
    }

    const user = matchedUsers[0];
    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun Anda sedang dinonaktifkan. Hubungi Owner.' });
    }

    const isMatch = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!isMatch) {
      return res.status(401).json({ error: 'Username atau password tidak cocok.' });
    }

    const token = createStaffSession({
      id: user.id,
      uid: user.uid,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
    });

    // Log login activity
    await db.insert(activityLogs).values({
      userId: user.id,
      userName: user.fullName,
      action: 'LOGIN',
      details: `Staf [${user.fullName}] (${user.role}) berhasil masuk ke sistem.`,
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat proses login.' });
  }
});

// Firebase Google Login verification
apiRouter.post('/auth/firebase-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID Token Firebase diperlukan.' });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const existing = await db.select().from(users).where(eq(users.uid, decoded.uid));
    let dbUser = existing[0];

    if (!dbUser) {
      // Check if email already exists
      if (decoded.email) {
        const byEmail = await db.select().from(users).where(eq(users.email, decoded.email));
        if (byEmail.length > 0) {
          dbUser = byEmail[0];
          await db.update(users).set({ uid: decoded.uid }).where(eq(users.id, dbUser.id));
        }
      }

      if (!dbUser) {
        const baseUsername = (decoded.email ? decoded.email.split('@')[0] : 'google_user').replace(/[^a-zA-Z0-9]/g, '');
        const inserted = await db.insert(users).values({
          uid: decoded.uid,
          username: `${baseUsername}_${Math.floor(Math.random() * 900 + 100)}`,
          fullName: decoded.name || 'Pengguna Google',
          role: 'owner', // Default google login as owner
          email: decoded.email,
          isActive: true,
        }).returning();
        dbUser = inserted[0];
      }
    }

    const token = createStaffSession({
      id: dbUser.id,
      uid: dbUser.uid,
      username: dbUser.username,
      fullName: dbUser.fullName,
      role: dbUser.role,
      email: dbUser.email,
      phone: dbUser.phone,
      isActive: dbUser.isActive,
    });

    res.json({
      token,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        fullName: dbUser.fullName,
        role: dbUser.role,
        email: dbUser.email,
      },
    });
  } catch (error: any) {
    console.error('Firebase login error:', error);
    res.status(401).json({ error: 'Autentikasi Firebase tidak valid.' });
  }
});

// Get currently logged-in user profile
apiRouter.get('/auth/me', (req: AuthRequest, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Belum masuk.' });
  }
  res.json({ user: req.currentUser });
});

// Logout
apiRouter.post('/auth/logout', (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    revokeStaffSession(token);
  }
  res.json({ success: true, message: 'Berhasil keluar.' });
});

// ==========================================
// 3. STORE SETTINGS
// ==========================================
apiRouter.get('/settings', async (req, res) => {
  try {
    const rows = await db.select().from(storeSettings).limit(1);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pengaturan toko belum diinisiasi.' });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat pengaturan toko.' });
  }
});

apiRouter.put('/settings', requireAuth, requireRoles('owner'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const existing = await db.select().from(storeSettings).limit(1);
    let updated;

    if (existing.length === 0) {
      const inserted = await db.insert(storeSettings).values({
        storeName: data.storeName || 'Kopi Nusantara',
        storeTagline: data.storeTagline,
        storeAddress: data.storeAddress,
        storePhone: data.storePhone,
        storeEmail: data.storeEmail,
        taxPercentage: data.taxPercentage || '0',
        invoicePrefix: data.invoicePrefix || 'KN-',
        minStockAlertDefault: Number(data.minStockAlertDefault) || 5,
        receiptHeader: data.receiptHeader,
        receiptFooter: data.receiptFooter,
        printerWidth: data.printerWidth || '80mm',
        enableQris: data.enableQris ?? true,
        enableCash: data.enableCash ?? true,
        enableTransfer: data.enableTransfer ?? true,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        bankAccountHolder: data.bankAccountHolder,
        qrisMerchantName: data.qrisMerchantName,
        qrisNmid: data.qrisNmid,
      }).returning();
      updated = inserted[0];
    } else {
      const updatedRows = await db.update(storeSettings)
        .set({
          storeName: data.storeName,
          storeTagline: data.storeTagline,
          storeAddress: data.storeAddress,
          storePhone: data.storePhone,
          storeEmail: data.storeEmail,
          taxPercentage: data.taxPercentage,
          invoicePrefix: data.invoicePrefix,
          minStockAlertDefault: Number(data.minStockAlertDefault),
          receiptHeader: data.receiptHeader,
          receiptFooter: data.receiptFooter,
          printerWidth: data.printerWidth,
          enableQris: data.enableQris,
          enableCash: data.enableCash,
          enableTransfer: data.enableTransfer,
          bankName: data.bankName,
          bankAccountNumber: data.bankAccountNumber,
          bankAccountHolder: data.bankAccountHolder,
          qrisMerchantName: data.qrisMerchantName,
          qrisNmid: data.qrisNmid,
          updatedAt: new Date(),
        })
        .where(eq(storeSettings.id, existing[0].id))
        .returning();
      updated = updatedRows[0];
    }

    await db.insert(activityLogs).values({
      userId: req.currentUser?.id,
      userName: req.currentUser?.fullName || 'Owner',
      action: 'UPDATE_SETTINGS',
      details: 'Memperbarui profil dan konfigurasi toko Kopi Nusantara.',
      ipAddress: req.ip,
    });

    realtimeHub.broadcast('SETTINGS_UPDATED', updated);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan toko.' });
  }
});

// ==========================================
// 4. CATEGORIES
// ==========================================
apiRouter.get('/categories', async (req, res) => {
  try {
    const list = await db.select().from(categories).orderBy(asc(categories.name));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat kategori.' });
  }
});

apiRouter.post('/categories', requireAuth, requireRoles('owner', 'manager'), async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi.' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const inserted = await db.insert(categories).values({
      name,
      slug,
      description,
    }).returning();

    res.json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menambah kategori. Mungkin nama sudah ada.' });
  }
});

// ==========================================
// 5. PRODUCTS (CRUD, SEARCH, FILTER)
// ==========================================
apiRouter.get('/products', async (req, res) => {
  try {
    const { search, categoryId, activeOnly, lowStockOnly } = req.query;

    let query = db.select({
      id: products.id,
      sku: products.sku,
      barcode: products.barcode,
      name: products.name,
      categoryId: products.categoryId,
      categoryName: categories.name,
      costPrice: products.costPrice,
      sellPrice: products.sellPrice,
      stock: products.stock,
      unit: products.unit,
      imageUrl: products.imageUrl,
      minStock: products.minStock,
      location: products.location,
      isActive: products.isActive,
      isDemo: products.isDemo,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.id));

    const result = await query;

    let filtered = result;
    if (activeOnly === 'true') {
      filtered = filtered.filter(p => p.isActive);
    }
    if (categoryId && categoryId !== 'all') {
      filtered = filtered.filter(p => p.categoryId === Number(categoryId));
    }
    if (lowStockOnly === 'true') {
      filtered = filtered.filter(p => p.stock <= p.minStock);
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    res.json(filtered);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Gagal memuat produk.' });
  }
});

apiRouter.post('/products', requireAuth, requireRoles('owner', 'manager'), async (req: AuthRequest, res) => {
  try {
    const {
      sku,
      barcode,
      name,
      categoryId,
      costPrice,
      sellPrice,
      stock,
      unit,
      imageUrl,
      minStock,
      location,
      isActive,
    } = req.body;

    if (!name || !sku || costPrice === undefined || sellPrice === undefined) {
      return res.status(400).json({ error: 'Nama, SKU, Harga Modal, dan Harga Jual wajib diisi.' });
    }

    const inserted = await db.insert(products).values({
      sku: sku.trim(),
      barcode: barcode ? barcode.trim() : null,
      name: name.trim(),
      categoryId: categoryId ? Number(categoryId) : null,
      costPrice: String(costPrice),
      sellPrice: String(sellPrice),
      stock: Number(stock) || 0,
      unit: unit || 'pcs',
      imageUrl: imageUrl || null,
      minStock: Number(minStock) || 5,
      location: location || 'Gudang Utama',
      isActive: isActive !== false,
      isDemo: false,
    }).returning();

    const newProd = inserted[0];

    // Create inventory record
    await db.insert(inventory).values({
      productId: newProd.id,
      currentStock: newProd.stock,
      reservedStock: 0,
      lastRestockedAt: new Date(),
    });

    // Record initial movement
    if (newProd.stock > 0) {
      await db.insert(stockMovements).values({
        productId: newProd.id,
        movementType: 'IN',
        quantity: newProd.stock,
        previousStock: 0,
        currentStock: newProd.stock,
        referenceId: 'MANUAL-ADD',
        notes: 'Pencatatan stok awal produk baru',
        createdBy: req.currentUser?.fullName || 'Staf Gudang',
      });
    }

    await db.insert(activityLogs).values({
      userId: req.currentUser?.id,
      userName: req.currentUser?.fullName || 'Staf',
      action: 'CREATE_PRODUCT',
      details: `Menambah produk baru [${newProd.name}] (SKU: ${newProd.sku}) stok ${newProd.stock}.`,
      ipAddress: req.ip,
    });

    realtimeHub.broadcast('PRODUCT_CREATED', newProd);
    res.status(201).json(newProd);
  } catch (error: any) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Gagal menambah produk. Pastikan SKU atau Barcode belum pernah digunakan.' });
  }
});

apiRouter.put('/products/:id', requireAuth, requireRoles('owner', 'manager'), async (req: AuthRequest, res) => {
  try {
    const prodId = Number(req.params.id);
    const {
      sku,
      barcode,
      name,
      categoryId,
      costPrice,
      sellPrice,
      unit,
      imageUrl,
      minStock,
      location,
      isActive,
    } = req.body;

    const existing = await db.select().from(products).where(eq(products.id, prodId));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    const updated = await db.update(products).set({
      sku: sku.trim(),
      barcode: barcode ? barcode.trim() : null,
      name: name.trim(),
      categoryId: categoryId ? Number(categoryId) : null,
      costPrice: String(costPrice),
      sellPrice: String(sellPrice),
      unit: unit || 'pcs',
      imageUrl: imageUrl || null,
      minStock: Number(minStock) || 5,
      location: location || 'Gudang Utama',
      isActive: isActive !== false,
      updatedAt: new Date(),
    }).where(eq(products.id, prodId)).returning();

    await db.insert(activityLogs).values({
      userId: req.currentUser?.id,
      userName: req.currentUser?.fullName || 'Staf',
      action: 'UPDATE_PRODUCT',
      details: `Memperbarui produk [${name}] (ID: ${prodId}).`,
      ipAddress: req.ip,
    });

    realtimeHub.broadcast('PRODUCT_UPDATED', updated[0]);
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Gagal memperbarui data produk.' });
  }
});

apiRouter.delete('/products/:id', requireAuth, requireRoles('owner'), async (req: AuthRequest, res) => {
  try {
    const prodId = Number(req.params.id);
    const existing = await db.select().from(products).where(eq(products.id, prodId));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    // Soft delete by setting isActive to false to preserve transaction history integrity
    const updated = await db.update(products).set({
      isActive: false,
      updatedAt: new Date(),
    }).where(eq(products.id, prodId)).returning();

    await db.insert(activityLogs).values({
      userId: req.currentUser?.id,
      userName: req.currentUser?.fullName || 'Owner',
      action: 'DEACTIVATE_PRODUCT',
      details: `Menonaktifkan produk [${existing[0].name}] dari katalog aktif.`,
      ipAddress: req.ip,
    });

    realtimeHub.broadcast('PRODUCT_UPDATED', updated[0]);
    res.json({ success: true, message: 'Produk berhasil dinonaktifkan.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menonaktifkan produk.' });
  }
});

// ==========================================
// 6. INVENTORY & STOCK ADJUSTMENT (MASUK, KELUAR, OPNAME)
// ==========================================
apiRouter.post('/inventory/adjust', requireAuth, requireRoles('owner', 'manager'), async (req: AuthRequest, res) => {
  try {
    const { productId, movementType, quantity, notes, referenceId } = req.body;
    // movementType: 'IN' | 'OUT' | 'ADJUSTMENT'

    const prodId = Number(productId);
    const qty = Number(quantity);

    if (!prodId || !movementType || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Parameter penyesuaian stok tidak valid.' });
    }

    const result = await db.transaction(async (tx) => {
      const prodRows = await tx.select().from(products).where(eq(products.id, prodId));
      if (prodRows.length === 0) {
        throw new Error('Produk tidak ditemukan.');
      }

      const prod = prodRows[0];
      const prevStock = prod.stock;
      let newStock = prevStock;

      if (movementType === 'IN') {
        newStock = prevStock + qty;
      } else if (movementType === 'OUT') {
        if (prevStock < qty) {
          throw new Error(`Stok tidak cukup. Stok saat ini: ${prevStock}, permintaan keluar: ${qty}`);
        }
        newStock = prevStock - qty;
      } else if (movementType === 'ADJUSTMENT') {
        // Stock opname direct replacement
        newStock = qty;
      }

      // Update product stock
      const updatedProds = await tx.update(products).set({
        stock: newStock,
        updatedAt: new Date(),
      }).where(eq(products.id, prodId)).returning();

      // Record movement
      const diff = newStock - prevStock;
      const insertedMovement = await tx.insert(stockMovements).values({
        productId: prodId,
        movementType,
        quantity: diff,
        previousStock: prevStock,
        currentStock: newStock,
        referenceId: referenceId || 'MANUAL-ADJUST',
        notes: notes || `Penyesuaian stok (${movementType})`,
        createdBy: req.currentUser?.fullName || 'Staf Gudang',
      }).returning();

      // Check low stock alert
      if (newStock <= prod.minStock) {
        await tx.insert(notifications).values({
          type: newStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          title: newStock === 0 ? 'Stok Habis!' : 'Peringatan Stok Menipis',
          message: `${prod.name} tersisa ${newStock} ${prod.unit} (Batas minimum: ${prod.minStock}).`,
          isRead: false,
          metadata: { productId: prod.id, stock: newStock, minStock: prod.minStock },
        });
      }

      return { product: updatedProds[0], movement: insertedMovement[0] };
    });

    realtimeHub.broadcast('STOCK_UPDATED', {
      productId: result.product.id,
      stock: result.product.stock,
      movement: result.movement,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Stock adjustment error:', error);
    res.status(400).json({ error: error.message || 'Gagal melakukan penyesuaian stok.' });
  }
});

// Get stock movements history
apiRouter.get('/inventory/movements', requireAuth, async (req, res) => {
  try {
    const list = await db.select({
      id: stockMovements.id,
      productId: stockMovements.productId,
      productName: products.name,
      productSku: products.sku,
      unit: products.unit,
      movementType: stockMovements.movementType,
      quantity: stockMovements.quantity,
      previousStock: stockMovements.previousStock,
      currentStock: stockMovements.currentStock,
      referenceId: stockMovements.referenceId,
      notes: stockMovements.notes,
      createdBy: stockMovements.createdBy,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .orderBy(desc(stockMovements.id))
    .limit(100);

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat riwayat pergerakan stok.' });
  }
});

// Purchases (Riwayat Pembelian & Restock Barang dari Supplier)
apiRouter.get('/inventory/purchases', requireAuth, async (req, res) => {
  try {
    const list = await db.select().from(purchases).orderBy(desc(purchases.id)).limit(50);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat riwayat pembelian.' });
  }
});

apiRouter.post('/inventory/purchases', requireAuth, requireRoles('owner', 'manager'), async (req: AuthRequest, res) => {
  try {
    const { supplierName, items, notes } = req.body;
    // items: [{ productId, quantity, costPrice }]

    if (!supplierName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Supplier dan daftar barang wajib diisi.' });
    }

    const result = await db.transaction(async (tx) => {
      const now = new Date();
      const purchaseNumber = `PO-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += Number(item.quantity) * Number(item.costPrice);
      }

      const insertedPurchases = await tx.insert(purchases).values({
        purchaseNumber,
        supplierName,
        totalAmount: String(totalAmount),
        status: 'COMPLETED',
        notes: notes || 'Penerimaan barang restock gudang',
        createdBy: req.currentUser?.fullName || 'Manajer Gudang',
      }).returning();

      const purchaseRecord = insertedPurchases[0];

      for (const itm of items) {
        const prodRows = await tx.select().from(products).where(eq(products.id, Number(itm.productId)));
        if (prodRows.length === 0) continue;
        const prod = prodRows[0];
        const qty = Number(itm.quantity);
        const cost = Number(itm.costPrice);
        const subtotal = qty * cost;

        // Insert purchase item
        await tx.insert(purchaseItems).values({
          purchaseId: purchaseRecord.id,
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          costPrice: String(cost),
          subtotal: String(subtotal),
        });

        // Increase product stock and update costPrice if changed
        const prevStock = prod.stock;
        const newStock = prevStock + qty;

        await tx.update(products).set({
          stock: newStock,
          costPrice: String(cost),
          updatedAt: new Date(),
        }).where(eq(products.id, prod.id));

        // Movement
        await tx.insert(stockMovements).values({
          productId: prod.id,
          movementType: 'IN',
          quantity: qty,
          previousStock: prevStock,
          currentStock: newStock,
          referenceId: purchaseNumber,
          notes: `Restock dari supplier: ${supplierName}`,
          createdBy: req.currentUser?.fullName || 'Manajer Gudang',
        });
      }

      return purchaseRecord;
    });

    realtimeHub.broadcast('PURCHASE_CREATED', result);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Purchase creation error:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan data pembelian.' });
  }
});

// ==========================================
// 7. POINT OF SALE (POS) CHECKOUT & TRANSACTIONS
// ==========================================
apiRouter.post('/pos/checkout', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      items, // [{ productId, quantity }]
      discountType, // 'nominal' | 'percentage'
      discountValue,
      paymentMethod, // 'TUNAI' | 'QRIS' | 'TRANSFER'
      amountPaid,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Keranjang belanja tidak boleh kosong.' });
    }

    if (!['TUNAI', 'QRIS', 'TRANSFER'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Metode pembayaran tidak didukung.' });
    }

    // Atomically check stock and create transaction to prevent negative stock
    const result = await db.transaction(async (tx) => {
      // 1. Fetch store settings for invoice numbering & tax
      const settingsList = await tx.select().from(storeSettings).limit(1);
      const settings = settingsList[0];
      const prefix = settings?.invoicePrefix || 'KN-';
      const taxRate = Number(settings?.taxPercentage || '0');

      // Generate invoice number
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
      const invoiceNumber = `${prefix}${dateStr}-${randomSuffix}`;

      let subtotal = 0;
      let totalCost = 0;
      const itemsToInsert: any[] = [];
      const stockUpdates: { product: any; newStock: number }[] = [];

      // 2. Validate each item and calculate totals
      for (const item of items) {
        const prodRows = await tx.select().from(products).where(eq(products.id, Number(item.productId)));
        if (prodRows.length === 0) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }

        const prod = prodRows[0];
        const requestedQty = Number(item.quantity);

        if (requestedQty <= 0) {
          throw new Error(`Jumlah untuk ${prod.name} tidak valid.`);
        }

        if (prod.stock < requestedQty) {
          throw new Error(`Stok tidak mencukupi untuk [${prod.name}]. Sisa stok di gudang: ${prod.stock}, diminta: ${requestedQty}.`);
        }

        const unitSellPrice = Number(prod.sellPrice);
        const unitCostPrice = Number(prod.costPrice);
        const lineSubtotal = unitSellPrice * requestedQty;

        subtotal += lineSubtotal;
        totalCost += unitCostPrice * requestedQty;

        itemsToInsert.push({
          productId: prod.id,
          productSku: prod.sku,
          productName: prod.name,
          unit: prod.unit,
          costPrice: String(unitCostPrice),
          sellPrice: String(unitSellPrice),
          quantity: requestedQty,
          subtotal: String(lineSubtotal),
        });

        stockUpdates.push({
          product: prod,
          newStock: prod.stock - requestedQty,
        });
      }

      // 3. Calculate discounts
      let discAmount = 0;
      const discVal = Number(discountValue) || 0;
      if (discountType === 'percentage') {
        discAmount = (subtotal * discVal) / 100;
      } else {
        discAmount = discVal;
      }
      if (discAmount > subtotal) discAmount = subtotal;

      const taxableAmount = subtotal - discAmount;
      const taxAmount = (taxableAmount * taxRate) / 100;
      const totalAmount = Math.round(taxableAmount + taxAmount);

      const paid = Number(amountPaid) || totalAmount;
      const change = paid >= totalAmount ? paid - totalAmount : 0;

      // 4. Insert Sales record
      const insertedSales = await tx.insert(sales).values({
        invoiceNumber,
        cashierId: req.currentUser?.id,
        cashierName: req.currentUser?.fullName || 'Kasir',
        subtotal: String(subtotal),
        discountType: discountType || 'nominal',
        discountValue: String(discVal),
        discountAmount: String(discAmount),
        taxPercentage: String(taxRate),
        taxAmount: String(taxAmount),
        totalAmount: String(totalAmount),
        totalCostPrice: String(totalCost),
        paymentMethod,
        amountPaid: String(paid),
        changeAmount: String(change),
        paymentStatus: 'PAID',
        notes: notes || null,
      }).returning();

      const sale = insertedSales[0];

      // 5. Insert Sale Items
      for (const itemRecord of itemsToInsert) {
        await tx.insert(saleItems).values({
          saleId: sale.id,
          ...itemRecord,
        });
      }

      // 6. Deduct stocks and record movements
      for (const update of stockUpdates) {
        await tx.update(products).set({
          stock: update.newStock,
          updatedAt: new Date(),
        }).where(eq(products.id, update.product.id));

        await tx.insert(stockMovements).values({
          productId: update.product.id,
          movementType: 'SALE',
          quantity: -(update.product.stock - update.newStock),
          previousStock: update.product.stock,
          currentStock: update.newStock,
          referenceId: invoiceNumber,
          notes: `Penjualan kasir POS (${invoiceNumber})`,
          createdBy: req.currentUser?.fullName || 'Kasir POS',
        });

        // Trigger low stock notification if reached threshold
        if (update.newStock <= update.product.minStock) {
          await tx.insert(notifications).values({
            type: update.newStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            title: update.newStock === 0 ? 'Stok Produk Habis!' : 'Peringatan Stok Menipis',
            message: `Stok [${update.product.name}] kini tersisa ${update.newStock} ${update.product.unit} setelah transaksi ${invoiceNumber}.`,
            isRead: false,
            metadata: { productId: update.product.id, stock: update.newStock, minStock: update.product.minStock },
          });
        }
      }

      // 7. Activity log
      await tx.insert(activityLogs).values({
        userId: req.currentUser?.id,
        userName: req.currentUser?.fullName || 'Kasir',
        action: 'SALE',
        details: `Transaksi POS [${invoiceNumber}] berhasil. Total: Rp ${totalAmount.toLocaleString('id-ID')} via ${paymentMethod}.`,
        ipAddress: req.ip,
      });

      return {
        sale,
        items: itemsToInsert,
      };
    });

    // 8. Broadcast real-time update to all active devices
    realtimeHub.broadcast('TRANSACTION_CREATED', result);

    res.status(201).json(result);
  } catch (error: any) {
    console.error('POS Checkout error:', error);
    res.status(400).json({ error: error.message || 'Gagal memproses transaksi kasir.' });
  }
});

// Cancel or Refund Transaction
apiRouter.post('/pos/cancel/:id', requireAuth, requireRoles('owner', 'manager'), async (req: AuthRequest, res) => {
  try {
    const saleId = Number(req.params.id);
    const { reason } = req.body;

    const result = await db.transaction(async (tx) => {
      const saleRows = await tx.select().from(sales).where(eq(sales.id, saleId));
      if (saleRows.length === 0) {
        throw new Error('Transaksi tidak ditemukan.');
      }

      const sale = saleRows[0];
      if (sale.paymentStatus === 'CANCELLED') {
        throw new Error('Transaksi sudah dalam status dibatalkan sebelumnya.');
      }

      // Get items to restore stock
      const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, saleId));

      for (const item of items) {
        const prodRows = await tx.select().from(products).where(eq(products.id, item.productId));
        if (prodRows.length > 0) {
          const prod = prodRows[0];
          const restoredStock = prod.stock + item.quantity;

          await tx.update(products).set({
            stock: restoredStock,
            updatedAt: new Date(),
          }).where(eq(products.id, prod.id));

          await tx.insert(stockMovements).values({
            productId: prod.id,
            movementType: 'SALE_CANCEL',
            quantity: item.quantity,
            previousStock: prod.stock,
            currentStock: restoredStock,
            referenceId: sale.invoiceNumber,
            notes: `Pembatalan/Refund Transaksi: ${reason || 'Pembatalan kasir'}`,
            createdBy: req.currentUser?.fullName || 'Owner/Manajer',
          });
        }
      }

      // Update sale status
      const updatedSales = await tx.update(sales).set({
        paymentStatus: 'CANCELLED',
        notes: sale.notes ? `${sale.notes} | DIBATALKAN: ${reason || 'Refund'}` : `DIBATALKAN: ${reason || 'Refund'}`,
      }).where(eq(sales.id, saleId)).returning();

      await tx.insert(activityLogs).values({
        userId: req.currentUser?.id,
        userName: req.currentUser?.fullName || 'Staf',
        action: 'REFUND',
        details: `Membatalkan transaksi [${sale.invoiceNumber}] senilai Rp ${Number(sale.totalAmount).toLocaleString('id-ID')}. Stok dikembalikan.`,
        ipAddress: req.ip,
      });

      return updatedSales[0];
    });

    realtimeHub.broadcast('TRANSACTION_CANCELLED', result);
    res.json({ success: true, sale: result, message: 'Transaksi berhasil dibatalkan dan stok telah dikembalikan ke gudang.' });
  } catch (error: any) {
    console.error('Cancel transaction error:', error);
    res.status(400).json({ error: error.message || 'Gagal membatalkan transaksi.' });
  }
});

// List Sales with filters
apiRouter.get('/pos/sales', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, cashierId, paymentMethod, paymentStatus, search, limit = '100' } = req.query;

    let query = db.select().from(sales).orderBy(desc(sales.createdAt)).limit(Number(limit));
    const allSales = await query;

    let filtered = allSales;

    // Kasir role can only view their own sales if restricted (owner/manager sees all)
    if (req.currentUser?.role === 'cashier') {
      filtered = filtered.filter(s => s.cashierId === req.currentUser?.id);
    } else if (cashierId && cashierId !== 'all') {
      filtered = filtered.filter(s => s.cashierId === Number(cashierId));
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filtered = filtered.filter(s => s.paymentMethod === paymentMethod);
    }

    if (paymentStatus && paymentStatus !== 'all') {
      filtered = filtered.filter(s => s.paymentStatus === paymentStatus);
    }

    if (startDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(s => new Date(s.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(s => new Date(s.createdAt) <= end);
    }

    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(s =>
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat daftar penjualan.' });
  }
});

// Sale details with items
apiRouter.get('/pos/sales/:id', requireAuth, async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    const saleRows = await db.select().from(sales).where(eq(sales.id, saleId));
    if (saleRows.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
    }

    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    res.json({
      ...saleRows[0],
      items,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat rincian transaksi.' });
  }
});

// ==========================================
// 8. QRIS INTEGRATION & WEBHOOK HANDLER
// ==========================================
// Generate Dynamic QRIS with Indonesian National QR standard format (EMVCo)
apiRouter.post('/payments/qris/create', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { amount, invoiceNumber } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Nominal pembayaran tidak valid.' });
    }

    const settingsRows = await db.select().from(storeSettings).limit(1);
    const settings = settingsRows[0];

    const merchantName = (settings?.qrisMerchantName || 'KOPI NUSANTARA INDONESIA').substring(0, 25).toUpperCase();
    const nmid = settings?.qrisNmid || 'ID1020039482019';
    const orderId = `QRIS-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    // Build EMVCo QRIS payload string format (Indonesian QR Standard)
    // 00: Format Indicator '01'
    // 01: Point of Initiation Method '12' (Dynamic)
    // 26: Merchant Account Information (NMID)
    // 52: Merchant Category Code '5814' (Fast Food / Cafe)
    // 53: Transaction Currency '360' (IDR)
    // 54: Transaction Amount
    // 58: Country Code 'ID'
    // 59: Merchant Name
    // 60: Merchant City 'YOGYAKARTA'
    // 62: Additional Data Field (Invoice / Order Ref)
    const amountStr = numAmount.toString();
    const orderRefStr = (invoiceNumber || orderId).substring(0, 20);

    const qrisRaw = `00020101021226590014ID.LINKAJA.WWW01189360091100200394820215${nmid}52045814530336054${amountStr.length.toString().padStart(2, '0')}${amountStr}5802ID59${merchantName.length.toString().padStart(2, '0')}${merchantName}6010YOGYAKARTA62${(orderRefStr.length + 8).toString().padStart(2, '0')}05${orderRefStr.length.toString().padStart(2, '0')}${orderRefStr}6304ABCD`;

    // Generate high resolution Data URL for rendering directly
    const qrImageUrl = await QRCode.toDataURL(qrisRaw, {
      errorCorrectionLevel: 'M',
      width: 320,
      margin: 2,
      color: {
        dark: '#2A1810', // Coffee dark brown
        light: '#FFFFFF',
      },
    });

    // Save to payments table
    const insertedPayments = await db.insert(payments).values({
      orderId,
      paymentMethod: 'QRIS',
      amount: String(numAmount),
      status: 'PENDING',
      qrString: qrisRaw,
      qrImageUrl,
      gatewayReference: `GTW-${orderId}`,
    }).returning();

    res.json({
      orderId,
      amount: numAmount,
      qrString: qrisRaw,
      qrImageUrl,
      status: 'PENDING',
      merchantName,
      nmid,
    });
  } catch (error: any) {
    console.error('QRIS generation error:', error);
    res.status(500).json({ error: 'Gagal membuat kode QRIS.' });
  }
});

// Official Midtrans / Payment Gateway Webhook Callback Handler
apiRouter.post('/payments/webhook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('Payment Gateway Webhook received:', payload);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = payload;

    if (!order_id) {
      return res.status(400).json({ error: 'Invalid payload: order_id is required' });
    }

    // Verify signature if MIDTRANS_SERVER_KEY is present
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (serverKey && signature_key) {
      const hash = crypto.createHash('sha512').update(`${order_id}${status_code}${gross_amount}${serverKey}`).digest('hex');
      if (hash !== signature_key) {
        console.warn('Webhook signature mismatch!');
        return res.status(403).json({ error: 'Invalid signature key' });
      }
    }

    // Determine final status
    let paymentStatus = 'PENDING';
    if (transaction_status === 'capture' || transaction_status === 'settlement' || transaction_status === 'success') {
      if (fraud_status === 'challenge') {
        paymentStatus = 'PENDING';
      } else {
        paymentStatus = 'SUCCESS';
      }
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      paymentStatus = 'FAILED';
    }

    // Update payment record in database
    const matched = await db.select().from(payments).where(eq(payments.orderId, order_id));
    if (matched.length > 0) {
      await db.update(payments).set({
        status: paymentStatus,
        payload,
        paidAt: paymentStatus === 'SUCCESS' ? new Date() : null,
      }).where(eq(payments.orderId, order_id));

      // Emit real-time event for POS to immediately show success checkmark!
      realtimeHub.broadcast('PAYMENT_STATUS_CHANGED', {
        orderId: order_id,
        status: paymentStatus,
        amount: gross_amount,
        timestamp: new Date(),
      });
    }

    res.json({ status: 'ok', received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// Check QRIS payment status endpoint
apiRouter.get('/payments/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const records = await db.select().from(payments).where(eq(payments.orderId, orderId));
    if (records.length === 0) {
      return res.status(404).json({ error: 'Data pembayaran tidak ditemukan.' });
    }
    res.json(records[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal mengecek status pembayaran.' });
  }
});

// Teller / POS Simulator trigger for Gateway Callback
apiRouter.post('/payments/simulate-callback', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { orderId, status = 'SUCCESS' } = req.body;
    const records = await db.select().from(payments).where(eq(payments.orderId, orderId));
    if (records.length === 0) {
      return res.status(404).json({ error: 'Order QRIS tidak ditemukan.' });
    }

    const p = records[0];
    const updated = await db.update(payments).set({
      status,
      paidAt: status === 'SUCCESS' ? new Date() : null,
    }).where(eq(payments.id, p.id)).returning();

    // Broadcast SSE to POS modal
    realtimeHub.broadcast('PAYMENT_STATUS_CHANGED', {
      orderId,
      status,
      amount: p.amount,
      timestamp: new Date(),
    });

    res.json({ success: true, payment: updated[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memverifikasi callback.' });
  }
});

// ==========================================
// 9. FINANCIAL DASHBOARD & REPORTS
// ==========================================
apiRouter.get('/reports/dashboard', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // Fetch all sales
    const allSales = await db.select().from(sales).where(eq(sales.paymentStatus, 'PAID'));

    let revenueToday = 0;
    let transactionsToday = 0;
    let revenueMonth = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (const s of allSales) {
      const sDate = new Date(s.createdAt);
      const total = Number(s.totalAmount);
      const cost = Number(s.totalCostPrice);

      totalRevenue += total;
      totalCost += cost;

      if (sDate >= startOfToday) {
        revenueToday += total;
        transactionsToday++;
      }
      if (sDate >= startOfMonth) {
        revenueMonth += total;
      }
    }

    const totalProfit = totalRevenue - totalCost;

    // Product counts & low stock count
    const allProducts = await db.select().from(products);
    const totalProducts = allProducts.length;
    const lowStockProducts = allProducts.filter(p => p.stock <= p.minStock && p.isActive);

    // Recent transactions (last 5)
    const recentSales = await db.select().from(sales).orderBy(desc(sales.id)).limit(5);

    // Recent activity logs (last 6)
    const recentActivities = await db.select().from(activityLogs).orderBy(desc(activityLogs.id)).limit(6);

    // Top selling products (group by saleItems)
    const topItems = await db.select({
      productSku: saleItems.productSku,
      productName: saleItems.productName,
      unit: saleItems.unit,
      totalQuantity: sql<number>`sum(${saleItems.quantity})`,
      totalRevenue: sql<number>`sum(cast(${saleItems.subtotal} as numeric))`,
    })
    .from(saleItems)
    .groupBy(saleItems.productSku, saleItems.productName, saleItems.unit)
    .orderBy(desc(sql`sum(${saleItems.quantity})`))
    .limit(5);

    // Daily revenue chart (last 7 days)
    const dailyChart: { date: string; label: string; revenue: number; transactions: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const daySales = allSales.filter(s => {
        const sd = new Date(s.createdAt);
        return sd >= dayStart && sd <= dayEnd;
      });

      const dayRevenue = daySales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      dailyChart.push({
        date: d.toISOString().split('T')[0],
        label: dayLabel,
        revenue: dayRevenue,
        transactions: daySales.length,
      });
    }

    // Monthly revenue chart (last 6 months)
    const monthlyChart: { month: string; label: string; revenue: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const md = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mStart = new Date(md.getFullYear(), md.getMonth(), 1, 0, 0, 0);
      const mEnd = new Date(md.getFullYear(), md.getMonth() + 1, 0, 23, 59, 59);

      const mSales = allSales.filter(s => {
        const sd = new Date(s.createdAt);
        return sd >= mStart && sd <= mEnd;
      });

      const mRevenue = mSales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
      monthlyChart.push({
        month: `${md.getFullYear()}-${(md.getMonth() + 1).toString().padStart(2, '0')}`,
        label: md.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        revenue: mRevenue,
      });
    }

    res.json({
      revenueToday,
      transactionsToday,
      revenueMonth,
      totalRevenue,
      totalProfit,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      recentSales,
      recentActivities,
      topItems,
      dailyChart,
      monthlyChart,
    });
  } catch (error: any) {
    console.error('Dashboard reports error:', error);
    res.status(500).json({ error: 'Gagal memuat analitik dasbor.' });
  }
});

// Comprehensive Sales Report with custom filters
apiRouter.get('/reports/analytics', requireAuth, requireRoles('owner', 'manager'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const now = new Date();

    let filterStart = new Date(0);
    let filterEnd = new Date(now.getFullYear() + 1, 0, 1);

    if (range === 'today') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (range === '7days') {
      filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filterEnd = now;
    } else if (range === 'month') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (range === 'year') {
      filterStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (startDate && endDate) {
      filterStart = new Date(startDate as string);
      filterStart.setHours(0, 0, 0, 0);
      filterEnd = new Date(endDate as string);
      filterEnd.setHours(23, 59, 59, 999);
    }

    const matchedSales = await db.select().from(sales).where(
      and(
        eq(sales.paymentStatus, 'PAID'),
        gte(sales.createdAt, filterStart),
        lte(sales.createdAt, filterEnd)
      )
    ).orderBy(desc(sales.createdAt));

    let totalRevenue = 0;
    let totalCost = 0;
    const methodBreakdown: Record<string, { count: number; total: number }> = {
      TUNAI: { count: 0, total: 0 },
      QRIS: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
    };
    const cashierBreakdown: Record<string, { count: number; total: number }> = {};

    for (const s of matchedSales) {
      const tot = Number(s.totalAmount);
      const cost = Number(s.totalCostPrice);
      totalRevenue += tot;
      totalCost += cost;

      if (!methodBreakdown[s.paymentMethod]) {
        methodBreakdown[s.paymentMethod] = { count: 0, total: 0 };
      }
      methodBreakdown[s.paymentMethod].count++;
      methodBreakdown[s.paymentMethod].total += tot;

      if (!cashierBreakdown[s.cashierName]) {
        cashierBreakdown[s.cashierName] = { count: 0, total: 0 };
      }
      cashierBreakdown[s.cashierName].count++;
      cashierBreakdown[s.cashierName].total += tot;
    }

    res.json({
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      transactionCount: matchedSales.length,
      methodBreakdown,
      cashierBreakdown,
      sales: matchedSales,
    });
  } catch (error: any) {
    console.error('Analytics report error:', error);
    res.status(500).json({ error: 'Gagal memuat laporan penjualan.' });
  }
});

// ==========================================
// 10. STAFF / USER MANAGEMENT
// ==========================================
apiRouter.get('/staff', requireAuth, requireRoles('owner'), async (req, res) => {
  try {
    const list = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      role: users.role,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).orderBy(asc(users.id));

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat daftar staf.' });
  }
});

apiRouter.post('/staff', requireAuth, requireRoles('owner'), async (req: AuthRequest, res) => {
  try {
    const { username, password, fullName, role, email, phone } = req.body;
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Username, password, nama lengkap, dan role wajib diisi.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await db.insert(users).values({
      username: username.trim().toLowerCase(),
      passwordHash,
      fullName: fullName.trim(),
      role: role.toLowerCase(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      isActive: true,
    }).returning();

    await db.insert(activityLogs).values({
      userId: req.currentUser?.id,
      userName: req.currentUser?.fullName || 'Owner',
      action: 'CREATE_STAFF',
      details: `Menambah staf baru [${fullName}] dengan hak akses (${role}).`,
      ipAddress: req.ip,
    });

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Gagal menambah staf. Username mungkin sudah digunakan.' });
  }
});

apiRouter.put('/staff/:id', requireAuth, requireRoles('owner'), async (req: AuthRequest, res) => {
  try {
    const staffId = Number(req.params.id);
    const { fullName, role, email, phone, password } = req.body;

    const updateFields: any = {
      fullName: fullName.trim(),
      role: role.toLowerCase(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      updatedAt: new Date(),
    };

    if (password && password.trim().length >= 4) {
      updateFields.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await db.update(users).set(updateFields).where(eq(users.id, staffId)).returning();

    await db.insert(activityLogs).values({
      userId: req.currentUser?.id,
      userName: req.currentUser?.fullName || 'Owner',
      action: 'UPDATE_STAFF',
      details: `Memperbarui profil staf [${fullName}] (${role}).`,
      ipAddress: req.ip,
    });

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui staf.' });
  }
});

apiRouter.put('/staff/:id/toggle', requireAuth, requireRoles('owner'), async (req: AuthRequest, res) => {
  try {
    const staffId = Number(req.params.id);
    const target = await db.select().from(users).where(eq(users.id, staffId));
    if (target.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    if (target[0].id === req.currentUser?.id) {
      return res.status(400).json({ error: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' });
    }

    const updated = await db.update(users).set({
      isActive: !target[0].isActive,
      updatedAt: new Date(),
    }).where(eq(users.id, staffId)).returning();

    await db.insert(activityLogs).values({
      userId: req.currentUser?.id,
      userName: req.currentUser?.fullName || 'Owner',
      action: updated[0].isActive ? 'ACTIVATE_STAFF' : 'DEACTIVATE_STAFF',
      details: `${updated[0].isActive ? 'Mengaktifkan' : 'Menonaktifkan'} akun staf [${target[0].fullName}].`,
      ipAddress: req.ip,
    });

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal mengubah status aktif staf.' });
  }
});

// ==========================================
// 11. NOTIFICATIONS & ACTIVITY LOGS
// ==========================================
apiRouter.get('/notifications', requireAuth, async (req, res) => {
  try {
    const list = await db.select().from(notifications).orderBy(desc(notifications.id)).limit(30);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat notifikasi.' });
  }
});

apiRouter.put('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const notifId = Number(req.params.id);
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notifId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui status notifikasi.' });
  }
});

apiRouter.put('/notifications/read-all', requireAuth, async (req, res) => {
  try {
    await db.update(notifications).set({ isRead: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menandai semua notifikasi.' });
  }
});

apiRouter.get('/activity-logs', requireAuth, requireRoles('owner', 'manager'), async (req, res) => {
  try {
    const list = await db.select().from(activityLogs).orderBy(desc(activityLogs.id)).limit(100);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat log aktivitas.' });
  }
});
