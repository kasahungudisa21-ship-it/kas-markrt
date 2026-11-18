import {
  GoodsType,
  Language,
  ListingCategory,
  ListingStatus,
  NotificationEventType,
  OrderStatus,
  PaymentMethod,
  PricePeriod,
  RoomClass,
  TenantPreference,
  TransactionType,
  VehicleType,
} from './types';

interface Dictionary {
  brand: string;
  navExplore: string;
  navDashboard: string;
  navBuyerStudio: string;
  navProperties: string;
  navVehicles: string;
  navGoods: string;
  navConnections: string;
  navConnectionsUser: string;
  navBuy: string;
  navRent: string;
  navSell: string;
  postListing: string;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchButton: string;
  heroLocationCaption: string;
  stripPropertiesTitle: string;
  stripPropertiesSub: string;
  stripLandTitle: string;
  stripLandSub: string;
  stripVehiclesTitle: string;
  stripVehiclesSub: string;
  stripGoodsTitle: string;
  stripGoodsSub: string;
  allCategories: string;
  catApartment: string;
  catCondominium: string;
  catHouse: string;
  catLand: string;
  catVehicle: string;
  catGoods: string;
  txAll: string;
  txSale: string;
  txRent: string;
  allLocations: string;
  sortNewest: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  signInGoogle: string;
  signOut: string;
  signedInAs: string;
  resultsCount: string;
  noListingsFound: string;
  resetFilters: string;
  viewDetails: string;
  orderNow: string;
  reserveNow: string;
  saveListing: string;
  savedListing: string;
  statusAvailable: string;
  statusReserved: string;
  statusClosed: string;
  periodTotal: string;
  periodMonthly: string;
  periodYearly: string;
  placeOrderTab: string;
  askSellerTab: string;
  connectWithSeller: string;
  yourName: string;
  yourContact: string;
  yourMessage: string;
  sendInquiry: string;
  inquirySent: string;
  signInToConnect: string;
  signInToOrder: string;
  ownListingNotice: string;
  ownListingNoticeUser: string;
  showcaseNotice: string;
  quantityLabel: string;
  paymentMethodLabel: string;
  payCashOnDelivery: string;
  payBankTransfer: string;
  payTelebirr: string;
  payInspectionEscrow: string;
  deliveryAddressLabel: string;
  deliveryAddressPlaceholder: string;
  orderNotesLabel: string;
  orderTotalLabel: string;
  confirmOrderButton: string;
  orderConfirmedTitle: string;
  orderConfirmedBody: string;
  orderConfirmedBuyerBody: string;
  viewMyOrders: string;
  specsHeading: string;
  bedrooms: string;
  bathrooms: string;
  areaSqm: string;
  titleDeed: string;
  vehicleYear: string;
  mileageKm: string;
  transmission: string;
  fuelType: string;
  condition: string;
  sellerLabel: string;
  locationLabel: string;
  connectionsTitle: string;
  connectionsUserTitle: string;
  tabOrders: string;
  tabSaved: string;
  tabMyListings: string;
  tabInbox: string;
  backToMarketplace: string;
  sellerPageTitle: string;
  sellerPageSubtitle: string;
  chooseSaleOrRentLabel: string;
  sellOptionDesc: string;
  rentOptionDesc: string;
  whatSellingLabel: string;
  whatRentingLabel: string;
  buyerStudioTitle: string;
  buyerStudioSubtitle: string;
  chooseBuyOrRentLabel: string;
  buyOptionTitle: string;
  buyOptionDesc: string;
  rentBuyerOptionTitle: string;
  rentBuyerOptionDesc: string;
  whatBuyingLabel: string;
  whatRentingBuyerLabel: string;
  maxBudgetLabel: string;
  matchingListingsTitle: string;
  compareLabel: string;
  comparingTitle: string;
  clearCompare: string;
  postWantedTitle: string;
  postWantedSubtitle: string;
  wantedTitleLabel: string;
  wantedButton: string;
  wantedSuccess: string;
  activeWantedTitle: string;
  markFulfilled: string;
  livePreviewLabel: string;
  sellerPostSuccess: string;
  createListingTitle: string;
  editListingTitle: string;
  fieldCategory: string;
  fieldTransaction: string;
  fieldTitle: string;
  fieldDescription: string;
  fieldPrice: string;
  fieldCurrency: string;
  fieldPeriod: string;
  fieldNeighborhood: string;
  fieldCity: string;
  fieldImagePreset: string;
  fieldCustomImage: string;
  submitListing: string;
  saveChanges: string;
  cancel: string;
  markReserved: string;
  markClosed: string;
  markAvailable: string;
  deleteListing: string;
  editListing: string;
  replyPlaceholder: string;
  sendReply: string;
  closeInquiry: string;
  receivedInquiries: string;
  sentInquiries: string;
  incomingOrdersTitle: string;
  placedOrdersTitle: string;
  confirmOrderAction: string;
  completeOrderAction: string;
  cancelOrderAction: string;
  deleteOrderAction: string;
  allOrdersTitle: string;
  allListingsTitle: string;
  emptyOrders: string;
  emptySaved: string;
  emptyMyListings: string;
  emptyInbox: string;
  howItWorksTitle: string;
  step1Title: string;
  step1Body: string;
  step2Title: string;
  step2Body: string;
  step3Title: string;
  step3Body: string;
  footerNote: string;
  showcaseBadge: string;
  publishStarterPrompt: string;
  dashTitle: string;
  dashSubtitle: string;
  dashBreadcrumbRoot: string;
  dashNavOverview: string;
  dashNavListings: string;
  dashNavOrders: string;
  dashNavDemand: string;
  dashThemeLabel: string;
  dashThemeCobalt: string;
  dashThemeIndigo: string;
  dashThemeAmber: string;
  dashKpiListings: string;
  dashKpiOrders: string;
  dashKpiVolume: string;
  dashKpiDemand: string;
  dashCategoryMix: string;
  dashNeighborhoodMix: string;
  dashSaleVsRent: string;
  dashRecentActivity: string;
  dashColItem: string;
  dashColCategory: string;
  dashColType: string;
  dashColLocation: string;
  dashColStatus: string;
  dashColPrice: string;
  dashColAction: string;
  dashOpenDetails: string;
  dashAllStatuses: string;
  dashNoActivity: string;
  dashSignInForOrders: string;
  phoneInputLabel: string;
  phonePlaceholder: string;
  phonePrivacyNote: string;
  phoneHiddenLabel: string;
  phoneValidationError: string;
  dashNavContacts: string;
  dashContactsTitle: string;
  dashContactsSubtitle: string;
  dashRoleAll: string;
  dashRoleSeller: string;
  dashRoleBuyer: string;
  dashColUser: string;
  dashColRole: string;
  dashColPhone: string;
  dashColSource: string;
  dashColDate: string;
  dashNoContacts: string;
  photosSectionTitle: string;
  photosSectionSub: string;
  uploadAllSixLabel: string;
  takePhotoLabel: string;
  uploadPhotoLabel: string;
  retakePhotoLabel: string;
  removePhotoLabel: string;
  setCoverLabel: string;
  coverAngleLabel: string;
  photosCountSuffix: string;
  cameraModalTitle: string;
  cameraSnapButton: string;
  cameraSwitchButton: string;
  cameraPermissionFallback: string;
  photoCompressError: string;
  photoRequiredError: string;
  useSamplePhotosLabel: string;
  tabNotifications: string;
  notifNewOrderPlaced: string;
  notifOrderConfirmed: string;
  notifOrderCompleted: string;
  notifOrderCancelled: string;
  notifMarkRead: string;
  notifMarkAllRead: string;
  notifClearRead: string;
  notifEnableDesktop: string;
  notifDesktopEnabled: string;
  notifDesktopBlocked: string;
  notifEmpty: string;
  notifViewOrder: string;
  notifUnreadLabel: string;
  notifLiveHeading: string;
  rentalOptionsHeading: string;
  roomClassLabel: string;
  roomClassAll: string;
  roomClass1: string;
  roomClass2: string;
  roomClass3Plus: string;
  tenantPrefLabel: string;
  tenantPrefAll: string;
  tenantPrefLate: string;
  tenantPrefBaleTedar: string;
  tenantPrefAny: string;
  locationPlaceholder: string;
  locationFilterPlaceholder: string;
  voiceDescLabel: string;
  voiceDescSub: string;
  voiceRecordStart: string;
  voiceRecordStop: string;
  voiceRecordingActive: string;
  voiceUploadAudio: string;
  voiceRerecord: string;
  voiceRemove: string;
  voiceAttachedBadge: string;
  voicePlayHeading: string;
  voiceMicError: string;
  voiceTooLargeError: string;
  voiceOrTextError: string;
  videoSectionTitle: string;
  videoSectionSub: string;
  videoRecordStart: string;
  videoRecordModalTitle: string;
  videoRecordBegin: string;
  videoRecordStop: string;
  videoRecordingActive: string;
  videoUploadButton: string;
  videoRecordDevice: string;
  videoRerecord: string;
  videoRemove: string;
  videoAttachedBadge: string;
  videoPlayHeading: string;
  videoLoadingLabel: string;
  videoCompressingLabel: string;
  videoCameraError: string;
  videoTooLargeError: string;
  videoInvalidFileError: string;
  vehicleTypeLabel: string;
  vehicleModelLabel: string;
  goodsTypeLabel: string;
  goodsModelLabel: string;
  allVehicleTypes: string;
  allGoodsTypes: string;
  allModels: string;
  vehicleModelPlaceholder: string;
  goodsModelPlaceholder: string;
  vehicleNavHeading: string;
  goodsNavHeading: string;
  vehicleTypeSuv: string;
  vehicleTypeSedan: string;
  vehicleTypeCompact: string;
  vehicleTypeCrossover: string;
  vehicleTypePickup: string;
  vehicleTypeVan: string;
  vehicleTypeBus: string;
  vehicleTypeTruck: string;
  vehicleTypeElectric: string;
  vehicleTypeHybrid: string;
  vehicleTypeLuxury: string;
  vehicleTypeStationWagon: string;
  vehicleTypeCoupe: string;
  vehicleTypeConvertible: string;
  vehicleTypeMotorcycle: string;
  vehicleTypeMachinery: string;
  goodsTypeElectronics: string;
  goodsTypePhonesTech: string;
  goodsTypeFurniture: string;
  goodsTypeAppliances: string;
  goodsTypeMachineryTools: string;
  goodsTypeFashionHome: string;
  goodsTypeOther: string;
}

