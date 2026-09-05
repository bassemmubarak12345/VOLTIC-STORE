import React, { useState } from 'react';
import {
  Menu,
  X,
  ShoppingBag,
  Search,
  Globe,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  LogIn,
  Package,
} from 'lucide-react';
import { Language, Theme } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  cartCount: number;
  cartNotice?: string | null;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenAccount: () => void;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onOpenOrders: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  cartCount,
  cartNotice,
  onOpenCart,
  onOpenSearch,
  onOpenRegister,
  onOpenLogin,
  onOpenOrders,
  onSelectCategory,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <header
        id="mainHeader"
        className="sticky top-0 z-40 w-full backdrop-blur-md transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-gold)',
        }}
      >
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          
          {/* 1. Hamburger Menu Button (Right in RTL, Left in LTR) */}
          <div className="flex items-center">
            <button
              id="headerMenuBtn"
              onClick={() => setIsMenuOpen(true)}
              className="p-2.5 rounded-md text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors focus:outline-none flex items-center gap-2 group"
              aria-label={t.navMenu}
              title={t.navMenu}
            >
              <Menu className="w-6 h-6 group-hover:scale-105 transition-transform" />
              <span className="hidden sm:inline-block text-xs font-bold tracking-wider text-[var(--text-muted)] group-hover:text-[#c9a84c]">
                {t.navMenu}
              </span>
            </button>
          </div>

          {/* 2. Logo in the Center */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-block group text-decoration-none"
            >
              <span className="text-2xl sm:text-3xl font-black tracking-[4px] sm:tracking-[6px] text-gold-gradient block leading-none select-none font-['Cinzel',sans-serif]">
                VOLTIC
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-[2px] sm:tracking-[3px] text-[var(--text-muted)] group-hover:text-[#c9a84c] transition-colors block mt-1 font-semibold uppercase">
                {t.brandSub}
              </span>
            </a>
          </div>

          {/* 3. Search Button (مكان السلة اللي فوق كما طلب المستخدم) */}
          <div className="relative flex items-center gap-2">
            <button
              id="headerSearchBtn"
              onClick={onOpenSearch}
              className="relative p-2.5 rounded-full border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/15 hover:border-[#c9a84c] transition-all flex items-center justify-center w-11 h-11 cursor-pointer group"
              aria-label={t.navSearch}
              title={t.navSearch}
            >
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Desktop Cart Button (للشاشات الكبيرة لتسهيل إتمام الشراء بجانب الشريط السفلي) */}
            <button
              id="headerDesktopCartBtn"
              onClick={onOpenCart}
              className="hidden lg:flex relative p-2.5 rounded-full border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/15 hover:border-[#c9a84c] transition-all items-center justify-center w-11 h-11 cursor-pointer group"
              aria-label={t.navCart}
              title={t.navCart}
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span
                  id="headerCartBadge"
                  className="absolute -top-1.5 -start-1.5 min-w-[20px] h-[20px] px-1 bg-gradient-to-br from-[#e8c96d] to-[#9a7830] text-black text-[11px] font-black rounded-full flex items-center justify-center shadow-md animate-scale"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ===== Slide-over 3-Bars Menu Drawer (Compact & Proportionate) ===== */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className={`fixed top-0 bottom-0 ${
              isRtl ? 'right-0 rounded-s-2xl' : 'left-0 rounded-e-2xl'
            } w-[280px] sm:w-[310px] max-w-[80vw] p-4.5 sm:p-5 flex flex-col justify-between shadow-2xl z-50 transition-transform duration-300`}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderInlineEnd: '1px solid var(--border-gold)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#c9a84c]/20 flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-[3px] text-gold-gradient font-['Cinzel',serif] select-none leading-tight">
                  VOLTIC
                </span>
                <span className="text-[8.5px] tracking-[1px] text-[var(--text-muted)] uppercase font-semibold mt-0.5">
                  LUXURY MEN FRAGRANCES
                </span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar">
              
              {/* ===== 1 & 2. تسجيل وتحته تسجيل الدخول بشكل متناسق ومضغوط ===== */}
              <div className="flex flex-col gap-2">
                {/* زر التسجيل (في الأعلى) */}
                <button
                  id="menuRegisterVerticalBtn"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenRegister();
                  }}
                  className="w-full h-10 px-3.5 rounded-lg bg-gradient-to-r from-[#e8c96d] via-[#c9a84c] to-[#9a7830] text-black shadow-xs hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-black flex-shrink-0" />
                    <span className="text-xs font-black tracking-wide">
                      {t.menuRegister}
                    </span>
                  </div>
                  {isRtl ? (
                    <ChevronLeft className="w-4 h-4 text-black/70 group-hover:-translate-x-0.5 transition-transform" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-black/70 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </button>

                {/* زر تسجيل الدخول (تحته) */}
                <button
                  id="menuLoginVerticalBtn"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full h-10 px-3.5 rounded-lg bg-[var(--bg-card-elevated)] border border-[#c9a84c]/50 hover:border-[#c9a84c] text-[var(--text-main)] shadow-xs hover:bg-[#c9a84c]/10 active:scale-[0.99] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                    <span className="text-xs font-black tracking-wide text-[#c9a84c]">
                      {t.menuLogin}
                    </span>
                  </div>
                  {isRtl ? (
                    <ChevronLeft className="w-4 h-4 text-[#c9a84c]/70 group-hover:-translate-x-0.5 transition-transform" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#c9a84c]/70 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent my-1.5" />

              {/* ===== 3. أقسام المتجر والقوائم ===== */}
              <nav className="flex flex-col gap-0.5">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold text-[var(--text-main)] hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] transition-colors text-start cursor-pointer"
                >
                  <span>{t.navHome}</span>
                  {isRtl ? <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onSelectCategory) {
                      onSelectCategory('summer');
                    } else {
                      scrollToSection('summer');
                    }
                  }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold text-[var(--text-main)] hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] transition-colors text-start cursor-pointer"
                >
                  <span>{t.navSummer}</span>
                  {isRtl ? <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onSelectCategory) {
                      onSelectCategory('winter');
                    } else {
                      scrollToSection('winter');
                    }
                  }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold text-[var(--text-main)] hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] transition-colors text-start cursor-pointer"
                >
                  <span>{t.navWinter}</span>
                  {isRtl ? <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onSelectCategory) {
                      onSelectCategory('occasions');
                    } else {
                      scrollToSection('occasions');
                    }
                  }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold text-[var(--text-main)] hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] transition-colors text-start cursor-pointer"
                >
                  <span>{t.navOccasions}</span>
                  {isRtl ? <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onSelectCategory) {
                      onSelectCategory('sport');
                    } else {
                      scrollToSection('sport');
                    }
                  }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold text-[var(--text-main)] hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] transition-colors text-start cursor-pointer"
                >
                  <span>{t.navSport}</span>
                  {isRtl ? <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenOrders();
                  }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold text-[var(--text-muted)] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors text-start cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#c9a84c]" />
                    <span>{t.myOrders}</span>
                  </div>
                  {isRtl ? <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                </button>
              </nav>

            </div>

            {/* Drawer Footer */}
            <div className="pt-2.5 border-t border-[#c9a84c]/20 text-center flex-shrink-0">
              <p className="text-[9.5px] tracking-[1.5px] text-[var(--text-muted)] font-semibold uppercase">
                VOLTIC • LUXURY MEN FRAGRANCES
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
