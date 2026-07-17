import { db } from '@/lib/db';

export async function getPublicMenu(slug: string) {
  return db.tenant.findFirst({
    where: { slug, status: { in: ['ACTIVE', 'TRIAL'] } },
    select: {
      name: true, slug: true, logoUrl: true, coverUrl: true, description: true, phone: true, address: true, theme: true,
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, name: true, description: true, imageUrl: true,
          products: {
            where: { isAvailable: true }, orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
            select: { id: true, name: true, description: true, imageUrl: true, price: true, preparationMin: true, badges: true, allergens: true, isFeatured: true },
          },
        },
      },
    },
  });
}
