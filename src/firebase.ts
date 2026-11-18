import { initializeApp } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  AppNotification,
  BuyerRequest,
  BuyerRequestStatus,
  ContactActionType,
  ContactEntry,
  ContactRole,
  Inquiry,
  Listing,
  ListingPhoto,
  ListingSpecs,
  ListingStatus,
  NotificationEventType,
  Order,
  OrderStatus,
  PaymentMethod,
  RoomClass,
  SavedItem,
  TenantPreference,
} from './types';
import {
  assembleChunksToBlobUrl,
  MAX_VIDEO_CHUNKS,
  parseDataUrl,
  splitBase64IntoChunks,
} from './utils/videoProcessing';

export const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || 'kasahungudisa12@gmail.com'
)
  .trim()
  .toLowerCase();

export function isAdminUser(user: User | null): boolean {
  return Boolean(user && user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL);
}

const hasEnvFirebaseConfig = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

const activeFirebaseConfig = hasEnvFirebaseConfig
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain:
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
        `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
        `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    }
  : firebaseConfig;

const configWithOptionalDb = firebaseConfig as { firestoreDatabaseId?: string };

const activeDatabaseId = hasEnvFirebaseConfig
  ? (import.meta.env.VITE_FIREBASE_DATABASE_ID || '').trim()
  : (configWithOptionalDb.firestoreDatabaseId || '').trim();

const app = initializeApp(activeFirebaseConfig);
export const db = activeDatabaseId ? getFirestore(app, activeDatabaseId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function consumeRedirectSignInResult(): Promise<void> {
  await getRedirectResult(auth);
}

export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function signOutAccount() {
  return signOut(auth);
}

function toMillis(val: unknown): number {
  if (val instanceof Timestamp) {
    return val.toMillis();
  }
  return Date.now();
}

export function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
}

