import React, { useState, useEffect, useMemo } from 'react';
import { Language, Theme, Product, CartItem, User, Order, StoreSettings, CategoryItem, Banner } from './types';
import { PRODUCTS as DEFAULT_PRODUCTS, CATEGORIES_DATA as DEFAULT_CATEGORIES } from './data/products';
import { DEFAULT_BANNERS } from './data/banners';
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
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import {
  auth,
  subscribeProducts,
  subscribeCategories,
  subscribeBanners,
  subscribeSettings,
  createOrderInFirestore,
  getCustomerProfile,
} from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

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

  // 4. Real-time Firestore Cloud States
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES as unknown as CategoryItem[]);
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS as unknown as Banner[]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // 5. Admin & Auth state
  const [adminAuthUser, setAdminAuthUser] = useState<FirebaseUser | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      return hash === '#admin' || hash === '#login' || path === '/login' || path === '/admin';
    }
    return false;
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

  // ----------------------------------------------------
  // FIREBASE REAL-TIME SUBSCRIPTIONS
  // ----------------------------------------------------
  useEffect(() => {
    // 1. Subscribe to Products
    const unsubProducts = subscribeProducts((data) => {
      if (data && data.length > 0) {
        setProducts(data);
      }
    });

    // 2. Subscribe to Categories
    const unsubCategories = subscribeCategories((data) => {
      if (data && data.length > 0) {
        setCategories(data);
      }
    });

    // 3. Subscribe to Banners
    const unsubBanners = subscribeBanners((data) => {
      if (data && data.length > 0) {
        setBanners(data);
      }
    });

    // 4. Subscribe to Store Settings
    const unsubSettings = subscribeSettings((data) => {
      if (data) {
        setSettings(data);
      }
    });

    // 5. Subscribe to Firebase Auth state
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setAdminAuthUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await getCustomerProfile(firebaseUser.uid);
          if (profile) {
            setCurrentUser(profile);
            localStorage.setItem('voltic_current_user', JSON.stringify(profile));
          }
        } catch {
          // ignore
        }
      }
    });

    // 6. Listen for hash changes to trigger Admin view (#admin, #login)
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin' || hash === '#login') {
        setIsAdminView(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubSettings();
      unsubAuth();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const appliedCoupon = useMemo(() => {
    if (!appliedCouponCode) return null;
    const res = validateAndApplyCoupon(appliedCouponCode, cart, products, language);
    if (res.success && res.rule) {
      return {
        code: res.code!,
        discountAmount: res.discountAmount,
        discountPercent: res.discountPercent || res.rule.percent,
        desc: language === 'ar' ? res.rule.labelAr : res.rule.labelEn,
      };
    }
    return null;
  }, [appliedCouponCode, cart, products, language]);

  const handleApplyCoupon = (code: string) => {
    const cleanCode = code.trim().replace(/[\s\-_]/g, '').toUpperCase();
    const rule = PROMO_RULES[cleanCode];
    if (!rule) {
      return {
        success: false,
        message: language === 'ar' ? 'كود الخصم غير صحيح' : 'Invalid discount code',
      };
    }

    const simulatedCart = (quickViewProduct && !cart.some((c) => c.id === quickViewProduct.id))
      ? [...cart, { id: quickViewProduct.id, qty: 1 }]
      : cart;

    const res = validateAndApplyCoupon(cleanCode, simulatedCart, products, language);
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

  // Checkout process: creates order, saves directly to Firestore, shows order confirmation
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!currentUser) {
      setIsCartOpen(false);
      setIsAccountOpen(true);
      return;
    }

    const orderId = 'VLT-' + Date.now().toString().slice(-6);
    const detailedItems = cart
      .map((item) => {
        const p = products.find((prod) => prod.id === item.id);
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
      timestamp: Date.now(),
      status: 'pending',
      customer: {
        name: currentUser.name,
        email: currentUser.email,
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

    // Save to Firestore Real-Time Cloud Orders Collection
    try {
      await createOrderInFirestore(newOrder);
      console.log('Order successfully saved to Firestore:', orderId);
    } catch (err) {
      console.error('Failed saving order to Firestore:', err);
    }

    // Save locally as backup for customer orders view
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

    // Clear cart and show order confirmation modal
    setCart([]);
    setAppliedCouponCode('');
    setIsCartOpen(false);
    setIsAccountOpen(false);
    setConfirmedOrder(newOrder);
  };

  const handleOpenOwnerPanel = () => {
    setIsAdminView(true);
    window.location.hash = '#admin';
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

  // =========================================================================
  // VIEW: ADMIN VIEW (PROTECTED WITH REAL FIREBASE AUTH)
  // =========================================================================
  if (isAdminView) {
    if (adminAuthUser) {
      return (
        <AdminDashboard
          language={language}
          onExitDashboard={() => {
            setIsAdminView(false);
            window.location.hash = '';
          }}
        />
      );
    } else {
      return (
        <AdminLogin
          language={language}
          onSuccess={() => setIsAdminView(true)}
          onBackToStore={() => {
            setIsAdminView(false);
            window.location.hash = '';
          }}
        />
      );
    }
  }

  // =========================================================================
  // VIEW: CUSTOMER LUXURY STORE FRONTEND
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col selection:bg-[#c9a84c] selection:text-black">
      
      {/* ===== 1. STICKY HEADER ===== */}
      <Header
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        cartCount={cartCount}
        cartNotice={cartNotice}
        settings={settings}
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
        onOpenAdmin={handleOpenOwnerPanel}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {/* ===== HERO BANNER SLIDER (With Crossfade and Real-Time Sync) ===== */}
        <BannerSlider
          language={language}
          banners={banners}
          onSelectCategory={(cat) => handleSelectCategory(cat)}
        />

        {/* ===== CIRCULAR CATEGORIES SLIDER (Real-Time Cloud Sync) ===== */}
        <div id="categories-section" className="pt-2 sm:pt-4 pb-2 sm:pb-3">
          <CircularCategoriesSlider
            language={language}
            selectedCategory={selectedCategory}
            categories={categories}
            onSelectCategory={(categoryId) => handleSelectCategory(categoryId)}
          />
        </div>

        {/* ===== SINGLE ACTIVE CATEGORY PRODUCTS SECTION (One category only at a time) ===== */}
        {(() => {
          const activeCategory =
            categories.find((c) => c.id === selectedCategory) ||
            categories[0] ||
            (DEFAULT_CATEGORIES[0] as unknown as CategoryItem);
          const rawFiltered = products.filter(
            (p) => String(p.category || '').toLowerCase() === String(activeCategory.id).toLowerCase()
          );
          const categoryProducts =
            rawFiltered.length > 0
              ? rawFiltered
              : DEFAULT_PRODUCTS.filter(
                  (p) => String(p.category || '').toLowerCase() === String(activeCategory.id).toLowerCase()
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
        settings={settings}
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
        products={products}
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
        products={products}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        onQuickView={(p) => setQuickViewProduct(p)}
        onSelectCategory={handleSelectCategory}
      />

    </div>
  );
}
