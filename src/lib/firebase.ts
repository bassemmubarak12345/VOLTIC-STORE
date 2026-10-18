import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { Product, CategoryItem, Banner, Order, StoreSettings, User } from '../types';
import { PRODUCTS, CATEGORIES_DATA } from '../data/products';
import { DEFAULT_BANNERS } from '../data/banners';

// Client Firebase Configuration provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyCKBOBkuB_Z3dYn660QHdf1VDve_-EIlPA",
  authDomain: "voltic-aee22.firebaseapp.com",
  projectId: "voltic-aee22",
  storageBucket: "voltic-aee22.firebasestorage.app",
  messagingSenderId: "359714391479",
  appId: "1:359714391479:web:46786c55d9f3efeb245432",
  measurementId: "G-5725PC2XSW"
};

// Initialize Firebase singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable persistence
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Persistence fallback handled gracefully
});

// Default Store Settings
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeNameAr: 'VOLTIC',
  storeNameEn: 'VOLTIC',
  brandSubAr: 'عطور رجالية فاخرة',
  brandSubEn: "Luxury Men's Fragrances",
  whatsappNumber: '201029012522',
  designerWhatsapp: '201146388578',
  announcementAr: 'شحن سريع لجميع المحافظات • دفع آمن عند الاستلام • جودة وثبات استثنائي',
  announcementEn: 'Fast Delivery Nationwide • Cash on Delivery • Exceptional Longevity',
  footerRightsAr: 'جميع الحقوق محفوظة © 2026 متجر VOLTIC للعطور الفاخرة',
  footerRightsEn: 'All Rights Reserved © 2026 VOLTIC Fragrances Store',
  currencyAr: 'ج.م',
  currencyEn: 'EGP',
  shippingFee: 50,
  freeShippingThreshold: 1500,
  adminEmails: ['bassemmubarak100000@gmail.com', 'admin@voltic.com'],
};

// ==========================================
// 1. PRODUCTS REAL-TIME SYNC & OPERATIONS
// ==========================================

export const subscribeProducts = (onUpdate: (products: Product[]) => void) => {
  // Immediately emit default products so UI is always fully populated with zero flicker
  onUpdate(PRODUCTS);

  const productsCol = collection(db, 'products');
  return onSnapshot(
    productsCol,
    async (snapshot) => {
      if (snapshot.empty) {
        // Keep default products visible and seed in background
        onUpdate(PRODUCTS);
        try {
          const promises = PRODUCTS.map((p) => {
            const cleanProd: Record<string, unknown> = {
              id: p.id,
              nameAr: p.nameAr || '',
              nameEn: p.nameEn || p.nameAr || '',
              price: Number(p.price) || 0,
              ml: p.ml || '100 ML',
              img: p.img || '',
              descAr: p.descAr || '',
              descEn: p.descEn || '',
              category: p.category || 'summer',
              rating: Number(p.rating) || 5,
              createdAt: serverTimestamp(),
            };
            if (p.badgeAr) cleanProd.badgeAr = p.badgeAr;
            if (p.badgeEn) cleanProd.badgeEn = p.badgeEn;
            return setDoc(doc(db, 'products', p.id), cleanProd);
          });
          await Promise.all(promises);
        } catch (err) {
          console.warn('Firestore products seeding notice:', err);
          onUpdate(PRODUCTS);
        }
      } else {
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Product;
          list.push({ ...data, id: docSnap.id });
        });

        if (list.length > 0) {
          onUpdate(list);
        } else {
          onUpdate(PRODUCTS);
        }
      }
    },
    (error) => {
      console.warn('Firestore products subscription notice:', error);
      onUpdate(PRODUCTS);
    }
  );
};

export const saveProductToFirestore = async (product: Product) => {
  const id = product.id || `prod-${Date.now()}`;
  const prodDoc = doc(db, 'products', id);
  const cleanData: Record<string, unknown> = {
    id,
    nameAr: product.nameAr || '',
    nameEn: product.nameEn || product.nameAr || '',
    price: Number(product.price) || 0,
    ml: product.ml || '100 ML',
    img: product.img || '',
    descAr: product.descAr || '',
    descEn: product.descEn || '',
    category: product.category || 'summer',
    rating: Number(product.rating) || 5,
    updatedAt: serverTimestamp(),
  };
  if (product.badgeAr) cleanData.badgeAr = product.badgeAr;
  if (product.badgeEn) cleanData.badgeEn = product.badgeEn;

  await setDoc(prodDoc, cleanData, { merge: true });
  return id;
};

