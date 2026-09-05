import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface FooterProps {
  language: Language;
  onOpenOrders: () => void;
  onOpenOwnerPanel: () => void;
  onScrollToSection: (id: string) => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  language,
  onOpenOrders,
  onOpenOwnerPanel,
  onScrollToSection,
  onSelectCategory,
}) => {
  const t = TRANSLATIONS[language];

  const handleCategoryClick = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else {
      onScrollToSection(catId);
    }
  };

  return (
    <footer
      id="mainFooter"
      className="w-full pt-10 pb-24 sm:pb-28 border-t border-[#c9a84c]/20 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-strip)',
      }}
    >
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center gap-6">
        
        {/* 1. اللوجو في النصف */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-2xl sm:text-3xl font-black tracking-[4px] sm:tracking-[5px] text-gold-gradient inline-block font-['Cinzel',sans-serif] select-none leading-tight">
            VOLTIC
          </span>
          <p className="text-[10px] sm:text-[11px] tracking-[2.5px] text-[#c9a84c] font-semibold uppercase mt-1">
            {t.brandSub}
          </p>
        </div>

        {/* 2. تحته روابط الـ 4 أقسام وطلباتي تحت بعضهم بشكل احترافي */}
        <nav
          aria-label="Footer Navigation"
          className="flex flex-col items-center justify-center gap-3 text-sm font-bold text-[var(--text-muted)]"
        >
          <button
            onClick={() => handleCategoryClick('summer')}
            className="hover:text-[#c9a84c] transition-colors cursor-pointer tracking-wide"
          >
            {t.navSummer}
          </button>
          <button
            onClick={() => handleCategoryClick('winter')}
            className="hover:text-[#c9a84c] transition-colors cursor-pointer tracking-wide"
          >
            {t.navWinter}
          </button>
          <button
            onClick={() => handleCategoryClick('occasions')}
            className="hover:text-[#c9a84c] transition-colors cursor-pointer tracking-wide"
          >
            {t.navOccasions}
          </button>
          <button
            onClick={() => handleCategoryClick('sport')}
            className="hover:text-[#c9a84c] transition-colors cursor-pointer tracking-wide"
          >
            {t.navSport}
          </button>
          <button
            onClick={onOpenOrders}
            className="hover:text-[#c9a84c] transition-colors cursor-pointer tracking-wide"
          >
            {t.myOrders}
          </button>
          <a
            href="https://wa.me/201029012522"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#25D366] text-[#c9a84c] transition-colors cursor-pointer tracking-wide flex items-center justify-center gap-1.5"
            title={language === 'ar' ? 'تواصل معنا عبر واتساب' : 'Contact Us on WhatsApp'}
          >
            <span>{language === 'ar' ? 'تواصل معنا' : 'Contact Us'}</span>
          </a>
        </nav>

        {/* خط فاصل هادئ متدرج */}
        <div className="w-24 sm:w-32 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />

        {/* 3. حقوق الموقع والمصمم */}
        <div className="flex flex-col items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
          {/* حقوق الموقع */}
          <p
            onDoubleClick={onOpenOwnerPanel}
            title="VOLTIC Luxury"
            className="text-[11px] sm:text-xs select-none cursor-default"
          >
            {t.footerRights}
          </p>

          {/* المصمم BRM DIGITAL برابط مباشر للواتساب */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs">
            <span>{t.designedBy}</span>
            <a
              href="https://wa.me/201146388578"
              target="_blank"
              rel="noopener noreferrer"
              title={t.contactDesigner}
              className="font-extrabold text-[#c9a84c] hover:text-[#e8c96d] hover:underline transition-colors tracking-wide"
            >
              BRM DIGITAL
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
