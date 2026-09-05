import React, { useState, useEffect, useMemo } from 'react';
import { Language, Theme, Product, CartItem, User, Order } from './types';
import { PRODUCTS, CATEGORIES_DATA } from './data/products';
import { TRANSLATIONS } from './data/translations';
import { validateAndApplyCoupon, PROMO_RULES } from './utils/discount';
import { Header } from './components/Header';
import { BannerSlider } from './components/BannerSlider';
import { CircularCategoriesSlider } from './components/CircularCategoriesSlider';
import { ProductCard } from './components/ProductCard';
import { BottomNavBar } from './components/BottomNavBar';
import { QuickViewModal } from './components/QuickViewModal';
import { CartDrawer } from './components/CartDrawer';
import { AccountModal } from './components/AccountModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrdersListModal } from './components/OrdersListModal';
import { SearchModal } from './components/SearchModal';
import { Footer } from './components/Footer';

export default function App() {
  // 1. Language state: 'ar' (default) or 'en'
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('voltic_lang');
      return saved === 'en' ? 'en' : 'ar';
    } catch {
      return 'ar';
    }
  });

  // 2. Theme state: 'dark' (default) or 'light'
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('voltic_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // 3. Cart & User state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('voltic_cart') || '[]');
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('voltic_current_user') || 'null');
    } catch {
      return null;
    }
  });

  // Modals & UI states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'register' | 'login'>('register');
  const [isOrdersListOpen, setIsOrdersListOpen] = useState(false);
  const [ordersModalTitle, setOrdersModalTitle] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('summer');

  // Discount coupon state
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');

  const appliedCoupon = useMemo(() => {
    if (!appliedCouponCode) return null;
    const res = validateAndApplyCoupon(appliedCouponCode, cart, PRODUCTS, language);
    if (res.success && res.rule) {
      return {
        code: res.code!,
        discountAmount: res.discountAmount,
        discountPercent: res.discountPercent || res.rule.percent,
        desc: language === 'ar' ? res.rule.labelAr : res.rule.labelEn,
      };
    }
    return null;
  }, [appliedCouponCode, cart, language]);

  const handleApplyCoupon = (code: string) => {
    const cleanCode = code.trim().replace(/[\s\-_]/g, '').toUpperCase();
    const rule = PROMO_RULES[cleanCode];
    if (!rule) {
      return {
        success: false,
        message: language === 'ar' ? 'كود الخصم غير صحيح' : 'Invalid discount code',
      };
    }

    // Check against cart OR current product in quickview
    const simulatedCart = (quickViewProduct && !cart.some((c) => c.id === quickViewProduct.id))
      ? [...cart, { id: quickViewProduct.id, qty: 1 }]
      : cart;

    const res = validateAndApplyCoupon(cleanCode, simulatedCart, PRODUCTS, language);
    if (res.success || (quickViewProduct && quickViewProduct.category === rule.category)) {
      setAppliedCouponCode(rule.code);
      showToast(
        language === 'ar'
          ? `تم تطبيق كود الخصم (${rule.code}) بنجاح!`
          : `Coupon code (${rule.code}) applied successfully!`
      );
      return {
        success: true,
        message: language === 'ar' ? `تم تطبيق كود الخصم (${rule.code}) بنجاح` : `Coupon code (${rule.code}) applied`,
      };
    } else {
      return {
        success: false,
        message: res.error || (language === 'ar' ? 'كود الخصم غير مطابق لهذا القسم' : 'Invalid discount code for this section'),
      };
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode('');
    showToast(language === 'ar' ? 'تم إلغاء كود الخصم' : 'Coupon code removed');
  };

  // Sync Language and Direction on DOM
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('voltic_lang', language);
    } catch {
      // ignore
    }
  }, [language]);

  // Sync Theme on Body class and localStorage
  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);
    try {
      localStorage.setItem('voltic_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Save Cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voltic_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(
      language === 'ar'
        ? nextTheme === 'light'
          ? 'تم تفعيل الوضع النهاري'
          : 'تم تفعيل الوضع الليلي'
        : nextTheme === 'light'
        ? 'Switched to Light Theme'
        : 'Switched to Dark Theme'
    );
  };

  const handleAddToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { id: product.id, qty }];
    });

    const notice = language === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart';
    setCartNotice(notice);
    setTimeout(() => {
      setCartNotice((curr) => (curr === notice ? null : curr));
    }, 2400);
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleSaveUser = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('voltic_current_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('voltic_current_user');
    } catch {
      // ignore
    }
    showToast(t.loggedOutMsg);
  };

  // Checkout process: creates order, sends to WhatsApp, shows order confirmation
  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (!currentUser) {
      setIsCartOpen(false);
      setIsAccountOpen(true);
      return;
    }

    const orderId = 'VLT-' + Date.now().toString().slice(-6);
    const detailedItems = cart
      .map((item) => {
        const p = PRODUCTS.find((prod) => prod.id === item.id);
        if (!p) return null;
        return {
          name: language === 'ar' ? p.nameAr : p.nameEn,
          qty: item.qty,
          price: p.price,
        };
      })
      .filter(Boolean) as { name: string; qty: number; price: number }[];

    const subtotal = detailedItems.reduce((acc, i) => acc + i.price * i.qty, 0);
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    const newOrder: Order = {
      id: orderId,
      date: new Date().toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
      customer: {
        name: currentUser.name,
        phone: currentUser.phone,
        phone2: currentUser.phone2,
        address: currentUser.address,
      },
      items: detailedItems,
      subtotal,
      discountCode: appliedCoupon ? appliedCoupon.code : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      discountDesc: appliedCoupon ? appliedCoupon.desc : undefined,
      total: finalTotal,
    };

    let ordersList: Order[] = [];
    try {
      ordersList = JSON.parse(localStorage.getItem('voltic_orders') || '[]');
    } catch {
      ordersList = [];
    }
    ordersList.unshift(newOrder);
    try {
      localStorage.setItem('voltic_orders', JSON.stringify(ordersList));
    } catch {
      // ignore
    }

    // Clear cart and show order confirmation modal directly
    setCart([]);
    setAppliedCouponCode('');
    setIsCartOpen(false);
    setIsAccountOpen(false);
    setConfirmedOrder(newOrder);
  };

  const handleOpenOwnerPanel = () => {
    const password = prompt(
      language === 'ar'
        ? 'أدخل كلمة مرور إدارة المتجر:'
        : 'Enter Store Admin Password:'
    );
    if (password === 'VOLTIC-OWNER-2026') {
      setOrdersModalTitle(t.ownerOrdersTitle);
      setIsOrdersListOpen(true);
    } else if (password !== null) {
      showToast(
        language === 'ar'
          ? 'كلمة المرور غير صحيحة'
          : 'Invalid administrator password'
      );
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const element = document.getElementById('products-section');
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

  const scrollToSection = (id: string) => {
    if (['summer', 'winter', 'occasions', 'sport'].includes(id)) {
      handleSelectCategory(id);
      return;
    }
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
    <div className="min-h-screen flex flex-col selection:bg-[#c9a84c] selection:text-black">
      
      {/* ===== 1. STICKY HEADER ===== */}
      <Header
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        cartCount={cartCount}
        cartNotice={cartNotice}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAccount={() => {
          setAccountModalTab('login');
          setIsAccountOpen(true);
        }}
        onOpenRegister={() => {
          setAccountModalTab('register');
          setIsAccountOpen(true);
        }}
        onOpenLogin={() => {
          setAccountModalTab('login');
          setIsAccountOpen(true);
        }}
        onOpenOrders={() => {
          setOrdersModalTitle(t.myOrders);
          setIsOrdersListOpen(true);
        }}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {/* ===== HERO BANNER SLIDER (With Crossfade and Native Proportions) ===== */}
        <BannerSlider
          language={language}
          onSelectCategory={(cat) => handleSelectCategory(cat)}
        />

        {/* ===== CIRCULAR CATEGORIES SLIDER ===== */}
        <div id="categories-section" className="pt-2 sm:pt-4 pb-2 sm:pb-3">
          <CircularCategoriesSlider
            language={language}
            selectedCategory={selectedCategory}
            onSelectCategory={(categoryId) => handleSelectCategory(categoryId)}
          />
        </div>

        {/* ===== SINGLE ACTIVE CATEGORY PRODUCTS SECTION (One category only at a time) ===== */}
        {(() => {
          const activeCategory =
            CATEGORIES_DATA.find((c) => c.id === selectedCategory) ||
            CATEGORIES_DATA[0];
          const categoryProducts = PRODUCTS.filter(
            (p) => p.category === activeCategory.id
          );
          const categoryTitle = isRtl ? activeCategory.titleAr : activeCategory.titleEn;
          const categoryTag = isRtl ? activeCategory.tagAr : activeCategory.tagEn;
          const categoryDesc = isRtl ? activeCategory.descAr : activeCategory.descEn;

          return (
            <section
              id="products-section"
              className="max-w-[1300px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 transition-all duration-300"
            >
              {/* Section Header */}
              <div className="text-center mb-8 sm:mb-12">
                <span className="inline-block text-[11px] sm:text-xs font-black tracking-widest text-[#c9a84c] mb-2 uppercase">
                  {categoryTag}
                </span>
                <h3 className="text-2xl sm:text-4xl font-black text-[var(--text-main)] mb-3">
                  {categoryTitle}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-[620px] mx-auto leading-relaxed">
                  {categoryDesc}
                </p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent mx-auto mt-4" />
              </div>

              {/* Product Grid - Shows ONLY products of active category */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-6">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onOpenQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            </section>
          );
        })()}

      </main>

      {/* ===== 2. FIXED BOTTOM NAVIGATION BAR (All Devices: Mobile, Tablet & Desktop) ===== */}
      <BottomNavBar
        language={language}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        cartCount={cartCount}
        cartNotice={cartNotice}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onScrollToHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onScrollToCategories={() => scrollToSection('categories-section')}
      />

      {/* ===== FOOTER ===== */}
      <Footer
        language={language}
        onOpenOrders={() => {
          setOrdersModalTitle(t.myOrders);
          setIsOrdersListOpen(true);
        }}
        onOpenOwnerPanel={handleOpenOwnerPanel}
        onScrollToSection={scrollToSection}
        onSelectCategory={handleSelectCategory}
      />

      {/* ===== TOAST NOTIFICATION ===== */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-extrabold text-xs shadow-2xl max-w-[90vw] text-center truncate pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* ===== MODALS & DRAWERS ===== */}
      <QuickViewModal
        product={quickViewProduct}
        language={language}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(p, qty, appliedCode) => {
          handleAddToCart(p, qty);
          if (appliedCode) {
            setAppliedCouponCode(appliedCode);
          }
        }}
        appliedCouponCode={appliedCouponCode}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        products={PRODUCTS}
        language={language}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        onSaveUser={handleSaveUser}
        onLogout={handleLogout}
        language={language}
        onProceedCheckoutAfterAuth={handleCheckout}
        initialTab={accountModalTab}
      />

      <OrderConfirmationModal
        order={confirmedOrder}
        language={language}
        onClose={() => setConfirmedOrder(null)}
      />

      <OrdersListModal
        isOpen={isOrdersListOpen}
        onClose={() => setIsOrdersListOpen(false)}
        title={ordersModalTitle}
        language={language}
      />

      {/* ===== INSTANT SEARCH MODAL ===== */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        language={language}
        products={PRODUCTS}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        onQuickView={(p) => setQuickViewProduct(p)}
        onSelectCategory={handleSelectCategory}
      />

    </div>
  );
}