const en: Dictionary = {
  brand: 'Kas Market',
  navExplore: 'Browse',
  navDashboard: 'Dashboard',
  navBuyerStudio: 'Buyer Studio',
  navProperties: 'Properties',
  navVehicles: 'Vehicles',
  navGoods: 'Goods',
  navConnections: 'Orders & Inbox',
  navConnectionsUser: 'Listings & Inbox',
  navBuy: 'Buy',
  navRent: 'Rent',
  navSell: 'Sell',
  postListing: 'Sell / Post',
  heroTitle: 'Properties, land, vehicles, and goods in one direct marketplace.',
  heroSubtitle:
    'Browse verified homes, condominiums, and apartments for rent or sale, surveyed land plots, inspected vehicles, and everyday items—place orders or connect directly with owners.',
  searchPlaceholder: 'Search condominium, apartment, Bole, RAV4, land plot...',
  searchButton: 'Search',
  heroLocationCaption: 'Bole · Old Airport · Kazanchis · CMC · Sarbet',
  stripPropertiesTitle: 'Apartments, Condos & Houses',
  stripPropertiesSub: 'For Sale & For Rent',
  stripLandTitle: 'Land & Plots',
  stripLandSub: 'Surveyed Parcels',
  stripVehiclesTitle: 'Vehicles',
  stripVehiclesSub: 'Cars, SUVs & Rentals',
  stripGoodsTitle: 'Goods & Equipment',
  stripGoodsSub: 'Furniture, Tech & More',
  allCategories: 'All',
  catApartment: 'Apartments',
  catCondominium: 'Condominiums',
  catHouse: 'Houses',
  catLand: 'Land',
  catVehicle: 'Vehicles',
  catGoods: 'Goods',
  txAll: 'All',
  txSale: 'For Sale',
  txRent: 'For Rent',
  allLocations: 'All Locations',
  sortNewest: 'Newest First',
  sortPriceAsc: 'Price: Low to High',
  sortPriceDesc: 'Price: High to Low',
  signInGoogle: 'Sign In',
  signOut: 'Sign Out',
  signedInAs: 'Account',
  resultsCount: 'listings',
  noListingsFound: 'No listings match your current filters.',
  resetFilters: 'Reset Filters',
  viewDetails: 'Details',
  orderNow: 'Order',
  reserveNow: 'Book / Order',
  saveListing: 'Save',
  savedListing: 'Saved',
  statusAvailable: 'Available',
  statusReserved: 'Reserved',
  statusClosed: 'Sold / Rented',
  periodTotal: 'Total',
  periodMonthly: 'mo',
  periodYearly: 'yr',
  placeOrderTab: 'Place Order',
  askSellerTab: 'Message Seller',
  connectWithSeller: 'Message Seller',
  yourName: 'Full Name',
  yourContact: 'Phone Number',
  yourMessage: 'Message to Seller',
  sendInquiry: 'Send Message',
  inquirySent: 'Your message has been sent directly to the seller. Track replies in Orders & Inbox.',
  signInToConnect: 'Sign in with Google to message this seller directly.',
  signInToOrder: 'Sign in with Google to place an order and receive an instant confirmation receipt.',
  ownListingNotice: 'This is your active listing. Manage incoming orders or edits in Orders & Inbox.',
  ownListingNoticeUser: 'This is your active listing. Manage edits or buyer messages in Listings & Inbox.',
  showcaseNotice: 'Sample catalog preview. You can place a demo order on the Place Order tab, or post a community listing.',
  quantityLabel: 'Quantity',
  paymentMethodLabel: 'Payment / Settlement Method',
  payCashOnDelivery: 'Cash on Delivery / On-Site',
  payBankTransfer: 'Bank Transfer (CBE / Awash)',
  payTelebirr: 'Telebirr Mobile Payment',
  payInspectionEscrow: 'Inspection & Contract Escrow',
  deliveryAddressLabel: 'Delivery or Inspection Address',
  deliveryAddressPlaceholder: 'e.g. Bole Atlas, House #24 or Pickup at Seller Location',
  orderNotesLabel: 'Notes (Optional)',
  orderTotalLabel: 'Order Total',
  confirmOrderButton: 'Place Order Now',
  orderConfirmedTitle: 'Order Confirmed',
  orderConfirmedBody: 'Your order is saved and shared with the seller for confirmation.',
  orderConfirmedBuyerBody: 'Your order has been received and sent directly to the Kas Market administrator for review and processing.',
  viewMyOrders: 'View My Orders',
  specsHeading: 'Key Specifications',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  areaSqm: 'Area',
  titleDeed: 'Title / Deed',
  vehicleYear: 'Model Year',
  mileageKm: 'Mileage',
  transmission: 'Transmission',
  fuelType: 'Fuel Type',
  condition: 'Condition',
  sellerLabel: 'Listed by',
  locationLabel: 'Location',
  connectionsTitle: 'Orders & Seller Hub',
  connectionsUserTitle: 'My Listings & Messages',
  tabOrders: 'Orders',
  tabSaved: 'Saved',
  tabMyListings: 'My Listings',
  tabInbox: 'Messages',
  backToMarketplace: 'Back to Browse',
  sellerPageTitle: 'Seller Studio — Post a Listing',
  sellerPageSubtitle:
    'Choose whether you are selling or renting out, then enter what you are offering directly below.',
  chooseSaleOrRentLabel: '1. Choose Listing Mode',
  sellOptionDesc: 'Sell property, land, vehicles, or items outright',
  rentOptionDesc: 'Rent out apartments, houses, vehicles, or equipment',
  whatSellingLabel: '2. What are you selling?',
  whatRentingLabel: '2. What are you renting out?',
  buyerStudioTitle: 'Buyer Studio — Find, Compare & Order',
  buyerStudioSubtitle:
    'Choose whether you want to buy or rent, set your category and budget, compare options side-by-side, or post a wanted request.',
  chooseBuyOrRentLabel: '1. Choose Whether You Want to Buy or Rent',
  buyOptionTitle: 'Looking to Buy',
  buyOptionDesc: 'Purchase apartments, houses, land plots, vehicles, or goods',
  rentBuyerOptionTitle: 'Looking to Rent',
  rentBuyerOptionDesc: 'Rent apartments, houses, vehicles, or commercial spaces',
  whatBuyingLabel: '2. What do you want to buy?',
  whatRentingBuyerLabel: '2. What do you want to rent?',
  maxBudgetLabel: 'Max Budget',
  matchingListingsTitle: 'Matching Listings',
  compareLabel: 'Compare',
  comparingTitle: 'Side-by-Side Comparison',
  clearCompare: 'Clear',
  postWantedTitle: 'Post a Buyer Request',
  postWantedSubtitle: 'Cannot find an exact match? Publish what you need so sellers can reach out.',
  wantedTitleLabel: 'What are you looking for?',
  wantedButton: 'Publish Buyer Request',
  wantedSuccess: 'Your buyer request is now live.',
  activeWantedTitle: 'Live Buyer Requests',
  markFulfilled: 'Mark Fulfilled',
  livePreviewLabel: 'Live Buyer Preview',
  sellerPostSuccess: 'Your listing is now live on the marketplace for buyers to browse and order.',
  createListingTitle: 'Post a New Listing',
  editListingTitle: 'Edit Listing',
  fieldCategory: 'Category',
  fieldTransaction: 'Listing Type',
  fieldTitle: 'Headline',
  fieldDescription: 'Description',
  fieldPrice: 'Price',
  fieldCurrency: 'Currency',
  fieldPeriod: 'Billing Basis',
  fieldNeighborhood: 'Neighborhood / Sub-city',
  fieldCity: 'City',
  fieldImagePreset: 'Select Category Photo',
  fieldCustomImage: 'Or Custom Image URL (optional)',
  submitListing: 'Publish Listing',
  saveChanges: 'Save Changes',
  cancel: 'Cancel',
  markReserved: 'Mark Reserved',
  markClosed: 'Mark Sold / Rented',
  markAvailable: 'Mark Available',
  deleteListing: 'Delete',
  editListing: 'Edit',
  replyPlaceholder: 'Write a direct reply with viewing times or details...',
  sendReply: 'Send Reply',
  closeInquiry: 'Close Thread',
  receivedInquiries: 'Received Inquiries',
  sentInquiries: 'Sent Inquiries',
  incomingOrdersTitle: 'Incoming Buyer Orders',
  placedOrdersTitle: 'My Placed Orders',
  confirmOrderAction: 'Confirm Order',
  completeOrderAction: 'Mark Completed',
  cancelOrderAction: 'Cancel Order',
  deleteOrderAction: 'Delete Order',
  allOrdersTitle: 'All Marketplace Orders',
  allListingsTitle: 'All Marketplace Listings',
  emptyOrders: 'No orders placed or received yet. Browse the marketplace to order any property, vehicle, or item.',
  emptySaved: 'You have not saved any listings yet.',
  emptyMyListings: 'You have not published any listings yet. Use Sell / Post to publish your first listing.',
  emptyInbox: 'No messages yet. Message a seller on any listing or publish your own.',
  howItWorksTitle: 'How Sellers Post & Buyers Order on Kas Market',
  step1Title: '01. Sellers Post in Seconds',
  step1Body: 'Open Sell / Post to publish apartments, villas, land, cars, or goods with live preview, transparent ETB/USD pricing, and clear specs.',
  step2Title: '02. Buyers Browse & Filter',
  step2Body: 'Filter by sale or rent, neighborhood, category, and price to inspect verified details and specifications side-by-side.',
  step3Title: '03. Order & Track Fulfillment',
  step3Body: 'Place an order or booking request with preferred payment terms, get an instant order number, and track seller confirmation.',
  footerNote: 'Direct Marketplace for Real Estate, Land, Vehicles & Goods',
  showcaseBadge: 'Preview Catalog',
  publishStarterPrompt: 'Sign in with Google to publish your own real estate, car, or item listing.',
  dashTitle: 'Marketplace Dashboard',
  dashSubtitle: 'Live inventory, order volume, category distribution, and buyer demand across Kas Market.',
  dashBreadcrumbRoot: 'Dashboard',
  dashNavOverview: 'Overview',
  dashNavListings: 'Listings Ledger',
  dashNavOrders: 'Orders & Volume',
  dashNavDemand: 'Buyer Demand',
  dashThemeLabel: 'Color Theme',
  dashThemeCobalt: 'Cobalt Slate',
  dashThemeIndigo: 'Royal Indigo',
  dashThemeAmber: 'Graphite Gold',
  dashKpiListings: 'Active Listings',
  dashKpiOrders: 'Orders Tracked',
  dashKpiVolume: 'Active Order Value',
  dashKpiDemand: 'Buyer Requests',
  dashCategoryMix: 'Listings by Category',
  dashNeighborhoodMix: 'Top Neighborhoods',
  dashSaleVsRent: 'Sale vs. Rent Split',
  dashRecentActivity: 'Recent Marketplace Listings',
  dashColItem: 'Listing',
  dashColCategory: 'Category',
  dashColType: 'Type',
  dashColLocation: 'Neighborhood',
  dashColStatus: 'Status',
  dashColPrice: 'Price',
  dashColAction: 'Action',
  dashOpenDetails: 'Inspect',
  dashAllStatuses: 'All Statuses',
  dashNoActivity: 'No records match the selected filters.',
  dashSignInForOrders: 'Sign in with Google to view your live incoming and placed orders in this ledger.',
  phoneInputLabel: 'Phone Number (Private to Admin)',
  phonePlaceholder: '+251 911 234 567',
  phonePrivacyNote: 'Required. Kept private and visible only to the platform administrator.',
  phoneHiddenLabel: 'Phone kept private (Admin only)',
  phoneValidationError: 'Please enter a valid phone number (at least 6 characters).',
  dashNavContacts: 'Phone Directory',
  dashContactsTitle: 'Admin-Only Seller & Buyer Phone Directory',
  dashContactsSubtitle: 'Private phone numbers submitted by sellers and buyers. Never exposed to other users.',
  dashRoleAll: 'All Contacts',
  dashRoleSeller: 'Sellers',
  dashRoleBuyer: 'Buyers',
  dashColUser: 'Name & Email',
  dashColRole: 'Role',
  dashColPhone: 'Phone Number',
  dashColSource: 'Submitted Via',
  dashColDate: 'Date',
  dashNoContacts: 'No seller or buyer phone numbers submitted yet.',
  photosSectionTitle: '6-Angle Photos',
  photosSectionSub: 'Take live photos or upload up to 6 different angles of what you are selling or renting.',
  uploadAllSixLabel: 'Upload up to 6 at once',
  takePhotoLabel: 'Take Photo',
  uploadPhotoLabel: 'Upload',
  retakePhotoLabel: 'Retake',
  removePhotoLabel: 'Remove',
  setCoverLabel: 'Set Cover',
  coverAngleLabel: 'Cover Photo',
  photosCountSuffix: 'photos',
  cameraModalTitle: 'Take Angle Photo',
  cameraSnapButton: 'Capture Photo',
  cameraSwitchButton: 'Switch Camera',
  cameraPermissionFallback: 'Live camera unavailable — opening device camera or photo picker.',
  photoCompressError: 'Unable to process that image. Please select a JPG, PNG, or WebP photo.',
  photoRequiredError: 'Please add at least 1 photo (up to 6 different angles supported).',
  useSamplePhotosLabel: 'Fill remaining with category sample',
  tabNotifications: 'Notifications',
  notifNewOrderPlaced: 'New order placed',
  notifOrderConfirmed: 'Order confirmed by seller',
  notifOrderCompleted: 'Order marked completed',
  notifOrderCancelled: 'Order was cancelled',
  notifMarkRead: 'Mark Read',
  notifMarkAllRead: 'Mark All Read',
  notifClearRead: 'Clear',
  notifEnableDesktop: 'Enable Desktop Alerts',
  notifDesktopEnabled: 'Desktop Alerts Active',
  notifDesktopBlocked: 'Browser notifications blocked',
  notifEmpty: 'No order notifications yet. Alerts arrive automatically whenever an order is placed or updated.',
  notifViewOrder: 'View Order',
  notifUnreadLabel: 'unread',
  notifLiveHeading: 'Order Notification',
  rentalOptionsHeading: 'Rental Room & Tenant Options',
  roomClassLabel: 'Room Count (Class)',
  roomClassAll: 'All Classes',
  roomClass1: '1 Class (1 Room)',
  roomClass2: '2 Class (2 Rooms)',
  roomClass3Plus: '3+ Class (3+ Rooms)',
  tenantPrefLabel: 'Tenant Preference',
  tenantPrefAll: 'Late & Bale Tedar',
  tenantPrefLate: 'Late (Single)',
  tenantPrefBaleTedar: 'Bale Tedar (Married)',
  tenantPrefAny: 'Both (Late / Bale Tedar)',
  locationPlaceholder: 'Type any location (e.g. Bole, Ayat, Jemo, Adama...)',
  locationFilterPlaceholder: 'Type any place...',
  voiceDescLabel: 'Voice Description (Optional)',
  voiceDescSub: 'Record up to 45s of your voice explaining the item or property, or upload a short audio clip.',
  voiceRecordStart: 'Record Voice',
  voiceRecordStop: 'Stop Recording',
  voiceRecordingActive: 'Recording...',
  voiceUploadAudio: 'Upload Audio',
  voiceRerecord: 'Re-record',
  voiceRemove: 'Remove Voice',
  voiceAttachedBadge: 'Voice',
  voicePlayHeading: 'Seller Voice Description',
  voiceMicError: 'Microphone access is unavailable. You can still upload a short audio file.',
  voiceTooLargeError: 'Audio clip is too large (max ~45 seconds / 160 KB). Please record a shorter clip.',
  voiceOrTextError: 'Please write at least 10 characters in the description or record a voice description.',
  videoSectionTitle: 'Listing Video (Optional)',
  videoSectionSub: 'Record a short walkthrough video (up to 30s) or upload a video clip in addition to your photos.',
  videoRecordStart: 'Record Video',
  videoRecordModalTitle: 'Record Listing Video',
  videoRecordBegin: 'Start Recording',
  videoRecordStop: 'Stop & Save',
  videoRecordingActive: 'Recording Video...',
  videoUploadButton: 'Upload Video',
  videoRecordDevice: 'Use Device Camera',
  videoRerecord: 'Re-record Video',
  videoRemove: 'Remove Video',
  videoAttachedBadge: 'Video',
  videoPlayHeading: 'Property / Item Video Walkthrough',
  videoLoadingLabel: 'Loading video walkthrough...',
  videoCompressingLabel: 'Preparing & optimizing video...',
  videoCameraError: 'Live video camera is unavailable in this view. Use your device camera or upload a video file.',
  videoTooLargeError: 'Video file is too large (max ~30 seconds / 2.2 MB after compression). Please record or choose a shorter clip.',
  videoInvalidFileError: 'Unable to read that video file. Please select an MP4, WebM, or MOV video.',
  vehicleTypeLabel: 'Vehicle Type',
  vehicleModelLabel: 'Model',
  goodsTypeLabel: 'Goods Type',
  goodsModelLabel: 'Model / Brand',
  allVehicleTypes: 'All Vehicle Types',
  allGoodsTypes: 'All Goods Types',
  allModels: 'All Models',
  vehicleModelPlaceholder: 'Type or choose model (e.g. Toyota RAV4, Vitz, Hilux...)',
  goodsModelPlaceholder: 'Type or choose model (e.g. iPhone 15, LG TV, Samsung...)',
  vehicleNavHeading: 'Vehicle Type & Model Navigation',
  goodsNavHeading: 'Goods Type & Model Navigation',
  vehicleTypeSuv: 'SUV / 4x4',
  vehicleTypeSedan: 'Sedan',
  vehicleTypeCompact: 'Compact / Hatchback',
  vehicleTypeCrossover: 'Crossover / CUV',
  vehicleTypePickup: 'Pickup / 4WD',
  vehicleTypeVan: 'Van / Minibus',
  vehicleTypeBus: 'Bus / Coaster',
  vehicleTypeTruck: 'Truck / Heavy Duty',
  vehicleTypeElectric: 'Electric / EV',
  vehicleTypeHybrid: 'Hybrid',
  vehicleTypeLuxury: 'Luxury / VIP',
  vehicleTypeStationWagon: 'Station Wagon',
  vehicleTypeCoupe: 'Coupe / Sport',
  vehicleTypeConvertible: 'Convertible',
  vehicleTypeMotorcycle: 'Motorcycle / Bajaj',
  vehicleTypeMachinery: 'Heavy Machinery',
  goodsTypeElectronics: 'Electronics & TV',
  goodsTypePhonesTech: 'Phones & Computers',
  goodsTypeFurniture: 'Furniture',
  goodsTypeAppliances: 'Home Appliances',
  goodsTypeMachineryTools: 'Machinery & Tools',
  goodsTypeFashionHome: 'Fashion & Living',
  goodsTypeOther: 'Other Goods',
};

