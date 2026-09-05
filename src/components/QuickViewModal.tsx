import React, { useState } from 'react';
import { X, Star, Plus, Minus, ShoppingBag, Check, Tag, Percent, CheckCircle2 } from 'lucide-react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { getProductPromoRule, PROMO_RULES } from '../utils/discount';

interface QuickViewModalProps {
  product: Product | null;
  language: Language;
  onClose: () => void;
  onAddToCart: (product: Product, qty: number, appliedCode?: string) => void;
  appliedCouponCode?: string;
  onApplyCoupon?: (code: string) => { success: boolean; message: string };
  onRemoveCoupon?: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  language,
  onClose,
  onAddToCart,
  appliedCouponCode,
  onApplyCoupon,
}) => {
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  if (!product) return null;

  const isRtl = language === 'ar';
  const t = TRANSLATIONS[language];
  const name = isRtl ? product.nameAr : product.nameEn;
  const desc = isRtl ? product.descAr : product.descEn;
  const badge = isRtl ? product.badgeAr : product.badgeEn;

  // Find promo rule applicable to this product
  const productPromo = getProductPromoRule(product.category);

  // Check if current applied code matches this product's category
  const activePromoRule = appliedCouponCode ? PROMO_RULES[appliedCouponCode] : null;
  const isAppliedForThisProduct = Boolean(
    activePromoRule && activePromoRule.category === product.category
  );

  // Discount percentages and prices
  const discountPercent = isAppliedForThisProduct
    ? activePromoRule?.percent ?? 0
    : 0;

  const unitPrice = product.price;
  const discountedUnitPrice = isAppliedForThisProduct
    ? Math.round(unitPrice * (1 - discountPercent / 100))
    : unitPrice;

  const originalTotal = unitPrice * qty;
  const liveTotal = discountedUnitPrice * qty;
  const totalSavings = originalTotal - liveTotal;

  // Handle applying promo code directly in this modal
  const handleApplyCode = (codeToApply: string) => {
    if (!codeToApply.trim()) {
      setFeedback({
        text: isRtl ? 'يرجى كتابة كود الخصم أولاً' : 'Please enter a coupon code',
        isError: true,
      });
      return;
    }

    if (onApplyCoupon) {
      const res = onApplyCoupon(codeToApply.trim());
      setFeedback({
        text: res.message,
        isError: !res.success,
      });
    }
  };

  const handleAdd = () => {
    // If a promo code was already applied or available for this product, pass it to cart
    const codeToPass = isAppliedForThisProduct
      ? appliedCouponCode
      : productPromo?.code;

    onAddToCart(product, qty, codeToPass);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-xs animate-fadeIn p-3 sm:p-4 flex items-center justify-center min-h-screen"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[850px] max-h-[90vh] my-auto overflow-y-auto rounded-xl border border-[#c9a84c]/40 shadow-2xl grid grid-cols-1 md:grid-cols-2 custom-scrollbar"
        style={{ backgroundColor: 'var(--bg-card)', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 end-3 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/70 hover:bg-[#c9a84c] text-white hover:text-black border border-[#c9a84c]/40 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="relative min-h-[260px] md:min-h-[460px] bg-black flex items-center justify-center">
          <img
            src={product.img}
            alt={name}
            className="w-full h-full object-cover object-center"
          />
          {badge && (
            <span className="absolute top-3 start-3 px-2.5 py-1 rounded text-xs font-black bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black shadow-md">
              {badge}
            </span>
          )}

          {/* If promo exists for this product, show discount banner on image */}
          {productPromo && (
            <div className="absolute bottom-3 inset-x-3 p-2 rounded-lg bg-black/85 border border-[#c9a84c]/60 backdrop-blur-md flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#f7e4a8] font-bold">
                <Tag className="w-3.5 h-3.5 text-[#c9a84c]" />
                <span>{isRtl ? 'كود الخصم:' : 'Promo Code:'}</span>
                <span className="font-mono font-black text-[#c9a84c] bg-black/60 px-1.5 py-0.5 rounded border border-[#c9a84c]/40 select-all">
                  {productPromo.code}
                </span>
              </div>
              <span className="font-black text-green-400 bg-green-950/60 px-2 py-0.5 rounded border border-green-500/30">
                {productPromo.percent}% {isRtl ? 'خصم' : 'OFF'}
              </span>
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="p-5 sm:p-7 flex flex-col justify-between">
          <div>
            {/* Rating */}
            <div className="flex items-center gap-1 text-[#c9a84c] mb-1.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`w-4 h-4 ${
                    idx < product.rating
                      ? 'fill-[#c9a84c] text-[#c9a84c]'
                      : 'text-[#c9a84c]/30'
                  }`}
                />
              ))}
            </div>

            {/* Name */}
            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] mb-2">
              {name}
            </h3>

            {/* Price & ML */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {isAppliedForThisProduct ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-green-400">
                    {discountedUnitPrice} <span className="text-sm font-bold text-[var(--text-muted)]">{t.currency}</span>
                  </span>
                  <span className="text-sm font-bold text-[var(--text-muted)] line-through">
                    {unitPrice} {t.currency}
                  </span>
                  <span className="text-[11px] font-black bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded">
                    -{discountPercent}%
                  </span>
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-[#c9a84c]">
                  {unitPrice} <span className="text-sm font-bold text-[var(--text-muted)]">{t.currency}</span>
                </div>
              )}

              <span className="px-2.5 py-0.5 rounded text-xs font-bold border border-[#c9a84c]/40 text-[var(--text-muted)]">
                {product.ml}
              </span>
            </div>

            {/* ===== DISCOUNT CODE SECTION (Visible directly upon opening product image) ===== */}
            <div className="p-3 rounded-lg bg-[var(--bg-card-elevated)] border border-[#c9a84c]/35 mb-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#c9a84c]">
                  <Percent className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'كود الخصم:' : 'Discount Code:'}</span>
                </div>

                {isAppliedForThisProduct ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-950/40 px-2 py-0.5 rounded border border-green-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? `مفعّل (${activePromoRule?.code})` : `Applied (${activePromoRule?.code})`}</span>
                  </span>
                ) : productPromo ? (
                  <span className="text-[11px] font-bold text-amber-300">
                    {isRtl ? `خصم ${productPromo.percent}% متاح لهذا العطر` : `${productPromo.percent}% discount available`}
                  </span>
                ) : null}
              </div>

              {/* Fast Apply Button if promo exists for this product */}
              {productPromo && !isAppliedForThisProduct && (
                <div className="flex items-center justify-between gap-2 bg-black/40 p-2 rounded border border-[#c9a84c]/20 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--text-muted)]">
                      {isRtl ? 'الكود المخصص:' : 'Promo:'}
                    </span>
                    <span className="font-mono font-black text-[#f7e4a8] text-xs bg-black/70 px-2 py-0.5 rounded border border-[#c9a84c]/50">
                      {productPromo.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCode(productPromo.code)}
                    className="px-2.5 py-1 rounded bg-gradient-to-r from-[#e8c96d] to-[#c9a84c] text-black font-black text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow"
                  >
                    {isRtl ? 'تطبيق الكود الآن' : 'Apply Code Now'}
                  </button>
                </div>
              )}

              {/* Custom coupon code input */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder={isRtl ? 'أدخل كود الخصم هنا...' : 'Enter discount code...'}
                  value={customCodeInput}
                  onChange={(e) => setCustomCodeInput(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded bg-black/50 border border-[#c9a84c]/30 focus:border-[#c9a84c] text-[var(--text-main)] outline-hidden uppercase tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCode(customCodeInput)}
                  className="px-3 py-1.5 rounded bg-[#c9a84c] hover:bg-[#d4b055] text-black text-xs font-black transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  {isRtl ? 'تطبيق' : 'Apply'}
                </button>
              </div>

              {/* Feedback status */}
              {feedback && (
                <p className={`text-[11px] font-bold mt-1.5 leading-snug ${feedback.isError ? 'text-red-400' : 'text-green-400'}`}>
                  {feedback.text}
                </p>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mb-4">
              {desc}
            </p>

            {/* Quantity Selector */}
            <div className="p-3 sm:p-4 rounded-lg bg-[var(--bg-card-elevated)] border border-[#c9a84c]/20 mb-4">
              <div className="text-xs font-bold text-[var(--text-muted)] mb-2">
                {t.quantity}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded border border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/10 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-base sm:text-lg font-black text-[var(--text-main)] min-w-[28px] text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((prev) => prev + 1)}
                  className="w-8 h-8 rounded border border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/10 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Live Total */}
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#c9a84c]/15 text-xs sm:text-sm font-bold">
                <span className="text-[var(--text-muted)]">{t.totalWithQty}:</span>
                <div className="text-end">
                  {isAppliedForThisProduct ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)] line-through">
                        {originalTotal} {t.currency}
                      </span>
                      <span className="text-base sm:text-lg font-black text-green-400">
                        {liveTotal} {t.currency}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base sm:text-lg font-black text-[#c9a84c]">
                      {liveTotal} {t.currency}
                    </span>
                  )}
                  {totalSavings > 0 && (
                    <span className="block text-[10px] text-green-400 font-bold">
                      {isRtl ? `وفرت ${totalSavings} ${t.currency}` : `Saved ${totalSavings} ${t.currency}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            className={`w-full py-3 sm:py-3.5 px-6 rounded-lg font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
              isAdded
                ? 'bg-green-600 text-white'
                : 'bg-gradient-to-r from-[#e8c96d] via-[#c9a84c] to-[#9a7830] text-black hover:brightness-110'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-5 h-5" />
                <span>{t.addedToCart}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>{isAppliedForThisProduct ? (isRtl ? 'إضافة إلى السلة مع الخصم' : 'Add to Cart with Discount') : t.addQtyToCart}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
