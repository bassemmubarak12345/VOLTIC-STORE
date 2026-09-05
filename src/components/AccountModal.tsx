import React, { useState } from 'react';
import { X, UserPlus, LogIn, UserCheck, LogOut, ShieldCheck } from 'lucide-react';
import { User, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

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
  const [tab, setTab] = useState<'register' | 'login'>(initialTab);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Sync tab with initialTab whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setTab(initialTab);
      }
      setError('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let savedUsers: User[] = [];
    try {
      savedUsers = JSON.parse(localStorage.getItem('voltic_users') || '[]');
    } catch {
      savedUsers = [];
    }

    if (tab === 'register') {
      if (!name.trim() || !phone.trim() || !address.trim() || password.length < 6) {
        setError(
          language === 'ar'
            ? 'يرجى إكمال جميع الحقول المطلوبة، وكلمة المرور 6 أحرف على الأقل.'
            : 'Please complete all required fields. Password must be at least 6 characters.'
        );
        return;
      }

      if (savedUsers.some((u) => u.phone === phone.trim())) {
        setError(
          language === 'ar'
            ? 'هذا الرقم مسجل مسبقاً، يرجى اختيار تسجيل الدخول.'
            : 'This phone number is already registered. Please use Sign In.'
        );
        return;
      }

      const newUser: User = {
        name: name.trim(),
        phone: phone.trim(),
        phone2: phone2.trim(),
        address: address.trim(),
        password: password.trim(),
      };

      savedUsers.push(newUser);
      localStorage.setItem('voltic_users', JSON.stringify(savedUsers));
      onSaveUser(newUser);

      if (onProceedCheckoutAfterAuth) {
        onProceedCheckoutAfterAuth();
      }
      onClose();
    } else {
      // Login
      const existing = savedUsers.find(
        (u) => u.phone === phone.trim() && u.password === password.trim()
      );

      if (!existing) {
        setError(
          language === 'ar'
            ? 'رقم الهاتف أو كلمة المرور غير صحيحة.'
            : 'Incorrect phone number or password.'
        );
        return;
      }

      onSaveUser(existing);
      if (onProceedCheckoutAfterAuth) {
        onProceedCheckoutAfterAuth();
      }
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-xs animate-fadeIn p-3 sm:p-4 flex items-center justify-center min-h-screen"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] max-h-[90vh] sm:max-h-[88vh] my-auto flex flex-col rounded-2xl border border-[#c9a84c]/45 shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header with Close Button */}
        <div className="flex items-center justify-between px-5 sm:px-7 pt-4 sm:pt-5 pb-3 border-b border-[#c9a84c]/15 flex-shrink-0">
          <div className="flex flex-col pe-4">
            <h3 className="text-base sm:text-lg font-black text-[var(--text-main)] leading-tight">
              {currentUser ? t.welcomeUser : t.accountTitle}
            </h3>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
              {currentUser ? currentUser.phone : t.accountNote}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content (Touch-friendly & Smooth on mobile) */}
        <div
          className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {/* Current User Logged In State */}
          {currentUser ? (
            <div className="text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#c9a84c]/15 border border-[#c9a84c] flex items-center justify-center text-[#c9a84c] mb-3">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-[var(--text-main)] mb-1">
                {currentUser.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                {currentUser.phone} &bull; {currentUser.address}
              </p>

              <div className="p-3.5 rounded-lg bg-[var(--bg-card-elevated)] border border-[#c9a84c]/20 text-xs text-[var(--text-muted)] mb-6 text-start flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#c9a84c] flex-shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'بيانات الشحن الخاصة بك محفوظة ومفعلة للطلبات الفورية.'
                    : 'Your shipping contact details are saved and ready for instant checkout.'}
                </span>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  setName('');
                  setPhone('');
                  setAddress('');
                  setPassword('');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logout}</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Mode Switcher Tabs */}
              <div className="flex gap-2 p-1 rounded-lg bg-[var(--bg-card-elevated)] border border-[#c9a84c]/20 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-md font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    tab === 'register'
                      ? 'bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black shadow-md'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.tabRegister}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-md font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    tab === 'login'
                      ? 'bg-gradient-to-r from-[#c9a84c] to-[#9a7830] text-black shadow-md'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.tabLogin}</span>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 mb-4 rounded-md bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                {tab === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                      {t.fullName} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.fullNamePlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#c9a84c]/25 bg-[var(--bg-card-elevated)] text-[var(--text-main)] text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                    {t.phone} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#c9a84c]/25 bg-[var(--bg-card-elevated)] text-[var(--text-main)] text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
                  />
                </div>

                {tab === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                        {t.phone2} <span className="text-[var(--text-muted)] font-normal">{t.optional}</span>
                      </label>
                      <input
                        type="tel"
                        value={phone2}
                        onChange={(e) => setPhone2(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#c9a84c]/25 bg-[var(--bg-card-elevated)] text-[var(--text-main)] text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                        {t.address} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t.addressPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#c9a84c]/25 bg-[var(--bg-card-elevated)] text-[var(--text-main)] text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                    {t.password} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#c9a84c]/25 bg-[var(--bg-card-elevated)] text-[var(--text-main)] text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-3 w-full py-3 px-6 rounded-lg bg-gradient-to-r from-[#e8c96d] via-[#c9a84c] to-[#9a7830] text-black font-black text-xs sm:text-sm tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-md cursor-pointer"
                >
                  {tab === 'register' ? t.submitRegister : t.submitLogin}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