export function generateValidId(prefix: string): string {
  const cleanPrefix = sanitizeId(prefix) || 'item';
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${cleanPrefix}_${ts}_${rand}`.slice(0, 128);
}

export async function syncUserProfile(user: User): Promise<void> {
  if (!user.uid || !user.email || !user.emailVerified) return;
  const uid = sanitizeId(user.uid);
  const publicPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;
  const displayName =
    (user.displayName || user.email.split('@')[0] || 'Seller').trim().slice(0, 80) || 'Seller';

  try {
    const publicRef = doc(db, 'users', uid);
    let snap = null;
    try {
      snap = await getDocFromServer(publicRef);
    } catch {
      try {
        snap = await getDoc(publicRef);
      } catch {
        snap = null;
      }
    }

    if (snap && snap.exists()) {
      await updateDoc(publicRef, {
        displayName,
        photoUrl: (user.photoURL || '').slice(0, 500),
        updatedAt: serverTimestamp(),
      });
    } else if (snap && !snap.exists()) {
      await setDoc(publicRef, {
        uid,
        displayName,
        photoUrl: (user.photoURL || '').slice(0, 500),
        city: 'Addis Ababa',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  try {
    const privateRef = doc(db, 'users', uid, 'private', 'info');
    await setDoc(
      privateRef,
      {
        uid,
        email: user.email.trim().slice(0, 150) || 'user@example.com',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }
}

export async function getMySavedPhone(uid: string): Promise<string> {
  const cleanUid = sanitizeId(uid);
  const path = `users/${cleanUid}/private/info`;
  try {
    const snap = await getDocFromServer(doc(db, 'users', cleanUid, 'private', 'info'));
    if (snap.exists()) {
      const phone = snap.data()?.phone;
      return typeof phone === 'string' ? phone : '';
    }
    return '';
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

function buildPrivateContactPayload(
  user: User,
  params: {
    role: ContactRole;
    actionType: ContactActionType;
    phone: string;
    listingId: string;
    listingTitle: string;
    neighborhood: string;
  }
) {
  const uid = sanitizeId(user.uid);
  const userName =
    (user.displayName || user.email?.split('@')[0] || 'User').trim().slice(0, 80) || 'User';
  const userEmail = (user.email || 'user@example.com').trim().slice(0, 150) || 'user@example.com';
  return {
    userId: uid,
    userName,
    userEmail,
    role: params.role,
    actionType: params.actionType,
    phone: params.phone.trim().slice(0, 30),
    listingId: params.listingId ? sanitizeId(params.listingId) : '',
    listingTitle: params.listingTitle.trim().slice(0, 120),
    neighborhood: params.neighborhood.trim().slice(0, 80),
    createdAt: serverTimestamp(),
  };
}

export function subscribeListings(
  onData: (listings: Listing[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'listings';
  const q = query(collection(db, path), where('status', 'in', ['available', 'reserved', 'closed']));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Listing[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: String(data.ownerId || ''),
          sellerName: String(data.sellerName || ''),
          category: data.category,
          transactionType: data.transactionType,
          title: String(data.title || ''),
          description: String(data.description || ''),
          descriptionVoiceUrl:
            typeof data.descriptionVoiceUrl === 'string' && data.descriptionVoiceUrl.length > 0
              ? data.descriptionVoiceUrl
              : undefined,
          descriptionVoiceDurationSec:
            typeof data.descriptionVoiceDurationSec === 'number' &&
            data.descriptionVoiceDurationSec > 0
              ? Math.round(data.descriptionVoiceDurationSec)
              : undefined,
          price: Number(data.price || 0),
          currency: data.currency === 'USD' ? 'USD' : 'ETB',
          pricePeriod: data.pricePeriod || 'total',
          neighborhood: String(data.neighborhood || ''),
          city: String(data.city || ''),
          imageUrl: String(data.imageUrl || ''),
          photoCount: Number(data.photoCount || 1),
          videoMimeType:
            typeof data.videoMimeType === 'string' && data.videoMimeType.length > 0
              ? data.videoMimeType
              : undefined,
          videoDurationSec:
            typeof data.videoDurationSec === 'number' && data.videoDurationSec > 0
              ? Math.round(data.videoDurationSec)
              : undefined,
          videoChunkCount:
            typeof data.videoChunkCount === 'number' && data.videoChunkCount > 0
              ? Math.round(data.videoChunkCount)
              : undefined,
          status: data.status || 'available',
          specs: (data.specs as ListingSpecs) || {},
          createdAtMs: toMillis(data.createdAt),
          updatedAtMs: toMillis(data.updatedAt),
        };
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeSavedItems(
  uid: string,
  onData: (saved: SavedItem[]) => void,
  onError: (err: Error) => void
): () => void {
  const cleanUid = sanitizeId(uid);
  const path = `users/${cleanUid}/saved`;
  const q = query(collection(db, 'users', cleanUid, 'saved'), where('userId', '==', cleanUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          userId: String(data.userId || cleanUid),
          listingId: String(data.listingId || d.id),
          createdAtMs: toMillis(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeUserInquiries(
  uid: string,
  onData: (inquiries: Inquiry[]) => void,
  onError: (err: Error) => void
): () => void {
  const cleanUid = sanitizeId(uid);
  const path = 'inquiries';
  const sentQuery = query(collection(db, path), where('senderId', '==', cleanUid));
  const receivedQuery = query(collection(db, path), where('sellerId', '==', cleanUid));

  const mapById = new Map<string, Inquiry>();

  const emitMerged = () => {
    const merged = Array.from(mapById.values()).sort((a, b) => b.createdAtMs - a.createdAtMs);
    onData(merged);
  };

  const mapDoc = (d: { id: string; data: () => Record<string, unknown> }): Inquiry => {
    const data = d.data();
    return {
      id: d.id,
      listingId: String(data.listingId || ''),
      listingTitle: String(data.listingTitle || ''),
      sellerId: String(data.sellerId || ''),
      sellerName: String(data.sellerName || ''),
      senderId: String(data.senderId || ''),
      senderName: String(data.senderName || ''),
      senderContact: String(data.senderContact || ''),
      message: String(data.message || ''),
      status: (data.status as Inquiry['status']) || 'open',
      sellerReply: String(data.sellerReply || ''),
      createdAtMs: toMillis(data.createdAt),
      updatedAtMs: toMillis(data.updatedAt),
    };
  };

  const unsubSent = onSnapshot(
    sentQuery,
    (snapshot) => {
      for (const [key, val] of mapById.entries()) {
        if (val.senderId === cleanUid && val.sellerId !== cleanUid) {
          mapById.delete(key);
        }
      }
      snapshot.docs.forEach((d) => mapById.set(d.id, mapDoc(d)));
      emitMerged();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubReceived = onSnapshot(
    receivedQuery,
    (snapshot) => {
      for (const [key, val] of mapById.entries()) {
        if (val.sellerId === cleanUid) {
          mapById.delete(key);
        }
      }
      snapshot.docs.forEach((d) => mapById.set(d.id, mapDoc(d)));
      emitMerged();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  return () => {
    unsubSent();
    unsubReceived();
  };
}

function buildCleanSpecs(specs: ListingSpecs): ListingSpecs {
  const clean: ListingSpecs = {};
  if (typeof specs.bedrooms === 'number' && Number.isFinite(specs.bedrooms)) {
    clean.bedrooms = Math.min(30, Math.max(0, Math.round(specs.bedrooms)));
  }
  if (typeof specs.bathrooms === 'number' && Number.isFinite(specs.bathrooms)) {
    clean.bathrooms = Math.min(30, Math.max(0, Math.round(specs.bathrooms)));
  }
  if (typeof specs.areaSqm === 'number' && Number.isFinite(specs.areaSqm) && specs.areaSqm >= 0) {
    clean.areaSqm = Math.min(1000000, Math.max(0, Number(specs.areaSqm)));
  }
  if (specs.titleDeed && specs.titleDeed.trim()) {
    clean.titleDeed = specs.titleDeed.trim().slice(0, 60);
  }
  if (specs.vehicleType && specs.vehicleType.trim()) {
    clean.vehicleType = specs.vehicleType.trim().slice(0, 60);
  }
  if (specs.vehicleModel && specs.vehicleModel.trim()) {
    clean.vehicleModel = specs.vehicleModel.trim().slice(0, 60);
  }
  if (typeof specs.vehicleYear === 'number' && Number.isFinite(specs.vehicleYear)) {
    clean.vehicleYear = Math.min(2030, Math.max(1960, Math.round(specs.vehicleYear)));
  }
  if (typeof specs.mileageKm === 'number' && Number.isFinite(specs.mileageKm) && specs.mileageKm >= 0) {
    clean.mileageKm = Math.min(2000000, Math.max(0, Number(specs.mileageKm)));
  }
  if (specs.transmission && specs.transmission.trim()) {
    clean.transmission = specs.transmission.trim().slice(0, 30);
  }
  if (specs.fuelType && specs.fuelType.trim()) {
    clean.fuelType = specs.fuelType.trim().slice(0, 30);
  }
  if (specs.goodsType && specs.goodsType.trim()) {
    clean.goodsType = specs.goodsType.trim().slice(0, 60);
  }
  if (specs.goodsModel && specs.goodsModel.trim()) {
    clean.goodsModel = specs.goodsModel.trim().slice(0, 60);
  }
  if (specs.itemCondition && specs.itemCondition.trim()) {
    clean.itemCondition = specs.itemCondition.trim().slice(0, 30);
  }
  if (
    specs.roomClass === '1_class' ||
    specs.roomClass === '2_class' ||
    specs.roomClass === '3_plus'
  ) {
    clean.roomClass = specs.roomClass;
  }
  if (
    specs.tenantPreference === 'late' ||
    specs.tenantPreference === 'bale_tedar' ||
    specs.tenantPreference === 'any'
  ) {
    clean.tenantPreference = specs.tenantPreference;
  }
  return clean;
}

export interface ListingInput {
  category: Listing['category'];
  transactionType: Listing['transactionType'];
  title: string;
  description: string;
  descriptionVoiceUrl?: string;
  descriptionVoiceDurationSec?: number;
  price: number;
  currency: Listing['currency'];
  pricePeriod: Listing['pricePeriod'];
  neighborhood: string;
  city: string;
  imageUrl: string;
  photos?: ListingPhoto[];
  videoDataUrl?: string;
  videoMimeType?: string;
  videoDurationSec?: number;
  videoModified?: boolean;
  specs: ListingSpecs;
  sellerPhone?: string;
}

function sanitizeListingPhotos(photos: ListingPhoto[] | undefined, fallbackCoverUrl: string): ListingPhoto[] {
  const deduped = new Map<number, ListingPhoto>();
  (photos || []).forEach((p) => {
    const idx = Math.round(Number(p.slotIndex));
    const url = (p.imageDataUrl || '').trim().slice(0, 200000);
    const label = (p.angleLabel || `Angle ${idx + 1}`).trim().slice(0, 80);
    if (idx >= 0 && idx <= 5 && url.length >= 1 && !deduped.has(idx)) {
      deduped.set(idx, {
        slotIndex: idx,
        angleLabel: label || `Angle ${idx + 1}`,
        imageDataUrl: url,
      });
    }
  });

  if (deduped.size === 0 && fallbackCoverUrl.trim()) {
    deduped.set(0, {
      slotIndex: 0,
      angleLabel: 'Primary Angle',
      imageDataUrl: fallbackCoverUrl.trim().slice(0, 200000),
    });
  }

  return Array.from(deduped.values())
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .slice(0, 6);
}

export async function fetchListingPhotos(listingId: string): Promise<ListingPhoto[]> {
  const cleanId = sanitizeId(listingId);
  const path = `listings/${cleanId}/photos`;
  try {
    const q = query(collection(db, 'listings', cleanId, 'photos'), where('listingId', '==', cleanId));
    const snap = await getDocs(q);
    const photos: ListingPhoto[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        slotIndex: Number(data.slotIndex ?? 0),
        angleLabel: String(data.angleLabel || 'Photo'),
        imageDataUrl: String(data.imageDataUrl || ''),
      };
    });
    photos.sort((a, b) => a.slotIndex - b.slotIndex);
    return photos;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchListingVideo(
  listingId: string,
  fallbackMimeType = 'video/webm'
): Promise<string | null> {
  const cleanId = sanitizeId(listingId);
  const path = `listings/${cleanId}/videoChunks`;
  try {
    const q = query(
      collection(db, 'listings', cleanId, 'videoChunks'),
      where('listingId', '==', cleanId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const chunks = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          chunkIndex: Number(data.chunkIndex ?? 0),
          data: String(data.data || ''),
        };
      })
      .filter((c) => c.data.length > 0)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
    if (chunks.length === 0) return null;
    return assembleChunksToBlobUrl(
      chunks.map((c) => c.data),
      fallbackMimeType
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createListing(user: User, input: ListingInput): Promise<string> {
  const id = generateValidId('lst');
  const contactId = generateValidId('cnt');
  const cleanUid = sanitizeId(user.uid);
  const path = `listings/${id}`;
  const cleanSpecs = buildCleanSpecs(input.specs);
  const sellerName =
    (user.displayName || user.email?.split('@')[0] || 'Seller').trim().slice(0, 80) || 'Seller';
  const cleanTitle = input.title.trim().slice(0, 120);
  const cleanNeighborhood = input.neighborhood.trim().slice(0, 80);
  const cleanPhone = (input.sellerPhone || '').trim().slice(0, 30);

  if (cleanPhone.length < 6) {
    throw new Error('Seller phone number is required.');
  }

  const cleanPhotos = sanitizeListingPhotos(input.photos, input.imageUrl);
  const rawCoverUrl = (cleanPhotos[0]?.imageDataUrl || input.imageUrl).trim();
  const coverUrl = rawCoverUrl.startsWith('data:') ? rawCoverUrl : rawCoverUrl.slice(0, 180000);
  if (coverUrl.length > 180000) {
    throw new Error('Cover photo is too large. Please upload a smaller photo.');
  }
  const photoCount = Math.min(6, Math.max(1, cleanPhotos.length));
  const cleanVoiceUrl = (input.descriptionVoiceUrl || '').trim().slice(0, 220000);
  const cleanVoiceDuration = cleanVoiceUrl
    ? Math.min(120, Math.max(1, Math.round(Number(input.descriptionVoiceDurationSec || 1))))
    : 0;

  let videoChunks: string[] = [];
  let cleanVideoMime = '';
  let cleanVideoDuration = 0;
  if (input.videoDataUrl && input.videoDataUrl.trim()) {
    const parsed = parseDataUrl(input.videoDataUrl);
    videoChunks = splitBase64IntoChunks(parsed.base64Body);
    if (videoChunks.length > MAX_VIDEO_CHUNKS) {
      throw new Error('Video is too large. Please record or upload a shorter clip.');
    }
    cleanVideoMime = (input.videoMimeType || parsed.mimeType || 'video/webm').trim().slice(0, 80);
    cleanVideoDuration = Math.min(120, Math.max(1, Math.round(Number(input.videoDurationSec || 1))));
  }

  try {
    const batch = writeBatch(db);
    const listingPayload: Record<string, unknown> = {
      ownerId: cleanUid,
      sellerName,
      category: input.category,
      transactionType: input.transactionType,
      title: cleanTitle,
      description: input.description.trim().slice(0, 2000),
      descriptionVoiceUrl: cleanVoiceUrl,
      descriptionVoiceDurationSec: cleanVoiceDuration,
      price: Math.min(10000000000, Math.max(1, Number(input.price))),
      currency: input.currency,
      pricePeriod: input.pricePeriod,
      neighborhood: cleanNeighborhood,
      city: input.city.trim().slice(0, 60),
      imageUrl: coverUrl,
      photoCount,
      status: 'available',
      specs: cleanSpecs,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (videoChunks.length > 0) {
      listingPayload.videoDurationSec = cleanVideoDuration;
      listingPayload.videoChunkCount = videoChunks.length;
      listingPayload.videoMimeType = cleanVideoMime;
    }

    batch.set(doc(db, 'listings', id), listingPayload);

    cleanPhotos.forEach((p) => {
      batch.set(doc(db, 'listings', id, 'photos', `slot_${p.slotIndex}`), {
        listingId: id,
        ownerId: cleanUid,
        slotIndex: p.slotIndex,
        angleLabel: p.angleLabel,
        imageDataUrl: p.imageDataUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    videoChunks.forEach((chunkData, chunkIdx) => {
      batch.set(doc(db, 'listings', id, 'videoChunks', `chunk_${chunkIdx}`), {
        listingId: id,
        ownerId: cleanUid,
        chunkIndex: chunkIdx,
        data: chunkData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    batch.set(
      doc(db, 'users', cleanUid, 'private', 'info'),
      {
        uid: cleanUid,
        email: (user.email || 'seller@example.com').slice(0, 150),
        phone: cleanPhone,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(
      doc(db, 'contactDirectory', contactId),
      buildPrivateContactPayload(user, {
        role: 'seller',
        actionType: 'listing_post',
        phone: cleanPhone,
        listingId: id,
        listingTitle: cleanTitle,
        neighborhood: cleanNeighborhood,
      })
    );

    await batch.commit();
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateListingDetails(
  listingId: string,
  input: ListingInput,
  user?: User | null
): Promise<void> {
  const cleanId = sanitizeId(listingId);
  const path = `listings/${cleanId}`;
  const cleanSpecs = buildCleanSpecs(input.specs);
  const cleanPhone = (input.sellerPhone || '').trim().slice(0, 30);

  const hasPhotosUpdate = Boolean(input.photos && input.photos.length > 0);
  const cleanPhotos = hasPhotosUpdate
    ? sanitizeListingPhotos(input.photos, input.imageUrl)
    : [];
  const rawCoverUrl = (cleanPhotos[0]?.imageDataUrl || input.imageUrl).trim();
  const coverUrl = rawCoverUrl.startsWith('data:') ? rawCoverUrl : rawCoverUrl.slice(0, 180000);
  if (coverUrl.length > 180000) {
    throw new Error('Cover photo is too large. Please upload a smaller photo.');
  }

  try {
    const existingPhotoSnap =
      hasPhotosUpdate && user
        ? await getDocs(
            query(collection(db, 'listings', cleanId, 'photos'), where('listingId', '==', cleanId))
          )
        : null;

    const existingVideoSnap =
      input.videoModified && user
        ? await getDocs(
            query(
              collection(db, 'listings', cleanId, 'videoChunks'),
              where('listingId', '==', cleanId)
            )
          )
        : null;

    const cleanVoiceUrl = (input.descriptionVoiceUrl || '').trim().slice(0, 220000);
    const cleanVoiceDuration = cleanVoiceUrl
      ? Math.min(120, Math.max(1, Math.round(Number(input.descriptionVoiceDurationSec || 1))))
      : 0;

    let nextVideoChunks: string[] = [];
    let nextVideoMime = '';
    let nextVideoDuration = 0;
    if (input.videoModified && input.videoDataUrl && input.videoDataUrl.trim()) {
      const parsed = parseDataUrl(input.videoDataUrl);
      nextVideoChunks = splitBase64IntoChunks(parsed.base64Body);
      if (nextVideoChunks.length > MAX_VIDEO_CHUNKS) {
        throw new Error('Video is too large. Please record or upload a shorter clip.');
      }
      nextVideoMime = (input.videoMimeType || parsed.mimeType || 'video/webm').trim().slice(0, 80);
      nextVideoDuration = Math.min(
        120,
        Math.max(1, Math.round(Number(input.videoDurationSec || 1)))
      );
    }

    const batch = writeBatch(db);
    const listingUpdatePayload: Record<string, unknown> = {
      title: input.title.trim().slice(0, 120),
      description: input.description.trim().slice(0, 2000),
      descriptionVoiceUrl: cleanVoiceUrl,
      descriptionVoiceDurationSec: cleanVoiceDuration,
      price: Math.min(10000000000, Math.max(1, Number(input.price))),
      currency: input.currency,
      pricePeriod: input.pricePeriod,
      neighborhood: input.neighborhood.trim().slice(0, 80),
      city: input.city.trim().slice(0, 60),
      imageUrl: coverUrl,
      specs: cleanSpecs,
      updatedAt: serverTimestamp(),
    };
    if (hasPhotosUpdate) {
      listingUpdatePayload.photoCount = Math.min(6, Math.max(1, cleanPhotos.length));
    }
    if (input.videoModified) {
      listingUpdatePayload.videoDurationSec = nextVideoDuration;
      listingUpdatePayload.videoChunkCount = nextVideoChunks.length;
      listingUpdatePayload.videoMimeType = nextVideoMime;
    }

    batch.update(doc(db, 'listings', cleanId), listingUpdatePayload);

    if (hasPhotosUpdate && user) {
      const cleanUid = sanitizeId(user.uid);
      const existingByDocId = new Map<string, boolean>();
      existingPhotoSnap?.docs.forEach((d) => {
        existingByDocId.set(d.id, true);
      });

      const activeDocIds = new Set<string>();
      cleanPhotos.forEach((p) => {
        const docId = `slot_${p.slotIndex}`;
        activeDocIds.add(docId);
        if (existingByDocId.has(docId)) {
          batch.update(doc(db, 'listings', cleanId, 'photos', docId), {
            angleLabel: p.angleLabel,
            imageDataUrl: p.imageDataUrl,
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(doc(db, 'listings', cleanId, 'photos', docId), {
            listingId: cleanId,
            ownerId: cleanUid,
            slotIndex: p.slotIndex,
            angleLabel: p.angleLabel,
            imageDataUrl: p.imageDataUrl,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });

      existingByDocId.forEach((_, docId) => {
        if (!activeDocIds.has(docId)) {
          batch.delete(doc(db, 'listings', cleanId, 'photos', docId));
        }
      });
    }

    if (input.videoModified && user) {
      const cleanUid = sanitizeId(user.uid);
      const existingVideoByDocId = new Map<string, boolean>();
      existingVideoSnap?.docs.forEach((d) => {
        existingVideoByDocId.set(d.id, true);
      });

      const activeVideoDocIds = new Set<string>();
      nextVideoChunks.forEach((chunkData, chunkIdx) => {
        const docId = `chunk_${chunkIdx}`;
        activeVideoDocIds.add(docId);
        if (existingVideoByDocId.has(docId)) {
          batch.update(doc(db, 'listings', cleanId, 'videoChunks', docId), {
            data: chunkData,
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(doc(db, 'listings', cleanId, 'videoChunks', docId), {
            listingId: cleanId,
            ownerId: cleanUid,
            chunkIndex: chunkIdx,
            data: chunkData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });

      existingVideoByDocId.forEach((_, docId) => {
        if (!activeVideoDocIds.has(docId)) {
          batch.delete(doc(db, 'listings', cleanId, 'videoChunks', docId));
        }
      });
    }

    if (user && cleanPhone.length >= 6) {
      const cleanUid = sanitizeId(user.uid);
      batch.set(
        doc(db, 'users', cleanUid, 'private', 'info'),
        {
          uid: cleanUid,
          email: (user.email || 'seller@example.com').slice(0, 150),
          phone: cleanPhone,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      batch.set(
        doc(db, 'contactDirectory', generateValidId('cnt')),
        buildPrivateContactPayload(user, {
          role: 'seller',
          actionType: 'listing_post',
          phone: cleanPhone,
          listingId: cleanId,
          listingTitle: input.title.trim().slice(0, 120),
          neighborhood: input.neighborhood.trim().slice(0, 80),
        })
      );
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateListingStatus(listingId: string, status: ListingStatus): Promise<void> {
  const cleanId = sanitizeId(listingId);
  const path = `listings/${cleanId}`;
  try {
    await updateDoc(doc(db, 'listings', cleanId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeListing(listingId: string): Promise<void> {
  const cleanId = sanitizeId(listingId);
  const path = `listings/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'listings', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function toggleSavedListing(
  uid: string,
  listingId: string,
  currentlySaved: boolean
): Promise<void> {
  const cleanUid = sanitizeId(uid);
  const cleanListingId = sanitizeId(listingId);
  const path = `users/${cleanUid}/saved/${cleanListingId}`;

  try {
    const ref = doc(db, 'users', cleanUid, 'saved', cleanListingId);
    if (currentlySaved) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        userId: cleanUid,
        listingId: cleanListingId,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, currentlySaved ? OperationType.DELETE : OperationType.CREATE, path);
  }
}