const am: Dictionary = {
  brand: 'Kas Market',
  navExplore: 'ገበያ',
  navDashboard: 'ዳሽቦርድ',
  navBuyerStudio: 'የገዥ ገጽ',
  navProperties: 'ንብረቶች',
  navVehicles: 'መኪኖች',
  navGoods: 'ዕቃዎች',
  navConnections: 'ትዕዛዞች',
  navConnectionsUser: 'ዝርዝሮቼ እና መልዕክቶች',
  navBuy: 'መግዛት',
  navRent: 'መከራየት',
  navSell: 'መሸጥ',
  postListing: 'ለመሸጥ ለጥፍ',
  heroTitle: 'ቤቶች፣ ኮንዶሚኒየም፣ አፓርታማ፣ መሬት፣ መኪኖች እና የተለያዩ ዕቃዎች በአንድ ቦታ።',
  heroSubtitle:
    'የሚከራዩ እና የሚሸጡ ቤቶችን፣ ኮንዶሚኒየሞችን፣ አፓርታማዎችን፣ ቦታዎችን፣ መኪኖችን እና የተለያዩ ዕቃዎችን እያዩ በቀጥታ ይዘዙ ወይም ከባለቤቶች ጋር ይገናኙ።',
  searchPlaceholder: 'ኮንዶሚኒየም፣ አፓርታማ፣ ቦሌ፣ RAV4፣ መሬት ይፈልጉ...',
  searchButton: 'ፈልግ',
  heroLocationCaption: 'ቦሌ · ኦልድ ኤርፖርት · ካዛንቺስ · ሲኤምሲ · ሳርቤት',
  stripPropertiesTitle: 'አፓርታማ፣ ኮንዶሚኒየም እና ቤቶች',
  stripPropertiesSub: 'ለሽያጭ እና ለኪራይ',
  stripLandTitle: 'መሬት እና ቦታዎች',
  stripLandSub: 'ካርታ ያላቸው ቦታዎች',
  stripVehiclesTitle: 'መኪኖች',
  stripVehiclesSub: 'ለሽያጭ እና ለኪራይ',
  stripGoodsTitle: 'የተለያዩ ዕቃዎች',
  stripGoodsSub: 'የቤት ዕቃ እና ኤሌክትሮኒክስ',
  allCategories: 'ሁሉም',
  catApartment: 'አፓርታማ',
  catCondominium: 'ኮንዶሚኒየም',
  catHouse: 'ቤቶች',
  catLand: 'መሬት',
  catVehicle: 'መኪኖች',
  catGoods: 'ዕቃዎች',
  txAll: 'ሁሉም',
  txSale: 'ለሽያጭ',
  txRent: 'ለኪራይ',
  allLocations: 'ሁሉም አካባቢዎች',
  sortNewest: 'አዲስ የገቡ',
  sortPriceAsc: 'ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ',
  sortPriceDesc: 'ዋጋ፡ ከከፍተኛ ወደ ዝቅተኛ',
  signInGoogle: 'ይግቡ',
  signOut: 'ውጣ',
  signedInAs: 'መለያ',
  resultsCount: 'ዝርዝሮች',
  noListingsFound: 'ከምርጫዎ ጋር የሚዛመድ ማስታወቂያ አልተገኘም።',
  resetFilters: 'ማጣሪያ አጽዳ',
  viewDetails: 'ዝርዝር',
  orderNow: 'ይዘዙ',
  reserveNow: 'ይያዙ / ይዘዙ',
  saveListing: 'አስቀምጥ',
  savedListing: 'ተቀምጧል',
  statusAvailable: 'ክፍት ነው',
  statusReserved: 'ተይዟል',
  statusClosed: 'ተሽጧል / ተከራይቷል',
  periodTotal: 'ጠቅላላ',
  periodMonthly: 'በወር',
  periodYearly: 'በዓመት',
  placeOrderTab: 'ትዕዛዝ ስጥ',
  askSellerTab: 'ለሻጭ ጻፍ',
  connectWithSeller: 'ለሻጭ መልዕክት ላክ',
  yourName: 'ሙሉ ስም',
  yourContact: 'ስልክ ቁጥር',
  yourMessage: 'ለሻጭ መልዕክት',
  sendInquiry: 'መልዕክት ላክ',
  inquirySent: 'መልዕክትዎ ለባለቤቱ በቀጥታ ተልኳል። ምላሹን በትዕዛዞች ክፍል ይከታተሉ።',
  signInToConnect: 'ለሻጭ መልዕክት ለመላክ በGoogle ይግቡ።',
  signInToOrder: 'ትዕዛዝ ለመስጠት እና ደረሰኝ ለማግኘት በGoogle ይግቡ።',
  ownListingNotice: 'ይህ የራስዎ ማስታወቂያ ነው። የገዥ ትዕዛዞችን ከትዕዛዞች ክፍል ያስተዳድሩ።',
  ownListingNoticeUser: 'ይህ የራስዎ ማስታወቂያ ነው። ማስተካከያዎችን ወይም የገዥ መልዕክቶችን ከዝርዝሮቼ እና መልዕክቶች ክፍል ያስተዳድሩ።',
  showcaseNotice: 'የናሙና ዝርዝር ነው። በትዕዛዝ ትር ላይ በቀጥታ መሞከር ወይም የማህበረሰብ ማስታወቂያ መምረጥ ይችላሉ።',
  quantityLabel: 'ብዛት',
  paymentMethodLabel: 'የክፍያ ዘዴ',
  payCashOnDelivery: 'ዕቃው ሲደርስ በጥሬ ገንዘብ',
  payBankTransfer: 'የባንክ ዝውውር (CBE / አዋሽ)',
  payTelebirr: 'ቴሌብር (Telebirr)',
  payInspectionEscrow: 'ምርመራ እና ውል ሲፈጸም',
  deliveryAddressLabel: 'የማድረሻ ወይም የመገናኛ አድራሻ',
  deliveryAddressPlaceholder: 'ለምሳሌ፡ ቦሌ አትላስ ወይም በሻጭ ቦታ መውሰድ',
  orderNotesLabel: 'ተጨማሪ ማስታወሻ (አማራጭ)',
  orderTotalLabel: 'ጠቅላላ ዋጋ',
  confirmOrderButton: 'ትዕዛዝ አረጋግጥ',
  orderConfirmedTitle: 'ትዕዛዝዎ ተመዝግቧል',
  orderConfirmedBody: 'ትዕዛዝዎ ተቀምጧል፣ ሻጩ እስኪያረጋግጥ በትዕዛዞች ክፍል መከታተል ይችላሉ።',
  orderConfirmedBuyerBody: 'ትዕዛዝዎ ተመዝግቦ ለማረጋገጫ ወደ መድረኩ አስተዳዳሪ (Admin) በቀጥታ ተልኳል።',
  viewMyOrders: 'ትዕዛዞቼን ይዩ',
  specsHeading: 'ዝርዝር መረጃ',
  bedrooms: 'መኝታ ክፍሎች',
  bathrooms: 'መታጠቢያ',
  areaSqm: 'ስፋት',
  titleDeed: 'ካርታ / ሰነድ',
  vehicleYear: 'የተመረተበት ዓመት',
  mileageKm: 'የሄደበት ኪ.ሜ',
  transmission: 'ማርሽ',
  fuelType: 'ነዳጅ',
  condition: 'ሁኔታ',
  sellerLabel: 'አቅራቢ',
  locationLabel: 'አካባቢ',
  connectionsTitle: 'ትዕዛዞች እና የሻጭ ማዕከል',
  connectionsUserTitle: 'የእኔ ማስታወቂያዎች እና መልዕክቶች',
  tabOrders: 'ትዕዛዞች',
  tabSaved: 'የተቀመጡ',
  tabMyListings: 'የእኔ ማስታወቂያዎች',
  tabInbox: 'መልዕክቶች',
  backToMarketplace: 'ወደ ገበያ ተመለስ',
  sellerPageTitle: 'የሻጭ ገጽ — ማስታወቂያ ለጥፍ',
  sellerPageSubtitle:
    'መጀመሪያ የሚሸጥ ወይም የሚከራይ ይምረጡ፣ ከዚያ ከስሩ የሚሸጡትን ወይም የሚያከራዩትን ያስገቡ።',
  chooseSaleOrRentLabel: '1. የሚሸጥ ወይም የሚከራይ ይምረጡ',
  sellOptionDesc: 'ቤት፣ መሬት፣ መኪና ወይም የተለያዩ ዕቃዎችን ለመሸጥ',
  rentOptionDesc: 'አፓርታማ፣ ቤት፣ መኪና ወይም ዕቃ ለማከራየት',
  whatSellingLabel: '2. የሚሸጡትን ነገር ይምረጡ እና ያስገቡ',
  whatRentingLabel: '2. የሚያከራዩትን ነገር ይምረጡ እና ያስገቡ',
  buyerStudioTitle: 'የገዥ ገጽ — ይፈልጉ፣ ያወዳድሩ እና ይዘዙ',
  buyerStudioSubtitle:
    'መግዛት ወይም መከራየት የሚፈልጉትን ይምረጡ፣ ምድብ እና በጀት ያስገቡ፣ አማራጮችን ጎን ለጎን ያወዳድሩ ወይም የሚፈልጉትን ይለጥፉ።',
  chooseBuyOrRentLabel: '1. ለመግዛት ወይም ለመከራየት ይምረጡ',
  buyOptionTitle: 'ለመግዛት እፈልጋለሁ',
  buyOptionDesc: 'አፓርታማ፣ ቤት፣ መሬት፣ መኪና ወይም ዕቃ ለመግዛት',
  rentBuyerOptionTitle: 'ለመከራየት እፈልጋለሁ',
  rentBuyerOptionDesc: 'አፓርታማ፣ ቤት፣ መኪና ወይም ዕቃ ለመከራየት',
  whatBuyingLabel: '2. ምን መግዛት ይፈልጋሉ?',
  whatRentingBuyerLabel: '2. ምን መከራየት ይፈልጋሉ?',
  maxBudgetLabel: 'ከፍተኛ በጀት',
  matchingListingsTitle: 'ተዛማጅ ማስታወቂያዎች',
  compareLabel: 'አወዳድር',
  comparingTitle: 'ጎን ለጎን ማወዳደሪያ',
  clearCompare: 'አጽዳ',
  postWantedTitle: 'የምፈልገው ማስታወቂያ ለጥፍ',
  postWantedSubtitle: 'የሚፈልጉትን በትክክል ካላገኙ፣ ሻጮች እንዲያቀርቡልዎ እዚህ ይለጥፉ።',
  wantedTitleLabel: 'ምን እየፈለጉ ነው?',
  wantedButton: 'ፍላጎቴን ለጥፍ',
  wantedSuccess: 'የገዥ ጥያቄዎ በቀጥታ ታትሟል።',
  activeWantedTitle: 'የገዥዎች ፍላጎት ዝርዝር',
  markFulfilled: 'ተገኝቷል በል',
  livePreviewLabel: 'የገዥ እይታ ቅድመ-ዕይታ',
  sellerPostSuccess: 'ማስታወቂያዎ በገበያው ላይ በቀጥታ ታትሟል። ገዥዎች አይተው ማዘዝ ይችላሉ።',
  createListingTitle: 'አዲስ ማስታወቂያ ለጥፍ',
  editListingTitle: 'ማስታወቂያ አስተካክል',
  fieldCategory: 'ምድብ',
  fieldTransaction: 'ዓይነት',
  fieldTitle: 'ርዕስ',
  fieldDescription: 'ዝርዝር መግለጫ',
  fieldPrice: 'ዋጋ',
  fieldCurrency: 'ምንዛሬ',
  fieldPeriod: 'የክፍያ ጊዜ',
  fieldNeighborhood: 'ሰፈር / ክፍለ ከተማ',
  fieldCity: 'ከተማ',
  fieldImagePreset: 'ምስል ይምረጡ',
  fieldCustomImage: 'ወይም የምስል ሊንክ (አማራጭ)',
  submitListing: 'ማስታወቂያ አትም',
  saveChanges: 'ለውጦችን አስቀምጥ',
  cancel: 'ሰርዝ',
  markReserved: 'ተይዟል በል',
  markClosed: 'ተሽጧል / ተከራይቷል በል',
  markAvailable: 'ክፍት ነው በል',
  deleteListing: 'አጥፋ',
  editListing: 'አስተካክል',
  replyPlaceholder: 'የቀጠሮ ሰዓት ወይም ዝርዝር መልስ ይጻፉ...',
  sendReply: 'መልስ ላክ',
  closeInquiry: 'ውይይት ዝጋ',
  receivedInquiries: 'የደረሱ መልዕክቶች',
  sentInquiries: 'የተላኩ መልዕክቶች',
  incomingOrdersTitle: 'የገቡ የገዥ ትዕዛዞች',
  placedOrdersTitle: 'ያዘዝኳቸው ትዕዛዞች',
  confirmOrderAction: 'ትዕዛዝ አረጋግጥ',
  completeOrderAction: 'ተጠናቋል በል',
  cancelOrderAction: 'ትዕዛዝ ሰርዝ',
  deleteOrderAction: 'ትዕዛዝ አጥፋ',
  allOrdersTitle: 'ሁሉም የገበያ ትዕዛዞች',
  allListingsTitle: 'ሁሉም የገበያ ማስታወቂያዎች',
  emptyOrders: 'እስካሁን የገባ ወይም የተላከ ትዕዛዝ የለም።',
  emptySaved: 'እስካሁን ያስቀመጡት ማስታወቂያ የለም።',
  emptyMyListings: 'እስካሁን የለጠፉት ማስታወቂያ የለም። ለመሸጥ ለጥፍ የሚለውን ይጫኑ።',
  emptyInbox: 'እስካሁን ምንም መልዕክት የለም።',
  howItWorksTitle: 'ሻጮች እንዴት ይለጥፋሉ? ገዥዎችስ እንዴት ያዛሉ?',
  step1Title: '01. ሻጮች በቀላሉ ይለጥፋሉ',
  step1Body: 'በለመሸጥ ለጥፍ ገጽ አፓርታማ፣ ቤት፣ መሬት፣ መኪና ወይም ዕቃ ከፎቶ እና ከዋጋ ጋር በቀጥታ ያትማሉ።',
  step2Title: '02. ገዥዎች እያዩ ይመርጣሉ',
  step2Body: 'በምድብ፣ በአካባቢ፣ በሽያጭ ወይም በኪራይ በማጣራት ሁሉንም ዝርዝር መረጃዎች በግልጽ ያያሉ።',
  step3Title: '03. በቀጥታ ትዕዛዝ ይሰጣሉ',
  step3Body: 'ገዥዎች የክፍያ ዘዴ እና አድራሻ በመምረጥ ትዕዛዝ ይሰጣሉ፣ ሻጮችም በቅጽበት አይተው ያረጋግጣሉ።',
  footerNote: 'የሪል እስቴት፣ መሬት፣ መኪኖች እና ዕቃዎች ቀጥታ የገበያ መድረክ',
  showcaseBadge: 'ናሙና',
  publishStarterPrompt: 'የራስዎን ቤት፣ መኪና ወይም ዕቃ ለመለጠፍ በGoogle ይግቡ።',
  dashTitle: 'የገበያ ዳሽቦርድ',
  dashSubtitle: 'የማስታወቂያዎች ብዛት፣ የትዕዛዝ መጠን፣ የምድብ ስርጭት እና የገዥ ፍላጎት በቀጥታ።',
  dashBreadcrumbRoot: 'ዳሽቦርድ',
  dashNavOverview: 'አጠቃላይ እይታ',
  dashNavListings: 'የዝርዝር ሰንጠረዥ',
  dashNavOrders: 'ትዕዛዞች እና ገቢ',
  dashNavDemand: 'የገዥ ፍላጎት',
  dashThemeLabel: 'የቀለም ምርጫ',
  dashThemeCobalt: 'ሰማያዊ እና ግራጫ',
  dashThemeIndigo: 'ሐምራዊ ሰማያዊ',
  dashThemeAmber: 'ወርቃማ ግራጫ',
  dashKpiListings: 'ክፍት ማስታወቂያዎች',
  dashKpiOrders: 'ጠቅላላ ትዕዛዞች',
  dashKpiVolume: 'የትዕዛዝ ጠቅላላ ዋጋ',
  dashKpiDemand: 'የገዥ ጥያቄዎች',
  dashCategoryMix: 'ማስታወቂያዎች በምድብ',
  dashNeighborhoodMix: 'ዋና አካባቢዎች',
  dashSaleVsRent: 'የሽያጭ እና የኪራይ ክፍፍል',
  dashRecentActivity: 'የቅርብ ጊዜ ማስታወቂያዎች',
  dashColItem: 'ማስታወቂያ',
  dashColCategory: 'ምድብ',
  dashColType: 'ዓይነት',
  dashColLocation: 'አካባቢ',
  dashColStatus: 'ሁኔታ',
  dashColPrice: 'ዋጋ',
  dashColAction: 'እርምጃ',
  dashOpenDetails: 'ክፈት',
  dashAllStatuses: 'ሁሉም ሁኔታዎች',
  dashNoActivity: 'ከምርጫዎ ጋር የሚዛመድ መረጃ አልተገኘም።',
  dashSignInForOrders: 'የእርስዎን የገቡ እና የተላኩ ትዕዛዞች ለማየት በGoogle ይግቡ።',
  phoneInputLabel: 'ስልክ ቁጥር (ለአስተዳዳሪ ብቻ የሚታይ)',
  phonePlaceholder: '+251 911 234 567',
  phonePrivacyNote: 'ግዴታ ነው። ስልክ ቁጥርዎ በሚስጥር ተይዞ ለመድረኩ አስተዳዳሪ ብቻ ይታያል።',
  phoneHiddenLabel: 'ስልክ በሚስጥር ተይዟል (ለአስተዳዳሪ ብቻ)',
  phoneValidationError: 'እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ (ቢያንስ 6 ቁጥሮች)።',
  dashNavContacts: 'የስልክ ማውጫ',
  dashContactsTitle: 'ለአስተዳዳሪ ብቻ የሚታይ የሻጭ እና የገዥ ስልክ ማውጫ',
  dashContactsSubtitle: 'በሻጮች እና በገዥዎች የገቡ ስልክ ቁጥሮች። ለሌሎች ተጠቃሚዎች አይታዩም።',
  dashRoleAll: 'ሁሉም',
  dashRoleSeller: 'ሻጮች',
  dashRoleBuyer: 'ገዥዎች',
  dashColUser: 'ስም እና ኢሜይል',
  dashColRole: 'ሚና',
  dashColPhone: 'ስልክ ቁጥር',
  dashColSource: 'የገባበት መንገድ',
  dashColDate: 'ቀን',
  dashNoContacts: 'እስካሁን የገባ የሻጭ ወይም የገዥ ስልክ ቁጥር የለም።',
  photosSectionTitle: 'የተለያዩ 6 የፎቶ አንግሎች',
  photosSectionSub: 'የሚሸጡትን ወይም የሚያከራዩትን ዕቃ/ንብረት ከተለያዩ አንግሎች እስከ 6 ፎቶዎችን አንስተው ይጫኑ።',
  uploadAllSixLabel: 'እስከ 6 ፎቶ በአንድ ጊዜ ምረጥ',
  takePhotoLabel: 'ፎቶ አንሳ',
  uploadPhotoLabel: 'ጫን',
  retakePhotoLabel: 'ድገም',
  removePhotoLabel: 'አጥፋ',
  setCoverLabel: 'ዋና አድርግ',
  coverAngleLabel: 'ዋና ፎቶ',
  photosCountSuffix: 'ፎቶዎች',
  cameraModalTitle: 'በካሜራ ፎቶ አንሳ',
  cameraSnapButton: 'ፎቶ አንሳ',
  cameraSwitchButton: 'ካሜራ ቀይር',
  cameraPermissionFallback: 'ቀጥታ ካሜራ አልተገኘም — የመሳሪያዎን ፎቶ መምረጫ ከፍተናል።',
  photoCompressError: 'ፎቶውን ማዘጋጀት አልተቻለም። እባክዎ JPG ወይም PNG ፎቶ ይምረጡ።',
  photoRequiredError: 'እባክዎ ቢያንስ 1 ፎቶ ያስገቡ (እስከ 6 አንግሎች መጫን ይችላሉ)።',
  useSamplePhotosLabel: 'ናሙና ፎቶ ሙላ',
  tabNotifications: 'ማሳወቂያዎች',
  notifNewOrderPlaced: 'አዲስ ትዕዛዝ ገብቷል',
  notifOrderConfirmed: 'ትዕዛዝዎ በሻጩ ተረጋግጧል',
  notifOrderCompleted: 'ትዕዛዝ ተጠናቋል',
  notifOrderCancelled: 'ትዕዛዝ ተሰርዟል',
  notifMarkRead: 'ተነቧል በል',
  notifMarkAllRead: 'ሁሉንም ተነቧል በል',
  notifClearRead: 'አጥፋ',
  notifEnableDesktop: 'የስክሪን ማሳወቂያ ክፈት',
  notifDesktopEnabled: 'የስክሪን ማሳወቂያ ክፍት ነው',
  notifDesktopBlocked: 'የብራውዘር ማሳወቂያ ተዘግቷል',
  notifEmpty: 'እስካሁን ምንም የትዕዛዝ ማሳወቂያ የለም። አዲስ ትዕዛዝ ሲገባ ወይም ሲቀየር በቀጥታ እዚህ ይደርስዎታል።',
  notifViewOrder: 'ትዕዛዝ ይዩ',
  notifUnreadLabel: 'ያልተነበበ',
  notifLiveHeading: 'የትዕዛዝ ማሳወቂያ',
  rentalOptionsHeading: 'የቤት ኪራይ ክፍል እና የነዋሪ ምርጫ',
  roomClassLabel: 'የክፍል ብዛት (Class)',
  roomClassAll: 'ሁሉም ክፍሎች',
  roomClass1: 'ባለ 1 ክፍል (1 Class)',
  roomClass2: 'ባለ 2 ክፍል (2 Class)',
  roomClass3Plus: 'ባለ 3+ ክፍል (3+ Class)',
  tenantPrefLabel: 'ለማን የሚከራይ (Late / Bale Tedar)',
  tenantPrefAll: 'ሁሉም (ላጤ እና ባለትዳር)',
  tenantPrefLate: 'ላጤ (Late / Single)',
  tenantPrefBaleTedar: 'ባለ ትዳር (Bale Tedar)',
  tenantPrefAny: 'ለላጤም ለባለትዳርም (Both)',
  locationPlaceholder: 'የፈለጉትን ቦታ ይጻፉ (ለምሳሌ፡ ቦሌ፣ አያት፣ ጀሞ፣ አዳማ...)',
  locationFilterPlaceholder: 'የፈለጉትን ቦታ ይጻፉ...',
  voiceDescLabel: 'የድምጽ መግለጫ (Voice — አማራጭ)',
  voiceDescSub: 'ስለ ንብረቱ ወይም ዕቃው እስከ 45 ሰከንድ ድረስ በድምጽዎ ይናገሩ ወይም አጭር ኦዲዮ ይጫኑ።',
  voiceRecordStart: 'በድምጽ ቅዳ',
  voiceRecordStop: 'ቀረጻ አቁም',
  voiceRecordingActive: 'በመቅዳት ላይ...',
  voiceUploadAudio: 'ኦዲዮ ጫን',
  voiceRerecord: 'እንደገና ቅዳ',
  voiceRemove: 'ድምጹን አጥፋ',
  voiceAttachedBadge: 'ድምጽ',
  voicePlayHeading: 'የሻጭ የድምጽ መግለጫ',
  voiceMicError: 'ማይክሮፎን መጠቀም አልተቻለም። በምትኩ አጭር የድምጽ ፋይል መጫን ይችላሉ።',
  voiceTooLargeError: 'የድምጽ ፋይሉ መጠን በዝቷል (ከ45 ሰከንድ / 160 KB ያልበለጠ ይሁን)። እባክዎ አጭር ድምጽ ይቅዱ።',
  voiceOrTextError: 'እባክዎ ቢያንስ 10 ፊደላት መግለጫ ይጻፉ ወይም በድምጽ ይቅዱ።',
  videoSectionTitle: 'የማስታወቂያ ቪዲዮ (ከፎቶ በተጨማሪ — አማራጭ)',
  videoSectionSub: 'ከፎቶዎቹ በተጨማሪ እስከ 30 ሰከንድ የሚደርስ አጭር ቪዲዮ በካሜራ ቀርጸው ወይም ከፋይል ይጫኑ።',
  videoRecordStart: 'ቪዲዮ ቅረጽ',
  videoRecordModalTitle: 'የማስታወቂያ ቪዲዮ ቅረጻ',
  videoRecordBegin: 'ቀረጻ ጀምር',
  videoRecordStop: 'ቀረጻ አቁም እና አስቀምጥ',
  videoRecordingActive: 'ቪዲዮ በመቅረጽ ላይ...',
  videoUploadButton: 'ቪዲዮ ጫን',
  videoRecordDevice: 'በስልክ ካሜራ ቅረጽ',
  videoRerecord: 'እንደገና ቅረጽ',
  videoRemove: 'ቪዲዮ አጥፋ',
  videoAttachedBadge: 'ቪዲዮ',
  videoPlayHeading: 'የንብረቱ / ዕቃው ቪዲዮ',
  videoLoadingLabel: 'ቪዲዮው እየተከፈተ ነው...',
  videoCompressingLabel: 'ቪዲዮው እየተዘጋጀ ነው...',
  videoCameraError: 'ቀጥታ የቪዲዮ ካሜራ አልተገኘም። የመሳሪያዎን ካሜራ ወይም የቪዲዮ ፋይል መጫን ይችላሉ።',
  videoTooLargeError: 'የቪዲዮው መጠን በዝቷል (ከ30 ሰከንድ / 2.2 MB ያልበለጠ ይሁን)። እባክዎ አጭር ቪዲዮ ይቅረጹ ወይም ይምረጡ።',
  videoInvalidFileError: 'ይህን የቪዲዮ ፋይል ማንበብ አልተቻለም። እባክዎ MP4፣ WebM ወይም MOV ቪዲዮ ይምረጡ።',
  vehicleTypeLabel: 'የመኪና ዓይነት (Type)',
  vehicleModelLabel: 'የመኪና ሞዴል (Model)',
  goodsTypeLabel: 'የዕቃ ዓይነት (Type)',
  goodsModelLabel: 'ሞዴል / ብራንድ (Model)',
  allVehicleTypes: 'ሁሉም የመኪና ዓይነቶች',
  allGoodsTypes: 'ሁሉም የዕቃ ዓይነቶች',
  allModels: 'ሁሉም ሞዴሎች',
  vehicleModelPlaceholder: 'ሞዴል ይምረጡ ወይም ይጻፉ (ለምሳሌ፡ RAV4, Vitz, Hilux...)',
  goodsModelPlaceholder: 'ሞዴል / ብራንድ ይምረጡ ወይም ይጻፉ (ለምሳሌ፡ iPhone, Samsung, LG...)',
  vehicleNavHeading: 'የመኪና ዓይነት (Type) እና ሞዴል (Model) መምረጫ',
  goodsNavHeading: 'የዕቃ ዓይነት (Type) እና ሞዴል (Model) መምረጫ',
  vehicleTypeSuv: 'SUV / 4x4',
  vehicleTypeSedan: 'ሴዳን (Sedan)',
  vehicleTypeCompact: 'ኮምፓክት / ቪትዝ (Hatchback)',
  vehicleTypeCrossover: 'ክሮስኦቨር (Crossover)',
  vehicleTypePickup: 'ፒካፕ (Pickup)',
  vehicleTypeVan: 'ቫን / ሚኒባስ',
  vehicleTypeBus: 'አውቶቡስ / ኮስተር',
  vehicleTypeTruck: 'የጭነት መኪና / ሲኖትራክ',
  vehicleTypeElectric: 'ኤሌክትሪክ (EV)',
  vehicleTypeHybrid: 'ሃይብሪድ (Hybrid)',
  vehicleTypeLuxury: 'ላግዠሪ / ቪአይፒ',
  vehicleTypeStationWagon: 'ስቴሽን ዋገን',
  vehicleTypeCoupe: 'ኩፔ / ስፖርት',
  vehicleTypeConvertible: 'ኮንቨርቲብል',
  vehicleTypeMotorcycle: 'ሞተር ሳይክል / ባጃጅ',
  vehicleTypeMachinery: 'የግንባታ ማሽነሪ',
  goodsTypeElectronics: 'ኤሌክትሮኒክስ እና ቲቪ',
  goodsTypePhonesTech: 'ስልክ እና ኮምፒውተር',
  goodsTypeFurniture: 'የቤት ዕቃ (ፈርኒቸር)',
  goodsTypeAppliances: 'የቤት ውስጥ መገልገያዎች',
  goodsTypeMachineryTools: 'ማሽነሪ እና መሳሪያዎች',
  goodsTypeFashionHome: 'ልብስ እና የውበት ዕቃ',
  goodsTypeOther: 'ሌሎች ዕቃዎች',
};

