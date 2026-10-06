export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

export type CategoryId = 'summer' | 'winter' | 'occasions' | 'sport' | string;

export interface CategoryItem {
  id: string;
  titleAr: string;
  titleEn: string;
  subAr: string;
  subEn: string;
  tagAr: string;
  tagEn: string;
  descAr: string;
  descEn: string;
  img: string;
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  ml: string;
  img: string;
  descAr: string;
  descEn: string;
  category: CategoryId;
  badgeAr?: string;
  badgeEn?: string;
  rating: number;
  inStock?: boolean;
}

export interface CartItem {
  id: string;
  qty: number;
}

export interface User {
  uid?: string;
  name: string;
  email: string;
  phone: string;
  phone2?: string;
  address: string;
  password?: string;
  createdAt?: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  timestamp?: number;
  customer: {
    name: string;
    email?: string;
    phone: string;
    phone2?: string;
    address: string;
  };
  items: OrderItem[];
  subtotal?: number;
  discountCode?: string;
  discountAmount?: number;
  discountDesc?: string;
  total: number;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
}

export interface Banner {
  id: number | string;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  discountAr?: string;
  discountEn?: string;
  badgeAr?: string;
  badgeEn?: string;
  img?: string;
  image?: string;
  fallbackImage?: string;
  altAr?: string;
  altEn?: string;
  code?: string;
  category?: CategoryId;
}

export interface StoreSettings {
  storeNameAr: string;
  storeNameEn: string;
  brandSubAr: string;
  brandSubEn: string;
  whatsappNumber: string;
  designerWhatsapp: string;
  announcementAr: string;
  announcementEn: string;
  footerRightsAr: string;
  footerRightsEn: string;
  currencyAr: string;
  currencyEn: string;
  shippingFee: number;
  freeShippingThreshold: number;
  adminEmails: string[];
}
