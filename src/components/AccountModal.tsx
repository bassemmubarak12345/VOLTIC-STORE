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
} from 'lucide-react';
import { User, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  auth,
  saveCustomerProfile,
  checkCustomerByEmail,
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

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setView(initialTab);
      }
      setErrorMsg('');
      setSuccessMsg('');
      setEmailAlreadyExists(false);
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

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || password.length < 6) {
      setErrorMsg(
        isRtl
          ? 'يرجى إكمال جميع الحقول المطلوبة (كلمة المرور 6 أحرف على الأقل).'
          : 'Please fill in all required fields (Password min 6 chars).'
      );
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if email exists first in customers collection
      const existingCustomer = await checkCustomerByEmail(email.trim());
      if (existingCustomer) {
        setEmailAlreadyExists(true);
        setErrorMsg('هذا البريد الإلكتروني مسجل من قبل، من فضلك سجل دخولك');
        setIsLoading(false);
        return;
      }

      // 2. Create in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );
      const uid = userCredential.user.uid;

      // 3. Save full customer profile to Firestore 'customers' collection with doc ID = uid
      const customerData: User = {
        uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        phone2: phone2.trim() || undefined,
        address: address.trim(),
        createdAt: new Date().toISOString(),
      };

      await saveCustomerProfile(uid, customerData);

      // 4. Update local app state
      onSaveUser(customerData);

      setSuccessMsg(
        isRtl
          ? 'تم إنشاء حسابك في VOLTIC بنجاح! أهلاً بك ✨'
          : 'Your VOLTIC account has been created successfully! Welcome ✨'
      );

      setTimeout(() => {
        if (onProceedCheckoutAfterAuth) {
          onProceedCheckoutAfterAuth();
        }
        onClose();
      }, 1200);
    } catch (err: unknown) {
      console.error('Customer registration error:', err);
      const errorObj = err as { code?: string; message?: string };
      if (errorObj?.code === 'auth/email-already-in-use') {
        setEmailAlreadyExists(true);
        setErrorMsg('هذا البريد الإلكتروني مسجل من قبل، من فضلك سجل دخولك');
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
        email: loginEmail.trim(),
        phone: '',
        address: '',
      };

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

    if (!resetEmail.trim()) {
      setErrorMsg(isRtl ? 'يرجى كتابة البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      // Check if email exists in customers collection
      const customer = await checkCustomerByEmail(resetEmail.trim());
      if (!customer) {
        setErrorMsg('هذا البريد غير مسجل لدينا');
        setIsLoading(false);
        return;
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setSuccessMsg(
        isRtl
          ? 'تم ارسال رابط اعادة التعيين الى بريدك\n\n📌 تنبيه هام: يرجى تفقد صندوق الوارد (Inbox) أو مجلد الرسائل غير المرغوب فيها (Spam / Junk) في حال عدم ظهور الرسالة في البريد الرئيسي فوراً.'
          : 'Password reset link sent to your email successfully\n\n📌 Note: Please check your Inbox or Spam / Junk folder if you do not see the email immediately.'
      );
    } catch (err: unknown) {
      console.error('Forgot password error:', err);
      setErrorMsg(
        isRtl
          ? 'تعذر إرسال الرابط، يرجى التأكد من البريد والمحاولة ثانية.'
          : 'Could not send reset link. Please check email and retry.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-md bg-[#141414] border border-[#c9a84c]/30 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          aria-label={t.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c] flex items-center justify-center mx-auto mb-2.5 shadow-lg">
            {currentUser ? (
              <UserCheck className="w-6 h-6" />
            ) : view === 'login' ? (
              <LogIn className="w-6 h-6" />
            ) : view === 'register' ? (
              <UserPlus className="w-6 h-6" />
            ) : (
              <KeyRound className="w-6 h-6" />
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white font-['Cinzel',sans-serif]">
            VOLTIC
          </h3>

          <p className="text-xs text-[#c9a84c] font-bold mt-0.5">
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

            {/* If Email already exists: Show action buttons as requested */}
            {emailAlreadyExists && (
              <div className="pt-2 border-t border-red-500/20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setLoginEmail(email);
                    setErrorMsg('');
                    setEmailAlreadyExists(false);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#c9a84c] hover:bg-[#e8c96d] text-black font-black text-xs text-center transition-all cursor-pointer"
                >
                  {isRtl ? 'تسجيل دخول' : 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView('forgot_password');
                    setResetEmail(email);
                    setErrorMsg('');
                    setEmailAlreadyExists(false);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center transition-all cursor-pointer"
                >
                  {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            <span className="whitespace-pre-line font-medium">{successMsg}</span>
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
