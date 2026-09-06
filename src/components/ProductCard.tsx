import React from 'react';
import { ShoppingBag, Star, Eye } from 'lucide-react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface ProductCardProps {
  product: Product;
  language: Language;
  onAddToCart: (product: Product, e?: React.MouseEvent) => void;
  onOpenQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  language,
  onAddToCart,
  onOpenQuickView,
}) => {
  const isRtl = language === 'ar';
  const t = TRANSLATIONS[language];
  const name = isRtl ? product.nameAr : product.nameEn;
  const desc = isRtl ? product.descAr : product.descEn;
  const badge = isRtl ? product.badgeAr : product.badgeEn;

  return (
    <div
      onClick={() => onOpenQuickView(product)}
      className="group relative flex flex-col rounded-lg overflow-hidden border transition-all duration-300 cursor-pointer shadow-md hover:shadow-2xl hover:-translate-y-1.5"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-gold)',
      }}
    >
      {/* Badge if available */}
      {badge && (
        <div className="absolute top-3.5 end-3.5 z-20">
          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black rounded shadow-md">
            {badge}
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative h-[240px] sm:h-[280px] w-full overflow-hidden bg-[#181818]">
        <img
          src={product.img}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Hover/Tap action overlay: Opens full product details modal so user can adjust quantity, promo, and view specs before adding */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenQuickView(product);
            }}
            className="w-full max-w-[190px] py-2.5 px-4 rounded bg-gradient-to-r from-[#e8c96d] via-[#c9a84c] to-[#9a7830] text-black font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{isRtl ? 'عرض التفاصيل والطلب' : 'View Details & Order'}</span>
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Star Rating */}
          <div className="flex items-center gap-1 text-[#c9a84c] mb-1.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                className={`w-3.5 h-3.5 ${
                  idx < product.rating
                    ? 'fill-[#c9a84c] text-[#c9a84c]'
                    : 'text-[#c9a84c]/30'
                }`}
              />
            ))}
          </div>

          {/* Product Name */}
          <h4 className="text-sm sm:text-base font-extrabold text-[var(--text-main)] group-hover:text-[#c9a84c] transition-colors line-clamp-1 mb-1">
            {name}
          </h4>

          {/* Product Description */}
          <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-3">
            {desc}
          </p>
        </div>

        {/* Price & ML */}
        <div className="flex items-center justify-between pt-2 border-t border-[#c9a84c]/15 mt-auto">
          <div className="flex items-baseline gap-1 text-[#c9a84c] font-black">
            <span className="text-base sm:text-lg">{product.price}</span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">{t.currency}</span>
          </div>

          <div className="px-2 py-0.5 rounded border border-[#c9a84c]/30 text-[11px] font-bold text-[var(--text-muted)]">
            {product.ml}
          </div>
        </div>
      </div>
    </div>
  );
};
