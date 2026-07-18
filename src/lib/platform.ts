export const PLATFORM_NAME = 'QR Menülerim';
export const CONTACT_PHONE = '905541563862';
export const CONTACT_PHONE_DISPLAY = '0554 156 38 62';
export const PERSONAL_SITE = 'https://umitcancinar.me';

export function whatsappUrl(message = 'Merhaba, QR Menülerim hakkında bilgi almak istiyorum.') {
  return `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(message)}`;
}
