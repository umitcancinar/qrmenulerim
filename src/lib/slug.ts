const turkishMap: Record<string, string> = { ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i', ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u' };

export function slugify(value: string) {
  return value
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (letter) => turkishMap[letter] || letter)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
