import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Store,
} from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, checkAdminEmail } from '../lib/firebase';
import { Language } from '../types';

interface AdminLoginProps {
  language: Language;
  onSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  language,
  onSuccess,
  onBackToStore,
}) => {
  const isRtl = language === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Brute force protection: 5 attempts -> 60s cooldown
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      return parseInt(localStorage.getItem('voltic_admin_failed_attempts') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [lockoutTimer, setLockoutTimer] = useState(() => {
    try {
      const lockUntil = parseInt(localStorage.getItem('voltic_admin_lockout_until') || '0', 10);
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  });

  // Forgot password sub-view
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('voltic_admin_lockout_until');
            localStorage.setItem('voltic_admin_failed_attempts', '0');
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Reset attempts on success
      localStorage.setItem('voltic_admin_failed_attempts', '0');
      setFailedAttempts(0);
      onSuccess();
    } catch (err: unknown) {
      console.error('Admin login error:', err);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('voltic_admin_failed_attempts', String(newAttempts));

      if (newAttempts >= 5) {
        const lockUntil = Date.now() + 60 * 1000;
        localStorage.setItem('voltic_admin_lockout_until', String(lockUntil));
        setLockoutTimer(60);
        setErrorMsg(
          isRtl
            ? 'تم تجاوز الحد الأقصى للمحاولات (5 مرات). تم قفل المحاولة مؤقتاً لمدة 60 ثانية لحماية المتجر.'
            : 'Too many failed attempts (5 times). Account temporarily locked for 60 seconds.'
        );
      } else {
        // Required exact Arabic message
        setErrorMsg('الايميل او كلمة المرور أو كلاهما غير صحيح');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setErrorMsg(isRtl ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsResetting(true);

    try {
      // Must verify email belongs to an admin
      const isAdmin = await checkAdminEmail(resetEmail.trim());
      if (!isAdmin) {
        setErrorMsg(
          isRtl
            ? 'خطأ: هذا البريد غير مسجل كمسؤول للوحة التحكم.'
            : 'Error: This email is not registered as an authorized administrator.'
        );
        setIsResetting(false);
        return;
      }

      await sendPasswordResetEmail(auth, resetEmail.trim());
      setSuccessMsg(
        isRtl
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.\n(ملاحظة: تفقد صندوق الوارد أو مجلد الرسائل غير المرغوب فيها Spam / Junk إذا لم تجدها في الرسائل العادية)'
          : 'Password reset link sent successfully.\n(Note: Check your Inbox or Spam / Junk folder if not received immediately)'
      );
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      setErrorMsg(
        isRtl
          ? 'تعذر إرسال الرابط، يرجى التأكد من صحة البريد والمحاولة مرة أخرى.'
          : 'Failed to send reset link. Please check your email and try again.'
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative bg-[#0a0a0a]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(201,168,76,0.12),transparent_70%)] pointer-events-none" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl sm:rounded-3xl border border-[#c9a84c]/30 bg-[#121212]/95 backdrop-blur-xl p-6 sm:p-9 shadow-2xl">
        
        {/* Top Return to Store Button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToStore}
            className="flex items-center gap-1.5 text-xs text-[#c9a84c] hover:text-[#e8c96d] font-bold transition-colors cursor-pointer"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isRtl ? 'العودة للمتجر' : 'Back to Store'}</span>
          </button>

          <span className="text-[10px] uppercase tracking-widest text-[#c9a84c]/60 font-black border border-[#c9a84c]/20 px-2 py-0.5 rounded-full">
            VOLTIC ADMIN
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#c9a84c]/20 via-[#c9a84c]/10 to-transparent border border-[#c9a84c]/40 flex items-center justify-center mx-auto mb-3 text-[#c9a84c] shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Cinzel',sans-serif] tracking-wider">
            VOLTIC
          </h1>
          <p className="text-xs sm:text-sm text-[#c9a84c] font-semibold mt-1">
            {isRtl ? 'لوحة تحكم إدارة المتجر' : 'Store Management Dashboard'}
          </p>
        </div>

        {/* Lockout Warning Banner */}
        {lockoutTimer > 0 && (
          <div className="mb-5 p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs leading-relaxed flex items-center gap-3 animate-pulse">
            <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-400" />
            <div>
              <p className="font-bold">
                {isRtl ? 'تم قفل الدخول مؤقتاً للحماية' : 'Temporarily Locked for Security'}
              </p>
              <p className="text-[11px] mt-0.5">
                {isRtl
                  ? `يرجى الانتظار (${lockoutTimer}) ثانية قبل المحاولة مجدداً.`
                  : `Please wait (${lockoutTimer}) seconds before retrying.`}
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs leading-relaxed flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            <span className="whitespace-pre-line">{successMsg}</span>
          </div>
        )}

        {!showForgotPassword ? (
          /* =========================================================================
              VIEW 1: SIGN IN FORM
             ========================================================================= */
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                {isRtl ? 'البريد الإلكتروني للإدارة' : 'Admin Email'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  disabled={lockoutTimer > 0 || isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@voltic.com"
                  className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 focus:border-[#c9a84c] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#c9a84c] transition-all disabled:opacity-50"
                  dir="ltr"
                />
                <Mail className={`w-4 h-4 text-[#c9a84c]/60 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3.5' : 'right-3.5'} pointer-events-none`} />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-300">
                  {isRtl ? 'كلمة المرور' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setErrorMsg('');
                    setSuccessMsg('');
                    setResetEmail(email);
                  }}
                  className="text-[11px] text-[#c9a84c] hover:underline font-semibold"
                >
                  {isRtl ? 'هل نسيت كلمة المرور؟' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={lockoutTimer > 0 || isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 focus:border-[#c9a84c] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#c9a84c] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c9a84c] ${isRtl ? 'left-3.5' : 'right-3.5'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Attempts warning */}
            {failedAttempts > 0 && failedAttempts < 5 && lockoutTimer === 0 && (
              <p className="text-[11px] text-amber-400 font-semibold text-center">
                {isRtl
                  ? `متبقي لك ${5 - failedAttempts} محاولات قبل القفل المؤقت.`
                  : `${5 - failedAttempts} attempts remaining before temporary lock.`}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={lockoutTimer > 0 || isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#c9a84c] via-[#e8c96d] to-[#c9a84c] hover:opacity-95 text-black font-black text-sm tracking-wider shadow-lg hover:shadow-[#c9a84c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? 'جاري التحقق...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRtl ? 'دخول لوحة التحكم' : 'Sign In to Dashboard'}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* =========================================================================
              VIEW 2: FORGOT PASSWORD FORM
             ========================================================================= */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-xs text-gray-300 leading-relaxed">
              {isRtl
                ? 'أدخل بريدك الإلكتروني المعتمد كمسؤول، وسنرسل لك رابط إعادة تعيين كلمة المرور فوراً.'
                : 'Enter your registered admin email to receive a password reset link.'}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                {isRtl ? 'البريد الإلكتروني للإدارة' : 'Admin Email'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@voltic.com"
                  className="w-full bg-[#1a1a1a] border border-[#c9a84c]/30 focus:border-[#c9a84c] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#c9a84c] transition-all"
                  dir="ltr"
                />
                <Mail className={`w-4 h-4 text-[#c9a84c]/60 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3.5' : 'right-3.5'} pointer-events-none`} />
              </div>
            </div>

            {/* Submit Reset Button */}
            <button
              type="submit"
              disabled={isResetting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black font-black text-sm tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? 'جاري الإرسال...' : 'Sending Link...'}</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{isRtl ? 'إرسال رابط استعادة كلمة المرور' : 'Send Reset Link'}</span>
                </>
              )}
            </button>

            {/* Back to Login */}
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="w-full text-center text-xs text-gray-400 hover:text-[#c9a84c] font-bold pt-2 transition-colors"
            >
              {isRtl ? 'الرجوع لتسجيل الدخول' : 'Back to Login'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
