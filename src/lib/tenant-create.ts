import type { Prisma, TenantStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createTrialWindow } from '@/lib/lifecycle';

export type CreateTenantInput = {
  name: string;
  slug: string;
  ownerName: string;
  username: string;
  password: string;
  phone?: string;
  status: TenantStatus;
  starterMenu?: boolean;
};

const starterProducts = [
  { category: 0, name: 'Fıstıklı Humus', description: 'Tahin, limon, çıtır nohut ve Antep fıstığı.', price: 185, preparationMin: 8, badges: ['VEJETARYEN', 'ŞEFİN SEÇİMİ'], allergens: ['Susam'], ingredients: ['Nohut', 'Tahin', 'Limon'], imageUrl: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=900&q=84', isFeatured: true },
  { category: 0, name: 'Köz Patlıcan', description: 'Yoğun köz aroması, taze otlar ve nar ekşisi.', price: 165, preparationMin: 7, badges: ['VEGAN', 'GLUTENSİZ'], allergens: [], ingredients: ['Patlıcan', 'Maydanoz', 'Nar ekşisi'], imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=84', isFeatured: false },
  { category: 1, name: 'Şefin İmza Tabağı', description: 'Mevsim ürünleriyle günlük hazırlanan özel tabak.', price: 395, preparationMin: 18, badges: ['POPÜLER'], allergens: [], ingredients: ['Mevsim ürünleri', 'Şef sosu'], imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=84', isFeatured: true },
  { category: 1, name: 'Izgara Sebze Kasesi', description: 'Açık ateşte sebzeler, tahıl ve ferah ot sosu.', price: 285, preparationMin: 14, badges: ['VEGAN'], allergens: [], ingredients: ['Mevsim sebzeleri', 'Tahıl', 'Ot sosu'], imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=84', isFeatured: false },
];

export const safeTenantInclude = {
  users: { where: { role: 'OWNER' as const }, take: 1, select: { id: true, displayName: true, username: true, role: true, isActive: true } },
  _count: { select: { products: true, categories: true } },
} satisfies Prisma.TenantInclude;

export async function createTenantWithOwner(input: CreateTenantInput) {
  const passwordHash = await hashPassword(input.password);
  return db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        status: input.status,
        phone: input.phone || null,
        description: input.status === 'TRIAL' ? 'Menünüzü birkaç dakika içinde markanıza göre kişiselleştirin.' : null,
        ...(input.status === 'TRIAL' ? createTrialWindow() : {}),
        settings: {
          eyebrow: 'DİJİTAL MENÜ',
          tagline: `${input.name} lezzetlerini keşfet.`,
          announcement: input.status === 'TRIAL' ? '24 saatlik tam özellikli deneme profiliniz hazır.' : 'Menümüzü keşfedin.',
          openingHours: '09:00 – 23:00',
          averageWait: '15–25 dk',
        },
        users: { create: { username: input.username, displayName: input.ownerName, passwordHash, role: 'OWNER' } },
      },
    });

    if (input.starterMenu !== false) {
      const categories = await Promise.all([
        tx.menuCategory.create({ data: { tenantId: tenant.id, name: 'Başlangıçlar', description: 'Paylaşıma uygun, iştah açan lezzetler', sortOrder: 1 } }),
        tx.menuCategory.create({ data: { tenantId: tenant.id, name: 'Ana Lezzetler', description: 'Mutfağın öne çıkan tabakları', sortOrder: 2 } }),
      ]);
      await tx.product.createMany({
        data: starterProducts.map((product, index) => ({
          tenantId: tenant.id,
          categoryId: categories[product.category].id,
          name: product.name,
          description: product.description,
          price: product.price,
          preparationMin: product.preparationMin,
          badges: product.badges,
          allergens: product.allergens,
          ingredients: product.ingredients,
          imageUrl: product.imageUrl,
          isFeatured: product.isFeatured,
          sortOrder: index + 1,
        })),
      });
    }

    return tx.tenant.findUniqueOrThrow({ where: { id: tenant.id }, include: safeTenantInclude });
  });
}
