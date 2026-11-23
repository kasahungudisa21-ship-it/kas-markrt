import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { ArrowLeft, Bell, Check, CheckCheck, LogOut, Pencil, Trash2, X } from 'lucide-react';
import {
  closeInquiryThread,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  removeListing,
  removeOrder,
  replyToInquiry,
  updateListingStatus,
  updateOrderStatus,
} from '../firebase';
import {
  getCategoryLabel,
  getNotificationEventTitle,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getStatusLabel,
  getTransactionLabel,
  translations,
} from '../i18n';
import { AppNotification, Inquiry, Language, Listing, Order } from '../types';
import { formatFirestoreUserError, formatPrice } from '../utils/format';
import {
  BrowserNotifPermission,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from '../utils/notifications';
import { ListingCard } from './ListingCard';
import { ResilientImage } from './ResilientImage';

export type ConnectionsTab = 'orders' | 'notifications' | 'listings' | 'inbox' | 'saved';

interface ConnectionsViewProps {
  lang: Language;
  user: User | null;
  isAdmin?: boolean;
  allListings: Listing[];
  savedIds: Set<string>;
  inquiries: Inquiry[];
  orders: Order[];
  notifications: AppNotification[];
  requestedTab?: ConnectionsTab | null;
  onClearRequestedTab?: () => void;
  onBack: () => void;
  onSelectListing: (listing: Listing, initialTab?: 'order' | 'message') => void;
  onToggleSave: (listing: Listing) => void;
  onEditListing: (listing: Listing) => void;
  onDeleteListing?: (listing: Listing) => Promise<void> | void;
  onOpenSellPage: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function ConnectionsView({
  lang,
  user,
  isAdmin = false,
  allListings,
  savedIds,
  inquiries,
  orders,
  notifications,
  requestedTab = null,
  onClearRequestedTab,
  onBack,
  onSelectListing,
  onToggleSave,
  onEditListing,
  onDeleteListing,
  onOpenSellPage,
  onSignIn,
  onSignOut,
}: ConnectionsViewProps) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<ConnectionsTab>(isAdmin ? 'orders' : 'listings');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [desktopPermission, setDesktopPermission] = useState<BrowserNotifPermission>(() =>
    getBrowserNotificationPermission()
  );

  useEffect(() => {
    if (requestedTab) {
      if (!isAdmin && (requestedTab === 'orders' || requestedTab === 'notifications')) {
        setActiveTab('listings');
      } else {
        setActiveTab(requestedTab);
      }
      onClearRequestedTab?.();
    }
  }, [requestedTab, isAdmin, onClearRequestedTab]);

  const effectiveTab: ConnectionsTab =
    !isAdmin && (activeTab === 'orders' || activeTab === 'notifications')
      ? 'listings'
      : activeTab;

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const formatNotifTime = (ms: number) => {
    if (!ms) return '';
    return new Intl.DateTimeFormat(lang === 'am' ? 'am-ET' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  };

  const savedListings = allListings.filter((l) => savedIds.has(l.id));
  const myListings = user ? allListings.filter((l) => !l.isShowcase && l.ownerId === user.uid) : [];
  const otherPlatformListings = isAdmin
    ? allListings.filter((l) => !user || l.isShowcase || l.ownerId !== user.uid)
    : [];
  const incomingOrders = user ? orders.filter((o) => o.sellerId === user.uid) : [];
  const placedOrders = user ? orders.filter((o) => o.buyerId === user.uid) : [];
  const otherAdminOrders =
    user && isAdmin
      ? orders.filter((o) => o.sellerId !== user.uid && o.buyerId !== user.uid)
      : [];
  const receivedInquiries = user ? inquiries.filter((inq) => inq.sellerId === user.uid) : [];
  const sentInquiries = user ? inquiries.filter((inq) => inq.senderId === user.uid) : [];

  const handleReplySubmit = async (inquiryId: string) => {
    const text = (replyDrafts[inquiryId] || '').trim();
    if (!text) return;
    setActionError('');
    setBusyId(inquiryId);
    try {
      await replyToInquiry(inquiryId, text);
      setReplyDrafts((prev) => ({ ...prev, [inquiryId]: '' }));
    } catch (err) {
      setActionError(formatFirestoreUserError(err, lang));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-7 min-h-[70vh]">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#102632] via-[#103437] to-[#0C352A] border border-[#225453] p-6 sm:p-8 text-[#FCF9F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_14px_34px_-16px_rgba(12,46,38,0.35)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-12 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl"
        />
        <div className="relative space-y-1.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToMarketplace}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FCF8EE]">
            {isAdmin ? t.connectionsTitle : t.connectionsUserTitle}
          </h1>
        </div>

        <div className="relative flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs font-medium text-emerald-100 truncate max-w-[200px]">
                {user.displayName || user.email}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-red-900/70 hover:text-red-100 hover:border-red-400/50 text-xs font-medium text-emerald-100 transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.signOut}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0B2620] text-xs font-bold whitespace-nowrap transition-colors"
            >
              {t.signInGoogle}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-1.5 bg-[#EDE9E0] border border-[#DDD7CB] rounded-2xl w-fit max-w-full overflow-x-auto shadow-xs">
        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                effectiveTab === 'orders'
                  ? 'bg-[#0F4C3A] text-white shadow-sm'
                  : 'text-[#2D4039] hover:text-[#0F3D32] hover:bg-white/70'
              }`}
            >
              {t.tabOrders} ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                effectiveTab === 'notifications'
                  ? 'bg-[#B45309] text-white shadow-sm'
                  : 'text-[#2D4039] hover:text-[#5C2D0C] hover:bg-white/70'
              }`}
            >
              {t.tabNotifications}
              {unreadNotifications.length > 0 ? (
                <span
                  className={`ml-1 font-mono tabular-nums font-bold ${
                    effectiveTab === 'notifications' ? 'text-amber-100' : 'text-[#9A3412]'
                  }`}
                >
                  ({unreadNotifications.length})
                </span>
              ) : (
                <span className="ml-1 tabular-nums">({notifications.length})</span>
              )}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
            effectiveTab === 'listings'
              ? 'bg-[#1E40AF] text-white shadow-sm'
              : 'text-[#2D4039] hover:text-[#142F66] hover:bg-white/70'
          }`}
        >
          {t.tabMyListings} ({isAdmin ? allListings.length : myListings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
            effectiveTab === 'inbox'
              ? 'bg-[#0F5E48] text-white shadow-sm'
              : 'text-[#2D4039] hover:text-[#0F3D32] hover:bg-white/70'
          }`}
        >
          {t.tabInbox} ({inquiries.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
            effectiveTab === 'saved'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-[#2D4039] hover:text-[#591432] hover:bg-white/70'
          }`}
        >
          {t.tabSaved} ({savedListings.length})
        </button>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center justify-between gap-3">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError('')}
            aria-label="Dismiss error"
            className="p-1 rounded-lg hover:bg-red-100 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!user && effectiveTab !== 'saved' ? (
        <div className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-10 text-center space-y-4">
          <p className="text-sm text-[#394D46]">{t.signInToConnect}</p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-5 py-2.5 rounded-lg bg-[#0F4C3A] hover:bg-[#0B3B2D] text-white text-sm font-semibold"
          >
            {t.signInGoogle}
          </button>
        </div>
      ) : effectiveTab === 'orders' && isAdmin ? (
        orders.length === 0 ? (
          <div className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-10 text-center space-y-4">
            <p className="text-sm text-zinc-600">{t.emptyOrders}</p>
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium"
            >
              {t.navExplore}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {incomingOrders.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-[#102620]">{t.incomingOrdersTitle}</h2>
                <div className="space-y-4">
                  {incomingOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-20 h-16 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                          <ResilientImage
                            src={ord.listingImage}
                            alt={ord.listingTitle}
                            category={ord.listingCategory}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs text-zinc-500">
                            <span className="font-mono font-medium text-zinc-700">
                              {ord.orderNumber}
                            </span>{' '}
                            · {getOrderStatusLabel(ord.status, lang)} ·{' '}
                            {getPaymentMethodLabel(ord.paymentMethod, lang)}
                          </div>
                          <h3 className="text-sm font-semibold text-[#102620] truncate">
                            {ord.listingTitle}
                          </h3>
                          <p className="text-xs text-zinc-600">
                            {ord.buyerName} · {t.phoneHiddenLabel} · {ord.deliveryAddress}
                          </p>
                          {ord.notes && (
                            <p className="text-xs text-zinc-500 italic">{ord.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <span className="font-mono text-sm font-semibold text-[#9A3412] tabular-nums mr-2">
                          {formatPrice(ord.totalAmount, ord.currency, 'total', lang)} (×
                          {ord.quantity})
                        </span>

                        {ord.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyId === ord.id}
                            onClick={async () => {
                              setActionError('');
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'confirmed');
                              } catch (err) {
                                setActionError(formatFirestoreUserError(err, lang));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium"
                          >
                            {t.confirmOrderAction}
                          </button>
                        )}

                        {ord.status === 'confirmed' && (
                          <button
                            type="button"
                            disabled={busyId === ord.id}
                            onClick={async () => {
                              setActionError('');
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'completed');
                              } catch (err) {
                                setActionError(formatFirestoreUserError(err, lang));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium"
                          >
                            {t.completeOrderAction}
                          </button>
                        )}

                        {(ord.status === 'pending' || ord.status === 'confirmed') && (
                          <button
                            type="button"
                            disabled={busyId === ord.id}
                            onClick={async () => {
                              setActionError('');
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'cancelled');
                              } catch (err) {
                                setActionError(formatFirestoreUserError(err, lang));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="px-3.5 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            {t.cancelOrderAction}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={busyId === ord.id}
                          onClick={async () => {
                            setActionError('');
                            setBusyId(ord.id);
                            try {
                              await removeOrder(ord.id);
                            } catch (err) {
                              setActionError(formatFirestoreUserError(err, lang));
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="px-3.5 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.deleteOrderAction}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {placedOrders.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-[#102620]">{t.placedOrdersTitle}</h2>
                <div className="space-y-4">
                  {placedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-20 h-16 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                          <ResilientImage
                            src={ord.listingImage}
                            alt={ord.listingTitle}
                            category={ord.listingCategory}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs text-zinc-500">
                            <span className="font-mono font-medium text-zinc-700">
                              {ord.orderNumber}
                            </span>{' '}
                            ·{' '}
                            <span
                              className={`font-medium ${
                                ord.status === 'confirmed' || ord.status === 'completed'
                                  ? 'text-emerald-800'
                                  : ord.status === 'cancelled'
                                  ? 'text-red-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {getOrderStatusLabel(ord.status, lang)}
                            </span>{' '}
                            · {getPaymentMethodLabel(ord.paymentMethod, lang)}
                          </div>
                          <h3 className="text-sm font-semibold text-[#102620] truncate">
                            {ord.listingTitle}
                          </h3>
                          <p className="text-xs text-zinc-600">
                            {t.sellerLabel}: {ord.sellerName} · {ord.deliveryAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <span className="font-mono text-sm font-semibold text-[#9A3412] tabular-nums">
                          {formatPrice(ord.totalAmount, ord.currency, 'total', lang)} (×
                          {ord.quantity})
                        </span>

                        {ord.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyId === ord.id}
                            onClick={async () => {
                              setActionError('');
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'cancelled');
                              } catch (err) {
                                setActionError(formatFirestoreUserError(err, lang));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="px-3.5 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            {t.cancelOrderAction}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={busyId === ord.id}
                          onClick={async () => {
                            setActionError('');
                            setBusyId(ord.id);
                            try {
                              await removeOrder(ord.id);
                            } catch (err) {
                              setActionError(formatFirestoreUserError(err, lang));
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="px-3.5 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.deleteOrderAction}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {otherAdminOrders.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-[#102620]">
                  {t.allOrdersTitle} ({otherAdminOrders.length})
                </h2>
                <div className="space-y-4">
                  {otherAdminOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-20 h-16 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                          <ResilientImage
                            src={ord.listingImage}
                            alt={ord.listingTitle}
                            category={ord.listingCategory}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs text-zinc-500">
                            <span className="font-mono font-medium text-zinc-700">
                              {ord.orderNumber}
                            </span>{' '}
                            · {getOrderStatusLabel(ord.status, lang)} ·{' '}
                            {getPaymentMethodLabel(ord.paymentMethod, lang)}
                          </div>
                          <h3 className="text-sm font-semibold text-[#102620] truncate">
                            {ord.listingTitle}
                          </h3>
                          <p className="text-xs text-zinc-600">
                            {ord.buyerName} → {ord.sellerName} · {ord.deliveryAddress}
                          </p>
                          {ord.notes && (
                            <p className="text-xs text-zinc-500 italic">{ord.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <span className="font-mono text-sm font-semibold text-[#9A3412] tabular-nums mr-2">
                          {formatPrice(ord.totalAmount, ord.currency, 'total', lang)} (×
                          {ord.quantity})
                        </span>

                        {ord.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyId === ord.id}
                            onClick={async () => {
                              setActionError('');
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'confirmed');
                              } catch (err) {
                                setActionError(formatFirestoreUserError(err, lang));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium"
                          >
                            {t.confirmOrderAction}
                          </button>
                        )}

                        {ord.status === 'confirmed' && (
                          <button
                            type="button"
                            disabled={busyId === ord.id}
                            onClick={async () => {
                              setActionError('');
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'completed');
                              } catch (err) {
                                setActionError(formatFirestoreUserError(err, lang));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium"
                          >
                            {t.completeOrderAction}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={busyId === ord.id}
                          onClick={async () => {
                            setActionError('');
                            setBusyId(ord.id);
                            try {
                              await removeOrder(ord.id);
                            } catch (err) {
                              setActionError(formatFirestoreUserError(err, lang));
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="px-3.5 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.deleteOrderAction}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : effectiveTab === 'notifications' && isAdmin ? (
        <div className="space-y-5">
          <div className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="text-sm font-semibold text-[#102620]">
                {t.tabNotifications}
                {unreadNotifications.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-emerald-800 tabular-nums">
                    ({unreadNotifications.length} {t.notifUnreadLabel})
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {desktopPermission !== 'unsupported' && (
                <button
                  type="button"
                  disabled={desktopPermission === 'granted' || desktopPermission === 'denied'}
                  onClick={async () => {
                    const perm = await requestBrowserNotificationPermission();
                    setDesktopPermission(perm);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                    desktopPermission === 'granted'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : desktopPermission === 'denied'
                      ? 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>
                    {desktopPermission === 'granted'
                      ? t.notifDesktopEnabled
                      : desktopPermission === 'denied'
                      ? t.notifDesktopBlocked
                      : t.notifEnableDesktop}
                  </span>
                </button>
              )}

              {unreadNotifications.length > 0 && (
                <button
                  type="button"
                  disabled={busyId === 'mark_all'}
                  onClick={async () => {
                    setActionError('');
                    setBusyId('mark_all');
                    try {
                      await markAllNotificationsRead(unreadNotifications.map((n) => n.id));
                    } catch (err) {
                      setActionError(formatFirestoreUserError(err, lang));
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium whitespace-nowrap"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{t.notifMarkAllRead}</span>
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-10 text-center space-y-4">
              <p className="text-sm text-zinc-600">{t.notifEmpty}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`rounded-xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    notif.isRead
                      ? 'bg-white border-zinc-200'
                      : 'bg-emerald-50/40 border-emerald-300'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-mono font-medium text-zinc-800">
                        {notif.orderNumber}
                      </span>
                      <span>·</span>
                      <span
                        className={
                          notif.isRead
                            ? 'text-zinc-600 font-medium'
                            : 'text-emerald-800 font-semibold'
                        }
                      >
                        {getNotificationEventTitle(notif.eventType, lang)}
                      </span>
                      {notif.createdAtMs > 0 && (
                        <>
                          <span>·</span>
                          <span className="tabular-nums">{formatNotifTime(notif.createdAtMs)}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-[#102620] truncate">
                      {notif.listingTitle}
                    </h3>
                    <p className="text-xs text-zinc-600">
                      {notif.actorName} ·{' '}
                      <span className="font-mono font-semibold text-[#9A3412] tabular-nums">
                        {formatPrice(notif.amount, notif.currency, 'total', lang)}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!notif.isRead) {
                          markNotificationRead(notif.id).catch((err) => {
                            setActionError(formatFirestoreUserError(err, lang));
                          });
                        }
                        setActiveTab('orders');
                      }}
                      className="px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium whitespace-nowrap"
                    >
                      {t.notifViewOrder}
                    </button>

                    {!notif.isRead && (
                      <button
                        type="button"
                        disabled={busyId === notif.id}
                        onClick={async () => {
                          setActionError('');
                          setBusyId(notif.id);
                          try {
                            await markNotificationRead(notif.id);
                          } catch (err) {
                            setActionError(formatFirestoreUserError(err, lang));
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.notifMarkRead}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busyId === notif.id}
                      onClick={async () => {
                        setActionError('');
                        setBusyId(notif.id);
                        try {
                          await deleteNotification(notif.id);
                        } catch (err) {
                          setActionError(formatFirestoreUserError(err, lang));
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-red-50 hover:border-red-200 text-xs font-medium text-zinc-600 hover:text-red-700 whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.notifClearRead}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : effectiveTab === 'saved' ? (
        savedListings.length === 0 ? (
          <div className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-10 text-center text-sm text-zinc-500">
            {t.emptySaved}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedListings.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                lang={lang}
                isSaved={true}
                onSelect={onSelectListing}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        )
      ) : effectiveTab === 'listings' ? (
        myListings.length === 0 && otherPlatformListings.length === 0 ? (
          <div className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-10 text-center space-y-4">
            <p className="text-sm text-zinc-600">{t.emptyMyListings}</p>
            <button
              type="button"
              onClick={onOpenSellPage}
              className="px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium"
            >
              {t.postListing}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {myListings.length > 0 && (
              <div className="space-y-4">
                {myListings.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-24 h-18 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                        <ResilientImage
                          src={item.imageUrl}
                          alt={item.title}
                          category={item.category}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="text-xs text-zinc-500">
                          {getCategoryLabel(item.category, lang)} ·{' '}
                          {getTransactionLabel(item.transactionType, lang)} ·{' '}
                          {getStatusLabel(item.status, lang)}
                        </div>
                        <h3 className="text-sm font-semibold text-[#102620] truncate">{item.title}</h3>
                        <div className="font-mono text-sm font-semibold text-[#9A3412] tabular-nums">
                          {formatPrice(item.price, item.currency, item.pricePeriod, lang)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {item.status !== 'closed' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditListing(item)}
                            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 inline-flex items-center gap-1.5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>{t.editListing}</span>
                          </button>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={async () => {
                              setActionError('');
                              setBusyId(item.id);
                              try {
                                await updateListingStatus(
                                  item.id,
                                  item.status === 'available' ? 'reserved' : 'available'
                                );
                              } catch (err) {
                                setActionError(formatFirestoreUserError(err, lang));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            {item.status === 'available' ? t.markReserved : t.markAvailable}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={async () => {
                              setActionError('');
                              setBusyId(item.id);
                              try {
                                await updateListingStatus(item.id, 'closed');
                              } catch (err) {
                                setActionError(formatFirestoreUserError(err, lang));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            {t.markClosed}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={async () => {
                            setActionError('');
                            setBusyId(item.id);
                            try {
                              await updateListingStatus(item.id, 'available');
                            } catch (err) {
                              setActionError(formatFirestoreUserError(err, lang));
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          {t.markAvailable}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={async () => {
                          setActionError('');
                          setBusyId(item.id);
                          try {
                            if (onDeleteListing) {
                              await onDeleteListing(item);
                            } else {
                              await removeListing(item.id);
                            }
                          } catch (err) {
                            setActionError(formatFirestoreUserError(err, lang));
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.deleteListing}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {otherPlatformListings.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-[#102620]">
                  {t.allListingsTitle} ({otherPlatformListings.length})
                </h2>
                <div className="space-y-4">
                  {otherPlatformListings.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-24 h-18 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                          <ResilientImage
                            src={item.imageUrl}
                            alt={item.title}
                            category={item.category}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="text-xs text-zinc-500">
                            {getCategoryLabel(item.category, lang)} ·{' '}
                            {getTransactionLabel(item.transactionType, lang)} ·{' '}
                            {getStatusLabel(item.status, lang)} · {item.sellerName}
                          </div>
                          <h3 className="text-sm font-semibold text-[#102620] truncate">{item.title}</h3>
                          <div className="font-mono text-sm font-semibold text-[#9A3412] tabular-nums">
                            {formatPrice(item.price, item.currency, item.pricePeriod, lang)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {!item.isShowcase && item.status !== 'closed' && (
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={async () => {
                              setActionError('');
                              setBusyId(item.id);
                              try {
                                await updateListingStatus(item.id, 'closed');
                              } catch (err) {
                                setActionError(formatFirestoreUserError(err, lang));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            {t.markClosed}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={async () => {
                            setActionError('');
                            setBusyId(item.id);
                            try {
                              if (onDeleteListing) {
                                await onDeleteListing(item);
                              } else {
                                await removeListing(item.id);
                              }
                            } catch (err) {
                              setActionError(formatFirestoreUserError(err, lang));
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.deleteListing}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : inquiries.length === 0 ? (
        <div className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-10 text-center text-sm text-zinc-500">
          {t.emptyInbox}
        </div>
      ) : (
        <div className="space-y-8">
          {receivedInquiries.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#102620]">{t.receivedInquiries}</h2>
              <div className="space-y-4">
                {receivedInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                      <span>
                        {inq.senderName} · {t.phoneHiddenLabel}
                      </span>
                      <span className="font-medium text-zinc-700 capitalize">{inq.status}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#102620]">{inq.listingTitle}</h3>
                    <p className="text-sm text-zinc-700">{inq.message}</p>

                    {inq.sellerReply && (
                      <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
                        {inq.sellerReply}
                      </div>
                    )}

                    {inq.status !== 'closed' && (
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          maxLength={1000}
                          placeholder={t.replyPlaceholder}
                          value={replyDrafts[inq.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [inq.id]: e.target.value }))
                          }
                          className="flex-1 h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                        />
                        <button
                          type="button"
                          disabled={busyId === inq.id}
                          onClick={() => handleReplySubmit(inq.id)}
                          className="px-4 h-10 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium whitespace-nowrap"
                        >
                          {t.sendReply}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === inq.id}
                          onClick={async () => {
                            setActionError('');
                            setBusyId(inq.id);
                            try {
                              await closeInquiryThread(inq.id);
                            } catch (err) {
                              setActionError(formatFirestoreUserError(err, lang));
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="px-4 h-10 rounded-lg border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-50 whitespace-nowrap"
                        >
                          {t.closeInquiry}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {sentInquiries.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#102620]">{t.sentInquiries}</h2>
              <div className="space-y-4">
                {sentInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-white border border-[#E5E0D6] rounded-2xl shadow-[0_4px_20px_-12px_rgba(12,46,38,0.08)] p-5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                      <span>
                        {t.sellerLabel}: {inq.sellerName}
                      </span>
                      <span className="font-medium text-zinc-700 capitalize">{inq.status}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#102620]">{inq.listingTitle}</h3>
                    <p className="text-sm text-zinc-700">{inq.message}</p>
                    {inq.sellerReply && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#9A3412]">
                        {inq.sellerReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
