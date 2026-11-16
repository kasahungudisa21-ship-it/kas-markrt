import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { ArrowLeft, Bell, Check, CheckCheck, LogOut, Pencil, Trash2 } from 'lucide-react';
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
import { formatPrice } from '../utils/format';
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
  const [activeTab, setActiveTab] = useState<ConnectionsTab>('orders');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [desktopPermission, setDesktopPermission] = useState<BrowserNotifPermission>(() =>
    getBrowserNotificationPermission()
  );

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab);
      onClearRequestedTab?.();
    }
  }, [requestedTab, onClearRequestedTab]);

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
    setBusyId(inquiryId);
    try {
      await replyToInquiry(inquiryId, text);
      setReplyDrafts((prev) => ({ ...prev, [inquiryId]: '' }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 space-y-8 min-h-[70vh]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToMarketplace}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{t.connectionsTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-zinc-600 truncate max-w-[200px]">
                {user.displayName || user.email}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.signOut}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium whitespace-nowrap"
            >
              {t.signInGoogle}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg w-fit max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'orders'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {t.tabOrders} ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'notifications'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {t.tabNotifications}
          {unreadNotifications.length > 0 ? (
            <span className="ml-1 font-mono tabular-nums text-emerald-800 font-semibold">
              ({unreadNotifications.length})
            </span>
          ) : (
            <span className="ml-1 tabular-nums">({notifications.length})</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'listings'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {t.tabMyListings} ({isAdmin ? allListings.length : myListings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'inbox'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {t.tabInbox} ({inquiries.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'saved'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {t.tabSaved} ({savedListings.length})
        </button>
      </div>

      {!user && activeTab !== 'saved' ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center space-y-4">
          <p className="text-sm text-zinc-600">{t.signInToOrder}</p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium"
          >
            {t.signInGoogle}
          </button>
        </div>
      ) : activeTab === 'orders' ? (
        orders.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center space-y-4">
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
                <h2 className="text-base font-semibold text-zinc-900">{t.incomingOrdersTitle}</h2>
                <div className="space-y-4">
                  {incomingOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
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
                          <h3 className="text-sm font-semibold text-zinc-900 truncate">
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
                        <span className="font-mono text-sm font-semibold text-emerald-900 tabular-nums mr-2">
                          {formatPrice(ord.totalAmount, ord.currency, 'total', lang)} (×
                          {ord.quantity})
                        </span>

                        {ord.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyId === ord.id}
                            onClick={async () => {
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'confirmed');
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
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'completed');
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
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'cancelled');
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
                            setBusyId(ord.id);
                            try {
                              await removeOrder(ord.id);
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
                <h2 className="text-base font-semibold text-zinc-900">{t.placedOrdersTitle}</h2>
                <div className="space-y-4">
                  {placedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
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
                          <h3 className="text-sm font-semibold text-zinc-900 truncate">
                            {ord.listingTitle}
                          </h3>
                          <p className="text-xs text-zinc-600">
                            {t.sellerLabel}: {ord.sellerName} · {ord.deliveryAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <span className="font-mono text-sm font-semibold text-emerald-900 tabular-nums">
                          {formatPrice(ord.totalAmount, ord.currency, 'total', lang)} (×
                          {ord.quantity})
                        </span>

                        {ord.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyId === ord.id}
                            onClick={async () => {
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'cancelled');
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
                            setBusyId(ord.id);
                            try {
                              await removeOrder(ord.id);
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
                <h2 className="text-base font-semibold text-zinc-900">
                  {t.allOrdersTitle} ({otherAdminOrders.length})
                </h2>
                <div className="space-y-4">
                  {otherAdminOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
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
                          <h3 className="text-sm font-semibold text-zinc-900 truncate">
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
                        <span className="font-mono text-sm font-semibold text-emerald-900 tabular-nums mr-2">
                          {formatPrice(ord.totalAmount, ord.currency, 'total', lang)} (×
                          {ord.quantity})
                        </span>

                        {ord.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyId === ord.id}
                            onClick={async () => {
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'confirmed');
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
                              setBusyId(ord.id);
                              try {
                                await updateOrderStatus(ord.id, 'completed');
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
                            setBusyId(ord.id);
                            try {
                              await removeOrder(ord.id);
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
      ) : activeTab === 'notifications' ? (
        <div className="space-y-5">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="text-sm font-semibold text-zinc-900">
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
                    setBusyId('mark_all');
                    try {
                      await markAllNotificationsRead(unreadNotifications.map((n) => n.id));
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
            <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center space-y-4">
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
                    <h3 className="text-sm font-semibold text-zinc-900 truncate">
                      {notif.listingTitle}
                    </h3>
                    <p className="text-xs text-zinc-600">
                      {notif.actorName} ·{' '}
                      <span className="font-mono font-semibold text-emerald-900 tabular-nums">
                        {formatPrice(notif.amount, notif.currency, 'total', lang)}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!notif.isRead) {
                          markNotificationRead(notif.id).catch(() => {});
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
                          setBusyId(notif.id);
                          try {
                            await markNotificationRead(notif.id);
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
                        setBusyId(notif.id);
                        try {
                          await deleteNotification(notif.id);
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
      ) : activeTab === 'saved' ? (
        savedListings.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-sm text-zinc-500">
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
      ) : activeTab === 'listings' ? (
        myListings.length === 0 && otherPlatformListings.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center space-y-4">
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
                    className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                        <h3 className="text-sm font-semibold text-zinc-900 truncate">{item.title}</h3>
                        <div className="font-mono text-sm font-semibold text-emerald-900 tabular-nums">
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
                              setBusyId(item.id);
                              try {
                                await updateListingStatus(
                                  item.id,
                                  item.status === 'available' ? 'reserved' : 'available'
                                );
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
                              setBusyId(item.id);
                              try {
                                await updateListingStatus(item.id, 'closed');
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
                            setBusyId(item.id);
                            try {
                              await updateListingStatus(item.id, 'available');
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
                          setBusyId(item.id);
                          try {
                            if (onDeleteListing) {
                              await onDeleteListing(item);
                            } else {
                              await removeListing(item.id);
                            }
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
                <h2 className="text-base font-semibold text-zinc-900">
                  {t.allListingsTitle} ({otherPlatformListings.length})
                </h2>
                <div className="space-y-4">
                  {otherPlatformListings.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                          <h3 className="text-sm font-semibold text-zinc-900 truncate">{item.title}</h3>
                          <div className="font-mono text-sm font-semibold text-emerald-900 tabular-nums">
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
                              setBusyId(item.id);
                              try {
                                await updateListingStatus(item.id, 'closed');
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
                            setBusyId(item.id);
                            try {
                              if (onDeleteListing) {
                                await onDeleteListing(item);
                              } else {
                                await removeListing(item.id);
                              }
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
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-sm text-zinc-500">
          {t.emptyInbox}
        </div>
      ) : (
        <div className="space-y-8">
          {receivedInquiries.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-zinc-900">{t.receivedInquiries}</h2>
              <div className="space-y-4">
                {receivedInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                      <span>
                        {inq.senderName} · {t.phoneHiddenLabel}
                      </span>
                      <span className="font-medium text-zinc-700 capitalize">{inq.status}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900">{inq.listingTitle}</h3>
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
                            setBusyId(inq.id);
                            try {
                              await closeInquiryThread(inq.id);
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
              <h2 className="text-base font-semibold text-zinc-900">{t.sentInquiries}</h2>
              <div className="space-y-4">
                {sentInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                      <span>
                        {t.sellerLabel}: {inq.sellerName}
                      </span>
                      <span className="font-medium text-zinc-700 capitalize">{inq.status}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900">{inq.listingTitle}</h3>
                    <p className="text-sm text-zinc-700">{inq.message}</p>
                    {inq.sellerReply && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
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
