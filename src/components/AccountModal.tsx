import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  LogIn,
  UserCheck,
  LogOut,
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { User, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  auth,
  saveCustomerProfile,
  checkCustomerByEmail,
  sendVolticPasswordResetEmail,
} from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSaveUser: (user: User) => void;
  onLogout: () => void;
  language: Language;
  onProceedCheckoutAfterAuth?: () => void;
  initialTab?: 'register' | 'login';
}

type ModalView = 'login' | 'register' | 'forgot_password';

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
  onLogout,
  language,
  onProceedCheckoutAfterAuth,
  initialTab = 'register',
}) => {
  const isRtl = language === 'ar';
  const t = TRANSLATIONS[language];

  const [view, setView] = useState<ModalView>(initialTab);
  
  // Registration form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password form
  const [resetEmail, setResetEmail] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [notRegisteredEmail, setNotRegisteredEmail] = useState('');

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setView(initialTab);
      }
      setErrorMsg('');
      setSuccessMsg('');
      setEmailAlreadyExists(false);
      setNotRegisteredEmail('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // ==========================================
  // 1. CUSTOMER REGISTRATION
  // ==========================================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setEmailAlreadyExists(false);
    setNotRegisteredEmail('');

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || password.length < 6) {
      setErrorMsg(
        isRtl
          ? 'يرجى إكمال جميع الحقول المطلوبة (كلمة المرور 6 أحرف على الأقل).'
          : 'Please fill in all required fields (Password min 6 chars).'
      );
      return;
    }

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Check if email is already registered in customers cloud collection or Auth
      const existingCustomer = await checkCustomerByEmail(cleanEmail);
      if (existingCustomer) {
        setEmailAlreadyExists(true);
        setLoginEmail(cleanEmail);
        setView('login');
        setErrorMsg(
          isRtl
            ? 'هذا البريد الإلكتروني مسجل لدينا بالفعل. تم تحويلك لصفحة تسجيل الدخول، يرجى كتابة كلمة المرور.'
            : 'This email is already registered with us. Transferred to Sign In, please enter your password.'
        );
        setIsLoading(false);
        return;
      }

      // 2. Create in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password.trim()
      );
      const uid = userCredential.user.uid;

      // 3. Save full customer profile to Firestore 'customers' collection with doc ID = uid
      const customerData: User = {
        uid,
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        phone2: phone2.trim() || undefined,
        address: address.trim(),
        createdAt: new Date().toISOString(),
      };

      try {
        await saveCustomerProfile(uid, customerData);
      } catch (saveErr) {
        console.warn('saveCustomerProfile cloud sync notice:', saveErr);
      }

      // 4. Update local app state and cache
      try {
        localStorage.setItem('voltic_user', JSON.stringify(customerData));
      } catch {
        // quota fallback
      }
      onSaveUser(customerData);

      setSuccessMsg(
        isRtl
          ? 'تم إنشاء حسابك في VOLTIC بنجاح! تم تسجيل دخولك للموقع تلقائياً ✨'
          : 'Your VOLTIC account has been created successfully! Logged in automatically ✨'
      );

      setTimeout(() => {
        if (onProceedCheckoutAfterAuth) {
          onProceedCheckoutAfterAuth();
        }
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error('Customer registration error:', err);
      const errorObj = err as { code?: string; message?: string };
      if (errorObj?.code === 'auth/email-already-in-use') {
        setEmailAlreadyExists(true);
        setLoginEmail(cleanEmail);
        setView('login');
        setErrorMsg(
          isRtl
            ? 'هذا البريد الإلكتروني مسجل لدينا بالفعل. تم تحويلك لصفحة تسجيل الدخول، يرجى كتابة كلمة المرور.'
            : 'This email is already registered with us. Transferred to Sign In, please enter your password.'
        );
      } else {
        setErrorMsg(
          isRtl
            ? 'حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى.'
            : 'Registration failed. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 2. CUSTOMER LOGIN
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setEmailAlreadyExists(false);
    setNotRegisteredEmail('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg(isRtl ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Sign in with Firebase Auth using Email & Password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail.trim(),
        loginPassword
      );
      const uid = userCredential.user.uid;

      // Retrieve customer profile from Firestore
      const customer = await checkCustomerByEmail(loginEmail.trim());

      const activeUser: User = customer || {
        uid,
        name: userCredential.user.displayName || loginEmail.split('@')[0],
        email: loginEmail.trim().toLowerCase(),
        phone: '',
        address: '',
      };

      try {
        localStorage.setItem('voltic_user', JSON.stringify(activeUser));
      } catch {
        // quota fallback
      }
      onSaveUser(activeUser);

      setSuccessMsg(
        isRtl ? 'تم تسجيل الدخول بنجاح! أهلاً بك ثانية ✨' : 'Logged in successfully! Welcome back ✨'
      );

      setTimeout(() => {
        if (onProceedCheckoutAfterAuth) {
          onProceedCheckoutAfterAuth();
        }
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error('Customer login error:', err);
      // Required exact message
      setErrorMsg('الايميل او كلمة المرور أو كلاهما غير صحيح');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 3. CUSTOMER FORGOT PASSWORD
  // ==========================================
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setNotRegisteredEmail('');

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg(isRtl ? 'يرجى كتابة البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if email exists in customers cloud collection or Firebase Auth
      const customer = await checkCustomerByEmail(cleanEmail);
      if (!customer) {
        setNotRegisteredEmail(cleanEmail);
        setErrorMsg(
          isRtl
            ? 'هذا البريد الإلكتروني غير مسجل لدينا في المتجر. يرجى إنشاء حساب جديد أولاً.'
            : 'This email is not registered with us. Please create a new account.'
        );
        setIsLoading(false);
        return;
      }

      // 2. Send password reset email via Voltic branded service
      await sendVolticPasswordResetEmail(cleanEmail);
      setSuccessMsg(
        isRtl
          ? 'تم إرسال رابط استعادة كلمة المرور باسم متجر (Voltic) إلى بريدك الإلكتروني بنجاح.\n\n📌 تأكيد هام ومؤكد: الرسالة مرسلة باسم المتجر الرسمي (Voltic). إذا لم تجد الرسالة في صندوق الوارد (Inbox) فوراً، ستجدها بالتأكيد في مجلد الرسائل غير المرغوب فيها (Spam / Junk)؛ يرجى فتحها والضغط على "ليس بريداً عشوائياً / Not Spam" لتصلك كافة رسائل وتحديثات Voltic في البريد الوارد دائماً.'
          : 'Password reset link sent under (Voltic) store name to your email successfully.\n\n📌 Important Confirmation: Sent under the official name (Voltic). If not found in your Inbox, you will definitely find it in your Spam / Junk folder. Please open it and mark it as "Not Spam" to ensure all future Voltic emails arrive directly in your primary Inbox.'
      );
    } catch (err: unknown) {
      console.error('Customer forgot password error:', err);
      const errorObj = err as { code?: string; message?: string };
      if (errorObj?.code === 'auth/user-not-found') {
        setNotRegisteredEmail(cleanEmail);
        setErrorMsg(
          isRtl
            ? 'هذا البريد الإلكتروني غير مسجل لدينا في المتجر. يرجى إنشاء حساب جديد أولاً.'
            : 'This email is not registered with us. Please create a new account.'
        );
      } else if (errorObj?.code === 'auth/invalid-email') {
        setErrorMsg(
          isRtl ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email format.'
        );
      } else if (errorObj?.code === 'auth/too-many-requests') {
        setErrorMsg(
          isRtl
            ? 'تم إرسال عدة طلبات مؤخراً، يرجى الانتظار دقيقة والمحاولة ثانية.'
            : 'Too many requests. Please wait a minute and retry.'
        );
      } else {
        setErrorMsg(
          isRtl
            ? 'تعذر إرسال الرابط، يرجى التأكد من صحة البريد والمحاولة مرة أخرى.'
            : 'Could not send reset link. Please check email and retry.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-md p-3 sm:p-5 py-6 sm:py-10 flex justify-center items-start sm:items-center min-h-screen"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-md bg-[#141414] border border-[#c9a84c]/35 rounded-3xl p-5 sm:p-8 shadow-2xl my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          aria-label={t.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Voltic Emblem (100% Visible & Responsive on Mobile, Tablet & PC) */}
        <div className="text-center mb-5 sm:mb-6 flex flex-col items-center justify-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 via-[#c9a84c]/10 to-transparent border border-[#c9a84c]/40 text-[#c9a84c] flex items-center justify-center mx-auto mb-2.5 shadow-lg flex-shrink-0">
            {currentUser ? (
              <UserCheck className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : view === 'login' ? (
              <LogIn className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : view === 'register' ? (
              <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : (
              <KeyRound className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-gold-gradient font-['Cinzel',serif] tracking-[3px] sm:tracking-[4px] select-none leading-tight">
            VOLTIC
          </h3>

          <p className="text-[10.5px] sm:text-xs text-[#c9a84c] font-bold mt-1 tracking-wide">
            {currentUser
              ? isRtl ? 'بيانات حسابك المسجل' : 'Your Registered Profile'
              : view === 'login'
              ? isRtl ? 'تسجيل دخول العميل' : 'Customer Sign In'
              : view === 'register'
              ? isRtl ? 'إنشاء حساب عميل جديد' : 'New Customer Registration'
              : isRtl ? 'استعادة كلمة المرور' : 'Reset Password'}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span className="font-bold">{errorMsg}</span>
            </div>

            {/* If Email is NOT registered: Provide direct 1-click action to Register & enter the store */}
            {notRegisteredEmail && (
              <div className="pt-2 border-t border-red-500/20">
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setEmail(notRegisteredEmail);
                    setErrorMsg('');
                    setNotRegisteredEmail('');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#c9a84c] hover:bg-[#e8c96d] text-black font-black text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isRtl
                      ? 'إنشاء حساب جديد بهذا البريد الآن والولوج للمتجر'
                      : 'Create New Account with this Email Now'}
                  </span>
                </button>
              </div>
            )}

            {/* If Email already exists: Show action buttons */}
            {emailAlreadyExists && (
              <div className="pt-2 border-t border-red-500/20 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setLoginEmail(email || loginEmail);
                    setErrorMsg('');
                    setEmailAlreadyExists(false);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#c9a84c] hover:bg-[#e8c96d] text-black font-black text-xs text-center transition-all cursor-pointer"
                >
                  {isRtl ? 'تسجيل دخول بكلمة المرور' : 'Sign In with Password'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView('forgot_password');
                    setResetEmail(email || loginEmail);
                    setErrorMsg('');
                    setEmailAlreadyExists(false);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success & Spam Confirmation Notification */}
        {successMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-black/60 border border-emerald-500/40 shadow-xl space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{isRtl ? 'تم إرسال الرسالة بنجاح باسم متجر Voltic' : 'Email Sent Successfully under Voltic Name'}</span>
            </div>
            
            <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line font-medium">
              {successMsg}
            </p>

            <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#c9a84c] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isRtl ? 'مؤكد: إذا لم تجدها في الوارد ستجدها في الـ Spam' : 'Confirmed: If not in Inbox, check Spam folder'}</span>
              </span>

              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isRtl ? 'فتح البريد الإلكتروني' : 'Open Email'}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        )}

        {/* =========================================================================
            IF LOGGED IN: VIEW PROFILE & LOGOUT
           ========================================================================= */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#c9a84c]/20 space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">{isRtl ? 'الاسم:' : 'Name:'}</span>
                <span className="font-bold text-white">{currentUser.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">{isRtl ? 'البريد الإلكتروني:' : 'Email:'}</span>
                <span className="font-bold text-[#c9a84c]" dir="ltr">{currentUser.email}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">{isRtl ? 'رقم الهاتف:' : 'Phone:'}</span>
                <span className="font-bold text-white" dir="ltr">{currentUser.phone}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-400">{isRtl ? 'عنوان التوصيل:' : 'Address:'}</span>
                <span className="font-bold text-white max-w-[200px] text-end truncate">
                  {currentUser.address}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                signOut(auth).catch(() => {});
                onLogout();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-red-950/40 hover:bg-red-600 border border-red-500/40 hover:border-red-600 text-red-300 hover:text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          <>
            {/* View Switcher Tabs (Only if not in forgot password) */}
            {view !== 'forgot_password' && (
              <div className="flex p-1 bg-[#1a1a1a] rounded-xl border border-[#c9a84c]/20 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    view === 'register'
                      ? 'bg-[#c9a84c] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'حساب جديد' : 'Register'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    view === 'login'
                      ? 'bg-[#c9a84c] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تسجيل دخول' : 'Sign In'}</span>
                </button>
              </div>
            )}

            {/* =========================================================================
                VIEW 1: REGISTER FORM (Includes Email + Phone + Address + Password)
               ========================================================================= */}
            {view === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    {isRtl ? 'الاسم بالكامل' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isRtl ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 focus:border-[#c9a84c] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    {isRtl ? 'البريد الإلكتروني' : 'Email Address'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 focus:border-[#c9a84c] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">
                      {isRtl ? 'رقم الهاتف' : 'Phone'} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 focus:border-[#c9a84c] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">
                      {isRtl ? 'رقم هاتف بديل' : 'Alt Phone'}
                    </label>
                    <input
                      type="tel"
                      value={phone2}
                      onChange={(e) => setPhone2(e.target.value)}
                      placeholder={isRtl ? 'اختياري' : 'Optional'}
                      className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 focus:border-[#c9a84c] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    {isRtl ? 'عنوان التوصيل بالتفصيل' : 'Delivery Address'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={isRtl ? 'المحافظة، المدينة، الشارع، رقم المبنى' : 'City, Street, Building No.'}
                    className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 focus:border-[#c9a84c] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    {isRtl ? 'كلمة المرور' : 'Password'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 focus:border-[#c9a84c] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c9a84c] ${isRtl ? 'left-3' : 'right-3'}`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-black text-xs sm:text-sm shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? 'جاري إنشاء الحساب بالسحابة...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{isRtl ? 'إنشاء حساب جديد' : 'Register Now'}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* =========================================================================
                VIEW 2: LOGIN FORM (Using Email + Password)
               ========================================================================= */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'البريد الإلكتروني' : 'Email Address'} *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 focus:border-[#c9a84c] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                      dir="ltr"
                    />
                    <Mail className={`w-4 h-4 text-[#c9a84c]/60 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'} pointer-events-none`} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-300">
                      {isRtl ? 'كلمة المرور' : 'Password'} *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot_password');
                        setResetEmail(loginEmail);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] text-[#c9a84c] hover:underline font-semibold"
                    >
                      {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 focus:border-[#c9a84c] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c9a84c] ${isRtl ? 'left-3' : 'right-3'}`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-black text-xs sm:text-sm shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? 'جاري التحقق...' : 'Signing in...'}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* =========================================================================
                VIEW 3: FORGOT PASSWORD (Customer)
               ========================================================================= */}
            {view === 'forgot_password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-xs text-gray-300 leading-relaxed">
                  {isRtl
                    ? 'أدخل بريدك الإلكتروني المسجل في المتجر، وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'
                    : 'Enter your registered email to receive a password reset link.'}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    {isRtl ? 'البريد الإلكتروني' : 'Email Address'} *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#1a1a1a] border border-[#c9a84c]/25 focus:border-[#c9a84c] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                      dir="ltr"
                    />
                    <Mail className={`w-4 h-4 text-[#c9a84c]/60 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'} pointer-events-none`} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-black text-xs sm:text-sm shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? 'جاري التحقق والإرسال...' : 'Sending Link...'}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>{isRtl ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'}</span>
                    </>
                  )}
                </button>

                <div className="flex justify-between items-center pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-gray-400 hover:text-[#c9a84c] font-bold"
                  >
                    {isRtl ? '← العودة لتسجيل الدخول' : '← Back to Login'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setView('register');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[#c9a84c] hover:underline font-bold"
                  >
                    {isRtl ? 'تسجيل حساب جديد' : 'New Register'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};