export const translations: Record<Language, Dictionary> = { en, am };

export function getCategoryLabel(category: ListingCategory, lang: Language): string {
  const t = translations[lang];
  switch (category) {
    case 'apartment':
      return t.catApartment;
    case 'condominium':
      return t.catCondominium;
    case 'house':
      return t.catHouse;
    case 'land':
      return t.catLand;
    case 'vehicle':
      return t.catVehicle;
    case 'goods':
      return t.catGoods;
  }
}

export function getTransactionLabel(tx: TransactionType, lang: Language): string {
  const t = translations[lang];
  return tx === 'sale' ? t.txSale : t.txRent;
}

export function getStatusLabel(status: ListingStatus, lang: Language): string {
  const t = translations[lang];
  switch (status) {
    case 'available':
      return t.statusAvailable;
    case 'reserved':
      return t.statusReserved;
    case 'closed':
      return t.statusClosed;
  }
}

export function getOrderStatusLabel(status: OrderStatus, lang: Language): string {
  if (lang === 'am') {
    switch (status) {
      case 'pending':
        return 'በመጠባበቅ ላይ';
      case 'confirmed':
        return 'ተረጋግጧል';
      case 'completed':
        return 'ተጠናቋል';
      case 'cancelled':
        return 'ተሰርዟል';
    }
  }
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
  }
}

