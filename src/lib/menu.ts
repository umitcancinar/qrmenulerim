import { db } from '@/lib/db';
import { tenantLifecycleBySlug } from '@/lib/lifecycle';
import type { DietTag, RestaurantMenu } from '@/components/menu/types';
import { externalCategoryItems, inspectExternalMenuSource, type ExternalMenuCategory } from '@/lib/external-menu';

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
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^-?\d+(?:[.,]\d+)?$/.test(value.trim())) {
    const parsed = Number(value.trim().replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
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

export async function getPublicMenu(slug: string, verifiedTenantId?: string) {
  let tenantId = verifiedTenantId;
  if (!tenantId) {
    const access = await tenantLifecycleBySlug(slug);
    if (!access || !['ACTIVE', 'TRIAL_ACTIVE'].includes(access.lifecycle)) return null;
    tenantId = access.tenant.id;
  }
  const tenant = await db.tenant.findFirst({
    where: { id: tenantId },
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
  if (settings.menuApiEnabled === true && settings.menuApiUrl) {
    try {
      const { payload: external } = await inspectExternalMenuSource(settings.menuApiUrl, slug);
      const externalCategories = (external.categories as ExternalMenuCategory[]).map((category, index) => ({ id: asString(category.id, `external-category-${index}`), name: asString(category.name, `Kategori ${index + 1}`), description: asString(category.description, 'Özenle hazırlanan lezzetler'), icon: asString(category.icon, categoryIcons[index % categoryIcons.length]) }));
      const externalProducts = (external.categories as ExternalMenuCategory[]).flatMap((category, categoryIndex) => {
          const categoryId = asString(category.id, `external-category-${categoryIndex}`); const items = externalCategoryItems(external, category);
          return items.filter((item) => item.isActive !== false && item.isAvailable !== false).map((item, itemIndex) => {
            const price = asNumber(item.basePrice ?? item.price, 0); const portionOptions = Array.isArray(item.portionOptions) ? item.portionOptions : Array.isArray(item.portions) ? item.portions : [];
            return { id: asString(item.id, `external-item-${categoryIndex}-${itemIndex}`), categoryId, name: asString(item.name, 'İsimsiz ürün'), kicker: asString(item.badge ?? item.kicker) || undefined, description: asString(item.description, 'Açıklama yakında eklenecek.'), imageUrl: asString(item.image ?? item.imageUrl, fallbackCover), price, preparationMin: asNumber(item.preparationTime ?? item.preparationMin, 15), calories: asNumber(item.calories, 0) || undefined, tags: normalizeTags(asStrings(item.tags ?? item.badges ?? (item.badge ? [item.badge] : []))), allergens: asStrings(item.allergens), ingredients: asStrings(item.ingredients), portions: portionOptions.flatMap((portion, portionIndex) => { if (!portion || typeof portion !== 'object') return []; const value = portion as Record<string, unknown>; const label = asString(value.name ?? value.label); const directPrice = asNumber(value.price, Number.NaN); const override = asNumber(value.priceOverride, Number.NaN); const multiplier = asNumber(value.multiplier, 1); return label ? [{ id: asString(value.id, `portion-${portionIndex}`), label, price: Number.isFinite(directPrice) ? directPrice : Number.isFinite(override) ? override : price * multiplier }] : []; }), featured: item.isFeatured === true || item.featured === true };
          });
        });
        const externalName = asString(external.restaurantName ?? external.name, storedTenant.name);
        return { name: externalName, eyebrow: asString(settings.eyebrow, 'DİJİTAL MENÜ'), tagline: asString(settings.tagline, 'Lezzeti keşfet.'), description: storedTenant.description || asString(external.description, 'Özenle seçilmiş lezzetlerimizi keşfedin.'), logoText: externalName.slice(0, 1).toLocaleUpperCase('tr-TR'), coverUrl: asString(external.coverUrl, storedTenant.coverUrl || fallbackCover), address: storedTenant.address || asString(external.address, 'Adres bilgisi yakında eklenecek.'), phone: storedTenant.phone || asString(external.phone), instagram: asString(settings.instagram, asString(external.instagram, '@qrmenulerim')), openingHours: asString(settings.openingHours, asString(external.openingHours, '12:00 – 00:00')), averageWait: asString(settings.averageWait, asString(external.averageWait, '15–25 dk')), rating: asNumber(external.rating ?? settings.rating, 4.8), reviewCount: asNumber(external.reviewCount ?? settings.reviewCount, 0), announcement: asString(settings.announcement, asString(external.announcement, 'Menümüz dış menü kaynağından güncel olarak getiriliyor.')), categories: [{ id: 'favorites', name: 'Şefin Seçkisi', icon: '✦', description: 'Mutfağın öne çıkan lezzetleri' }, ...externalCategories.filter((category) => category.id !== 'favorites')], products: externalProducts } satisfies RestaurantMenu;
    } catch { /* Harici kaynak yanıt vermezse işletmenin kendi kayıtlı menüsüne geri dön. */ }
  }
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
