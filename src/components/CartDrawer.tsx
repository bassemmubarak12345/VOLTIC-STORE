import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Tag, CheckCircle2 } from 'lucide-react';
import { Product, CartItem, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface AppliedCouponInfo {
  code: string;
  discountAmount: number;
  discountPercent: number;
  desc: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  language: Language;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  appliedCoupon?: AppliedCouponInfo | null;
  onApplyCoupon?: (code: string) => { success: boolean; message: string };
  onRemoveCoupon?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  products,
  language,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  const isRtl = language === 'ar';
  const t = TRANSLATIONS[language];

  // Map cart items with full product info
  const detailedItems = cart
    .map((item) => {
      const p = products.find((prod) => prod.id === item.id);
      if (!p) return null;
      return {
        ...p,
        qty: item.qty,
        subtotal: p.price * item.qty,
      };
    })
    .filter(Boolean) as (Product & { qty: number; subtotal: number })[];

  const subtotalAmount = detailedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotalAmount - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onApplyCoupon) return;
    if (!inputCode.trim()) {
      setCouponError(isRtl ? 'يرجى كتابة كود الخصم' : 'Please enter a discount code');
      return;
    }

    const res = onApplyCoupon(inputCode);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError('');
      setInputCode('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-end animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] h-full flex flex-col shadow-2xl animate-slideIn transition-transform"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderInlineStart: '1px solid var(--border-gold)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#c9a84c]/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#c9a84c]" />
            <h3 className="font-black text-lg text-[var(--text-main)] font-['Cairo',sans-serif]">
              {t.cartTitle}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] font-black">
              {detailedItems.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#c9a84c]/15">
          {detailedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <ShoppingBag className="w-14 h-14 text-[var(--text-muted)] opacity-30 mb-3" />
              <h4 className="text-base font-bold text-[var(--text-main)] mb-1">
                {t.cartEmpty}
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-[240px] leading-relaxed">
                {t.cartEmptySub}
              </p>
            </div>
          ) : (
            detailedItems.map((item) => {
              const name = isRtl ? item.nameAr : item.nameEn;

              return (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5 items-center">
                  {/* Product Thumbnail */}
                  <img
                    src={item.img}
                    alt={name}
                    className="w-16 h-16 rounded-md object-cover flex-shrink-0 border border-[#c9a84c]/20 bg-black"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-extrabold text-[var(--text-main)] truncate mb-0.5">
                      {name}
                    </h5>
                    <div className="text-xs font-bold text-[#c9a84c] mb-2">
                      {item.price} {t.currency} &times; {item.qty} = <span className="font-black">{item.subtotal} {t.currency}</span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-[#c9a84c]/30 rounded-md bg-[var(--bg-card-elevated)]">
                        <button
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[#c9a84c] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[var(--text-main)]">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => onUpdateQty(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[#c9a84c] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title={t.cartDelete}
                        aria-label={t.cartDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer (Discount Code + Totals + Checkout) */}
        {detailedItems.length > 0 && (
          <div className="p-5 border-t border-[#c9a84c]/20 bg-[var(--bg-card-elevated)]">
            
            {/* ===== DISCOUNT CODE SECTION (خانة كود الخصم) ===== */}
            <div id="cartDiscountSection" className="mb-4">
              <label
                htmlFor="discountCodeInput"
                className="text-xs font-bold text-[var(--text-main)] mb-1.5 flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-[#c9a84c]" />
                <span>{isRtl ? 'كود الخصم' : 'Discount Code'}</span>
              </label>

              {appliedCoupon ? (
                /* Applied Coupon Tag with remove button */
                <div className="p-2.5 rounded-lg bg-[#c9a84c]/15 border border-[#c9a84c]/60 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-black text-[#f7e4a8] flex items-center gap-1.5">
                          <span>{appliedCoupon.code}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            -{appliedCoupon.discountPercent}%
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-300 truncate">
                          {appliedCoupon.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-extrabold text-emerald-400">
                        -{appliedCoupon.discountAmount} {t.currency}
                      </span>
                      {onRemoveCoupon && (
                        <button
                          type="button"
                          onClick={onRemoveCoupon}
                          className="p-1 rounded hover:bg-black/30 text-gray-400 hover:text-red-400 transition-colors"
                          title={isRtl ? 'إلغاء كود الخصم' : 'Remove code'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Input form for promo code */
                <div>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      id="discountCodeInput"
                      type="text"
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value);
                        setCouponError('');
                      }}
                      placeholder={isRtl ? 'أدخل كود الخصم' : 'Enter discount code'}
                      className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-[#c9a84c]/30 focus:border-[#c9a84c] text-xs text-white placeholder-gray-400 outline-none uppercase font-bold tracking-wider"
                    />
                    <button
                      id="applyDiscountCodeBtn"
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#e8c96d] to-[#c9a84c] text-black font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-sm flex-shrink-0"
                    >
                      {isRtl ? 'تطبيق' : 'Apply'}
                    </button>
                  </form>

                  {couponError && (
                    <p className="text-[11px] text-red-400 font-medium mt-1.5 leading-snug">
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-[#c9a84c]/15 pt-3 pb-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{isRtl ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span className="font-bold text-[var(--text-main)]">
                  {subtotalAmount} {t.currency}
                </span>
              </div>

              {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                  <span>
                    {isRtl ? 'كود الخصم' : 'Discount Code'} ({appliedCoupon.code}):
                  </span>
                  <span>
                    -{appliedCoupon.discountAmount} {t.currency}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-black pt-1.5 border-t border-[#c9a84c]/15">
                <span className="text-[var(--text-main)]">
                  {isRtl ? 'الإجمالي النهائي:' : 'Total:'}
                </span>
                <span className="text-lg text-[#c9a84c]">
                  {finalTotal} {t.currency}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              id="cartCheckoutSubmitBtn"
              onClick={onCheckout}
              className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-[#e8c96d] via-[#c9a84c] to-[#9a7830] text-black font-black text-sm tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all shadow-lg cursor-pointer"
            >
              <span>{t.cartCheckout}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
