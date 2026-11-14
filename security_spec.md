# Security Specification — AddisGebeya Marketplace

## 1. Data Invariants
1. **Identity Integrity**: Every user-owned document (`UserPublicProfile`, `UserPrivateInfo`, `SavedItem`, `Listing.ownerId`, `Inquiry.senderId`) must strictly match `request.auth.uid` on creation and remain immutable on update.
2. **Verified Write Access**: All write operations require `request.auth != null && request.auth.token.email_verified == true`.
3. **PII Isolation**: Private contact data (`email`, `phone`) is isolated in `/users/{userId}/private/info` (strictly owner-only read/write) and `/inquiries/{inquiryId}` (strictly `senderId` or `sellerId` read). Public `/listings/{listingId}` and `/users/{userId}` never store emails or private phone numbers.
4. **Relational Integrity**: An `Inquiry` cannot be created unless the referenced `/listings/{listingId}` exists, `incoming().sellerId` equals that listing's `ownerId`, and `senderId != sellerId`.
5. **Terminal State Locking**: Once a `Listing`, `Inquiry`, or `Order` reaches a terminal status (`closed` for listings/inquiries, `completed` or `cancelled` for orders), no further updates are permitted.
6. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` on create; `createdAt` is immutable and `updatedAt == request.time` on update.
7. **Strict Key & Size Enforcement**: Every string has `.size()` bounds; every document uses `keys().hasAll(...)` and `keys().hasOnly(...)` on create, and `affectedKeys().hasOnly(...)` on update.
8. **Order Price & Status Integrity**: Orders must compute `totalAmount == unitPrice * quantity`, start in `status == 'pending'`, only transition via explicit seller confirmation/completion or buyer cancellation while pending, and may only be deleted by the verified `buyerId`, `sellerId`, or platform administrator.
9. **BuyerRequest & Rental Preference Integrity**: Public `/buyerRequests/{requestId}` documents contain zero PII (only display name, category, target budget, neighborhood, and optional bounded `roomClass` / `tenantPreference` enums) and may only be created, updated, or deleted by the owning verified `buyerId`. Similarly, `Listing.specs.roomClass` and `Listing.specs.tenantPreference` strictly validate against allowlisted enums.
10. **Admin-Only Seller & Buyer Phone Directory**: Seller and buyer phone numbers are written exclusively to `/contactDirectory/{contactId}` (and the owner's `/users/{userId}/private/info`), while public `/listings`, `/buyerRequests`, `/orders`, and `/inquiries` never expose raw phone numbers to other buyers or sellers. Only the verified platform administrator (`request.auth.token.email == 'kasahungudisa12@gmail.com' && request.auth.token.email_verified == true`) can `get`, `list`, or `delete` entries in `/contactDirectory`.
11. **Multi-Angle Listing Photos Integrity**: Up to 6 angle photos (`slotIndex` 0..5) per listing are stored in `/listings/{listingId}/photos/{photoId}` with strict `.size() <= 200000` bounds and Master Gate ownership verification (`getAfter` / `get` on parent `/listings/{listingId}`).
12. **Atomic Order-Backed Notifications & Recipient Isolation**: Every `/notifications/{notificationId}` document must be backed by a valid `/orders/{orderId}` (`existsAfter`/`getAfter`), match the post-batch order status (`order_placed`, `order_confirmed`, `order_completed`, `order_cancelled`), enforce `actorId == request.auth.uid`, start unread (`isRead == false`), and remain strictly readable/updatable/deletable only by its `recipientId` or the verified platform administrator.
13. **Voice Description Bounds**: Optional `descriptionVoiceUrl` (`string`, `size() <= 220000`) and `descriptionVoiceDurationSec` (`int`, `0..120`) on `/listings/{listingId}` allow sellers to attach recorded audio descriptions alongside or in place of lengthy written text while preserving strict payload size bounds.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Listing Identity Spoof**: Creating a listing with `ownerId: "victim_uid"` while authenticated as `"attacker_uid"`. -> Expect `PERMISSION_DENIED`.
2. **Listing Shadow Field Injection**: Creating a listing with an extra ghost field `isVerified: true` or `adminApproved: true`. -> Expect `PERMISSION_DENIED`.
3. **Listing Unverified Email Write**: Creating a listing when `request.auth.token.email_verified == false`. -> Expect `PERMISSION_DENIED`.
4. **Listing ID Poisoning**: Creating `/listings/invalid id with spaces and $$$` or >128 chars. -> Expect `PERMISSION_DENIED`.
5. **Listing Resource Exhaustion**: Creating a listing with a 5,000-char `title` or negative `price: -100`. -> Expect `PERMISSION_DENIED`.
6. **Listing Cross-Owner Tampering**: Updating or deleting another user's listing. -> Expect `PERMISSION_DENIED`.
7. **Listing Terminal State Bypass**: Updating a listing whose `status` is already `'closed'`. -> Expect `PERMISSION_DENIED`.
8. **Private PII Snooping**: Reading `/users/{otherUid}/private/info` as a non-owner, non-admin authenticated user. -> Expect `PERMISSION_DENIED`.
9. **Inquiry Orphan / Seller Spoof**: Creating an inquiry with a non-existent `listingId` or mismatched `sellerId`. -> Expect `PERMISSION_DENIED`.
10. **Inquiry Self-Messaging / Pre-Replied Spoof**: Creating an inquiry with `status: "replied"` or `senderId == sellerId`. -> Expect `PERMISSION_DENIED`.
11. **Inquiry Unauthorized List Scrape**: Listing `/inquiries` without a filter constraining `senderId == uid` or `sellerId == uid`. -> Expect `PERMISSION_DENIED`.
12. **Contact Directory Non-Admin / Spoofed Email Read**: Any non-admin user—or an attacker claiming the admin email with `email_verified: false`—attempting to `get` or `list` `/contactDirectory`. -> Expect `PERMISSION_DENIED`.
13. **Listing Photo Cross-Owner / Slot Overflow Injection**: Uploading a photo into `/listings/{otherListingId}/photos/{photoId}` or exceeding `slotIndex: 6` (more than 6 angles). -> Expect `PERMISSION_DENIED`.
14. **Notification Spoof Without Backing Order**: Creating `/notifications/ntf_spoof_15` referencing a nonexistent `orderId` or mismatched `eventType`. -> Expect `PERMISSION_DENIED`.
15. **Notification Cross-User List Scrape**: Listing `/notifications` as a non-admin user without `recipientId == request.auth.uid`. -> Expect `PERMISSION_DENIED`.
