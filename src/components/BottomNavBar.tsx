import React from 'react';
import { Home, Grid, ShoppingBag, User } from 'lucide-react';
import { Language, Theme } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface BottomNavBarProps {
  language: Language;
  theme?: Theme;
  onToggleTheme?: () => void;
  cartCount: number;
  cartNotice?: string | null;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onScrollToCategories: () => void;
  onScrollToHome: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  language,
  cartCount,
  onOpenCart,
  onOpenAccount,
  onScrollToCategories,
  onScrollToHome,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <nav
      id="bottomNavBar"
      className="fixed bottom-0 inset-x-0 w-full z-40 block border-t border-[#c9a84c]/30"
      style={{
        backgroundColor: 'var(--bottom-nav-bg)',
      }}
      aria-label="Main Bottom Navigation"
    >
      {/* Full width container spanning across the entire screen on desktop, tablet, and mobile */}
      <div className="w-full px-2 sm:px-8 md:px-16 py-2 flex items-center justify-between">
        
        {/* 1. الرئيسية (Home) */}
        <button
          id="bottomNavHome"
          onClick={onScrollToHome}
          className="flex-1 flex flex-col items-center justify-center py-1 px-2 text-[var(--text-muted)] hover:text-[#c9a84c] transition-colors cursor-pointer"
          title={t.bottomHome}
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[11px] sm:text-xs font-bold mt-1 tracking-tight">
            {t.bottomHome}
          </span>
        </button>

        {/* 2. الأقسام (Categories) */}
        <button
          id="bottomNavCategories"
          onClick={onScrollToCategories}
          className="flex-1 flex flex-col items-center justify-center py-1 px-2 text-[var(--text-muted)] hover:text-[#c9a84c] transition-colors cursor-pointer"
          title={t.bottomCategories}
        >
          <Grid className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[11px] sm:text-xs font-bold mt-1 tracking-tight">
            {t.bottomCategories}
          </span>
        </button>

        {/* 3. السلة (Cart with count badge) */}
        <button
          id="bottomNavCart"
          onClick={onOpenCart}
          className="flex-1 flex flex-col items-center justify-center py-1 px-2 text-[var(--text-muted)] hover:text-[#c9a84c] transition-colors cursor-pointer"
          title={t.bottomCart}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#c9a84c]" />
            {cartCount > 0 && (
              <span
                id="bottomNavCartBadge"
                className="absolute -top-1.5 -end-2.5 min-w-[18px] h-[18px] px-1 bg-[#c9a84c] text-black text-[10px] font-black rounded-full flex items-center justify-center"
              >
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] sm:text-xs font-bold mt-1 tracking-tight text-[#c9a84c]">
            {t.bottomCart}
          </span>
        </button>

        {/* 4. الحساب (Account) */}
        <button
          id="bottomNavAccount"
          onClick={onOpenAccount}
          className="flex-1 flex flex-col items-center justify-center py-1 px-2 text-[var(--text-muted)] hover:text-[#c9a84c] transition-colors cursor-pointer"
          title={t.bottomAccount}
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[11px] sm:text-xs font-bold mt-1 tracking-tight">
            {t.bottomAccount}
          </span>
        </button>

      </div>
    </nav>
  );
};