export const deleteProductFromFirestore = async (productId: string) => {
  await deleteDoc(doc(db, 'products', productId));
};

// ==========================================
// 2. CATEGORIES REAL-TIME SYNC & OPERATIONS
// ==========================================

const CANONICAL_CAT_ORDER = ['summer', 'winter', 'sport', 'occasions'];

const getCachedCategories = (): CategoryItem[] => {
  try {
    const cached = localStorage.getItem('voltic_categories_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...parsed].sort((a, b) => {
          const idxA = CANONICAL_CAT_ORDER.indexOf(a.id);
          const idxB = CANONICAL_CAT_ORDER.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });
      }
    }
  } catch {
    // Ignore cache error
  }
  return CATEGORIES_DATA as unknown as CategoryItem[];
};

export const subscribeCategories = (onUpdate: (categories: CategoryItem[]) => void) => {
  // Immediately emit cached/default categories to guarantee instant UI render
  onUpdate(getCachedCategories());

  const catCol = collection(db, 'categories');
  return onSnapshot(
    catCol,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed categories to Firestore
        try {
          const promises = CATEGORIES_DATA.map((c) =>
            setDoc(doc(db, 'categories', c.id), {
              id: c.id,
              titleAr: c.titleAr || '',
              titleEn: c.titleEn || '',
              subAr: c.subAr || '',
              subEn: c.subEn || '',
              tagAr: c.tagAr || '',
              tagEn: c.tagEn || '',
              descAr: c.descAr || '',
              descEn: c.descEn || '',
              img: c.img || '',
              createdAt: serverTimestamp(),
            })
          );
          await Promise.all(promises);
        } catch (err) {
          console.warn('Failed seeding categories to Firestore:', err);
          onUpdate(getCachedCategories());
        }
      } else {
        const list: CategoryItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CategoryItem;
          list.push({ ...data, id: docSnap.id });
        });

        // Maintain consistent canonical order
        list.sort((a, b) => {
          const idxA = CANONICAL_CAT_ORDER.indexOf(a.id);
          const idxB = CANONICAL_CAT_ORDER.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          return 0;
        });

        if (list.length > 0) {
          try {
            localStorage.setItem('voltic_categories_cache', JSON.stringify(list));
          } catch {
            // storage quota fallback
          }
          onUpdate(list);
        } else {
          onUpdate(getCachedCategories());
        }
      }
    },
    (error) => {
      console.warn('Firestore categories subscription error:', error);
      onUpdate(getCachedCategories());
    }
  );
};

export const saveCategoryToFirestore = async (category: CategoryItem) => {
  const id = category.id || 'summer';
  const cleanCategory: CategoryItem = {
    id,
    titleAr: category.titleAr || '',
    titleEn: category.titleEn || category.titleAr || '',
    subAr: category.subAr || '',
    subEn: category.subEn || '',
    tagAr: category.tagAr || '',
    tagEn: category.tagEn || '',
    descAr: category.descAr || '',
    descEn: category.descEn || '',
    img: category.img !== undefined && category.img !== null ? category.img : '',
  };

  // 1. Immediately update localStorage cache
  try {
    const current = getCachedCategories();
    const updated = current.map((c) => (c.id === id ? { ...c, ...cleanCategory } : c));
    localStorage.setItem('voltic_categories_cache', JSON.stringify(updated));
  } catch {
    // Ignore cache error
  }

  // 2. Persist to Firestore
  try {
    await setDoc(
      doc(db, 'categories', id),
      {
        ...cleanCategory,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Firestore saveCategory error:', err);
    // Even if Firestore fails, local cache is preserved
  }
};

// ==========================================
// 3. BANNERS REAL-TIME SYNC & OPERATIONS
// ==========================================

export const subscribeBanners = (onUpdate: (banners: Banner[]) => void) => {
  onUpdate(DEFAULT_BANNERS as unknown as Banner[]);

  const bannersCol = collection(db, 'banners');
  return onSnapshot(
    bannersCol,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed default banners
        try {
          const promises = DEFAULT_BANNERS.map((b, idx) =>
            setDoc(doc(db, 'banners', b.id || `banner-${idx + 1}`), {
              id: b.id || `banner-${idx + 1}`,
              image: b.image || '',
              altAr: b.altAr || 'بنر متجر VOLTIC',
              altEn: b.altEn || 'VOLTIC Banner',
              category: b.category || 'summer',
              order: idx,
              createdAt: serverTimestamp(),
            })
          );
          await Promise.all(promises);
        } catch (err) {
          console.warn('Failed seeding banners to Firestore:', err);
          onUpdate(DEFAULT_BANNERS as unknown as Banner[]);
        }
      } else {
        const list: (Banner & { order?: number })[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Banner & { order?: number };
          list.push({ ...data, id: docSnap.id });
        });
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        if (list.length > 0) {
          onUpdate(list);
        } else {
          onUpdate(DEFAULT_BANNERS as unknown as Banner[]);
        }
      }
    },
    (error) => {
      console.warn('Firestore banners subscription error:', error);
      onUpdate(DEFAULT_BANNERS as unknown as Banner[]);
    }
  );
};

