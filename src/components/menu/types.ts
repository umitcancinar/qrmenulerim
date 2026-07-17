export type DietTag = 'vegan' | 'vegetarian' | 'gluten-free' | 'spicy' | 'popular' | 'chef';

export type Portion = {
  id: string;
  label: string;
  price: number;
};

export type MenuProduct = {
  id: string;
  categoryId: string;
  name: string;
  kicker?: string;
  description: string;
  imageUrl: string;
  price: number;
  oldPrice?: number;
  preparationMin: number;
  calories?: number;
  tags: DietTag[];
  allergens: string[];
  ingredients: string[];
  portions?: Portion[];
  featured?: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export type RestaurantMenu = {
  name: string;
  eyebrow: string;
  tagline: string;
  description: string;
  logoText: string;
  coverUrl: string;
  address: string;
  phone: string;
  instagram: string;
  openingHours: string;
  averageWait: string;
  rating: number;
  reviewCount: number;
  announcement: string;
  categories: MenuCategory[];
  products: MenuProduct[];
};