export async function sendListingInquiry(
  user: User,
  listing: Listing,
  senderName: string,
  senderContact: string,
  message: string
): Promise<string> {
  const id = generateValidId('inq');
  const contactId = generateValidId('cnt');
  const cleanUid = sanitizeId(user.uid);
  const path = `inquiries/${id}`;
  const cleanPhone = senderContact.trim().slice(0, 30);

  if (cleanPhone.length < 6) {
    throw new Error('Phone number is required.');
  }

  try {
    const batch = writeBatch(db);
    // Keep raw buyer phone out of seller-readable /inquiries document
    batch.set(doc(db, 'inquiries', id), {
      listingId: sanitizeId(listing.id),
      listingTitle: listing.title.trim().slice(0, 120),
      sellerId: sanitizeId(listing.ownerId),
      sellerName: listing.sellerName.trim().slice(0, 80),
      senderId: cleanUid,
      senderName: senderName.trim().slice(0, 80),
      senderContact: 'Admin-only',
      message: message.trim().slice(0, 1000),
      status: 'open',
      sellerReply: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(
      doc(db, 'users', cleanUid, 'private', 'info'),
      {
        uid: cleanUid,
        email: (user.email || 'buyer@example.com').slice(0, 150),
        phone: cleanPhone,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(
      doc(db, 'contactDirectory', contactId),
      buildPrivateContactPayload(user, {
        role: 'buyer',
        actionType: 'inquiry',
        phone: cleanPhone,
        listingId: listing.id,
        listingTitle: listing.title,
        neighborhood: listing.neighborhood,
      })
    );

    await batch.commit();
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function replyToInquiry(inquiryId: string, replyText: string): Promise<void> {
  const cleanId = sanitizeId(inquiryId);
  const path = `inquiries/${cleanId}`;

  try {
    await updateDoc(doc(db, 'inquiries', cleanId), {
      sellerReply: replyText.trim().slice(0, 1000),
      status: 'replied',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function closeInquiryThread(inquiryId: string): Promise<void> {
  const cleanId = sanitizeId(inquiryId);
  const path = `inquiries/${cleanId}`;

  try {
    await updateDoc(doc(db, 'inquiries', cleanId), {
      status: 'closed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserOrders(
  uid: string,
  onData: (orders: Order[]) => void,
  onError: (err: Error) => void
): () => void {
  const cleanUid = sanitizeId(uid);
  const path = 'orders';
  const buyerQuery = query(collection(db, path), where('buyerId', '==', cleanUid));
  const sellerQuery = query(collection(db, path), where('sellerId', '==', cleanUid));

  const mapById = new Map<string, Order>();

  const emitMerged = () => {
    const merged = Array.from(mapById.values()).sort((a, b) => b.createdAtMs - a.createdAtMs);
    onData(merged);
  };

  const mapDoc = (d: { id: string; data: () => Record<string, unknown> }): Order => {
    const data = d.data();
    return {
      id: d.id,
      orderNumber: String(data.orderNumber || ''),
      listingId: String(data.listingId || ''),
      listingTitle: String(data.listingTitle || ''),
      listingCategory: (data.listingCategory as Order['listingCategory']) || 'goods',
      transactionType: (data.transactionType as Order['transactionType']) || 'sale',
      listingImage: String(data.listingImage || ''),
      sellerId: String(data.sellerId || ''),
      sellerName: String(data.sellerName || ''),
      buyerId: String(data.buyerId || ''),
      buyerName: String(data.buyerName || ''),
      buyerPhone: String(data.buyerPhone || ''),
      deliveryAddress: String(data.deliveryAddress || ''),
      paymentMethod: (data.paymentMethod as PaymentMethod) || 'cash_on_delivery',
      quantity: Number(data.quantity || 1),
      unitPrice: Number(data.unitPrice || 0),
      totalAmount: Number(data.totalAmount || 0),
      currency: data.currency === 'USD' ? 'USD' : 'ETB',
      notes: String(data.notes || ''),
      status: (data.status as OrderStatus) || 'pending',
      createdAtMs: toMillis(data.createdAt),
      updatedAtMs: toMillis(data.updatedAt),
    };
  };

  const unsubBuyer = onSnapshot(
    buyerQuery,
    (snapshot) => {
      for (const [key, val] of mapById.entries()) {
        if (val.buyerId === cleanUid && val.sellerId !== cleanUid) {
          mapById.delete(key);
        }
      }
      snapshot.docs.forEach((d) => mapById.set(d.id, mapDoc(d)));
      emitMerged();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubSeller = onSnapshot(
    sellerQuery,
    (snapshot) => {
      for (const [key, val] of mapById.entries()) {
        if (val.sellerId === cleanUid) {
          mapById.delete(key);
        }
      }
      snapshot.docs.forEach((d) => mapById.set(d.id, mapDoc(d)));
      emitMerged();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  return () => {
    unsubBuyer();
    unsubSeller();
  };
}

export interface PlaceOrderInput {
  listing: Listing;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  quantity: number;
  notes: string;
}

export async function placeOrder(
  user: User,
  input: PlaceOrderInput
): Promise<{ id: string; orderNumber: string }> {
  const id = generateValidId('ord');
  const notifId = generateValidId('ntf');
  const contactId = generateValidId('cnt');
  const cleanUid = sanitizeId(user.uid);
  const path = `orders/${id}`;
  const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const qty = Math.min(100, Math.max(1, Math.round(input.quantity)));
  const unitPrice = Number(input.listing.price);
  const totalAmount = unitPrice * qty;
  const cleanPhone = input.buyerPhone.trim().slice(0, 30);
  const cleanTitle = input.listing.title.trim().slice(0, 120) || 'Listing';
  const cleanListingId = sanitizeId(input.listing.id);
  const cleanSellerId = sanitizeId(input.listing.ownerId);
  const cleanSellerName = input.listing.sellerName.trim().slice(0, 80) || 'Seller';
  const cleanListingImage = input.listing.imageUrl.trim().slice(0, 180000) || 'cover';
  const cleanBuyerName = input.buyerName.trim().slice(0, 80) || 'Buyer';

  if (cleanPhone.length < 6) {
    throw new Error('Phone number is required.');
  }

  try {
    const batch = writeBatch(db);
    // Keep raw buyer phone out of seller-readable /orders document
    batch.set(doc(db, 'orders', id), {
      orderNumber,
      listingId: cleanListingId,
      listingTitle: cleanTitle,
      listingCategory: input.listing.category,
      transactionType: input.listing.transactionType,
      listingImage: cleanListingImage,
      sellerId: cleanSellerId,
      sellerName: cleanSellerName,
      buyerId: cleanUid,
      buyerName: cleanBuyerName,
      buyerPhone: 'Admin-only',
      deliveryAddress: input.deliveryAddress.trim().slice(0, 200),
      paymentMethod: input.paymentMethod,
      quantity: qty,
      unitPrice,
      totalAmount,
      currency: input.listing.currency,
      notes: input.notes.trim().slice(0, 500),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Atomically write real-time order notification for seller (or buyer receipt for showcase catalog)
    const recipientId = cleanSellerId === 'showcase_system' ? cleanUid : cleanSellerId;
    batch.set(doc(db, 'notifications', notifId), {
      recipientId,
      actorId: cleanUid,
      actorName: cleanBuyerName,
      orderId: id,
      orderNumber,
      listingId: cleanListingId,
      listingTitle: cleanTitle,
      eventType: 'order_placed',
      amount: totalAmount,
      currency: input.listing.currency,
      isRead: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(
      doc(db, 'users', cleanUid, 'private', 'info'),
      {
        uid: cleanUid,
        email: (user.email || 'buyer@example.com').slice(0, 150),
        phone: cleanPhone,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(
      doc(db, 'contactDirectory', contactId),
      buildPrivateContactPayload(user, {
        role: 'buyer',
        actionType: 'order',
        phone: cleanPhone,
        listingId: input.listing.id,
        listingTitle: `${orderNumber} · ${input.listing.title}`.slice(0, 120),
        neighborhood: input.listing.neighborhood,
      })
    );

    await batch.commit();
    return { id, orderNumber };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const cleanId = sanitizeId(orderId);
  const path = `orders/${cleanId}`;

  try {
    const orderRef = doc(db, 'orders', cleanId);
    const snap = await getDocFromServer(orderRef);

    if (!snap.exists()) {
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const data = snap.data();
    const currentUser = auth.currentUser;
    const batch = writeBatch(db);

    batch.update(orderRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    if (
      currentUser &&
      (status === 'confirmed' || status === 'completed' || status === 'cancelled')
    ) {
      const eventType: NotificationEventType =
        status === 'confirmed'
          ? 'order_confirmed'
          : status === 'completed'
          ? 'order_completed'
          : 'order_cancelled';

      const cleanActorId = sanitizeId(currentUser.uid);
      const buyerId = sanitizeId(String(data.buyerId || ''));
      const sellerId = sanitizeId(String(data.sellerId || ''));
      const isBuyerActor = cleanActorId === buyerId;
      const recipientId = isBuyerActor
        ? sellerId === 'showcase_system'
          ? buyerId
          : sellerId
        : buyerId;
      const actorName = (
        isBuyerActor
          ? String(data.buyerName || currentUser.displayName || 'Buyer')
          : String(currentUser.displayName || data.sellerName || 'Seller')
      )
        .trim()
        .slice(0, 80);

      if (recipientId && cleanActorId) {
        batch.set(doc(db, 'notifications', generateValidId('ntf')), {
          recipientId,
          actorId: cleanActorId,
          actorName: actorName || 'Member',
          orderId: cleanId,
          orderNumber: String(data.orderNumber || 'ORD-000000').slice(0, 32),
          listingId: sanitizeId(String(data.listingId || '')),
          listingTitle: String(data.listingTitle || 'Listing').slice(0, 120),
          eventType,
          amount: Number(data.totalAmount || 0),
          currency: data.currency === 'USD' ? 'USD' : 'ETB',
          isRead: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeOrder(orderId: string): Promise<void> {
  const cleanId = sanitizeId(orderId);
  const path = `orders/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'orders', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeBuyerRequests(
  onData: (requests: BuyerRequest[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'buyerRequests';
  const q = query(collection(db, path), where('status', 'in', ['active', 'fulfilled', 'closed']));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: BuyerRequest[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          buyerId: String(data.buyerId || ''),
          buyerName: String(data.buyerName || ''),
          transactionType: data.transactionType === 'rent' ? 'rent' : 'sale',
          category: (data.category as BuyerRequest['category']) || 'apartment',
          title: String(data.title || ''),
          maxBudget: Number(data.maxBudget || 0),
          currency: data.currency === 'USD' ? 'USD' : 'ETB',
          preferredNeighborhood: String(data.preferredNeighborhood || ''),
          notes: String(data.notes || ''),
          roomClass:
            data.roomClass === '1_class' ||
            data.roomClass === '2_class' ||
            data.roomClass === '3_plus'
              ? (data.roomClass as RoomClass)
              : undefined,
          tenantPreference:
            data.tenantPreference === 'late' ||
            data.tenantPreference === 'bale_tedar' ||
            data.tenantPreference === 'any'
              ? (data.tenantPreference as TenantPreference)
              : undefined,
          status: (data.status as BuyerRequestStatus) || 'active',
          createdAtMs: toMillis(data.createdAt),
          updatedAtMs: toMillis(data.updatedAt),
        };
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export interface BuyerRequestInput {
  transactionType: BuyerRequest['transactionType'];
  category: BuyerRequest['category'];
  title: string;
  maxBudget: number;
  currency: BuyerRequest['currency'];
  preferredNeighborhood: string;
  notes: string;
  buyerPhone: string;
  roomClass?: RoomClass;
  tenantPreference?: TenantPreference;
}

export async function createBuyerRequest(
  user: User,
  input: BuyerRequestInput
): Promise<string> {
  const id = generateValidId('breq');
  const contactId = generateValidId('cnt');
  const cleanUid = sanitizeId(user.uid);
  const path = `buyerRequests/${id}`;
  const buyerName =
    (user.displayName || user.email?.split('@')[0] || 'Buyer').trim().slice(0, 80) || 'Buyer';
  const cleanTitle = input.title.trim().slice(0, 120);
  const cleanNeighborhood = input.preferredNeighborhood.trim().slice(0, 80);
  const cleanPhone = input.buyerPhone.trim().slice(0, 30);

  if (cleanPhone.length < 6) {
    throw new Error('Phone number is required.');
  }

  try {
    const batch = writeBatch(db);
    const reqPayload: Record<string, unknown> = {
      buyerId: cleanUid,
      buyerName,
      transactionType: input.transactionType,
      category: input.category,
      title: cleanTitle,
      maxBudget: Math.min(10000000000, Math.max(1, Number(input.maxBudget))),
      currency: input.currency,
      preferredNeighborhood: cleanNeighborhood,
      notes: input.notes.trim().slice(0, 500),
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (
      input.roomClass === '1_class' ||
      input.roomClass === '2_class' ||
      input.roomClass === '3_plus'
    ) {
      reqPayload.roomClass = input.roomClass;
    }
    if (
      input.tenantPreference === 'late' ||
      input.tenantPreference === 'bale_tedar' ||
      input.tenantPreference === 'any'
    ) {
      reqPayload.tenantPreference = input.tenantPreference;
    }

    batch.set(doc(db, 'buyerRequests', id), reqPayload);

    batch.set(
      doc(db, 'users', cleanUid, 'private', 'info'),
      {
        uid: cleanUid,
        email: (user.email || 'buyer@example.com').slice(0, 150),
        phone: cleanPhone,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(
      doc(db, 'contactDirectory', contactId),
      buildPrivateContactPayload(user, {
        role: 'buyer',
        actionType: 'buyer_request',
        phone: cleanPhone,
        listingId: id,
        listingTitle: cleanTitle,
        neighborhood: cleanNeighborhood,
      })
    );

    await batch.commit();
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBuyerRequestStatus(
  requestId: string,
  status: BuyerRequestStatus
): Promise<void> {
  const cleanId = sanitizeId(requestId);
  const path = `buyerRequests/${cleanId}`;
  try {
    await updateDoc(doc(db, 'buyerRequests', cleanId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBuyerRequest(requestId: string): Promise<void> {
  const cleanId = sanitizeId(requestId);
  const path = `buyerRequests/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'buyerRequests', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeContactDirectory(
  onData: (entries: ContactEntry[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'contactDirectory';
  const q = query(collection(db, path), where('role', 'in', ['seller', 'buyer']));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ContactEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: String(data.userId || ''),
          userName: String(data.userName || ''),
          userEmail: String(data.userEmail || ''),
          role: data.role === 'seller' ? 'seller' : 'buyer',
          actionType: (data.actionType as ContactActionType) || 'listing_post',
          phone: String(data.phone || ''),
          listingId: String(data.listingId || ''),
          listingTitle: String(data.listingTitle || ''),
          neighborhood: String(data.neighborhood || ''),
          createdAtMs: toMillis(data.createdAt),
        };
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function deleteContactEntry(contactId: string): Promise<void> {
  const cleanId = sanitizeId(contactId);
  const path = `contactDirectory/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'contactDirectory', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeAdminOrders(
  onData: (orders: Order[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'orders';
  const q = query(
    collection(db, path),
    where('status', 'in', ['pending', 'confirmed', 'completed', 'cancelled'])
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Order[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          orderNumber: String(data.orderNumber || ''),
          listingId: String(data.listingId || ''),
          listingTitle: String(data.listingTitle || ''),
          listingCategory: (data.listingCategory as Order['listingCategory']) || 'goods',
          transactionType: (data.transactionType as Order['transactionType']) || 'sale',
          listingImage: String(data.listingImage || ''),
          sellerId: String(data.sellerId || ''),
          sellerName: String(data.sellerName || ''),
          buyerId: String(data.buyerId || ''),
          buyerName: String(data.buyerName || ''),
          buyerPhone: String(data.buyerPhone || ''),
          deliveryAddress: String(data.deliveryAddress || ''),
          paymentMethod: (data.paymentMethod as PaymentMethod) || 'cash_on_delivery',
          quantity: Number(data.quantity || 1),
          unitPrice: Number(data.unitPrice || 0),
          totalAmount: Number(data.totalAmount || 0),
          currency: data.currency === 'USD' ? 'USD' : 'ETB',
          notes: String(data.notes || ''),
          status: (data.status as OrderStatus) || 'pending',
          createdAtMs: toMillis(data.createdAt),
          updatedAtMs: toMillis(data.updatedAt),
        };
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

function mapNotificationDoc(d: { id: string; data: () => Record<string, unknown> }): AppNotification {
  const data = d.data();
  return {
    id: d.id,
    recipientId: String(data.recipientId || ''),
    actorId: String(data.actorId || ''),
    actorName: String(data.actorName || ''),
    orderId: String(data.orderId || ''),
    orderNumber: String(data.orderNumber || ''),
    listingId: String(data.listingId || ''),
    listingTitle: String(data.listingTitle || ''),
    eventType: (data.eventType as NotificationEventType) || 'order_placed',
    amount: Number(data.amount || 0),
    currency: data.currency === 'USD' ? 'USD' : 'ETB',
    isRead: Boolean(data.isRead),
    createdAtMs: toMillis(data.createdAt),
    updatedAtMs: toMillis(data.updatedAt),
  };
}

export function subscribeUserNotifications(
  uid: string,
  onData: (notifications: AppNotification[]) => void,
  onError: (err: Error) => void
): () => void {
  const cleanUid = sanitizeId(uid);
  const path = 'notifications';
  const q = query(collection(db, path), where('recipientId', '==', cleanUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapNotificationDoc(d))
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeAdminNotifications(
  onData: (notifications: AppNotification[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'notifications';
  const q = query(
    collection(db, path),
    where('eventType', 'in', ['order_placed', 'order_confirmed', 'order_completed', 'order_cancelled'])
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapNotificationDoc(d))
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const cleanId = sanitizeId(notificationId);
  const path = `notifications/${cleanId}`;
  try {
    await updateDoc(doc(db, 'notifications', cleanId), {
      isRead: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsRead(notificationIds: string[]): Promise<void> {
  const cleanIds = notificationIds.map((id) => sanitizeId(id)).filter(Boolean);
  if (cleanIds.length === 0) return;

  try {
    for (let i = 0; i < cleanIds.length; i += 400) {
      const chunk = cleanIds.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        batch.update(doc(db, 'notifications', id), {
          isRead: true,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const cleanId = sanitizeId(notificationId);
  const path = `notifications/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'notifications', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

