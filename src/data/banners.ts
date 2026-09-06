export interface BannerItem {
  id: string;
  image: string;
  fallbackImage?: string;
  altAr: string;
  altEn: string;
  code?: string;
  category?: 'summer' | 'winter' | 'occasions' | 'sport';
}

export const DEFAULT_BANNERS: BannerItem[] = [
  {
    "id": "banner-1",
    "image": "/banners/banner-1.jpg?v=1788695388663",
    "fallbackImage": "/banner-1.jpg?v=1788695388663",
    "altAr": "VOLTIC بنر 1",
    "altEn": "VOLTIC Banner 1",
    "category": "summer"
  },
  {
    "id": "banner-2",
    "image": "/banners/banner-2.jpg?v=1788695388663",
    "fallbackImage": "/banner-2.jpg?v=1788695388663",
    "altAr": "VOLTIC بنر 2",
    "altEn": "VOLTIC Banner 2",
    "category": "winter"
  },
  {
    "id": "banner-3",
    "image": "/banners/banner-3.jpg?v=1788695388663",
    "fallbackImage": "/banner-3.jpg?v=1788695388663",
    "altAr": "VOLTIC بنر 3",
    "altEn": "VOLTIC Banner 3",
    "category": "occasions"
  }
];
