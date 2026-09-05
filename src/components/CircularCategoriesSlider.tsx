import React from 'react';
import { Sparkles } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { CATEGORIES_DATA } from '../data/products';

interface CircularCategoriesSliderProps {
  language: Language;
  selectedCategory?: string;
  onSelectCategory: (categoryId: string) => void;
}

// 3 continuous cycles per track set to guarantee seamless looping on all screen sizes
const CYCLES = [0, 1, 2];

export const CircularCategoriesSlider: React.FC<CircularCategoriesSliderProps> = ({
  language,
  selectedCategory,
  onSelectCategory,
}) => {
  const isRtl = language === 'ar';
  const t = TRANSLATIONS[language];

  // Render a full track set containing cycles of the 4 categories + an elegant gap after each cycle
  const renderItemSet = (setKey: string) => (
    <div key={setKey} className="flex items-center flex-shrink-0">
      {CYCLES.map((cycleIdx) => (
        <React.Fragment key={`${setKey}-cycle-${cycleIdx}`}>
          {/* الأقسام الأربعة فقط */}
          {CATEGORIES_DATA.map((cat, catIdx) => {
            const title = isRtl ? cat.titleAr : cat.titleEn;
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={`${setKey}-${cycleIdx}-${cat.id}-${catIdx}`}
                className="px-2.5 sm:px-3.5 flex-shrink-0"
              >
                <button
                  onClick={() => onSelectCategory(cat.id)}
                  className="group flex flex-col items-center focus:outline-none transition-all cursor-pointer select-none"
                  style={{ width: '90px' }}
                  title={title}
                >
                  {/* Circular Avatar with Luxury Continuous Gold Ring - 100% full, unbroken and never clipped */}
                  <div
                    className={`relative rounded-full transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'p-[3px] bg-gradient-to-tr from-[#ffe082] via-[#c9a84c] to-[#9a7830] shadow-[0_0_18px_rgba(201,168,76,0.7)] scale-105'
                        : 'p-[2px] bg-gradient-to-tr from-[#c9a84c]/60 via-[#e8c96d]/40 to-[#9a7830]/40 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(201,168,76,0.35)]'
                    }`}
                  >
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-[var(--bg-page)] bg-[var(--bg-card)]">
                      <img
                        src={cat.img}
                        alt={title}
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Category Name */}
                  <span
                    className={`mt-1.5 text-xs sm:text-sm font-extrabold transition-colors text-center line-clamp-1 ${
                      isSelected
                        ? 'text-[#c9a84c]'
                        : 'text-[var(--text-main)] group-hover:text-[#c9a84c]'
                    }`}
                  >
                    {title}
                  </span>
                </button>
              </div>
            );
          })}

          {/* فراغ بسيط بعد نهاية الأقسام الـ 4 لتبدأ الدورة التالية بعدها بسلاسة */}
          <div
            className="w-12 sm:w-16 md:w-20 flex-shrink-0 flex items-center justify-center select-none"
            aria-hidden="true"
          >
            <div className="flex items-center gap-1.5 opacity-35">
              <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />
              <span className="w-4 sm:w-6 h-px bg-[#c9a84c]" />
              <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <section
      id="categoriesSliderSection"
      aria-label="Categories"
      className="w-full max-w-[1440px] mx-auto px-2 sm:px-3.5 md:px-5 py-2.5 sm:py-3.5"
    >
      {/* Header with Title and Royal Sparkle Accent */}
      <div className="flex items-center justify-start mb-2 sm:mb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#c9a84c]" />
          <h3 className="text-sm sm:text-base md:text-lg font-black tracking-wide text-[var(--text-main)]">
            {t.categoriesSliderTitle}
          </h3>
        </div>
      </div>

      {/* 
        Continuous Seamless Waterwheel (ساقية مستمرة للأقسام الأربعة تتحرك من الشمال إلى اليمين بسلاسة وبدون أي انقطاع)
      */}
      <div
        className="relative w-full overflow-hidden py-3.5 sm:py-4.5 select-none"
        dir="ltr"
      >
        {/* Ambient subtle edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-3 sm:w-5 bg-gradient-to-r from-[var(--bg-page)] to-transparent z-10 opacity-70" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-3 sm:w-5 bg-gradient-to-l from-[var(--bg-page)] to-transparent z-10 opacity-70" />

        {/* Infinite Waterwheel Track */}
        <div className="waterwheel-track">
          {renderItemSet('set-a')}
          {renderItemSet('set-b')}
        </div>
      </div>
    </section>
  );
};