export function getPaymentMethodLabel(method: PaymentMethod, lang: Language): string {
  const t = translations[lang];
  switch (method) {
    case 'cash_on_delivery':
      return t.payCashOnDelivery;
    case 'bank_transfer':
      return t.payBankTransfer;
    case 'telebirr':
      return t.payTelebirr;
    case 'inspection_escrow':
      return t.payInspectionEscrow;
  }
}

export function getPeriodLabel(period: PricePeriod, lang: Language): string {
  const t = translations[lang];
  switch (period) {
    case 'total':
      return '';
    case 'monthly':
      return `/${t.periodMonthly}`;
    case 'yearly':
      return `/${t.periodYearly}`;
  }
}

export function getNotificationEventTitle(eventType: NotificationEventType, lang: Language): string {
  const t = translations[lang];
  switch (eventType) {
    case 'order_placed':
      return t.notifNewOrderPlaced;
    case 'order_confirmed':
      return t.notifOrderConfirmed;
    case 'order_completed':
      return t.notifOrderCompleted;
    case 'order_cancelled':
      return t.notifOrderCancelled;
  }
}

export function getRoomClassLabel(roomClass: RoomClass, lang: Language): string {
  const t = translations[lang];
  switch (roomClass) {
    case '1_class':
      return t.roomClass1;
    case '2_class':
      return t.roomClass2;
    case '3_plus':
      return t.roomClass3Plus;
  }
}

