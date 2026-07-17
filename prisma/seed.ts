import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const adminSeedPassword = process.env.SEED_ADMIN_PASSWORD;
  const demoSeedPassword = process.env.SEED_DEMO_PASSWORD;
  if (!adminSeedPassword || !demoSeedPassword) {
    throw new Error('SEED_ADMIN_PASSWORD and SEED_DEMO_PASSWORD must be set before running the seed command.');
  }
  const adminPassword = await bcrypt.hash(adminSeedPassword, 12);
  await db.user.upsert({ where: { username: 'superadmin' }, update: {}, create: { username: 'superadmin', displayName: 'QR Menülerim Yönetimi', passwordHash: adminPassword, role: 'SUPERADMIN' } });
  const demo = await db.tenant.upsert({ where: { slug: 'ornek-lezzet' }, update: {}, create: { name: 'Örnek Lezzet Evi', slug: 'ornek-lezzet', status: 'ACTIVE', description: 'Her lokmada iyi hissettiren, günlük ve özenli lezzetler.', theme: { accent: '#6e3c82' }, users: { create: { username: 'orneklezzet', displayName: 'Örnek Lezzet Sahibi', passwordHash: await bcrypt.hash(demoSeedPassword, 12), role: 'OWNER' } } } });
  const categoryCount = await db.menuCategory.count({ where: { tenantId: demo.id } });
  if (!categoryCount) {
    const starters = await db.menuCategory.create({ data: { tenantId: demo.id, name: 'Başlangıçlar', description: 'Güne ve sofraya iyi gelenler', sortOrder: 1 } });
    const mains = await db.menuCategory.create({ data: { tenantId: demo.id, name: 'Ana Lezzetler', description: 'Şefin imza tabakları', sortOrder: 2 } });
    await db.product.createMany({ data: [
      { tenantId: demo.id, categoryId: starters.id, name: 'Fıstıklı Humus', description: 'Sıcak tereyağı, çıtır pita ve Antep fıstığı ile.', price: 185, preparationMin: 8, badges: ['VEJETARYEN', 'ŞEFİN SEÇİMİ'], allergens: ['Gluten', 'Susam'], isFeatured: true, sortOrder: 1 },
      { tenantId: demo.id, categoryId: starters.id, name: 'Köz Patlıcan Salatası', description: 'Yoğun köz aroması, taze otlar ve nar ekşisi.', price: 165, preparationMin: 7, badges: ['GLUTENSİZ'], allergens: [], sortOrder: 2 },
      { tenantId: demo.id, categoryId: mains.id, name: 'Adana Kebap', description: 'Zırhta çekilmiş dana eti, lavaş ve mevsim yeşillikleri.', price: 390, preparationMin: 18, badges: ['POPÜLER', 'ACI'], allergens: ['Gluten'], isFeatured: true, sortOrder: 1 },
      { tenantId: demo.id, categoryId: mains.id, name: 'Kuzu Şiş', description: 'Dinlendirilmiş kuzu lokum, közlenmiş sebzeler ile.', price: 485, preparationMin: 22, badges: ['PREMİUM'], allergens: [], sortOrder: 2 }
    ] });
  }
}

main().then(() => db.$disconnect()).catch(async (error) => { console.error(error); await db.$disconnect(); process.exit(1); });
