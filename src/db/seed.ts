import bcrypt from 'bcryptjs';
import { db } from './index.ts';
import {
  users,
  roles,
  permissions,
  categories,
  products,
  inventory,
  storeSettings,
  stockMovements,
  notifications,
  activityLogs
} from './schema.ts';
import { count } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    const userCount = await db.select({ val: count() }).from(users);
    if (userCount[0].val > 0) {
      console.log('Database already seeded. Skipping initial seed.');
      return;
    }

    console.log('Seeding initial data for Kopi Nusantara...');

    // 1. Roles
    await db.insert(roles).values([
      { name: 'owner', displayName: 'Owner / Administrator', description: 'Akses penuh ke seluruh menu, laporan, inventaris, dan konfigurasi toko.' },
      { name: 'manager', displayName: 'Manajer Operasional', description: 'Mengelola stok gudang, laporan penjualan harian/bulanan, dan memantau kasir.' },
      { name: 'cashier', displayName: 'Kasir POS', description: 'Melayani transaksi kasir POS, cek stok, dan cetak struk pembayaran.' },
    ]).onConflictDoNothing();

    // 2. Permissions
    await db.insert(permissions).values([
      { roleName: 'owner', permission: 'all' },
      { roleName: 'manager', permission: 'dashboard.view' },
      { roleName: 'manager', permission: 'inventory.manage' },
      { roleName: 'manager', permission: 'reports.view' },
      { roleName: 'cashier', permission: 'pos.access' },
      { roleName: 'cashier', permission: 'pos.transaction' },
      { roleName: 'cashier', permission: 'pos.receipt' },
    ]).onConflictDoNothing();

    // 3. Store Settings
    await db.insert(storeSettings).values({
      storeName: 'Kopi Nusantara',
      storeTagline: 'Cita Rasa Asli Kopi Indonesia',
      storeAddress: 'Jl. Malioboro No. 45, Danurejan, Yogyakarta 55213',
      storePhone: '+62 812-8899-7700',
      storeEmail: 'kontak@kopinusantara.id',
      taxPercentage: '0', // 0% by default, configurable
      invoicePrefix: 'KN-',
      minStockAlertDefault: 5,
      receiptHeader: 'KOPI NUSANTARA INDONESIA\nSpecialty Coffee & Roastery',
      receiptFooter: 'Terima kasih atas kunjungan Anda!\nKritik & saran: @kopinusantara.id',
      printerWidth: '80mm',
      enableQris: true,
      enableCash: true,
      enableTransfer: true,
      bankName: 'Bank Central Asia (BCA)',
      bankAccountNumber: '8830-1928-3341',
      bankAccountHolder: 'PT Kopi Nusantara Jaya',
      qrisMerchantName: 'KOPI NUSANTARA INDONESIA',
      qrisNmid: 'ID1020039482019',
    });

    // 4. Initial Users with safe bcrypt hashed password ('kopi123')
    const passwordHash = await bcrypt.hash('kopi123', 10);
    const insertedUsers = await db.insert(users).values([
      {
        username: 'owner',
        fullName: 'Hendra Wijaya (Owner)',
        role: 'owner',
        email: 'hendra@kopinusantara.id',
        phone: '081234567890',
        passwordHash,
        isActive: true,
      },
      {
        username: 'manajer',
        fullName: 'Budi Santoso (Manajer)',
        role: 'manager',
        email: 'budi@kopinusantara.id',
        phone: '081234567891',
        passwordHash,
        isActive: true,
      },
      {
        username: 'kasir1',
        fullName: 'Siti Rahma (Kasir Pagi)',
        role: 'cashier',
        email: 'siti@kopinusantara.id',
        phone: '081234567892',
        passwordHash,
        isActive: true,
      },
      {
        username: 'kasir2',
        fullName: 'Rian Pratama (Kasir Sore)',
        role: 'cashier',
        email: 'rian@kopinusantara.id',
        phone: '081234567893',
        passwordHash,
        isActive: true,
      },
    ]).returning();

    // 5. Categories
    const insertedCategories = await db.insert(categories).values([
      { name: 'Kopi', slug: 'kopi', description: 'Aneka seduhan kopi espresso base dan manual brew Nusantara' },
      { name: 'Minuman Non-Kopi', slug: 'minuman', description: 'Teh artisanal, cokelat, dan mocktail segar' },
      { name: 'Makanan & Snack', slug: 'makanan', description: 'Pastry renyah, kue basah, dan camilan pendamping kopi' },
      { name: 'Bahan Baku', slug: 'bahan-baku', description: 'Biji kopi sangrai (whole bean), bubuk kopi, dan sirup' },
      { name: 'Perlengkapan', slug: 'perlengkapan', description: 'Cup takeaway, sedotan ramah lingkungan, dan filter brew' },
    ]).returning();

    const catMap = Object.fromEntries(insertedCategories.map(c => [c.slug, c.id]));

    // 6. Products Demo
    const demoProductsData = [
      {
        sku: 'KN-KOP-001',
        barcode: '8991001001',
        name: 'Kopi Susu Gula Aren',
        categoryId: catMap['kopi'],
        costPrice: '8000',
        sellPrice: '18000',
        stock: 45,
        unit: 'cup',
        imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
        minStock: 10,
        location: 'Bar Kasir Depan',
        isDemo: true,
      },
      {
        sku: 'KN-KOP-002',
        barcode: '8991001002',
        name: 'Cappuccino Nusantara',
        categoryId: catMap['kopi'],
        costPrice: '9000',
        sellPrice: '22000',
        stock: 35,
        unit: 'cup',
        imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
        minStock: 8,
        location: 'Bar Kasir Depan',
        isDemo: true,
      },
      {
        sku: 'KN-KOP-003',
        barcode: '8991001003',
        name: 'Caffe Latte',
        categoryId: catMap['kopi'],
        costPrice: '9000',
        sellPrice: '22000',
        stock: 30,
        unit: 'cup',
        imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80',
        minStock: 8,
        location: 'Bar Kasir Depan',
        isDemo: true,
      },
      {
        sku: 'KN-KOP-004',
        barcode: '8991001004',
        name: 'Americano Robusta Mandheling',
        categoryId: catMap['kopi'],
        costPrice: '5000',
        sellPrice: '15000',
        stock: 50,
        unit: 'cup',
        imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&auto=format&fit=crop&q=80',
        minStock: 10,
        location: 'Bar Kasir Depan',
        isDemo: true,
      },
      {
        sku: 'KN-KOP-005',
        barcode: '8991001005',
        name: 'Biji Kopi Arabika Gayo (250g)',
        categoryId: catMap['bahan-baku'],
        costPrice: '45000',
        sellPrice: '75000',
        stock: 18,
        unit: 'pack',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        minStock: 5,
        location: 'Gudang Rak A-1',
        isDemo: true,
      },
      {
        sku: 'KN-KOP-006',
        barcode: '8991001006',
        name: 'Biji Kopi Robusta Temanggung (250g)',
        categoryId: catMap['bahan-baku'],
        costPrice: '32000',
        sellPrice: '55000',
        stock: 4, // Menipis for alert!
        unit: 'pack',
        imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&auto=format&fit=crop&q=80',
        minStock: 6,
        location: 'Gudang Rak A-2',
        isDemo: true,
      },
      {
        sku: 'KN-BAH-001',
        barcode: '8991002001',
        name: 'Sirup Gula Aren Organik 1 Liter',
        categoryId: catMap['bahan-baku'],
        costPrice: '38000',
        sellPrice: '60000',
        stock: 3, // Menipis alert
        unit: 'botol',
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
        minStock: 5,
        location: 'Gudang Rak B-1',
        isDemo: true,
      },
      {
        sku: 'KN-BAH-002',
        barcode: '8991002002',
        name: 'Susu UHT Full Cream 1 Liter',
        categoryId: catMap['bahan-baku'],
        costPrice: '16000',
        sellPrice: '21000',
        stock: 24,
        unit: 'kotak',
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
        minStock: 10,
        location: 'Gudang Chiller C-1',
        isDemo: true,
      },
      {
        sku: 'KN-MAK-001',
        barcode: '8991003001',
        name: 'Butter Croissant Artisanal',
        categoryId: catMap['makanan'],
        costPrice: '12000',
        sellPrice: '24000',
        stock: 20,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
        minStock: 5,
        location: 'Display Etalase',
        isDemo: true,
      },
      {
        sku: 'KN-PER-001',
        barcode: '8991004001',
        name: 'Paper Cup Hot 8oz & Lid (Pack isi 50)',
        categoryId: catMap['perlengkapan'],
        costPrice: '25000',
        sellPrice: '35000',
        stock: 12,
        unit: 'pack',
        imageUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=600&auto=format&fit=crop&q=80',
        minStock: 5,
        location: 'Gudang Rak D-3',
        isDemo: true,
      },
    ];

    const insertedProducts = await db.insert(products).values(demoProductsData).returning();

    // 7. Inventory and Stock Movements
    for (const prod of insertedProducts) {
      await db.insert(inventory).values({
        productId: prod.id,
        currentStock: prod.stock,
        reservedStock: 0,
        lastRestockedAt: new Date(),
        notes: 'Stok awal inisiasi toko Kopi Nusantara',
      });

      await db.insert(stockMovements).values({
        productId: prod.id,
        movementType: 'IN',
        quantity: prod.stock,
        previousStock: 0,
        currentStock: prod.stock,
        referenceId: 'INIT-RESTOCK',
        notes: 'Inisialisasi stok gudang awal',
        createdBy: 'Hendra Wijaya (Owner)',
      });
    }

    // 8. Notifications
    await db.insert(notifications).values([
      {
        type: 'LOW_STOCK',
        title: 'Peringatan Stok Menipis',
        message: 'Biji Kopi Robusta Temanggung (250g) tersisa 4 pack (Batas minimum: 6). Segera lakukan restock gudang.',
        isRead: false,
        metadata: { sku: 'KN-KOP-006', stock: 4, minStock: 6 },
      },
      {
        type: 'LOW_STOCK',
        title: 'Peringatan Stok Menipis',
        message: 'Sirup Gula Aren Organik 1 Liter tersisa 3 botol (Batas minimum: 5).',
        isRead: false,
        metadata: { sku: 'KN-BAH-001', stock: 3, minStock: 5 },
      },
      {
        type: 'USER_ACTIVITY',
        title: 'Sistem Kopi Nusantara Siap',
        message: 'Database inventaris, POS, dan hak akses staf telah aktif terkonfigurasi di Cloud SQL.',
        isRead: false,
      },
    ]);

    // 9. Activity Logs
    await db.insert(activityLogs).values([
      {
        userId: insertedUsers[0].id,
        userName: insertedUsers[0].fullName,
        action: 'INIT_STORE',
        details: 'Sistem Kopi Nusantara pertama kali diinisialisasi beserta data master produk.',
        ipAddress: '127.0.0.1',
      },
    ]);

    console.log('Database seeded successfully with master and demo data!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
