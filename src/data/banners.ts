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
    "image": "/banners/banner-1.jpg",
    "fallbackImage": "/banner-1.jpg",
    "altAr": "عطور صيفية - VOLTIC",
    "altEn": "VOLTIC Summer Fragrances",
    "category": "summer"
  },
  {
    "id": "banner-2",
    "image": "/banners/banner-2.jpg",
    "fallbackImage": "/banner-2.jpg",
    "altAr": "عطور شتوية - VOLTIC",
    "altEn": "VOLTIC Winter Fragrances",
    "category": "winter"
  },
  {
    "id": "banner-3",
    "image": "/banners/banner-3.jpg",
    "fallbackImage": "/banner-3.jpg",
    "altAr": "عطور المناسبات - VOLTIC",
    "altEn": "VOLTIC Occasions Fragrances",
    "category": "occasions"
  }
];
