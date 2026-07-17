import { db } from '@/lib/db';
import type { DietTag, RestaurantMenu } from '@/components/menu/types';

const fallbackCover = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=88';
const categoryIcons = ['◌', '♨', '△', '◇', '◒', '✦'];

type StoredProduct = {
  id: string; name: string; description: string | null; imageUrl: string | null; kicker: string | null;
  price: { toString(): string } | number; preparationMin: number | null; calories: number | null;
  badges: unknown; allergens: unknown; ingredients: unknown; portions: unknown; isFeatured: boolean;
};
type StoredCategory = { id: string; name: string; description: string | null; products: StoredProduct[] };
type StoredTenant = {
  name: string; coverUrl: string | null; description: string | null; phone: string | null; address: string | null;
  settings: unknown; categories: StoredCategory[];
};

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asPortions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const portion = item as Record<string, unknown>;
    const label = asString(portion.label);
    const price = asNumber(portion.price, Number.NaN);
    return label && Number.isFinite(price) ? [{ id: asString(portion.id, `portion-${index}`), label, price }] : [];
  });
}

function normalizeTags(badges: string[]): DietTag[] {
  const lookup: Record<string, DietTag> = {
    vegan: 'vegan', 'vejetaryen': 'vegetarian', vegetarian: 'vegetarian',
    glutensiz: 'gluten-free', 'gluten-free': 'gluten-free', aci: 'spicy', 'acılı': 'spicy', spicy: 'spicy',
    popüler: 'popular', popular: 'popular', 'şefin seçimi': 'chef', chef: 'chef',
  };
  return [...new Set(badges.map((badge) => lookup[badge.toLocaleLowerCase('tr-TR').trim()]).filter((tag): tag is DietTag => Boolean(tag)))];
}

export async function getPublicMenu(slug: string) {
  const tenant = await db.tenant.findFirst({
    where: { slug, status: { in: ['ACTIVE', 'TRIAL'] } },
    select: {
      name: true, slug: true, logoUrl: true, coverUrl: true, description: true, phone: true, address: true, theme: true, settings: true,
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, name: true, description: true, imageUrl: true,
          products: {
            where: { isAvailable: true }, orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
            select: { id: true, name: true, description: true, imageUrl: true, kicker: true, price: true, preparationMin: true, calories: true, badges: true, allergens: true, ingredients: true, portions: true, isFeatured: true },
          },
        },
      },
    },
  });
  if (!tenant) return null;

  const storedTenant = tenant as unknown as StoredTenant;
  const settings = (storedTenant.settings && typeof storedTenant.settings === 'object' && !Array.isArray(storedTenant.settings)) ? storedTenant.settings as Record<string, unknown> : {};
  const categories = storedTenant.categories.map((category, index) => ({
    id: category.id,
    name: category.name,
    description: category.description || 'Özenle hazırlanan lezzetler',
    icon: categoryIcons[index % categoryIcons.length],
  }));
  const products = storedTenant.categories.flatMap((category) => category.products.map((product) => ({
    id: product.id,
    categoryId: category.id,
    name: product.name,
    kicker: product.kicker || (product.isFeatured ? 'ŞEFİN SEÇİMİ' : undefined),
    description: product.description || 'Açıklama yakında eklenecek.',
    imageUrl: product.imageUrl || fallbackCover,
    price: Number(product.price),
    preparationMin: product.preparationMin ?? 15,
    calories: product.calories ?? undefined,
    tags: normalizeTags(asStrings(product.badges)),
    allergens: asStrings(product.allergens),
    ingredients: asStrings(product.ingredients),
    portions: asPortions(product.portions),
    featured: product.isFeatured,
  })));

  return {
    name: storedTenant.name,
    eyebrow: asString(settings.eyebrow, 'DİJİTAL MENÜ'),
    tagline: asString(settings.tagline, 'Lezzeti keşfet.'),
    description: storedTenant.description || 'Özenle seçilmiş lezzetlerimizi keşfedin.',
    logoText: storedTenant.name.slice(0, 1).toLocaleUpperCase('tr-TR'),
    coverUrl: storedTenant.coverUrl || fallbackCover,
    address: storedTenant.address || 'Adres bilgisi yakında eklenecek.',
    phone: storedTenant.phone || '',
    instagram: asString(settings.instagram, '@qrmenulerim'),
    openingHours: asString(settings.openingHours, '12:00 – 00:00'),
    averageWait: asString(settings.averageWait, '15–25 dk'),
    rating: asNumber(settings.rating, 4.8),
    reviewCount: asNumber(settings.reviewCount, 0),
    announcement: asString(settings.announcement, 'Menümüzü keşfedin; her ürün için detaylara dokunabilirsiniz.'),
    categories: [{ id: 'favorites', name: 'Şefin Seçkisi', icon: '✦', description: 'Mutfağın öne çıkan lezzetleri' }, ...categories],
    products,
  } satisfies RestaurantMenu;
}
