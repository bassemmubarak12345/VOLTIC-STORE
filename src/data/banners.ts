export interface BannerItem {
  id: string;
  image: string;
  fallbackImage?: string;
  altAr: string;
  altEn: string;
  code?: string;
  category?: 'summer' | 'winter' | 'occasions' | 'sport';
}

/**
 * قائمة البنرات الإعلانية في المتجر:
 * يمكنك إضافة البنرات التي تريدها من جيت هاب هنا مباشرة داخل المصفوفة DEFAULT_BANNERS.
 * 
 * طريقة الإضافة:
 * 1. ضع رابط الصورة المباشر من الإنترنت، مثلاً: image: 'https://example.com/banner.jpg'
 * 2. أو ضع الصور داخل مجلد public/banners/ واستخدم المسار، مثلاً: image: '/banners/banner-1.jpg'
 * 
 * مثال:
 * export const DEFAULT_BANNERS: BannerItem[] = [
 *   {
 *     id: 'banner-1',
 *     image: 'https://example.com/banner1.jpg', // أو '/banners/banner1.jpg'
 *     altAr: 'عطور صيفية حصرية',
 *     altEn: 'Exclusive Summer Fragrances',
 *     category: 'summer',
 *   },
 * ];
 */
export const DEFAULT_BANNERS: BannerItem[] = [];
