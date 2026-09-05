import { CartItem, Product, Language } from '../types';

export interface CouponRule {
  code: string;
  category: 'summer' | 'winter' | 'occasions';
  percent: number;
  labelAr: string;
  labelEn: string;
  categoryNameAr: string;
  categoryNameEn: string;
}

export const PROMO_RULES: Record<string, CouponRule> = {
  SUMMER50: {
    code: 'SUMMER50',
    category: 'summer',
    percent: 50,
    labelAr: 'خصم 50% على قسم العطور الصيفية',
    labelEn: '50% Off Summer Fragrances',
    categoryNameAr: 'العطور الصيفية',
    categoryNameEn: 'Summer Fragrances',
  },
  WIN40: {
    code: 'WIN40',
    category: 'winter',
    percent: 40,
    labelAr: 'خصم 40% على قسم العطور الشتوية',
    labelEn: '40% Off Winter Fragrances',
    categoryNameAr: 'العطور الشتوية',
    categoryNameEn: 'Winter Fragrances',
  },
  VIP25: {
    code: 'VIP25',
    category: 'occasions',
    percent: 25,
    labelAr: 'خصم 25% على قسم عطور المناسبات',
    labelEn: '25% Off Occasions Fragrances',
    categoryNameAr: 'عطور المناسبات',
    categoryNameEn: 'Occasions Fragrances',
  },
};

export interface DiscountResult {
  success: boolean;
  code?: string;
  discountAmount: number;
  discountPercent?: number;
  rule?: CouponRule;
  error?: string;
  qualifyingSubtotal?: number;
}

export function getProductPromoRule(category: string): CouponRule | undefined {
  return Object.values(PROMO_RULES).find((rule) => rule.category === category);
}

export function validateAndApplyCoupon(
  inputCode: string,
  cart: CartItem[],
  products: Product[],
  language: Language
): DiscountResult {
  const isRtl = language === 'ar';
  const cleanCode = inputCode.trim().replace(/[\s\-_]/g, '').toUpperCase();

  if (!cleanCode) {
    return {
      success: false,
      discountAmount: 0,
      error: isRtl ? 'يرجى إدخال كود الخصم' : 'Please enter a discount code',
    };
  }

  const rule = PROMO_RULES[cleanCode];
  if (!rule) {
    return {
      success: false,
      discountAmount: 0,
      error: isRtl ? 'كود الخصم غير صحيح' : 'Invalid discount code',
    };
  }

  // Find all items in the cart belonging to this category
  let qualifyingSubtotal = 0;
  let matchingCount = 0;

  cart.forEach((cartItem) => {
    const prod = products.find((p) => p.id === cartItem.id);
    if (prod && prod.category === rule.category) {
      qualifyingSubtotal += prod.price * cartItem.qty;
      matchingCount += cartItem.qty;
    }
  });

  if (matchingCount === 0 || qualifyingSubtotal === 0) {
    const categoryName = isRtl ? rule.categoryNameAr : rule.categoryNameEn;
    return {
      success: false,
      discountAmount: 0,
      error: isRtl
        ? `كود ${rule.code} مخصص لـ (${categoryName}) فقط. أضف عطراً من هذا القسم للاستفادة من الخصم.`
        : `Code ${rule.code} is valid only for (${categoryName}). Add an item from this category to get the discount.`,
    };
  }

  const discountAmount = Math.round(qualifyingSubtotal * (rule.percent / 100));

  return {
    success: true,
    code: rule.code,
    discountAmount,
    discountPercent: rule.percent,
    rule,
    qualifyingSubtotal,
  };
}
