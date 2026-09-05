import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  ShoppingBag,
  Eye,
  Sparkles,
  Check,
  Flame,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onSelectCategory?: (categoryId: string) => void;
}

// Arabic text normalizer for accurate search matches
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
    .trim();
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  language,
  products,
  onAddToCart,
  onQuickView,
  onSelectCategory,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'summer' | 'winter' | 'occasions' | 'sport'>('all');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  // Popular search suggestions
  const TRENDING_SEARCHES = [
    { labelAr: 'عطور صيفية منعشة', labelEn: 'Fresh Summer', key: 'صيف' },
    { labelAr: 'عطور شتوية دافئة', labelEn: 'Warm Winter', key: 'شتو' },
    { labelAr: 'عطور المناسبات الفاخرة', labelEn: 'Luxury Occasions', key: 'مناسب' },
    { labelAr: 'عطور رياضية حيوية', labelEn: 'Sport Fragrances', key: 'رياض' },
    { labelAr: 'عود ملكي', labelEn: 'Royal Oud', key: 'عود' },
    { labelAr: 'عنبر ومسك', labelEn: 'Amber & Musk', key: 'عنبر' },
    { labelAr: 'فانيلا فاخرة', labelEn: 'Vanilla', key: 'فانيلا' },
    { labelAr: 'أكوا البحر', labelEn: 'Aqua Sea', key: 'اكوا' },
  ];

  // Filter Categories Pills
  const FILTER_PILLS = [
    { id: 'all', labelAr: 'جميع العطور', labelEn: 'All Perfumes' },
    { id: 'summer', labelAr: 'عطور صيفية', labelEn: 'Summer' },
    { id: 'winter', labelAr: 'عطور شتوية', labelEn: 'Winter' },
    { id: 'occasions', labelAr: 'عطور المناسبات', labelEn: 'Occasions' },
    { id: 'sport', labelAr: 'عطور رياضية', labelEn: 'Sport' },
  ];

  // Lock body scroll when open and focus input
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setActiveFilter('all');
      setAddedProductId(null);
    }
  }, [isOpen]);

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered Products based on query & active tab
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by tab if selected
    if (activeFilter !== 'all') {
      result = result.filter((p) => p.category === activeFilter);
    }

    const cleanQ = query.trim();
    if (!cleanQ) {
      return activeFilter === 'all' ? [] : result;
    }

    const normQ = normalizeArabic(cleanQ);
    const lowerQ = cleanQ.toLowerCase();

    const isSummerQuery = normQ.includes('صيف') || lowerQ.includes('summer');
    const isWinterQuery = normQ.includes('شت') || lowerQ.includes('winter');
    const isOccasionsQuery = normQ.includes('مناسب') || lowerQ.includes('occasion');
    const isSportQuery = normQ.includes('رياض') || lowerQ.includes('sport');

    return result.filter((p) => {
      if (!p) return false;

      const nameAr = normalizeArabic(p.nameAr || '');
      const nameEn = (p.nameEn || '').toLowerCase();
      const descAr = normalizeArabic(p.descAr || '');
      const descEn = (p.descEn || '').toLowerCase();
      const badgeAr = normalizeArabic(p.badgeAr || '');
      const badgeEn = (p.badgeEn || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const priceStr = String(p.price || '');

      const textMatch =
        nameAr.includes(normQ) ||
        nameEn.includes(lowerQ) ||
        descAr.includes(normQ) ||
        descEn.includes(lowerQ) ||
        badgeAr.includes(normQ) ||
        badgeEn.includes(lowerQ) ||
        priceStr.includes(lowerQ);

      const categoryMatch =
        category.includes(lowerQ) ||
        (isSummerQuery && category === 'summer') ||
        (isWinterQuery && category === 'winter') ||
        (isOccasionsQuery && category === 'occasions') ||
        (isSportQuery && category === 'sport');

      return textMatch || categoryMatch;
    });
  }, [query, activeFilter, products]);

  // Best Sellers / Recommended when query is empty
  const recommendedProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  const handleAddWithFeedback = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1500);
  };

  const handleSelectProduct = (product: Product) => {
    onClose();
    setTimeout(() => {
      onQuickView(product);
    }, 80);
  };

  if (!isOpen) return null;

  return (
    <div
      id="fullScreenSearchModal"
      className="fixed inset-0 z-[100] w-screen h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden animate-fadeIn"
      style={{
        backgroundColor: '#0a0a0a',
      }}
    >
      {/* 1. TOP LUXURY NAVIGATION BAR */}
      <header className="flex-shrink-0 border-b border-[#c9a84c]/20 bg-[#111111]/95 backdrop-blur-xl px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/40 flex items-center justify-center text-[#c9a84c]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black tracking-widest text-[#c9a84c] uppercase block">
                VOLTIC LUXURY
              </span>
              <span className="text-[11px] text-gray-400 font-medium hidden sm:inline-block">
                {isRtl ? 'البحث الذكي عن العطور' : 'Smart Fragrance Search'}
              </span>
            </div>
          </div>

          {/* Results Counter if searching */}
          {(query || activeFilter !== 'all') && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-xs text-[#e8c96d] font-bold">
              <span>{filteredProducts.length}</span>
              <span>{isRtl ? 'عطر متطابق' : 'fragrances'}</span>
            </div>
          )}

          {/* Close Button */}
          <button
            id="searchCloseBtn"
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#c9a84c]/35 text-gray-300 hover:text-black hover:bg-gradient-to-r hover:from-[#e8c96d] hover:to-[#c9a84c] hover:border-transparent transition-all cursor-pointer font-bold text-xs sm:text-sm active:scale-95 group"
            title={isRtl ? 'إغلاق البحث (ESC)' : 'Close Search (ESC)'}
          >
            <span>{isRtl ? 'إغلاق' : 'Close'}</span>
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          </button>

        </div>

        {/* 2. LARGE LUXURY SEARCH INPUT FIELD */}
        <div className="max-w-4xl mx-auto mt-3 sm:mt-4">
          <div className="relative flex items-center w-full bg-[#181818] border-2 border-[#c9a84c]/40 focus-within:border-[#c9a84c] focus-within:shadow-[0_0_30px_rgba(201,168,76,0.35)] rounded-2xl px-4 py-3 sm:py-3.5 transition-all">
            
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-[#c9a84c] flex-shrink-0" />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث عن اسم العطر أو المكونات (مثل: عود، عنبر، فانيلا، صيفي)...' : 'Search by perfume name or notes (e.g. Oud, Amber, Vanilla, Summer)...'}
              className="flex-1 bg-transparent px-3 text-white placeholder-gray-400 text-sm sm:text-base md:text-lg font-bold focus:outline-none"
            />

            {/* Clear button if input is filled */}
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors mr-1 cursor-pointer"
                title={isRtl ? 'مسح' : 'Clear'}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* ESC Badge */}
            <span className="hidden md:inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-gray-400 border border-white/10 select-none">
              ESC
            </span>

          </div>

          {/* 3. CATEGORY FILTER TABS (PILLS) */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar select-none">
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1 flex-shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#c9a84c]" />
              <span>{isRtl ? 'التصنيف:' : 'Filter:'}</span>
            </span>

            {FILTER_PILLS.map((pill) => {
              const isActive = activeFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveFilter(pill.id as any)}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#e8c96d] via-[#c9a84c] to-[#9a7830] text-black shadow-md shadow-[#c9a84c]/20 scale-105'
                      : 'bg-[#1a1a1a] text-gray-300 border border-[#c9a84c]/25 hover:border-[#c9a84c]/60 hover:text-[#e8c96d]'
                  }`}
                >
                  {isRtl ? pill.labelAr : pill.labelEn}
                </button>
              );
            })}
          </div>

        </div>
      </header>

      {/* 4. MAIN FULL-SCREEN SCROLLABLE CONTENT */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-6xl mx-auto w-full custom-scrollbar">
        
        {/* CASE A: No search query and 'all' filter -> Show Trending & Best Sellers Showcase */}
        {query.trim() === '' && activeFilter === 'all' ? (
          <div className="space-y-8 animate-fadeIn pb-12">
            
            {/* Trending Keywords / Suggestions */}
            <div className="bg-[#141414] border border-[#c9a84c]/25 rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-3.5">
                <Flame className="w-5 h-5 text-[#c9a84c] animate-pulse" />
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isRtl ? 'الكلمات الأكثر بحثاً وشهرة' : 'Trending Searches'}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {TRENDING_SEARCHES.map((item) => (
                  <button
                    key={item.labelAr}
                    onClick={() => setQuery(item.key)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#1e1e1e] hover:bg-gradient-to-r hover:from-[#e8c96d] hover:to-[#c9a84c] text-[#e8c96d] hover:text-black border border-[#c9a84c]/30 hover:border-transparent transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    <span>#{isRtl ? item.labelAr : item.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Fragrances Showcase */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#c9a84c]" />
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {isRtl ? 'عطور مختارة وموصى بها لك' : 'Featured & Best Seller Perfumes'}
                  </h3>
                </div>
                <span className="text-xs text-[#c9a84c] font-bold">
                  {isRtl ? 'تصفح فوري' : 'Instant Browse'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recommendedProducts.map((product) => {
                  const name = isRtl ? product.nameAr : product.nameEn;
                  const badge = isRtl ? product.badgeAr : product.badgeEn;
                  const isJustAdded = addedProductId === product.id;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="group bg-[#151515] border border-[#c9a84c]/20 hover:border-[#c9a84c] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-[0_10px_30px_rgba(201,168,76,0.15)] cursor-pointer"
                    >
                      {/* Perfume Image */}
                      <div className="relative aspect-square w-full bg-black/50 overflow-hidden">
                        <img
                          src={product.img}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {badge && (
                          <span className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-md bg-[#c9a84c] text-black text-[9px] font-black uppercase shadow-md">
                            {badge}
                          </span>
                        )}
                        <span className="absolute bottom-2 end-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] text-gray-300 font-mono border border-white/10">
                          {product.ml}
                        </span>
                      </div>

                      {/* Details & Price */}
                      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#c9a84c] transition-colors truncate">
                            {name}
                          </h4>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                            {isRtl ? product.descAr : product.descEn}
                          </p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-sm sm:text-base font-black text-[#e8c96d]">
                              {product.price} {isRtl ? 'ج.م' : 'EGP'}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-[11px] text-gray-500 line-through block -mt-1">
                                {product.originalPrice}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleAddWithFeedback(product, e)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                              isJustAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gradient-to-r from-[#e8c96d] to-[#9a7830] text-black hover:brightness-110 active:scale-95 shadow-md'
                            }`}
                          >
                            {isJustAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{isRtl ? 'تمت' : 'Added'}</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>{isRtl ? 'أضف' : 'Add'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : filteredProducts.length === 0 ? (
          /* CASE B: No products matched */
          <div className="py-16 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#1a1a1a] border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] shadow-xl">
              <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-black text-white">
                {isRtl ? 'لم نتمكن من العثور على نتائج مطابقة' : 'No matching fragrances found'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-1.5">
                {isRtl
                  ? `لم نجد عطوراً تطابق "${query}". جرب استخدام كلمات أوسع مثل (صيفي، شتوي، عود، عنبر)`
                  : `No results matching "${query}". Try searching with broader terms like (summer, winter, oud, amber)`}
              </p>
            </div>

            {/* Quick Suggestions to recover */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 max-w-lg mx-auto">
              {TRENDING_SEARCHES.slice(0, 5).map((item) => (
                <button
                  key={item.labelAr}
                  onClick={() => setQuery(item.key)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#1a1a1a] text-[#c9a84c] border border-[#c9a84c]/30 hover:bg-[#c9a84c] hover:text-black transition-all cursor-pointer"
                >
                  {isRtl ? item.labelAr : item.labelEn}
                </button>
              ))}
              
              <button
                onClick={() => {
                  setQuery('');
                  setActiveFilter('all');
                }}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#c9a84c]/15 text-[#e8c96d] border border-[#c9a84c]/50 hover:bg-[#c9a84c] hover:text-black transition-all cursor-pointer"
              >
                {isRtl ? 'إعادة ضبط والاطلاع على كل العطور' : 'View all fragrances'}
              </button>
            </div>

          </div>
        ) : (
          /* CASE C: Results Grid (Full Screen Luxury Layout) */
          <div className="space-y-4 animate-fadeIn pb-12">
            
            {/* Header bar of results */}
            <div className="flex items-center justify-between border-b border-[#c9a84c]/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-[#e8c96d]">
                  {filteredProducts.length} {isRtl ? 'عطر متطابق مع بحثك' : 'fragrances found'}
                </span>
                {query && (
                  <span className="text-xs text-gray-400">
                    ({query})
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#c9a84c] font-bold">
                VOLTIC LUXURY SELECTION
              </span>
            </div>

            {/* Full-width Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 pt-1">
              {filteredProducts.map((product) => {
                const name = isRtl ? product.nameAr : product.nameEn;
                const badge = isRtl ? product.badgeAr : product.badgeEn;
                const isJustAdded = addedProductId === product.id;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="group bg-[#141414] border border-[#c9a84c]/25 hover:border-[#c9a84c] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-[0_12px_35px_rgba(201,168,76,0.22)] cursor-pointer"
                  >
                    {/* Perfume Image with Badge */}
                    <div className="relative aspect-square w-full bg-black/60 overflow-hidden">
                      <img
                        src={product.img}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {badge && (
                        <span className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-md bg-[#c9a84c] text-black text-[9px] font-black uppercase shadow-md">
                          {badge}
                        </span>
                      )}
                      <span className="absolute bottom-2 end-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] text-gray-300 font-mono border border-white/10">
                        {product.ml}
                      </span>
                    </div>

                    {/* Perfume Info */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-[#c9a84c] transition-colors truncate">
                          {name}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                          {isRtl ? product.descAr : product.descEn}
                        </p>
                      </div>

                      {/* Pricing & Actions */}
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-sm sm:text-base font-black text-[#e8c96d]">
                            {product.price} {isRtl ? 'ج.م' : 'EGP'}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[11px] text-gray-500 line-through block -mt-0.5">
                              {product.originalPrice}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Quick View Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProduct(product);
                            }}
                            className="p-2 rounded-xl border border-[#c9a84c]/30 text-gray-300 hover:text-[#c9a84c] hover:border-[#c9a84c] hover:bg-[#c9a84c]/10 transition-all cursor-pointer"
                            title={isRtl ? 'عرض التفاصيل' : 'View Details'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Add to Cart Button */}
                          <button
                            onClick={(e) => handleAddWithFeedback(product, e)}
                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                              isJustAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gradient-to-r from-[#e8c96d] to-[#9a7830] text-black hover:brightness-110 active:scale-95 shadow-md'
                            }`}
                          >
                            {isJustAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">{isRtl ? 'تمت' : 'Added'}</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">{isRtl ? 'أضف' : 'Add'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* 5. LUXURY BOTTOM BAR */}
      <footer className="flex-shrink-0 border-t border-[#c9a84c]/20 bg-[#111111] px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isRtl ? 'نتائج فورية ومباشرة من متجر VOLTIC' : 'Live instant search from VOLTIC'}</span>
        </span>
        <span className="font-mono text-[#c9a84c] font-black text-[11px] tracking-wider">
          VOLTIC PERFUMES ©
        </span>
      </footer>

    </div>
  );
};