export const saveBannerToFirestore = async (banner: Banner, orderIndex = 0) => {
  const id = String(banner.id || `banner-${Date.now()}`);
  const cleanBanner = {
    id,
    image: banner.image || banner.img || '',
    altAr: banner.altAr || 'بنر متجر VOLTIC',
    altEn: banner.altEn || 'VOLTIC Banner',
    category: banner.category || 'summer',
    order: orderIndex,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'banners', id), cleanBanner, { merge: true });
  return id;
};

export const deleteBannerFromFirestore = async (bannerId: string) => {
  await deleteDoc(doc(db, 'banners', bannerId));
};

// ==========================================
// 4. STORE SETTINGS REAL-TIME SYNC
// ==========================================

export const subscribeSettings = (onUpdate: (settings: StoreSettings) => void) => {
  const settingsDoc = doc(db, 'settings', 'store_config');
  return onSnapshot(
    settingsDoc,
    async (docSnap) => {
      if (!docSnap.exists()) {
        try {
          await setDoc(settingsDoc, DEFAULT_STORE_SETTINGS);
          onUpdate(DEFAULT_STORE_SETTINGS);
        } catch (err) {
          console.warn('Failed initializing settings in Firestore:', err);
          onUpdate(DEFAULT_STORE_SETTINGS);
        }
      } else {
        const data = docSnap.data() as StoreSettings;
        onUpdate({ ...DEFAULT_STORE_SETTINGS, ...data });
      }
    },
    (error) => {
      console.warn('Firestore settings subscription error:', error);
      onUpdate(DEFAULT_STORE_SETTINGS);
    }
  );
};

export const saveSettingsToFirestore = async (settings: Partial<StoreSettings>) => {
  const settingsDoc = doc(db, 'settings', 'store_config');
  await setDoc(settingsDoc, settings, { merge: true });
};

// ==========================================
// 5. ORDERS REAL-TIME SYNC & OPERATIONS
// ==========================================

export const subscribeOrders = (onUpdate: (orders: Order[]) => void) => {
  const ordersCol = collection(db, 'orders');
  return onSnapshot(
    ordersCol,
    (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Order;
        list.push({ ...data, id: docSnap.id });
      });
      // Sort newest first
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      onUpdate(list);
    },
    (error) => {
      console.warn('Firestore orders subscription error:', error);
    }
  );
};

export const createOrderInFirestore = async (order: Order) => {
  const id = order.id || `VLT-${Date.now().toString().slice(-6)}`;
  const orderDoc = doc(db, 'orders', id);
  const dataToSave = {
    id,
    date: order.date || new Date().toLocaleString(),
    timestamp: order.timestamp || Date.now(),
    status: order.status || 'pending',
    customer: {
      name: order.customer?.name || '',
      email: order.customer?.email || '',
      phone: order.customer?.phone || '',
      phone2: order.customer?.phone2 || '',
      address: order.customer?.address || '',
    },
    items: order.items || [],
    subtotal: Number(order.subtotal) || Number(order.total) || 0,
    discountCode: order.discountCode || '',
    discountAmount: Number(order.discountAmount) || 0,
    discountDesc: order.discountDesc || '',
    total: Number(order.total) || 0,
    createdAt: serverTimestamp(),
  };
  await setDoc(orderDoc, dataToSave);
  return id;
};

