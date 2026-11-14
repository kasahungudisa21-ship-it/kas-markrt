export type ListingCategory = 'apartment' | 'house' | 'land' | 'vehicle' | 'goods';

export type TransactionType = 'sale' | 'rent';

export type CurrencyCode = 'ETB' | 'USD';

export type PricePeriod = 'total' | 'monthly' | 'yearly';

export type ListingStatus = 'available' | 'reserved' | 'closed';

export type InquiryStatus = 'open' | 'replied' | 'closed';

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type BuyerRequestStatus = 'active' | 'fulfilled' | 'closed';

export type PaymentMethod =
  | 'cash_on_delivery'
  | 'bank_transfer'
  | 'telebirr'
  | 'inspection_escrow';

export type Language = 'en' | 'am';

export type RoomClass = '1_class' | '2_class' | '3_plus';

export type TenantPreference = 'late' | 'bale_tedar' | 'any';

export interface ListingSpecs {
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  titleDeed?: string;
  vehicleYear?: number;
  mileageKm?: number;
  transmission?: string;
  fuelType?: string;
  itemCondition?: string;
  roomClass?: RoomClass;
  tenantPreference?: TenantPreference;
}

export interface ListingPhoto {
  slotIndex: number;
  angleLabel: string;
  imageDataUrl: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  sellerName: string;
  category: ListingCategory;
  transactionType: TransactionType;
  title: string;
  description: string;
  descriptionVoiceUrl?: string;
  descriptionVoiceDurationSec?: number;
  price: number;
  currency: CurrencyCode;
  pricePeriod: PricePeriod;
  neighborhood: string;
  city: string;
  imageUrl: string;
  photoCount?: number;
  photos?: ListingPhoto[];
  status: ListingStatus;
  specs: ListingSpecs;
  createdAtMs: number;
  updatedAtMs: number;
  isShowcase?: boolean;
}

export interface Inquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  senderId: string;
  senderName: string;
  senderContact: string;
  message: string;
  status: InquiryStatus;
  sellerReply: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  listingId: string;
  listingTitle: string;
  listingCategory: ListingCategory;
  transactionType: TransactionType;
  listingImage: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: CurrencyCode;
  notes: string;
  status: OrderStatus;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface BuyerRequest {
  id: string;
  buyerId: string;
  buyerName: string;
  transactionType: TransactionType;
  category: ListingCategory;
  title: string;
  maxBudget: number;
  currency: CurrencyCode;
  preferredNeighborhood: string;
  notes: string;
  roomClass?: RoomClass;
  tenantPreference?: TenantPreference;
  status: BuyerRequestStatus;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface SavedItem {
  userId: string;
  listingId: string;
  createdAtMs: number;
}

export interface UserPrivateProfile {
  uid: string;
  email: string;
  phone?: string;
}

export type ContactRole = 'seller' | 'buyer';

export type ContactActionType = 'listing_post' | 'order' | 'inquiry' | 'buyer_request';

export interface ContactEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: ContactRole;
  actionType: ContactActionType;
  phone: string;
  listingId: string;
  listingTitle: string;
  neighborhood: string;
  createdAtMs: number;
}

export type NotificationEventType =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_completed'
  | 'order_cancelled';

export interface AppNotification {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  orderId: string;
  orderNumber: string;
  listingId: string;
  listingTitle: string;
  eventType: NotificationEventType;
  amount: number;
  currency: CurrencyCode;
  isRead: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}
