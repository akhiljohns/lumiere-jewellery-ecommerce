/**
 * Placeholder jewellery images from Unsplash, used when products
 * don't have their own images yet. These match the Lumière style.
 */
export const PLACEHOLDER_PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800",
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800",
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800",
  "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800",
  "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800",
  "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=800",
  "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800",
];

/**
 * Returns a deterministic placeholder image URL based on a string key
 * (e.g. product ID), so the same product always gets the same image.
 */
export function getPlaceholderImage(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PLACEHOLDER_PRODUCT_IMAGES.length;
  return PLACEHOLDER_PRODUCT_IMAGES[index];
}
