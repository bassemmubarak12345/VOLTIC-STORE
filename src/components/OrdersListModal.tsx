import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  PackageCheck,
  Calendar,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  MessageCircle,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { Order, Language, User, Product } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

interface OrdersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  language: Language;
  currentUser?: User | null;
  products?: Product[];
}

export const OrdersListModal: React.FC<OrdersListModalProps> = ({
  isOpen,
  onClose,
  title,
  language,
  currentUser,
  products = [],
}) => {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';
  const currency = isRtl ? 'ج.م' : 'EGP';

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cloudOrders, setCloudOrders] = useState<Order[]>([]);
  const [localOrders, setLocalOrders] = useState<Order[]>([]);

  // 1. Read Local Storage Orders
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = JSON.parse(localStorage.getItem('voltic_orders') || '[]');
      setLocalOrders(Array.isArray(saved) ? saved : []);
    } catch {
      setLocalOrders([]);
    }
  }, [isOpen]);

  // 2. Fetch / Subscribe to Real-Time Cloud Orders for this customer
  useEffect(() => {
    if (!isOpen) return;

    // If user has an email or phone, query their orders from Firestore
    const userEmail = currentUser?.email?.trim().toLowerCase();
    const userPhone = currentUser?.phone?.trim();

    if (!userEmail && !userPhone) {
      return;
    }

    try {
      const ordersCol = collection(db, 'orders');
      const unsub = onSnapshot(
        ordersCol,
        (snapshot) => {
          const list: Order[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Order;
            const orderEmail = (data.customer?.email || '').trim().toLowerCase();
            const orderPhone = (data.customer?.phone || '').trim();

            const isMatch =
              (userEmail && orderEmail && userEmail === orderEmail) ||
              (userPhone && orderPhone && userPhone === orderPhone);

            if (isMatch) {
              list.push({ ...data, id: docSnap.id });
            }
          });
          setCloudOrders(list);
        },
        (err) => {
          console.warn('Could not sync customer cloud orders:', err);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn('Orders subscription failed:', err);
    }
  }, [isOpen, currentUser]);

  // Merge Local and Cloud Orders without duplicates, sorted newest first
  const allOrders = useMemo(() => {
    const map = new Map<string, Order>();

    // 1. Add cloud orders
    cloudOrders.forEach((o) => {
      if (o.id) map.set(o.id, o);
    });

    // 2. Add local orders if not already present or to complement
    localOrders.forEach((o) => {
      if (o.id && !map.has(o.id)) {
        map.set(o.id, o);
      }
    });

    const combined = Array.from(map.values());
    combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return combined;
  }, [cloudOrders, localOrders]);

  if (!isOpen) return null;

  const handleCopyOrderId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback
    }
  };

  // Helper to find image for an item
  const getItemImage = (it: { id?: string; name: string; img?: string }) => {
    if (it.img && it.img.trim()) return it.img;
    const match = products.find(
      (p) =>
        (it.id && p.id === it.id) ||
        p.nameAr === it.name ||
        p.nameEn === it.name ||
        it.name.includes(p.nameAr) ||
        it.name.includes(p.nameEn)
    );
    if (match?.img) return match.img;
    // Luxury perfume default fallback
    return 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=400';
  };

  const getStatusBadge = (status?: Order['status']) => {
    switch (status) {
      case 'processing':
        return {
          label: isRtl ? 'جاري تجهيز الطلب' : 'Processing Order',
          bg: 'bg-blue-500/15 border-blue-500/35 text-blue-400',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'shipped':
        return {
          label: isRtl ? 'تم الشحن للتوصيل' : 'Out for Delivery',
          bg: 'bg-purple-500/15 border-purple-500/35 text-purple-400',
          icon: <Truck className="w-3.5 h-3.5" />,
        };
      case 'delivered':
        return {
          label: isRtl ? 'تم التوصيل بنجاح' : 'Delivered Successfully',
          bg: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'cancelled':
        return {
          label: isRtl ? 'ملغي' : 'Cancelled',
          bg: 'bg-red-500/15 border-red-500/35 text-red-400',
          icon: <RotateCcw className="w-3.5 h-3.5" />,
        };
      case 'pending':
      default:
        return {
          label: isRtl ? 'قيد المراجعة والتأكيد' : 'Pending Confirmation',
          bg: 'bg-[#c9a84c]/15 border-[#c9a84c]/35 text-[#c9a84c]',
          icon: <Sparkles className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#c9a84c]/35 shadow-2xl overflow-hidden my-auto"
        style={{ backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4.5 border-b border-[#c9a84c]/20 bg-gradient-to-r from-[#c9a84c]/10 via-transparent to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c9a84c]/15 border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] shadow-xs">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[var(--text-main)]">
                  {title || t.myOrders}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] font-black border border-[#c9a84c]/30">
                  {allOrders.length}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">
                {isRtl
                  ? 'سجل تفاصيل ومتابعة جميع طلباتك في VOLTIC'
                  : 'Track and view all your VOLTIC orders with full details'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-[var(--text-muted)] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {allOrders.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/25 flex items-center justify-center mx-auto text-[#c9a84c]">
                <ShoppingBag className="w-8 h-8 opacity-75" />
              </div>
              <h4 className="text-base font-bold text-[var(--text-main)]">
                {isRtl ? 'لا توجد طلبات مسجلة بعد' : 'No orders recorded yet'}
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                {isRtl
                  ? 'عند إتمام أي طلب في المتجر، ستظهر تفاصيله الكاملة وصوره ومراحل توصيله هنا مباشرة.'
                  : 'When you place an order, all its item pictures and live delivery details will appear right here.'}
              </p>
            </div>
          ) : (
            allOrders.map((order) => {
              const statusInfo = getStatusBadge(order.status);
              const waText = encodeURIComponent(
                isRtl
                  ? `مرحباً متجر VOLTIC، أود الاستفسار عن حالة طلبي رقم: ${order.id}`
                  : `Hello VOLTIC, I would like to inquire about my order: ${order.id}`
              );

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[#c9a84c]/25 bg-[var(--bg-card-elevated)] p-4 sm:p-5 shadow-lg hover:border-[#c9a84c]/50 transition-all space-y-4"
                >
                  {/* 1. Order Top Bar: ID, Date, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#c9a84c]/15">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-[#c9a84c] tracking-wider font-mono">
                        {order.id}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyOrderId(order.id, e)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
                        title={isRtl ? 'نسخ رقم الطلب' : 'Copy Order ID'}
                      >
                        {copiedId === order.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-[#c9a84c]" />
                        {order.date}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${statusInfo.bg}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* 2. Customer & Shipping Info Card */}
                  {order.customer && (
                    <div className="text-xs text-[var(--text-muted)] p-3 rounded-xl bg-black/30 border border-[#c9a84c]/15 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[var(--text-main)] text-xs sm:text-sm">
                          {order.customer.name}
                        </span>
                        <span className="text-[10px] text-[#c9a84c] flex items-center gap-1 font-bold">
                          <CreditCard className="w-3 h-3" />
                          {isRtl ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#c9a84c] flex-shrink-0" />
                          <a
                            href={`tel:${order.customer.phone}`}
                            className="hover:text-[#c9a84c] transition-colors dir-ltr font-mono"
                          >
                            {order.customer.phone}
                          </a>
                          {order.customer.phone2 && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              / {order.customer.phone2}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <MapPin className="w-3 h-3 text-[#c9a84c] flex-shrink-0" />
                          <span className="truncate">{order.customer.address}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Items List With Complete Pictures & Details (الصور والتفاصيل بالكامل) */}
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-extrabold tracking-wider uppercase text-[#c9a84c]/90">
                      {isRtl ? 'العطور المطلوبة في الشحنة:' : 'Fragrances in this order:'}
                    </h5>

                    <div className="space-y-2">
                      {order.items.map((it, idx) => {
                        const imgSrc = getItemImage(it);
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-black/20 border border-white/5 hover:border-[#c9a84c]/20 transition-all"
                          >
                            {/* Product Picture */}
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#c9a84c]/30 bg-black/60 flex-shrink-0 relative">
                              <img
                                src={imgSrc}
                                alt={it.name}
                                className="w-full h-full object-cover object-center"
                                loading="lazy"
                              />
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <h6 className="text-xs sm:text-sm font-black text-[var(--text-main)] truncate">
                                {it.name}
                              </h6>
                              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-0.5">
                                <span className="font-bold text-[#c9a84c]">
                                  {it.qty} &times; {it.price} {currency}
                                </span>
                                {it.ml && (
                                  <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[10px]">
                                    {it.ml}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="text-end flex-shrink-0">
                              <span className="text-xs sm:text-sm font-black text-[var(--text-main)]">
                                {it.price * it.qty} {currency}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Financial Breakdown & WhatsApp Inquiry Button */}
                  <div className="pt-3 border-t border-[#c9a84c]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <a
                        href={`https://wa.me/201026042468?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/35 text-[#25D366] text-xs font-bold transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'استفسار عبر واتساب' : 'Inquire via WhatsApp'}</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      {order.discountAmount && order.discountAmount > 0 && (
                        <div className="text-start sm:text-end text-[11px] text-emerald-400 font-bold">
                          <span>
                            {isRtl ? 'الخصم: ' : 'Discount: '} -{order.discountAmount} {currency}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)] font-bold">
                          {t.cartTotal}:
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#c9a84c]">
                          {order.total} {currency}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
