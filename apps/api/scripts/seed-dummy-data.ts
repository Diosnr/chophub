// Seed script: dummy vendors + products + delivery zones for admin testing
// Run with: cd apps/api && bun run ../../scripts/seed-dummy-data.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(__dirname, '..', 'apps', 'api', '.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;

  console.log('Seeding dummy data...');

  // ─────────────────────────────────────────────────────────────
  // 1. Delivery zones
  // ─────────────────────────────────────────────────────────────
  const zonesCol = db.collection('deliveryzones');
  const zoneSeed = [
    { name: 'Ado-Ekiti (within)', fee: 500, estimatedDays: 1, active: true },
    { name: 'Ado-Ekiti (outskirts)', fee: 1000, estimatedDays: 1, active: true },
    { name: 'Lagos Mainland', fee: 1500, estimatedDays: 1, active: true },
    { name: 'Lagos Island', fee: 2000, estimatedDays: 1, active: true },
    { name: 'Epe / Ikorodu', fee: 2500, estimatedDays: 2, active: true },
    { name: 'Abeokuta', fee: 3000, estimatedDays: 2, active: true },
    { name: 'Ibadan', fee: 3500, estimatedDays: 2, active: true },
  ];
  for (const zone of zoneSeed) {
    await zonesCol.updateOne({ name: zone.name }, { $set: zone, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
  }
  console.log(`✓ ${zoneSeed.length} delivery zones`);

  // ─────────────────────────────────────────────────────────────
  // 2. Vendor users + vendor profiles
  // ─────────────────────────────────────────────────────────────
  const usersCol = db.collection('users');
  const vendorsCol = db.collection('vendors');
  const productsCol = db.collection('products');

  const vendors = [
    {
      email: 'adebayo.fish@chophub.test',
      name: 'Adebayo Fish Farm',
      phone: '+234 803 111 0001',
      businessName: 'Adebayo Live Catfish',
      description: 'Family-run catfish farm in Ado-Ekiti. Fresh-caught every morning, live delivery.',
      status: 'pending',
      products: [
        { name: 'Live Catfish — 1kg', category: 'live-catfish', pricingType: 'per-kg', price: 3500, stock: 50, status: 'active', images: [] },
        { name: 'Live Catfish — 2kg', category: 'live-catfish', pricingType: 'per-kg', price: 3500, stock: 30, status: 'active', images: [] },
        { name: 'Live Catfish — 5kg (whole)', category: 'live-catfish', pricingType: 'per-kg', price: 3200, stock: 15, status: 'active', images: [] },
      ],
    },
    {
      email: 'mama.chicken@chophub.test',
      name: 'Mrs Adunni Olatunde',
      phone: '+234 803 111 0002',
      businessName: 'Mama Chicken Frozen Foods',
      description: 'Frozen chicken, turkey, and fish. Ibadan-based, deliver nationwide.',
      status: 'pending',
      products: [
        { name: 'Frozen Whole Chicken — 1.5kg', category: 'frozen-chicken', pricingType: 'fixed', price: 4500, stock: 40, status: 'active', images: [] },
        { name: 'Frozen Chicken Legs — 1kg pack', category: 'frozen-chicken', pricingType: 'fixed', price: 3800, stock: 60, status: 'active', images: [] },
        { name: 'Frozen Turkey — 2kg', category: 'frozen-chicken', pricingType: 'fixed', price: 9500, stock: 20, status: 'active', images: [] },
      ],
    },
    {
      email: 'jollof.king@chophub.test',
      name: 'Tunde Bakare',
      phone: '+234 803 111 0003',
      businessName: 'Tunde\'s Jollof & Co',
      description: 'Authentic Lagos-style jollof rice, pounded yam, egusi. Cooked fresh, delivered hot.',
      status: 'pending',
      products: [
        { name: 'Jollof Rice — Full plate (serves 2)', category: 'cooked-food', pricingType: 'fixed', price: 2500, stock: 25, status: 'active', images: [] },
        { name: 'Pounded Yam + Egusi (serves 2)', category: 'cooked-food', pricingType: 'fixed', price: 3500, stock: 20, status: 'active', images: [] },
        { name: 'Ofada Rice + Ayamase sauce', category: 'cooked-food', pricingType: 'fixed', price: 3200, stock: 15, status: 'active', images: [] },
      ],
    },
    {
      email: 'eko.seafood@chophub.test',
      name: 'Funmi Williams',
      phone: '+234 803 111 0004',
      businessName: 'Eko Seafood Market',
      description: 'Fresh seafood from Lagos lagoon — crabs, prawns, smoked fish.',
      status: 'pending',
      products: [
        { name: 'Smoked Catfish — 500g', category: 'cooked-food', pricingType: 'fixed', price: 2800, stock: 30, status: 'active', images: [] },
        { name: 'Dried Prawns — 250g', category: 'cooked-food', pricingType: 'fixed', price: 2200, stock: 25, status: 'active', images: [] },
      ],
    },
    {
      email: 'farm.fresh@chophub.test',
      name: 'Chinedu Okoro',
      phone: '+234 803 111 0005',
      businessName: 'FarmFresh Poultry',
      description: 'Live and frozen chicken from our Epe farm. Halal options available.',
      status: 'pending',
      products: [
        { name: 'Live Chicken — whole', category: 'frozen-chicken', pricingType: 'fixed', price: 5500, stock: 20, status: 'active', images: [] },
        { name: 'Frozen Chicken Wings — 1kg', category: 'frozen-chicken', pricingType: 'fixed', price: 3200, stock: 50, status: 'active', images: [] },
      ],
    },
    {
      email: 'abula.spot@chophub.test',
      name: 'Bisi Adebisi',
      phone: '+234 803 111 0006',
      businessName: 'Abula Spot',
      description: 'Yoruba classics: amala, gbegiri, ewedu, efo riro. Cooked the way mum used to.',
      status: 'approved',
      products: [
        { name: 'Amala + Abula combo (serves 2)', category: 'cooked-food', pricingType: 'fixed', price: 3800, stock: 18, status: 'active', images: [] },
        { name: 'Efo Riro + Rice (serves 1)', category: 'cooked-food', pricingType: 'fixed', price: 2200, stock: 30, status: 'active', images: [] },
      ],
    },
    {
      email: 'grill.master@chophub.test',
      name: 'Ibrahim Suleiman',
      phone: '+234 803 111 0007',
      businessName: 'Suya Master Lagos',
      description: 'Suya, kilishi, asun. Northern Nigerian street food, Lagos delivery.',
      status: 'approved',
      products: [
        { name: 'Suya — 500g pack', category: 'cooked-food', pricingType: 'fixed', price: 2500, stock: 40, status: 'active', images: [] },
        { name: 'Asun (spicy peppered goat) — 500g', category: 'cooked-food', pricingType: 'fixed', price: 4500, stock: 15, status: 'active', images: [] },
      ],
    },
    {
      email: 'rejected.test@chophub.test',
      name: 'Test Rejected Vendor',
      phone: '+234 803 111 0099',
      businessName: 'Questionable Foods Ltd',
      description: 'This is a test vendor that should appear as rejected in admin.',
      status: 'rejected',
      products: [],
    },
  ];

  let vendorsCreated = 0;
  let productsCreated = 0;

  for (const v of vendors) {
    // Upsert user
    let user = await usersCol.findOne({ email: v.email });
    if (!user) {
      const passwordHash = await bcrypt.hash('vendorpass123', 10);
      const referralCode = 'V' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const insert = await usersCol.insertOne({
        email: v.email,
        passwordHash,
        name: v.name,
        phone: v.phone,
        role: 'vendor',
        walletBalance: 0,
        referralCode,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      user = await usersCol.findOne({ _id: insert.insertedId });
      vendorsCreated++;
    }

    if (!user) continue;

    // Upsert vendor
    let vendor = await vendorsCol.findOne({ userId: user._id });
    if (!vendor) {
      const insert = await vendorsCol.insertOne({
        userId: user._id,
        businessName: v.businessName,
        description: v.description,
        status: v.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vendor = await vendorsCol.findOne({ _id: insert.insertedId });
    }

    if (!vendor) continue;

    // Insert products
    for (const p of v.products) {
      const exists = await productsCol.findOne({ vendorId: vendor._id, name: p.name });
      if (!exists) {
        await productsCol.insertOne({
          vendorId: vendor._id,
          name: p.name,
          description: undefined,
          images: [],
          category: p.category,
          pricingType: p.pricingType,
          price: p.price,
          stock: p.stock,
          status: p.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        productsCreated++;
      }
    }
  }

  console.log(`✓ ${vendorsCreated} vendor users + ${productsCreated} products`);

  // ─────────────────────────────────────────────────────────────
  // 3. Default settings
  // ─────────────────────────────────────────────────────────────
  const settingsCol = db.collection('settings');
  await settingsCol.updateOne({ key: 'delivery_fee' }, { $set: { value: 1500 } }, { upsert: true });
  await settingsCol.updateOne({ key: 'referral_reward' }, { $set: { value: 500 } }, { upsert: true });
  console.log('✓ Default settings (delivery_fee=1500, referral_reward=500)');

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  const totalVendors = await vendorsCol.countDocuments();
  const totalProducts = await productsCol.countDocuments();
  const totalZones = await zonesCol.countDocuments();
  const pendingVendors = await vendorsCol.countDocuments({ status: 'pending' });
  const approvedVendors = await vendorsCol.countDocuments({ status: 'approved' });
  const rejectedVendors = await vendorsCol.countDocuments({ status: 'rejected' });

  console.log('\n=== Final counts ===');
  console.log(`Vendors: ${totalVendors} (${pendingVendors} pending, ${approvedVendors} approved, ${rejectedVendors} rejected)`);
  console.log(`Products: ${totalProducts}`);
  console.log(`Delivery zones: ${totalZones}`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});