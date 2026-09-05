import React from 'react';
import { CheckCircle, X, PackageCheck } from 'lucide-react';
import { Order, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface OrderConfirmationModalProps {
  order: Order | null;
  language: Language;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  language,
  onClose,
}) => {
  if (!order) return null;

  const t = TRANSLATIONS[language];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-xs animate-fadeIn p-3 sm:p-4 flex items-center justify-center min-h-screen"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] max-h-[90vh] my-auto flex flex-col rounded-2xl border border-[#c9a84c]/50 shadow-2xl p-6 sm:p-8 text-center overflow-y-auto custom-scrollbar"
        style={{ backgroundColor: 'var(--bg-card)', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-full text-[var(--text-muted)] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c] flex items-center justify-center text-[#c9a84c]">
          <CheckCircle className="w-9 h-9" />
        </div>

        <h3 className="text-xl font-black text-[var(--text-main)] mb-1">
          {t.orderSuccessTitle}
        </h3>
        
        <p className="text-xs text-[var(--text-muted)] mb-4">
          {t.orderNumber}: <span className="font-black text-[#c9a84c]">{order.id}</span>
        </p>

        <div className="p-3.5 rounded-lg bg-[var(--bg-card-elevated)] border border-[#c9a84c]/20 text-xs text-[var(--text-muted)] mb-5 text-start flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
          <span>{t.orderDispatchedMsg}</span>
        </div>

        {/* Order Items Breakdown */}
        <div className="border-t border-b border-[#c9a84c]/15 py-3 mb-5 max-h-[180px] overflow-y-auto">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-1.5 font-medium text-[var(--text-muted)]"
            >
              <span>{item.name} &times; {item.qty}</span>
              <span className="font-bold text-[var(--text-main)]">{item.price * item.qty} {t.currency}</span>
            </div>
          ))}
          {order.discountAmount && order.discountAmount > 0 ? (
            <>
              <div className="flex items-center justify-between text-xs py-1 text-[var(--text-muted)] pt-2 border-t border-[#c9a84c]/15">
                <span>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span>{(order.subtotal || (order.total + order.discountAmount))} {t.currency}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 text-emerald-400 font-bold">
                <span>{language === 'ar' ? 'كود الخصم' : 'Discount Code'} ({order.discountCode}):</span>
                <span>-{order.discountAmount} {t.currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black pt-2 mt-1 border-t border-[#c9a84c]/20 text-[var(--text-main)]">
                <span>{language === 'ar' ? 'الإجمالي بعد الخصم:' : 'Total after discount:'}</span>
                <span className="text-[#c9a84c]">{order.total} {t.currency}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-sm font-black pt-2 mt-2 border-t border-[#c9a84c]/15 text-[var(--text-main)]">
              <span>{t.cartTotal}:</span>
              <span className="text-[#c9a84c]">{order.total} {t.currency}</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-[#e8c96d] via-[#c9a84c] to-[#9a7830] text-black font-black text-xs tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-md"
        >
          {t.orderOk}
        </button>
      </div>
    </div>
  );
};
