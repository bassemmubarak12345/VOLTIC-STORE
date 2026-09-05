export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

export type CategoryId = 'summer' | 'winter' | 'occasions' | 'sport';

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
}

export interface CartItem {
  id: string;
  qty: number;
}

export interface User {
  name: string;
  phone: string;
  phone2?: string;
  address: string;
  password?: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  customer: {
    name: string;
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
}

export interface Banner {
  id: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  discountAr: string;
  discountEn: string;
  badgeAr: string;
  badgeEn: string;
  img: string;
  code?: string;
  category?: CategoryId;
}
