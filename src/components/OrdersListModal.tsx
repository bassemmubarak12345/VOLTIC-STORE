import React from 'react';
import { X, PackageCheck, Calendar, Phone, MapPin } from 'lucide-react';
import { Order, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface OrdersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  language: Language;
}

export const OrdersListModal: React.FC<OrdersListModalProps> = ({
  isOpen,
  onClose,
  title,
  language,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[language];
  let orders: Order[] = [];
  try {
    orders = JSON.parse(localStorage.getItem('voltic_orders') || '[]');
  } catch {
    orders = [];
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[500px] max-h-[85vh] flex flex-col rounded-xl border border-[#c9a84c]/40 shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c9a84c]/20">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#c9a84c]" />
            <h3 className="text-base font-black text-[var(--text-main)]">
              {title}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#c9a84c]/15 text-[#c9a84c] font-bold">
              {orders.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-[#c9a84c]/15">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-xs">
              {t.noOrders}
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-[#c9a84c]">
                    {order.id}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {order.date}
                  </span>
                </div>

                {order.customer && (
                  <div className="text-[11px] text-[var(--text-muted)] mb-2.5 p-2 rounded bg-[var(--bg-card-elevated)] border border-[#c9a84c]/15">
                    <div className="font-bold text-[var(--text-main)]">{order.customer.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-[#c9a84c]" />
                      <span>{order.customer.phone}</span>
                      {order.customer.phone2 && <span>({order.customer.phone2})</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#c9a84c]" />
                      <span className="truncate">{order.customer.address}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1 mb-2">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-[var(--text-muted)]">
                      <span>{it.name} &times; {it.qty}</span>
                      <span className="font-semibold text-[var(--text-main)]">{it.price * it.qty} {t.currency}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#c9a84c]/10 text-xs font-black">
                  <span className="text-[var(--text-main)]">{t.cartTotal}</span>
                  <span className="text-sm text-[#c9a84c]">{order.total} {t.currency}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
