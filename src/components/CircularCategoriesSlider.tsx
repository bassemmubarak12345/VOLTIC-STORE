import React from 'react';
import { Compass } from 'lucide-react';
import { Language, CategoryItem } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { CATEGORIES_DATA } from '../data/products';

interface CircularCategoriesSliderProps {
  language: Language;
  selectedCategory?: string;
  categories?: CategoryItem[];
  onSelectCategory: (categoryId: string) => void;
}

export const CircularCategoriesSlider: React.FC<CircularCategoriesSliderProps> = ({
  language,
  selectedCategory,
  categories = CATEGORIES_DATA as unknown as CategoryItem[],
  onSelectCategory,
}) => {
  const isRtl = language === 'ar';
  const t = TRANSLATIONS[language];

  const activeCats = categories && categories.length > 0 ? categories : (CATEGORIES_DATA as unknown as CategoryItem[]);

  return (
    <section
      id="categoriesSliderSection"
      aria-label="Categories"
      className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 py-2 sm:py-3"
    >
      {/* Header with Title */}
      <div className="flex items-center justify-start mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#c9a84c]" />
          <h3 className="text-sm sm:text-base md:text-lg font-black tracking-wide text-[var(--text-main)]">
            {t.categoriesSliderTitle}
          </h3>
        </div>
      </div>

      {/* 
        Static, Fixed, Centered Categories (ثابتة تماماً بدون أي حركة أو دوران)
      */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 flex-wrap py-2">
        {activeCats.map((cat) => {
          const title = isRtl ? cat.titleAr : cat.titleEn;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group flex flex-col items-center focus:outline-none transition-all cursor-pointer select-none"
              style={{ width: '85px' }}
              title={title}
            >
              {/* Circular Avatar with Luxury Gold Ring - Static and Crisp */}
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
                className={`mt-2 text-xs sm:text-sm font-extrabold transition-colors text-center line-clamp-1 ${
                  isSelected
                    ? 'text-[#c9a84c]'
                    : 'text-[var(--text-main)] group-hover:text-[#c9a84c]'
                }`}
              >
                {title}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
