import { PrismaClient } from '@prisma/client';
import { demoMenu } from '../src/data/demo-menu';

const db = new PrismaClient();

const menuSettings = {
  eyebrow: demoMenu.eyebrow,
  tagline: demoMenu.tagline,
  instagram: demoMenu.instagram,
  openingHours: demoMenu.openingHours,
  averageWait: demoMenu.averageWait,
  rating: demoMenu.rating,
  reviewCount: demoMenu.reviewCount,
  announcement: demoMenu.announcement,
};

async function main() {
  const tenant = await db.tenant.upsert({
    where: { slug: 'mira' },
    update: {
      name: demoMenu.name === 'MİRA' ? 'MİRA Meze · Ocakbaşı · Bar' : demoMenu.name,
      status: 'ACTIVE',
      coverUrl: demoMenu.coverUrl,
      description: demoMenu.description,
      address: demoMenu.address,
      phone: demoMenu.phone,
      theme: { accent: '#6e3c82' },
      settings: menuSettings,
    },
    create: {
      name: 'MİRA Meze · Ocakbaşı · Bar', slug: 'mira', status: 'ACTIVE',
      coverUrl: demoMenu.coverUrl, description: demoMenu.description, address: demoMenu.address, phone: demoMenu.phone,
      theme: { accent: '#6e3c82' }, settings: menuSettings,
    },
  });

  for (const [categoryIndex, category] of demoMenu.categories.filter((category) => category.id !== 'favorites').entries()) {
    let targetCategory = await db.menuCategory.findFirst({ where: { tenantId: tenant.id, name: category.name } });
    if (!targetCategory) {
      targetCategory = await db.menuCategory.create({ data: { tenantId: tenant.id, name: category.name, description: category.description, sortOrder: categoryIndex + 1 } });
    } else {
      targetCategory = await db.menuCategory.update({ where: { id: targetCategory.id }, data: { description: category.description, sortOrder: categoryIndex + 1, isActive: true } });
    }

    const categoryProducts = demoMenu.products.filter((product) => product.categoryId === category.id);
    for (const [productIndex, product] of categoryProducts.entries()) {
      const existing = await db.product.findFirst({ where: { tenantId: tenant.id, categoryId: targetCategory.id, name: product.name } });
      const data = {
        tenantId: tenant.id, categoryId: targetCategory.id, name: product.name, description: product.description,
        imageUrl: product.imageUrl, kicker: product.kicker || null, price: product.price, preparationMin: product.preparationMin,
        calories: product.calories || null, badges: product.tags, allergens: product.allergens, ingredients: product.ingredients,
        portions: product.portions || [], isAvailable: true, isFeatured: Boolean(product.featured), sortOrder: productIndex + 1,
      };
      if (existing) await db.product.update({ where: { id: existing.id }, data });
      else await db.product.create({ data });
    }
  }
}

main().then(() => db.$disconnect()).catch(async (error) => { console.error(error); await db.$disconnect(); process.exit(1); });