export const updateOrderStatusInFirestore = async (orderId: string, status: Order['status']) => {
  const orderDoc = doc(db, 'orders', orderId);
  await updateDoc(orderDoc, {
    status,
    updatedAt: serverTimestamp(),
  });
};

export const deleteOrderFromFirestore = async (orderId: string) => {
  await deleteDoc(doc(db, 'orders', orderId));
};

// ==========================================
// 6. CUSTOMERS & AUTH MANAGEMENT
// ==========================================
// 6. CUSTOMERS & AUTH MANAGEMENT (Strictly Isolated Collections)
// ==========================================

export const saveCustomerProfile = async (uid: string, profile: Partial<User>) => {
  const cleanEmail = profile.email?.trim().toLowerCase();
  
  // 1. Save in Firestore 'customers' collection by UID
  const customerDoc = doc(db, 'customers', uid);
  const dataToSave = {
    ...profile,
    uid,
    role: 'customer',
    updatedAt: serverTimestamp(),
  };
  await setDoc(customerDoc, dataToSave, { merge: true });

  // 2. Also save in 'customers' collection indexed directly by cleanEmail for instant O(1) checks
  if (cleanEmail) {
    const emailCustomerDoc = doc(db, 'customers', cleanEmail);
    await setDoc(
      emailCustomerDoc,
      {
        ...dataToSave,
        email: cleanEmail,
      },
      { merge: true }
    );
  }
};

export const getCustomerProfile = async (uid: string): Promise<User | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'customers', uid));
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
  } catch (err) {
    console.warn('getCustomerProfile notice:', err);
  }
  return null;
};

export const checkCustomerByEmail = async (email: string): Promise<User | null> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;

  // 1. Direct O(1) document lookup in 'customers' collection by email ID
  try {
    const emailSnap = await getDoc(doc(db, 'customers', cleanEmail));
    if (emailSnap.exists()) {
      return { ...emailSnap.data(), email: cleanEmail } as User;
    }
  } catch (err) {
    console.warn('Direct customer doc lookup notice:', err);
  }

  // 2. Query 'customers' collection by email field
  try {
    const q = query(
      collection(db, 'customers'),
      where('email', '==', cleanEmail)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { ...docSnap.data(), uid: docSnap.id } as User;
    }
  } catch (err) {
    console.warn('Customers query by email notice:', err);
  }

  // 3. Fallback to localStorage cached customer data
  try {
    const cached = localStorage.getItem('voltic_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.email?.trim().toLowerCase() === cleanEmail) {
        return parsed as User;
      }
    }
  } catch {
    // Quota fallback
  }

  return null;
};

export const checkAdminEmail = async (email: string): Promise<boolean> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;

  // 1. Check primary hardcoded store admin list
  if (DEFAULT_STORE_SETTINGS.adminEmails.some((e) => e.toLowerCase() === cleanEmail)) {
    return true;
  }

  // 2. Check settings document in Firestore (settings/store_config)
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'store_config'));
    if (docSnap.exists()) {
      const settings = docSnap.data() as StoreSettings;
      if (settings.adminEmails?.some((e) => e.toLowerCase() === cleanEmail)) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Settings admin check notice:', err);
  }

  // 3. Check isolated 'admins' collection in Firestore
  try {
    const adminSnap = await getDoc(doc(db, 'admins', cleanEmail));
    if (adminSnap.exists()) {
      return true;
    }
  } catch (err) {
    console.warn('Admins collection check notice:', err);
  }

  return false;
};

export const registerAdminEmail = async (email: string) => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return;

  await setDoc(doc(db, 'admins', cleanEmail), {
    email: cleanEmail,
    role: 'admin',
    createdAt: serverTimestamp(),
  });
};

// Seed default admin accounts into Firestore 'admins' collection in the cloud
export const ensureAdminRecords = async () => {
  try {
    const defaultAdmins = DEFAULT_STORE_SETTINGS.adminEmails || [];
    for (const email of defaultAdmins) {
      const clean = email.toLowerCase();
      const adminDocRef = doc(db, 'admins', clean);
      const snap = await getDoc(adminDocRef);
      if (!snap.exists()) {
        await setDoc(adminDocRef, {
          email: clean,
          role: 'admin',
          createdAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('ensureAdminRecords notice:', err);
  }
};

// Auto run initialization in background
ensureAdminRecords().catch(() => {});
