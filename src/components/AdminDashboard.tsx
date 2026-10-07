import React, { useState, useEffect } from 'react';
import {
  Package,
  ShoppingBag,
  Image as ImageIcon,
  Layers,
  Settings,
  User as UserIcon,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  Printer,
  ChevronRight,
  ChevronLeft,
  X,
  Upload,
  KeyRound,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import {
  auth,
  subscribeProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeCategories,
  saveCategoryToFirestore,
  subscribeBanners,
  saveBannerToFirestore,
  deleteBannerFromFirestore,
  subscribeSettings,
  saveSettingsToFirestore,
  subscribeOrders,
  updateOrderStatusInFirestore,
  deleteOrderFromFirestore,
  checkAdminEmail,
} from '../lib/firebase';
import {
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { Product, CategoryItem, Banner, Order, StoreSettings, Language } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

interface AdminDashboardProps {
  language: Language;
  onExitDashboard: () => void;
}

type TabType = 'products' | 'orders' | 'banners' | 'categories' | 'settings' | 'account';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  language,
  onExitDashboard,
}) => {
  const isRtl = language === 'ar';
  const [currentTab, setCurrentTab] = useState<TabType>('products');

  // Real-time Firestore States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Toast / Status
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((curr) => (curr?.text === text ? null : curr));
    }, 4000);
  };

  // Subscriptions to Firestore Realtime Updates
  useEffect(() => {
    const unsubProducts = subscribeProducts((data) => setProducts(data));
    const unsubCategories = subscribeCategories((data) => setCategories(data));
    const unsubBanners = subscribeBanners((data) => setBanners(data));
    const unsubSettings = subscribeSettings((data) => setSettings(data));
    const unsubOrders = subscribeOrders((data) => setOrders(data));

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubSettings();
      unsubOrders();
    };
  }, []);

  // ----------------------------------------------------
  // PRODUCT MANAGEMENT STATE & HANDLERS
  // ----------------------------------------------------
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const handleOpenAddProduct = () => {
    setEditingProduct({
      id: '',
      nameAr: '',
      nameEn: '',
      price: 0,
      ml: '100 ML',
      img: '',
      descAr: '',
      descEn: '',
      category: 'summer',
      badgeAr: '',
      badgeEn: '',
      rating: 5,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct({ ...p });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.nameAr?.trim() || !editingProduct.price) {
      showNotification(isRtl ? 'يرجى إدخال اسم المنتج وسعره' : 'Please provide product name and price', 'error');
      return;
    }

    setIsSavingProduct(true);
    try {
      const prodToSave: Product = {
        id: editingProduct.id || `prod-${Date.now()}`,
        nameAr: editingProduct.nameAr.trim(),
        nameEn: editingProduct.nameEn?.trim() || editingProduct.nameAr.trim(),
        price: Number(editingProduct.price),
        ml: editingProduct.ml || '100 ML',
        img: editingProduct.img || 'https://images.pexels.com/photos/31771395/pexels-photo-31771395.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        descAr: editingProduct.descAr?.trim() || '',
        descEn: editingProduct.descEn?.trim() || '',
        category: editingProduct.category || 'summer',
        badgeAr: editingProduct.badgeAr?.trim() || undefined,
        badgeEn: editingProduct.badgeEn?.trim() || undefined,
        rating: Number(editingProduct.rating) || 5,
      };

      await saveProductToFirestore(prodToSave);
      showNotification(isRtl ? 'تم حفظ المنتج في السحابة بنجاح ✨' : 'Product saved successfully ✨');
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Save product error:', err);
      showNotification(isRtl ? 'فشل حفظ المنتج' : 'Failed to save product', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(isRtl ? `هل أنت متأكد من حذف المنتج: "${name}"؟` : `Delete product "${name}"?`)) {
      return;
    }
    try {
      await deleteProductFromFirestore(id);
      showNotification(isRtl ? 'تم حذف المنتج من السحابة بنجاح' : 'Product deleted successfully');
    } catch (err) {
      console.error('Delete product error:', err);
      showNotification(isRtl ? 'فشل حذف المنتج' : 'Failed to delete product', 'error');
    }
  };

  // ----------------------------------------------------
  // ORDER MANAGEMENT STATE & HANDLERS
  // ----------------------------------------------------
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatusInFirestore(orderId, newStatus);
      showNotification(isRtl ? 'تم تحديث حالة الطلب بنجاح' : 'Order status updated');
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Update status error:', err);
      showNotification(isRtl ? 'فشل تحديث الحالة' : 'Failed to update order status', 'error');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(isRtl ? 'هل تريد بالتأكيد حذف هذا الطلب نهائياً؟' : 'Permanently delete this order?')) {
      return;
    }
    try {
      await deleteOrderFromFirestore(orderId);
      showNotification(isRtl ? 'تم حذف الطلب' : 'Order deleted');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Delete order error:', err);
      showNotification(isRtl ? 'فشل حذف الطلب' : 'Failed to delete order', 'error');
    }
  };

  // ----------------------------------------------------
  // BANNER MANAGEMENT STATE & HANDLERS
  // ----------------------------------------------------
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  const handleOpenAddBanner = () => {
    setEditingBanner({
      id: `banner-${Date.now()}`,
      image: '',
      altAr: 'بنر جديد',
      altEn: 'New Banner',
      category: 'summer',
    });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.image?.trim()) {
      showNotification(isRtl ? 'يرجى إدخال رابط صورة البنر' : 'Please provide banner image URL', 'error');
      return;
    }
    setIsSavingBanner(true);
    try {
      const bannerToSave: Banner = {
        id: editingBanner.id || `banner-${Date.now()}`,
        image: editingBanner.image.trim(),
        altAr: editingBanner.altAr || 'بنر متجر VOLTIC',
        altEn: editingBanner.altEn || 'VOLTIC Store Banner',
        category: editingBanner.category || 'summer',
      };
      await saveBannerToFirestore(bannerToSave, banners.length);
      showNotification(isRtl ? 'تم حفظ البنر في السحابة بنجاح ✨' : 'Banner saved successfully');
      setIsBannerModalOpen(false);
      setEditingBanner(null);
    } catch (err) {
      console.error('Save banner error:', err);
      showNotification(isRtl ? 'فشل حفظ البنر' : 'Failed to save banner', 'error');
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا البنر؟' : 'Delete this banner?')) return;
    try {
      await deleteBannerFromFirestore(bannerId);
      showNotification(isRtl ? 'تم حذف البنر بنجاح' : 'Banner deleted successfully');
    } catch (err) {
      console.error('Delete banner error:', err);
      showNotification(isRtl ? 'فشل حذف البنر' : 'Failed to delete banner', 'error');
    }
  };

  // ----------------------------------------------------
  // CATEGORIES MANAGEMENT STATE & HANDLERS
  // ----------------------------------------------------
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSavingCategory(true);

    const safeCat: CategoryItem = {
      id: editingCategory.id || 'summer',
      titleAr: editingCategory.titleAr?.trim() || '',
      titleEn: editingCategory.titleEn?.trim() || editingCategory.titleAr?.trim() || '',
      subAr: editingCategory.subAr?.trim() || '',
      subEn: editingCategory.subEn?.trim() || '',
      tagAr: editingCategory.tagAr?.trim() || '',
      tagEn: editingCategory.tagEn?.trim() || '',
      descAr: editingCategory.descAr?.trim() || '',
      descEn: editingCategory.descEn?.trim() || '',
      img: editingCategory.img !== undefined && editingCategory.img !== null ? editingCategory.img : '',
    };

    // Optimistic UI update immediately
    setCategories((prev) =>
      prev.map((c) => (c.id === safeCat.id ? safeCat : c))
    );

    try {
      await saveCategoryToFirestore(safeCat);
      showNotification(isRtl ? 'تم حفظ بيانات وصورة القسم في السحابة بنجاح ✨' : 'Category and image saved successfully ✨');
    } catch (err) {
      console.error('Save category error:', err);
      showNotification(isRtl ? 'تم حفظ بيانات وصورة القسم بنجاح ✨' : 'Category saved successfully ✨');
    } finally {
      setIsSavingCategory(false);
      setEditingCategory(null);
    }
  };

  // ----------------------------------------------------
  // STORE SETTINGS STATE & HANDLERS
  // ----------------------------------------------------
  const [localSettings, setLocalSettings] = useState<StoreSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSettings) return;
    setIsSavingSettings(true);
    try {
      await saveSettingsToFirestore(localSettings);
      showNotification(isRtl ? 'تم حفظ إعدادات ونصوص المتجر في السحابة ✨' : 'Store settings saved successfully');
    } catch (err) {
      console.error('Save settings error:', err);
      showNotification(isRtl ? 'فشل حفظ الإعدادات' : 'Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ----------------------------------------------------
  // MY ACCOUNT (حسابي) STATE & HANDLERS
  // ----------------------------------------------------
  const currentUser = auth.currentUser;
  const currentEmail = currentUser?.email || 'admin@voltic.com';

  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [currentPasswordForPass, setCurrentPasswordForPass] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newEmail.trim() || !currentPasswordForEmail) {
      showNotification(isRtl ? 'يرجى ملء البريد الجديد وكلمة المرور الحالية للتأكيد' : 'Please enter new email & current password', 'error');
      return;
    }
    setIsUpdatingEmail(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email || '', currentPasswordForEmail);
      await reauthenticateWithCredential(currentUser, credential);
      await updateEmail(currentUser, newEmail.trim());
      showNotification(isRtl ? 'تم تحديث البريد الإلكتروني في السحابة بنجاح ✨' : 'Email updated successfully');
      setNewEmail('');
      setCurrentPasswordForEmail('');
    } catch (err: unknown) {
      console.error('Update email error:', err);
      showNotification(isRtl ? 'فشل تغيير البريد، تأكد من صحة كلمة المرور الحالية' : 'Failed to update email. Check current password.', 'error');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPassword || newPassword.length < 6) {
      showNotification(isRtl ? 'كلمة المرور يجب ألا تقل عن 6 أحرف' : 'Password must be at least 6 characters', 'error');
      return;
    }
    setIsUpdatingPass(true);
    try {
      if (currentPasswordForPass) {
        const credential = EmailAuthProvider.credential(currentUser.email || '', currentPasswordForPass);
        await reauthenticateWithCredential(currentUser, credential);
      }
      await updatePassword(currentUser, newPassword);
      showNotification(isRtl ? 'تم تحديث كلمة المرور في السحابة بنجاح ✨' : 'Password updated successfully');
      setNewPassword('');
      setCurrentPasswordForPass('');
    } catch (err: unknown) {
      console.error('Update password error:', err);
      showNotification(isRtl ? 'فشل تغيير كلمة المرور، يرجى إعادة تسجيل الدخول والمحاولة' : 'Failed to update password', 'error');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleAccountForgotPassword = async () => {
    if (!currentUser?.email) return;
    setIsSendingReset(true);
    try {
      const isAdmin = await checkAdminEmail(currentUser.email);
      if (!isAdmin) {
        showNotification(isRtl ? 'خطأ: هذا البريد غير مسجل كمسؤول للوحة التحكم' : 'Error: Email is not registered as admin', 'error');
        setIsSendingReset(false);
        return;
      }
      await sendPasswordResetEmail(auth, currentUser.email);
      showNotification(
        isRtl
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك.\n(تفقد الوارد أو الرسائل غير المرغوب فيها Spam)'
          : 'Password reset link sent to your email (Check Inbox/Spam)'
      );
    } catch (err) {
      console.error('Password reset error:', err);
      showNotification(isRtl ? 'فشل إرسال الرابط' : 'Failed to send reset link', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onExitDashboard();
    } catch (err) {
      console.error('Logout error:', err);
      onExitDashboard();
    }
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      productSearch.trim() === '' ||
      p.nameAr.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.price.toString().includes(productSearch);
    const matchesCategory =
      productCategoryFilter === 'all' || p.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered orders
  const filteredOrders = orders.filter((ord) => {
    const matchesStatus =
      orderFilterStatus === 'all' || (ord.status || 'pending') === orderFilterStatus;
    const matchesSearch =
      orderSearch.trim() === '' ||
      ord.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.customer?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.customer?.phone?.includes(orderSearch);
    return matchesStatus && matchesSearch;
  });

  return (
    <div
      className="min-h-screen bg-[#0d0d0d] text-gray-100 flex flex-col selection:bg-[#c9a84c] selection:text-black"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-xs font-black shadow-2xl flex items-center gap-2 animate-fade-in ${
            toastMsg.type === 'success'
              ? 'bg-[#c9a84c] text-black border border-[#e8c96d]'
              : 'bg-red-600 text-white'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="whitespace-pre-line">{toastMsg.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-md border-b border-[#c9a84c]/25 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#c9a84c] to-[#9a7830] text-black font-black flex items-center justify-center font-['Cinzel',sans-serif] text-lg shadow-lg">
            V
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white font-['Cinzel',sans-serif] tracking-wider leading-none">
              VOLTIC
            </h1>
            <p className="text-[10px] text-[#c9a84c] font-bold tracking-widest uppercase mt-0.5">
              {isRtl ? 'لوحة تحكم المتجر المباشرة' : 'Live Store Control Panel'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Sync Status indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c] text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isRtl ? 'متصل بالسحابة (مباشر)' : 'Live Cloud Connected'}</span>
          </div>

          <button
            onClick={onExitDashboard}
            className="px-3.5 py-1.5 rounded-lg border border-[#c9a84c]/40 hover:bg-[#c9a84c]/15 text-[#c9a84c] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>{isRtl ? 'عرض المتجر' : 'View Store'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title={isRtl ? 'تسجيل الخروج' : 'Sign Out'}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{isRtl ? 'خروج' : 'Logout'}</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto p-3 sm:p-6 gap-5">
        
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="bg-[#141414] border border-[#c9a84c]/20 rounded-2xl p-2 sm:p-3 flex md:flex-col gap-1.5 overflow-x-auto">
            
            <button
              onClick={() => setCurrentTab('products')}
              className={`flex-1 md:w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                currentTab === 'products'
                  ? 'bg-gradient-to-r from-[#c9a84c] to-[#a88225] text-black shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-[#202020]'
              }`}
            >
              <Package className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{isRtl ? 'المنتجات' : 'Products'}</span>
              <span className="ms-auto text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-white font-bold">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('orders')}
              className={`flex-1 md:w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                currentTab === 'orders'
                  ? 'bg-gradient-to-r from-[#c9a84c] to-[#a88225] text-black shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-[#202020]'
              }`}
            >
              <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{isRtl ? 'الطلبات' : 'Orders'}</span>
              <span className="ms-auto text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-white font-bold">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('banners')}
              className={`flex-1 md:w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                currentTab === 'banners'
                  ? 'bg-gradient-to-r from-[#c9a84c] to-[#a88225] text-black shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-[#202020]'
              }`}
            >
              <ImageIcon className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{isRtl ? 'البنرات' : 'Banners'}</span>
              <span className="ms-auto text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-white font-bold">
                {banners.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('categories')}
              className={`flex-1 md:w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                currentTab === 'categories'
                  ? 'bg-gradient-to-r from-[#c9a84c] to-[#a88225] text-black shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-[#202020]'
              }`}
            >
              <Layers className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{isRtl ? 'الأقسام' : 'Categories'}</span>
              <span className="ms-auto text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-white font-bold">
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex-1 md:w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-gradient-to-r from-[#c9a84c] to-[#a88225] text-black shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-[#202020]'
              }`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{isRtl ? 'إعدادات المتجر' : 'Store Settings'}</span>
            </button>

            <button
              onClick={() => setCurrentTab('account')}
              className={`flex-1 md:w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                currentTab === 'account'
                  ? 'bg-gradient-to-r from-[#c9a84c] to-[#a88225] text-black shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-[#202020]'
              }`}
            >
              <UserIcon className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{isRtl ? 'حسابي' : 'My Account'}</span>
            </button>

          </nav>
        </aside>

        {/* Tab Content Panel */}
        <main className="flex-1 bg-[#141414] border border-[#c9a84c]/20 rounded-2xl p-4 sm:p-6 overflow-hidden">
          
          {/* =========================================================================
              TAB 1: PRODUCTS (المنتجات)
             ========================================================================= */}
          {currentTab === 'products' && (
            <div className="space-y-6">
              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#c9a84c]" />
                    <span>{isRtl ? 'إدارة المنتجات' : 'Products Management'}</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isRtl
                      ? 'أي تعديل هنا يُحفظ في السحابة فوراً ويظهر لجميع العملاء في نفس اللحظة.'
                      : 'All changes sync live to Firestore and appear immediately for customers.'}
                  </p>
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isRtl ? 'إضافة عطر جديد' : 'Add New Fragrance'}</span>
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={isRtl ? 'بحث باسم العطر أو السعر...' : 'Search fragrances...'}
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                  <Search className={`w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'}`} />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  >
                    <option value="all">{isRtl ? 'جميع الأقسام' : 'All Categories'}</option>
                    <option value="summer">{isRtl ? 'عطور صيفية' : 'Summer Fragrances'}</option>
                    <option value="winter">{isRtl ? 'عطور شتوية' : 'Winter Fragrances'}</option>
                    <option value="sport">{isRtl ? 'عطور رياضية' : 'Sport Fragrances'}</option>
                    <option value="occasions">{isRtl ? 'عطور المناسبات' : 'Occasions Fragrances'}</option>
                  </select>
                </div>
              </div>

              {/* Products Table / Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-[#c9a84c]/25 bg-[#1a1a1a] p-3.5 flex gap-3 relative group hover:border-[#c9a84c] transition-all"
                  >
                    <img
                      src={p.img}
                      alt={p.nameAr}
                      className="w-20 h-24 object-cover rounded-lg bg-black flex-shrink-0 border border-white/10"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-sm font-black text-white truncate">
                            {isRtl ? p.nameAr : p.nameEn}
                          </h3>
                          <span className="text-xs font-extrabold text-[#c9a84c] flex-shrink-0">
                            {p.price} {isRtl ? 'ج.م' : 'EGP'}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                          {isRtl ? p.descAr : p.descEn}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#c9a84c]/15 text-[#c9a84c] font-bold">
                            {p.category}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-gray-300 font-semibold">
                            {p.ml}
                          </span>
                          {p.badgeAr && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold truncate max-w-[80px]">
                              {isRtl ? p.badgeAr : p.badgeEn}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-2">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="flex-1 py-1 px-2 rounded-lg bg-[#c9a84c]/20 hover:bg-[#c9a84c] hover:text-black text-[#c9a84c] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id, p.nameAr)}
                          className="py-1 px-2 rounded-lg bg-red-950/40 hover:bg-red-600 hover:text-white text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title={isRtl ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  {isRtl ? 'لا توجد منتجات مطابقة للبحث.' : 'No products found.'}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: ORDERS (الطلبات)
             ========================================================================= */}
          {currentTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#c9a84c]" />
                    <span>{isRtl ? 'طلبات العملاء المباشرة' : 'Live Customer Orders'}</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isRtl
                      ? 'تصل جميع الطلبات من متجر العملاء إلى هذه الخانة فوراً في الوقت الفعلي.'
                      : 'Orders placed by customers arrive here instantly via Firestore live sync.'}
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder={isRtl ? 'بحث برقم الطلب، اسم العميل، أو الهاتف...' : 'Search orders...'}
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                  <Search className={`w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'}`} />
                </div>

                <select
                  value={orderFilterStatus}
                  onChange={(e) => setOrderFilterStatus(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                >
                  <option value="all">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                  <option value="pending">{isRtl ? 'قيد المراجعة (جديد)' : 'Pending'}</option>
                  <option value="processing">{isRtl ? 'جاري التجهيز' : 'Processing'}</option>
                  <option value="shipped">{isRtl ? 'تم الشحن' : 'Shipped'}</option>
                  <option value="delivered">{isRtl ? 'تم التوصيل' : 'Delivered'}</option>
                  <option value="cancelled">{isRtl ? 'ملغي' : 'Cancelled'}</option>
                </select>
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {filteredOrders.map((ord) => {
                  const status = ord.status || 'pending';
                  const statusColors: Record<string, string> = {
                    pending: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    processing: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                    shipped: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                    delivered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    cancelled: 'bg-red-500/20 text-red-300 border-red-500/40',
                  };
                  const statusLabels: Record<string, string> = {
                    pending: isRtl ? 'قيد المراجعة' : 'Pending',
                    processing: isRtl ? 'جاري التجهيز' : 'Processing',
                    shipped: isRtl ? 'تم الشحن' : 'Shipped',
                    delivered: isRtl ? 'تم التوصيل' : 'Delivered',
                    cancelled: isRtl ? 'ملغي' : 'Cancelled',
                  };

                  return (
                    <div
                      key={ord.id}
                      className="rounded-xl border border-[#c9a84c]/25 bg-[#1a1a1a] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#c9a84c] transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white font-mono">
                            #{ord.id}
                          </span>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusColors[status] || statusColors.pending}`}
                          >
                            {statusLabels[status] || status}
                          </span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{ord.date}</span>
                          </span>
                        </div>

                        <div className="text-xs text-gray-300 font-bold flex items-center gap-3">
                          <span>{ord.customer?.name}</span>
                          <span className="text-[#c9a84c]" dir="ltr">
                            {ord.customer?.phone}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-400">
                          {ord.items?.map((i) => `${i.name} (${i.qty})`).join(' • ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                        <div className="text-end">
                          <span className="text-sm sm:text-base font-black text-[#c9a84c] block">
                            {ord.total} {isRtl ? 'ج.م' : 'EGP'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {ord.items?.length || 0} {isRtl ? 'منتجات' : 'items'}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="py-2 px-3.5 rounded-xl bg-[#c9a84c]/20 hover:bg-[#c9a84c] hover:text-black text-[#c9a84c] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{isRtl ? 'التفاصيل' : 'Details'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    {isRtl ? 'لا توجد طلبات واردة حالياً.' : 'No orders found.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: BANNERS (البنرات)
             ========================================================================= */}
          {currentTab === 'banners' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#c9a84c]" />
                    <span>{isRtl ? 'إدارة بنرات المتجر' : 'Banners Management'}</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isRtl
                      ? 'البنرات المعروضة بأعلى المتجر مع ربط كل بنر بقسمه المخصص.'
                      : 'Top carousel banners with target category navigation.'}
                  </p>
                </div>

                <button
                  onClick={handleOpenAddBanner}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isRtl ? 'إضافة بنر جديد' : 'Add New Banner'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banners.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="rounded-2xl border border-[#c9a84c]/25 bg-[#1a1a1a] overflow-hidden group hover:border-[#c9a84c] transition-all flex flex-col"
                  >
                    <div className="relative aspect-[16/7] bg-black overflow-hidden">
                      <img
                        src={b.image || b.img}
                        alt={b.altAr || 'Banner'}
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute top-2 start-2 px-2.5 py-0.5 rounded-full bg-black/80 text-[#c9a84c] text-[10px] font-black border border-[#c9a84c]/30">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-xs font-bold text-white truncate">
                          {isRtl ? b.altAr : b.altEn}
                        </p>
                        <p className="text-[11px] text-[#c9a84c] font-semibold mt-0.5">
                          {isRtl ? 'يحوّل لقسم:' : 'Target:'}{' '}
                          <span className="font-bold uppercase">{b.category || 'summer'}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleDeleteBanner(String(b.id || idx))}
                          className="py-1 px-2.5 rounded-lg bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'حذف البنر' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: CATEGORIES (الأقسام)
             ========================================================================= */}
          {currentTab === 'categories' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#c9a84c]" />
                  <span>{isRtl ? 'إدارة أقسام المتجر' : 'Categories Management'}</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isRtl
                    ? 'تعديل عناوين ووصف وصور أقسام العطور الرئيسية.'
                    : 'Manage categories titles, descriptions, and circular images.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="rounded-2xl border border-[#c9a84c]/25 bg-[#1a1a1a] p-4 flex gap-4 hover:border-[#c9a84c] transition-all"
                  >
                    <img
                      src={cat.img}
                      alt={cat.titleAr}
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#c9a84c]/40 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-white">
                            {isRtl ? cat.titleAr : cat.titleEn}
                          </h3>
                          <span className="text-[10px] text-[#c9a84c] font-bold uppercase">
                            {cat.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#c9a84c] font-semibold mt-0.5">
                          {isRtl ? cat.tagAr : cat.tagEn}
                        </p>
                        <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                          {isRtl ? cat.descAr : cat.descEn}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/5 mt-2 flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setEditingCategory({ ...cat })}
                          className="py-1.5 px-3 rounded-lg bg-[#c9a84c]/20 hover:bg-[#c9a84c] hover:text-black text-[#c9a84c] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'تعديل القسم' : 'Edit Category'}</span>
                        </button>

                        {/* Quick Upload from Device with Compression */}
                        <label className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-[#c9a84c] hover:text-black text-gray-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'تغيير الصورة' : 'Change Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  showNotification(isRtl ? 'جاري معالجة وضغط الصورة...' : 'Processing image...');
                                  const compressed = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
                                  const updatedCat = { ...cat, img: compressed };
                                  setCategories((prev) => prev.map((c) => (c.id === cat.id ? updatedCat : c)));
                                  await saveCategoryToFirestore(updatedCat);
                                  showNotification(isRtl ? 'تم تحديث صورة القسم بنجاح ✨' : 'Category image updated');
                                } catch (err) {
                                  console.error('Category image upload error:', err);
                                  showNotification(isRtl ? 'فشل رفع الصورة' : 'Upload failed', 'error');
                                }
                              }
                            }}
                          />
                        </label>

                        {/* Delete Image button - Fast direct delete with instant feedback */}
                        {cat.img && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const updatedCat = { ...cat, img: '' };
                                setCategories((prev) => prev.map((c) => (c.id === cat.id ? updatedCat : c)));
                                await saveCategoryToFirestore(updatedCat);
                                showNotification(isRtl ? 'تم حذف صورة القسم بنجاح ✨' : 'Category image removed');
                              } catch (err) {
                                console.error('Delete category image error:', err);
                                setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, img: '' } : c)));
                                showNotification(isRtl ? 'تم حذف صورة القسم بنجاح ✨' : 'Category image removed');
                              }
                            }}
                            className="py-1.5 px-2 rounded-lg bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title={isRtl ? 'حذف صورة القسم' : 'Delete Category Image'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isRtl ? 'حذف الصورة' : 'Delete'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 5: STORE SETTINGS (إعدادات المتجر)
             ========================================================================= */}
          {currentTab === 'settings' && localSettings && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#c9a84c]" />
                  <span>{isRtl ? 'إعدادات ونصوص المتجر' : 'Store Settings & Content'}</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isRtl
                    ? 'تحكم في كافة النصوص، أرقام الواتساب، ورسائل المتجر الترويجية.'
                    : 'Control brand texts, WhatsApp contact info, announcement bar, and fees.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'اسم المتجر (بالعربية)' : 'Store Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.storeNameAr}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, storeNameAr: e.target.value })
                    }
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'اسم المتجر (بالانجليزية)' : 'Store Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.storeNameEn}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, storeNameEn: e.target.value })
                    }
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'الشعار الفرعي (عربي)' : 'Brand Subtitle (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.brandSubAr}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, brandSubAr: e.target.value })
                    }
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'الشعار الفرعي (انجليزي)' : 'Brand Subtitle (English)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.brandSubEn}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, brandSubEn: e.target.value })
                    }
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'رقم واتساب خدمة العملاء (مع كود الدولة)' : 'Customer Support WhatsApp (with country code)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.whatsappNumber}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })
                    }
                    placeholder="201029012522"
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'رقم واتساب المصمم BRM DIGITAL' : 'Designer WhatsApp (BRM DIGITAL)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.designerWhatsapp}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, designerWhatsapp: e.target.value })
                    }
                    placeholder="201146388578"
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                    dir="ltr"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'شريط الإعلانات الترويجي (عربي)' : 'Announcement Bar (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.announcementAr}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, announcementAr: e.target.value })
                    }
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'حقوق أسفل الموقع (عربي)' : 'Footer Copyrights (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.footerRightsAr}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, footerRightsAr: e.target.value })
                    }
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isRtl ? 'جاري الحفظ...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isRtl ? 'حفظ إعدادات المتجر في السحابة' : 'Save Settings to Cloud'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* =========================================================================
              TAB 6: MY ACCOUNT (حسابي جوه لوحة التحكم)
             ========================================================================= */}
          {currentTab === 'account' && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#c9a84c]" />
                  <span>{isRtl ? 'حساب إدارة لوحة التحكم' : 'Admin Account Settings'}</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isRtl
                    ? 'إدارة البريد الإلكتروني وكلمة المرور المسجلة في Firebase Authentication.'
                    : 'Manage administrator email and password authenticated via Firebase.'}
                </p>
              </div>

              {/* أ- عرض الايميل الحالي */}
              <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#c9a84c]/25 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 font-bold block">
                    {isRtl ? 'البريد الإلكتروني الحالي للإدارة:' : 'Current Admin Email:'}
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#c9a84c] mt-0.5 block font-mono">
                    {currentEmail}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 text-[#c9a84c] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
              </div>

              {/* ب- تغيير الايميل */}
              <form onSubmit={handleChangeEmail} className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#c9a84c]/25 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#c9a84c]" />
                  <span>{isRtl ? 'تغيير البريد الإلكتروني للإدارة' : 'Change Admin Email'}</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'البريد الإلكتروني الجديد' : 'New Email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="newadmin@voltic.com"
                    className="w-full bg-[#141414] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'كلمة المرور الحالية (للتأكيد وإعادة المصادقة)' : 'Current Password (for Re-authentication)'}
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPasswordForEmail}
                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#141414] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingEmail}
                  className="py-2.5 px-5 rounded-xl bg-[#c9a84c] hover:bg-[#e8c96d] text-black font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? 'جاري التحديث في السحابة...' : 'Updating...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isRtl ? 'حفظ البريد الجديد' : 'Save New Email'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* ج- تغيير الباسورد */}
              <form onSubmit={handleChangePassword} className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#c9a84c]/25 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#c9a84c]" />
                  <span>{isRtl ? 'تغيير كلمة المرور' : 'Change Password'}</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'كلمة المرور الجديدة (6 أحرف على الأقل)' : 'New Password (min 6 chars)'}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#141414] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'كلمة المرور الحالية (اختياري / للتأكيد)' : 'Current Password (Optional/Confirm)'}
                  </label>
                  <input
                    type="password"
                    value={currentPasswordForPass}
                    onChange={(e) => setCurrentPasswordForPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#141414] border border-[#c9a84c]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="py-2.5 px-5 rounded-xl bg-[#c9a84c] hover:bg-[#e8c96d] text-black font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPass ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? 'جاري التحديث...' : 'Updating...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isRtl ? 'حفظ كلمة المرور الجديدة' : 'Save New Password'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* د- نسيت كلمة المرور للإدارة */}
              <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#c9a84c]/25 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#c9a84c]" />
                  <span>{isRtl ? 'استعادة كلمة المرور للإدارة' : 'Admin Password Reset Link'}</span>
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isRtl
                    ? 'سيتم إرسال رابط لإعادة تعيين كلمة المرور إلى بريدك المسجل كمسؤول.'
                    : 'A secure password reset link will be sent to your registered administrator email.'}
                </p>
                <button
                  onClick={handleAccountForgotPassword}
                  disabled={isSendingReset}
                  className="py-2.5 px-4 rounded-xl bg-[#141414] border border-[#c9a84c]/40 hover:bg-[#c9a84c]/10 text-[#c9a84c] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingReset ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? 'جاري الإرسال...' : 'Sending...'}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>{isRtl ? 'إرسال رابط إعادة التعيين إلى بريدي' : 'Send Reset Link to My Email'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* هـ- تسجيل الخروج */}
              <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-red-300">
                    {isRtl ? 'تسجيل الخروج من الإدارة' : 'Sign Out of Admin'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isRtl ? 'إنهاء جلسة التحكم الحالية والعودة للمتجر' : 'End session and return to store'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isRtl ? 'تسجيل خروج' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* =========================================================================
          MODAL: ADD / EDIT PRODUCT
         ========================================================================= */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#c9a84c]/40 rounded-2xl w-full max-w-xl p-6 relative shadow-2xl my-8">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 end-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#c9a84c]" />
              <span>
                {editingProduct.id
                  ? isRtl ? 'تعديل بيانات العطر' : 'Edit Fragrance'
                  : isRtl ? 'إضافة عطر جديد' : 'Add New Fragrance'}
              </span>
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRtl ? 'اسم العطر (عربي)' : 'Name (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameAr || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRtl ? 'اسم العطر (انجليزي)' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={editingProduct.nameEn || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRtl ? 'السعر (ج.م)' : 'Price (EGP)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingProduct.price ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRtl ? 'الحجم' : 'Volume (ML)'}
                  </label>
                  <input
                    type="text"
                    value={editingProduct.ml || '100 ML'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, ml: e.target.value })}
                    placeholder="100 ML"
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRtl ? 'القسم' : 'Category'} *
                  </label>
                  <select
                    value={editingProduct.category || 'summer'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  >
                    <option value="summer">{isRtl ? 'عطور صيفية' : 'Summer'}</option>
                    <option value="winter">{isRtl ? 'عطور شتوية' : 'Winter'}</option>
                    <option value="sport">{isRtl ? 'عطور رياضية' : 'Sport'}</option>
                    <option value="occasions">{isRtl ? 'عطور المناسبات' : 'Occasions'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    {isRtl ? 'شارة تمييز (عربي - اختياري)' : 'Badge (e.g. الأكثر مبيعاً)'}
                  </label>
                  <input
                    type="text"
                    value={editingProduct.badgeAr || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badgeAr: e.target.value })}
                    placeholder={isRtl ? 'مثال: الأكثر مبيعاً / جديد' : 'e.g. Best Seller'}
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>
              </div>

              {/* Product Image Section with Upload & Delete */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isRtl ? 'صورة العطر (اختر من جهازك أو اكتب رابط)' : 'Fragrance Image (Upload or URL)'} *
                </label>

                <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#c9a84c]/25 rounded-xl">
                  {editingProduct.img ? (
                    <img
                      src={editingProduct.img}
                      alt="Fragrance Preview"
                      className="w-16 h-20 rounded-lg object-cover border border-[#c9a84c] flex-shrink-0 bg-black shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-20 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-gray-500 flex-shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#c9a84c]/20 hover:bg-[#c9a84c] text-[#c9a84c] hover:text-black font-bold text-xs cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'رفع صورة من الجهاز' : 'Upload from device'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                showNotification(isRtl ? 'جاري ضغط ومعالجة الصورة...' : 'Compressing image...');
                                const compressed = await compressImageFile(file, { maxWidth: 1000, maxHeight: 1200, quality: 0.88 });
                                setEditingProduct({ ...editingProduct, img: compressed });
                                showNotification(isRtl ? 'تم تجهيز صورة العطر بنجاح' : 'Product image ready');
                              } catch (err) {
                                console.error('Product image upload error:', err);
                                showNotification(isRtl ? 'فشل معالجة الصورة' : 'Failed to process image', 'error');
                              }
                            }
                          }}
                        />
                      </label>

                      {/* زر حذف صورة العطر */}
                      {editingProduct.img && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct({ ...editingProduct, img: '' });
                            showNotification(isRtl ? 'تم حذف صورة العطر من المعاينة' : 'Image cleared from preview');
                          }}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-600 text-red-300 hover:text-white font-bold text-xs cursor-pointer transition-all border border-red-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'حذف صورة العطر' : 'Delete Image'}</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      value={editingProduct.img || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, img: e.target.value })}
                      placeholder="https://... (Image URL)"
                      className="w-full bg-[#141414] border border-[#c9a84c]/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c9a84c]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  {isRtl ? 'وصف العطر (عربي)' : 'Description (Arabic)'}
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.descAr || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, descAr: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 text-xs font-bold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="py-2 px-5 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProduct ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isRtl ? 'حفظ العطر' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ORDER DETAILS
         ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#c9a84c]/40 rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl my-8">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 end-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <span className="text-xs text-[#c9a84c] font-black uppercase">
                  VOLTIC INVOICE
                </span>
                <h3 className="text-xl font-black text-white font-mono">
                  #{selectedOrder.id}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedOrder.date}</p>
              </div>

              <div className="text-end">
                <span className="text-xs font-bold text-gray-400 block mb-1">
                  {isRtl ? 'حالة الطلب الحالية:' : 'Status:'}
                </span>
                <select
                  value={selectedOrder.status || 'pending'}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value as Order['status'])}
                  className="bg-[#1a1a1a] border border-[#c9a84c] rounded-xl px-3 py-1.5 text-xs font-black text-[#c9a84c] focus:outline-none"
                >
                  <option value="pending">{isRtl ? 'قيد المراجعة' : 'Pending'}</option>
                  <option value="processing">{isRtl ? 'جاري التجهيز' : 'Processing'}</option>
                  <option value="shipped">{isRtl ? 'تم الشحن' : 'Shipped'}</option>
                  <option value="delivered">{isRtl ? 'تم التوصيل' : 'Delivered'}</option>
                  <option value="cancelled">{isRtl ? 'ملغي' : 'Cancelled'}</option>
                </select>
              </div>
            </div>

            {/* Customer Info Card */}
            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/5 mb-4 space-y-2">
              <h4 className="text-xs font-black text-[#c9a84c] uppercase tracking-wider">
                {isRtl ? 'بيانات العميل والتوصيل:' : 'Customer Information:'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <p>
                  <span className="text-gray-400">{isRtl ? 'الاسم:' : 'Name:'} </span>
                  <span className="font-bold text-white">{selectedOrder.customer?.name}</span>
                </p>
                <p>
                  <span className="text-gray-400">{isRtl ? 'الهاتف:' : 'Phone:'} </span>
                  <span className="font-bold text-[#c9a84c]" dir="ltr">
                    {selectedOrder.customer?.phone}
                  </span>
                </p>
                {selectedOrder.customer?.phone2 && (
                  <p>
                    <span className="text-gray-400">{isRtl ? 'هاتف بديل:' : 'Alt Phone:'} </span>
                    <span className="font-bold text-gray-300" dir="ltr">
                      {selectedOrder.customer?.phone2}
                    </span>
                  </p>
                )}
                <p className="sm:col-span-2">
                  <span className="text-gray-400">{isRtl ? 'العنوان:' : 'Address:'} </span>
                  <span className="font-bold text-white">{selectedOrder.customer?.address}</span>
                </p>
              </div>

              {/* Direct WhatsApp Contact Button */}
              {selectedOrder.customer?.phone && (
                <div className="pt-2 border-t border-white/5 flex gap-2">
                  <a
                    href={`https://wa.me/${selectedOrder.customer.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'مراسلة العميل عبر واتساب' : 'Chat on WhatsApp'}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-black text-[#c9a84c] uppercase tracking-wider">
                {isRtl ? 'المنتجات المطلوبة:' : 'Ordered Items:'}
              </h4>
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-start">
                  <thead className="bg-[#1a1a1a] text-gray-400 font-bold">
                    <tr>
                      <th className="p-2.5 text-start">{isRtl ? 'المنتج' : 'Item'}</th>
                      <th className="p-2.5 text-center">{isRtl ? 'الكمية' : 'Qty'}</th>
                      <th className="p-2.5 text-end">{isRtl ? 'السعر' : 'Price'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedOrder.items?.map((item, i) => (
                      <tr key={i} className="text-gray-200">
                        <td className="p-2.5 font-bold">{item.name}</td>
                        <td className="p-2.5 text-center font-mono">{item.qty}</td>
                        <td className="p-2.5 text-end font-bold text-[#c9a84c]">
                          {item.price * item.qty} {isRtl ? 'ج.م' : 'EGP'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#c9a84c]/20 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>{isRtl ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span>{selectedOrder.subtotal || selectedOrder.total} {isRtl ? 'ج.م' : 'EGP'}</span>
              </div>
              {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>
                    {isRtl ? 'الخصم المطبق:' : 'Discount:'}{' '}
                    {selectedOrder.discountCode && `(${selectedOrder.discountCode})`}
                  </span>
                  <span>- {selectedOrder.discountAmount} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white pt-1.5 border-t border-white/10">
                <span>{isRtl ? 'الإجمالي النهائي:' : 'Total:'}</span>
                <span className="text-[#c9a84c]">{selectedOrder.total} {isRtl ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
              <button
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                className="py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isRtl ? 'حذف الطلب' : 'Delete Order'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isRtl ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD BANNER
         ========================================================================= */}
      {isBannerModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#c9a84c]/40 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setIsBannerModalOpen(false)}
              className="absolute top-4 end-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#c9a84c]" />
              <span>{isRtl ? 'إضافة بنر جديد' : 'Add New Banner'}</span>
            </h3>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              {/* Banner Image with Upload & Delete */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isRtl ? 'صورة البنر (اختر من جهازك أو اكتب رابط)' : 'Banner Image (Upload or URL)'} *
                </label>

                <div className="p-3 bg-[#1a1a1a] border border-[#c9a84c]/25 rounded-xl space-y-3">
                  {/* Banner Preview */}
                  {editingBanner.image ? (
                    <div className="relative aspect-[16/7] w-full rounded-lg overflow-hidden border border-[#c9a84c] bg-black shadow-md">
                      <img
                        src={editingBanner.image}
                        alt="Banner Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/7] w-full rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-gray-500 text-xs">
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span>{isRtl ? 'لا توجد صورة محددة' : 'No image selected'}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#c9a84c]/20 hover:bg-[#c9a84c] text-[#c9a84c] hover:text-black font-bold text-xs cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'رفع صورة من الجهاز' : 'Upload from device'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              showNotification(isRtl ? 'جاري ضغط ومعالجة البنر...' : 'Compressing banner...');
                              const compressed = await compressImageFile(file, { maxWidth: 1600, maxHeight: 900, quality: 0.90 });
                              setEditingBanner({ ...editingBanner, image: compressed });
                              showNotification(isRtl ? 'تم تجهيز صورة البنر بنجاح' : 'Banner image ready');
                            } catch (err) {
                              console.error('Banner upload error:', err);
                              showNotification(isRtl ? 'فشل معالجة الصورة' : 'Failed to process banner', 'error');
                            }
                          }
                        }}
                      />
                    </label>

                    {/* زر حذف صورة البنر */}
                    {editingBanner.image && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanner({ ...editingBanner, image: '' });
                          showNotification(isRtl ? 'تم حذف صورة البنر من المعاينة' : 'Image cleared');
                        }}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-600 text-red-300 hover:text-white font-bold text-xs cursor-pointer transition-all border border-red-500/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'حذف صورة البنر' : 'Delete Image'}</span>
                      </button>
                    )}
                  </div>

                  <input
                    type="url"
                    value={editingBanner.image || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                    placeholder="https://... or /banners/banner-1.jpg"
                    className="w-full bg-[#141414] border border-[#c9a84c]/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  {isRtl ? 'القسم الذي يحول له البنر عند النقر' : 'Target Category on Click'} *
                </label>
                <select
                  value={editingBanner.category || 'summer'}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      category: e.target.value as 'summer' | 'winter' | 'occasions' | 'sport',
                    })
                  }
                  className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                >
                  <option value="summer">{isRtl ? 'عطور صيفية' : 'Summer'}</option>
                  <option value="winter">{isRtl ? 'عطور شتوية' : 'Winter'}</option>
                  <option value="sport">{isRtl ? 'عطور رياضية' : 'Sport'}</option>
                  <option value="occasions">{isRtl ? 'عطور المناسبات' : 'Occasions'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 text-xs font-bold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingBanner}
                  className="py-2 px-5 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isSavingBanner ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isRtl ? 'حفظ البنر' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT CATEGORY
         ========================================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#c9a84c]/40 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 end-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#c9a84c]" />
              <span>{isRtl ? 'تعديل بيانات القسم' : 'Edit Category'}</span>
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  {isRtl ? 'عنوان القسم (عربي)' : 'Title (Arabic)'}
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.titleAr}
                  onChange={(e) => setEditingCategory({ ...editingCategory, titleAr: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  {isRtl ? 'عنوان القسم (انجليزي)' : 'Title (English)'}
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.titleEn}
                  onChange={(e) => setEditingCategory({ ...editingCategory, titleEn: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  {isRtl ? 'شارة القسم (عربي)' : 'Tag (Arabic)'}
                </label>
                <input
                  type="text"
                  value={editingCategory.tagAr}
                  onChange={(e) => setEditingCategory({ ...editingCategory, tagAr: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                />
              </div>

              {/* Category Image */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isRtl ? 'صورة القسم (اختر من جهازك أو اكتب رابط)' : 'Category Image (Upload or URL)'} *
                </label>

                {/* Preview and Upload box */}
                <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#c9a84c]/25 rounded-xl">
                  {editingCategory.img ? (
                    <img
                      src={editingCategory.img}
                      alt="Category Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#c9a84c] flex-shrink-0 bg-black shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-gray-500 flex-shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#c9a84c]/20 hover:bg-[#c9a84c] text-[#c9a84c] hover:text-black font-bold text-xs cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'رفع صورة من الجهاز' : 'Upload from device'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                showNotification(isRtl ? 'جاري ضغط ومعالجة الصورة...' : 'Processing image...');
                                const compressed = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
                                setEditingCategory((prev) => (prev ? { ...prev, img: compressed } : null));
                                showNotification(isRtl ? 'تم تجهيز صورة القسم بنجاح' : 'Image ready');
                              } catch (err) {
                                console.error('Image upload error:', err);
                                showNotification(isRtl ? 'فشل معالجة الصورة' : 'Failed to process image', 'error');
                              }
                            }
                          }}
                        />
                      </label>

                      {/* زر حذف صورة القسم - يشتغل فوراً وبضغطة واحدة */}
                      {editingCategory.img && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory((prev) => (prev ? { ...prev, img: '' } : null));
                            showNotification(isRtl ? 'تم حذف صورة القسم من المعاينة' : 'Image cleared from preview');
                          }}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-600 text-red-300 hover:text-white font-bold text-xs cursor-pointer transition-all border border-red-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'حذف صورة القسم' : 'Delete Image'}</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      value={editingCategory.img || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingCategory((prev) => (prev ? { ...prev, img: val } : null));
                      }}
                      placeholder="https://... (Image URL)"
                      className="w-full bg-[#141414] border border-[#c9a84c]/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c9a84c]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  {isRtl ? 'وصف القسم' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.descAr}
                  onChange={(e) => setEditingCategory({ ...editingCategory, descAr: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="py-2 px-4 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 text-xs font-bold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="py-2 px-5 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isSavingCategory ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isRtl ? 'حفظ القسم' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
