import { db } from '@/lib/db';

export const standVisualStyles = ['obsidian', 'atelier', 'walnut', 'prism', 'terra'] as const;
export type StandVisualStyle = typeof standVisualStyles[number];

export const defaultStandProducts = [
  {
    name: 'Obsidyen Dikey', slug: 'obsidyen-dikey', visualStyle: 'obsidian', sortOrder: 10,
    imageUrl: '/stands/obsidyen-dikey.jpg',
    dimensions: '10 × 15 cm', material: '3 mm siyah pleksi · UV baskı',
    description: 'Keskin çizgili, mat siyah yüzeyli ve modern restoran masaları için güçlü bir masaüstü standı.',
  },
  {
    name: 'Atelier Kemer', slug: 'atelier-kemer', visualStyle: 'atelier', sortOrder: 20,
    imageUrl: '/stands/atelier-kemer.jpg',
    dimensions: '11 × 17 cm', material: '5 mm dekota · Kontur kesim',
    description: 'Yumuşak kemer formu ve sıcak kırık beyaz yüzeyiyle kafe, pastane ve butik işletmelere uyum sağlar.',
  },
  {
    name: 'Ceviz Çerçeve', slug: 'ceviz-cerceve', visualStyle: 'walnut', sortOrder: 30,
    imageUrl: '/stands/ceviz-cerceve.jpg',
    dimensions: '10 × 16 cm', material: '6 mm MDF · Ahşap desen baskı',
    description: 'Ahşap dokulu çerçevesiyle steakhouse, ocakbaşı ve doğal malzeme kullanan mekânlar için tasarlandı.',
  },
  {
    name: 'Şeffaf Prizma', slug: 'seffaf-prizma', visualStyle: 'prism', sortOrder: 40,
    imageUrl: '/stands/seffaf-prizma.jpg',
    dimensions: '9 × 14 cm', material: '3 + 3 mm şeffaf pleksi · UV baskı',
    description: 'Hafif, ferah ve her masa düzenine karışan şeffaf gövde; iki yüzlü kullanım için uygundur.',
  },
  {
    name: 'Terra Totem', slug: 'terra-totem', visualStyle: 'terra', sortOrder: 50,
    imageUrl: '/stands/terra-totem.jpg',
    dimensions: '12 × 18 cm', material: '3 mm PVC · Çift taraflı UV baskı',
    description: 'Sıcak toprak tonu ve geniş QR alanıyla yoğun servisli bistro ve sosyal mekânlar için dikkat çekici bir seçenek.',
  },
] as const;

const standSeedState = globalThis as typeof globalThis & { standDefaultsPromise?: Promise<void> };

export async function ensureDefaultStandProducts() {
  standSeedState.standDefaultsPromise ??= (async () => {
    const productCount = await db.standProduct.count();
    if (productCount > 0) return;
    await db.standProduct.createMany({
      data: defaultStandProducts.map((product) => ({ ...product, price: null, isActive: true })),
      skipDuplicates: true,
    });
  })().catch((error) => {
    delete standSeedState.standDefaultsPromise;
    throw error;
  });
  await standSeedState.standDefaultsPromise;
}

export async function activeStandProducts() {
  const products = await db.standProduct.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  if (products.length) return products;
  await ensureDefaultStandProducts();
  return db.standProduct.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
}