export function getTenantPreferenceLabel(pref: TenantPreference, lang: Language): string {
  const t = translations[lang];
  switch (pref) {
    case 'late':
      return t.tenantPrefLate;
    case 'bale_tedar':
      return t.tenantPrefBaleTedar;
    case 'any':
      return t.tenantPrefAny;
  }
}

export const VEHICLE_TYPE_KEYS: VehicleType[] = [
  'suv',
  'sedan',
  'compact',
  'crossover',
  'pickup',
  'van',
  'bus',
  'truck',
  'electric',
  'hybrid',
  'luxury',
  'station_wagon',
  'coupe',
  'convertible',
  'motorcycle',
  'machinery',
];

export const GOODS_TYPE_KEYS: GoodsType[] = [
  'electronics',
  'phones_tech',
  'furniture',
  'appliances',
  'machinery_tools',
  'fashion_home',
  'other',
];

export const VEHICLE_MODEL_GROUPS: { brand: string; models: string[] }[] = [
  {
    brand: 'Toyota',
    models: [
      'Toyota Vitz',
      'Toyota Yaris',
      'Toyota Corolla',
      'Toyota Corolla Cross',
      'Toyota RAV4',
      'Toyota Hilux',
      'Toyota Land Cruiser',
      'Toyota Land Cruiser Prado',
      'Toyota Fortuner',
      'Toyota Rush',
      'Toyota Avanza',
      'Toyota Belta',
      'Toyota Platz',
      'Toyota Passo',
      'Toyota Auris',
      'Toyota Aqua',
      'Toyota Prius',
      'Toyota Camry',
      'Toyota Crown',
      'Toyota C-HR',
      'Toyota HiAce',
      'Toyota Coaster',
      'Toyota Probox',
      'Toyota Succeed',
      'Toyota Starlet',
      'Toyota bZ4X',
    ],
  },
  {
    brand: 'Hyundai',
    models: [
      'Hyundai Atos',
      'Hyundai i10',
      'Hyundai i20',
      'Hyundai Accent',
      'Hyundai Elantra',
      'Hyundai Sonata',
      'Hyundai Creta',
      'Hyundai Kona',
      'Hyundai Tucson',
      'Hyundai Santa Fe',
      'Hyundai Palisade',
      'Hyundai Starex',
      'Hyundai Staria',
      'Hyundai HD65 / HD72',
    ],
  },
  {
    brand: 'Suzuki',
    models: [
      'Suzuki Alto',
      'Suzuki S-Presso',
      'Suzuki Celerio',
      'Suzuki Swift',
      'Suzuki Dzire',
      'Suzuki Baleno',
      'Suzuki Ciaz',
      'Suzuki Fronx',
      'Suzuki Ertiga',
      'Suzuki Vitara',
      'Suzuki Grand Vitara',
      'Suzuki Jimny',
    ],
  },
  {
    brand: 'BYD & Electric (EV)',
    models: [
      'BYD Seagull',
      'BYD Dolphin',
      'BYD Atto 3',
      'BYD Yuan Plus',
      'BYD Song Plus',
      'BYD Song Pro',
      'BYD Qin Plus',
      'BYD Tang',
      'BYD Han',
      'Volkswagen ID.3',
      'Volkswagen ID.4',
      'Volkswagen ID.6',
      'Changan Eado EV',
      'Changan BenBen E-Star',
      'Neta V',
      'MG4 EV',
      'MG ZS EV',
      'Geely Geometry',
      'Tesla Model 3',
      'Tesla Model Y',
    ],
  },
  {
    brand: 'Kia',
    models: [
      'Kia Picanto',
      'Kia Rio',
      'Kia Cerato',
      'Kia K5 / Optima',
      'Kia Seltos',
      'Kia Sportage',
      'Kia Sorento',
      'Kia Telluride',
      'Kia Bongo',
    ],
  },
  {
    brand: 'Nissan, Mitsubishi & Honda',
    models: [
      'Nissan Sunny',
      'Nissan Tiida',
      'Nissan Note',
      'Nissan Juke',
      'Nissan Qashqai',
      'Nissan X-Trail',
      'Nissan Patrol',
      'Nissan Navara',
      'Nissan Urvan',
      'Mitsubishi Lancer',
      'Mitsubishi ASX',
      'Mitsubishi Outlander',
      'Mitsubishi Pajero',
      'Mitsubishi L200',
      'Honda Fit',
      'Honda Civic',
      'Honda Accord',
      'Honda HR-V',
      'Honda CR-V',
    ],
  },
  {
    brand: 'Ford, Mazda, Chevrolet & Chery',
    models: [
      'Ford Fiesta',
      'Ford Focus',
      'Ford Escape',
      'Ford Ranger',
      'Ford Explorer',
      'Ford F-150',
      'Mazda 3',
      'Mazda CX-5',
      'Chevrolet Aveo',
      'Chevrolet Cruze',
      'Chery Tiggo 4 / 7 / 8',
      'Jetour X70 / Dashing',
      'Subaru Forester',
      'Jeep Wrangler',
      'Jeep Grand Cherokee',
    ],
  },
  {
    brand: 'Mercedes, BMW, VW, Lexus & Range Rover',
    models: [
      'Mercedes-Benz C-Class',
      'Mercedes-Benz E-Class',
      'Mercedes-Benz S-Class',
      'Mercedes-Benz GLC / GLE',
      'Mercedes-Benz G-Class',
      'Mercedes-Benz Sprinter',
      'BMW 3 Series',
      'BMW 5 Series',
      'BMW X3',
      'BMW X5',
      'Volkswagen Polo',
      'Volkswagen Golf',
      'Volkswagen Passat',
      'Volkswagen Tiguan',
      'Audi A4',
      'Audi Q5',
      'Audi Q7',
      'Lexus NX',
      'Lexus RX 350',
      'Lexus LX 570 / 600',
      'Range Rover Evoque',
      'Range Rover Sport',
      'Range Rover Vogue',
      'Land Rover Defender',
      'Land Rover Discovery',
      'Porsche Cayenne',
    ],
  },
  {
    brand: 'Trucks, Buses, Bajaj & Machinery',
    models: [
      'Isuzu NPR',
      'Isuzu NQR',
      'Isuzu FSR',
      'Isuzu D-Max',
      'Sinotruk Howo',
      'Iveco Eurocargo',
      'Iveco Trakker',
      'Mitsubishi Fuso Canter',
      'Foton Tunland',
      'Yutong Bus',
      'King Long Bus',
      'Bajaj RE',
      'TVS King Bajaj',
      'Lifan / Yamaha Motorcycle',
      'Caterpillar Excavator',
      'JCB Backhoe Loader',
    ],
  },
];

