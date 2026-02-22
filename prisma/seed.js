// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ─────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@holidayicecream.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@holidayicecream.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@holidayicecream.com' },
    update: {},
    create: {
      name: 'Manager',
      email: 'manager@holidayicecream.com',
      password: hashedPassword,
      role: 'manager',
    },
  });

  await prisma.user.upsert({
    where: { email: 'cashier@holidayicecream.com' },
    update: {},
    create: {
      name: 'Cashier',
      email: 'cashier@holidayicecream.com',
      password: hashedPassword,
      role: 'cashier',
    },
  });

  console.log('✅ Users seeded');

  // ── Categories ────────────────────────────────────────────
  const iceCreamCat = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Ice Cream', description: 'All ice cream products – scoops, cones, and cups' },
  });

  const milkShakeCat = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Milk Shakes', description: 'Thick and creamy milkshakes in various flavors' },
  });

  const coldDrinkCat = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Cold Drinks', description: 'Refreshing cold beverages and sodas' },
  });

  const comboCat = await prisma.category.upsert({
    where: { id: 4 },
    update: {},
    create: { name: 'Combos', description: 'Value combo deals and bundles' },
  });

  console.log('✅ Categories seeded');

  // ── Products ──────────────────────────────────────────────
  // Use createMany + skipDuplicates (idempotent on re-runs via barcode uniqueness at DB level)
  const existingProductCount = await prisma.product.count();
  if (existingProductCount === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Vanilla Ice Cream Scoop',    price: 2.50, costPrice: 1.00, stock: 100, barcode: 'IC001', categoryId: iceCreamCat.id },
        { name: 'Chocolate Ice Cream Scoop',  price: 2.50, costPrice: 1.00, stock: 100, barcode: 'IC002', categoryId: iceCreamCat.id },
        { name: 'Strawberry Ice Cream Scoop', price: 2.50, costPrice: 1.00, stock: 80,  barcode: 'IC003', categoryId: iceCreamCat.id },
        { name: 'Mango Ice Cream Scoop',      price: 2.75, costPrice: 1.10, stock: 80,  barcode: 'IC004', categoryId: iceCreamCat.id },
        { name: 'Double Scoop Cup',           price: 4.50, costPrice: 1.80, stock: 100, barcode: 'IC005', categoryId: iceCreamCat.id },
        { name: 'Triple Scoop Cup',           price: 6.00, costPrice: 2.40, stock: 100, barcode: 'IC006', categoryId: iceCreamCat.id },
        { name: 'Waffle Cone - Single',       price: 3.50, costPrice: 1.40, stock: 100, barcode: 'IC007', categoryId: iceCreamCat.id },
        { name: 'Waffle Cone - Double',       price: 5.50, costPrice: 2.20, stock: 100, barcode: 'IC008', categoryId: iceCreamCat.id },
        { name: 'Ice Cream Sundae',           price: 5.00, costPrice: 2.00, stock: 50,  barcode: 'IC009', categoryId: iceCreamCat.id },
        { name: 'Banana Split',               price: 7.50, costPrice: 3.00, stock: 30,  barcode: 'IC010', categoryId: iceCreamCat.id },
        { name: 'Vanilla Milkshake',          price: 4.50, costPrice: 1.80, stock: 50,  barcode: 'MS001', categoryId: milkShakeCat.id },
        { name: 'Chocolate Milkshake',        price: 4.50, costPrice: 1.80, stock: 50,  barcode: 'MS002', categoryId: milkShakeCat.id },
        { name: 'Strawberry Milkshake',       price: 4.75, costPrice: 1.90, stock: 50,  barcode: 'MS003', categoryId: milkShakeCat.id },
        { name: 'Mango Milkshake',            price: 5.00, costPrice: 2.00, stock: 40,  barcode: 'MS004', categoryId: milkShakeCat.id },
        { name: 'Oreo Milkshake',             price: 5.50, costPrice: 2.20, stock: 40,  barcode: 'MS005', categoryId: milkShakeCat.id },
        { name: 'Mixed Berry Milkshake',      price: 5.25, costPrice: 2.10, stock: 30,  barcode: 'MS006', categoryId: milkShakeCat.id },
        { name: 'Caramel Milkshake',          price: 5.00, costPrice: 2.00, stock: 30,  barcode: 'MS007', categoryId: milkShakeCat.id },
        { name: 'Coca-Cola (330ml)',          price: 1.50, costPrice: 0.60, stock: 200, barcode: 'CD001', categoryId: coldDrinkCat.id },
        { name: 'Pepsi (330ml)',              price: 1.50, costPrice: 0.60, stock: 200, barcode: 'CD002', categoryId: coldDrinkCat.id },
        { name: 'Sprite (330ml)',             price: 1.50, costPrice: 0.60, stock: 150, barcode: 'CD003', categoryId: coldDrinkCat.id },
        { name: 'Fanta Orange (330ml)',       price: 1.50, costPrice: 0.60, stock: 150, barcode: 'CD004', categoryId: coldDrinkCat.id },
        { name: 'Mineral Water (500ml)',      price: 1.00, costPrice: 0.40, stock: 300, barcode: 'CD005', categoryId: coldDrinkCat.id },
        { name: 'Sparkling Water',            price: 1.25, costPrice: 0.50, stock: 100, barcode: 'CD006', categoryId: coldDrinkCat.id },
        { name: 'Fresh Lemonade',             price: 3.00, costPrice: 1.20, stock: 50,  barcode: 'CD007', categoryId: coldDrinkCat.id },
        { name: 'Iced Tea',                   price: 2.50, costPrice: 1.00, stock: 50,  barcode: 'CD008', categoryId: coldDrinkCat.id },
        { name: 'Ice Cream + Drink Combo',    price: 5.50, costPrice: 2.20, stock: 50,  barcode: 'CB001', categoryId: comboCat.id },
        { name: 'Milkshake + Snack Combo',    price: 6.50, costPrice: 2.60, stock: 30,  barcode: 'CB002', categoryId: comboCat.id },
      ],
    });
  }

  console.log('✅ Products seeded');

  // ── Expense Categories ─────────────────────────────────────
  const expCatCount = await prisma.expenseCategory.count();
  if (expCatCount === 0) {
    await prisma.expenseCategory.createMany({
      data: ['Ingredients', 'Utilities', 'Staff Wages', 'Rent', 'Marketing', 'Equipment', 'Maintenance', 'Miscellaneous']
        .map((name) => ({ name })),
    });
  }

  console.log('✅ Expense categories seeded');

  // ── Settings ───────────────────────────────────────────────
  const settingsData = [
    { settingKey: 'shop_name',            settingValue: 'Holiday Ice Cream Bar' },
    { settingKey: 'shop_address',         settingValue: '123 Ice Cream Street, Sweet City' },
    { settingKey: 'shop_phone',           settingValue: '+1-234-567-8900' },
    { settingKey: 'shop_email',           settingValue: 'info@holidayicecream.com' },
    { settingKey: 'tax_enabled',          settingValue: 'false' },
    { settingKey: 'tax_rate',             settingValue: '0' },
    { settingKey: 'currency',             settingValue: 'PKR' },
    { settingKey: 'currency_symbol',      settingValue: 'PKR ' },
    { settingKey: 'receipt_footer',       settingValue: 'Thank you for visiting Holiday Ice Cream Bar! 🍦' },
    { settingKey: 'low_stock_alert',      settingValue: '10' },
    { settingKey: 'loyalty_points_ratio', settingValue: '100' },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { settingKey: s.settingKey },
      update: {},
      create: s,
    });
  }

  console.log('✅ Settings seeded');

  // ── Default customer ───────────────────────────────────────
  await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Walk-in Customer', phone: '', email: '' },
  });

  // ── Suppliers ──────────────────────────────────────────────
  await prisma.supplier.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Ice Cream Supplies Co.',
      phone: '+1-800-ICE-1234',
      email: 'orders@icesupplies.com',
      address: '456 Supply Road, Cold Town',
    },
  });

  await prisma.supplier.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Beverage Distributors Ltd.',
      phone: '+1-800-BEV-5678',
      email: 'sales@bevdist.com',
      address: '789 Drink Lane, Thirst City',
    },
  });

  console.log('✅ Suppliers seeded');
  console.log('\n🎉 Database seeded successfully!');
  console.log('\nDefault login credentials:');
  console.log('  Admin   → admin@holidayicecream.com   / admin123');
  console.log('  Manager → manager@holidayicecream.com / admin123');
  console.log('  Cashier → cashier@holidayicecream.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