export const VEHICLE_MODEL_SUGGESTIONS: string[] = VEHICLE_MODEL_GROUPS.flatMap(
  (group) => group.models
);

export const GOODS_MODEL_SUGGESTIONS: string[] = [
  'iPhone 15 Pro',
  'Samsung Galaxy S24',
  'MacBook Pro',
  'HP EliteBook',
  'LG Smart TV',
  'Samsung Fridge',
  'Hisense Washer',
  'Espresso Machine',
  'Walnut Sofa Set',
  'Office Desk & Chair',
];

export function getVehicleTypeLabel(value: string, lang: Language): string {
  const t = translations[lang];
  switch (value.toLowerCase()) {
    case 'suv':
      return t.vehicleTypeSuv;
    case 'sedan':
      return t.vehicleTypeSedan;
    case 'compact':
      return t.vehicleTypeCompact;
    case 'crossover':
      return t.vehicleTypeCrossover;
    case 'pickup':
      return t.vehicleTypePickup;
    case 'van':
      return t.vehicleTypeVan;
    case 'bus':
      return t.vehicleTypeBus;
    case 'truck':
      return t.vehicleTypeTruck;
    case 'electric':
      return t.vehicleTypeElectric;
    case 'hybrid':
      return t.vehicleTypeHybrid;
    case 'luxury':
      return t.vehicleTypeLuxury;
    case 'station_wagon':
      return t.vehicleTypeStationWagon;
    case 'coupe':
      return t.vehicleTypeCoupe;
    case 'convertible':
      return t.vehicleTypeConvertible;
    case 'motorcycle':
      return t.vehicleTypeMotorcycle;
    case 'machinery':
      return t.vehicleTypeMachinery;
    default:
      return value;
  }
}

export function getGoodsTypeLabel(value: string, lang: Language): string {
  const t = translations[lang];
  switch (value.toLowerCase()) {
    case 'electronics':
      return t.goodsTypeElectronics;
    case 'phones_tech':
      return t.goodsTypePhonesTech;
    case 'furniture':
      return t.goodsTypeFurniture;
    case 'appliances':
      return t.goodsTypeAppliances;
    case 'machinery_tools':
      return t.goodsTypeMachineryTools;
    case 'fashion_home':
      return t.goodsTypeFashionHome;
    case 'other':
      return t.goodsTypeOther;
    default:
      return value;
  }
}


