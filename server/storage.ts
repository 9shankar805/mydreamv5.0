import { 
  users, adminUsers, stores, categories, products, orders, orderItems, cartItems, wishlistItems,
  admins, websiteVisits, notifications, orderTracking, returnPolicies, returns,
  promotions, advertisements, productReviews, settlements, storeAnalytics, inventoryLogs,
  paymentTransactions, coupons, banners, supportTickets, siteSettings, deliveryPartners, deliveries,
  vendorVerifications, fraudAlerts, commissions, productAttributes, adminLogs, deliveryZones,
  type User, type InsertUser, type AdminUser, type InsertAdminUser, type Store, type InsertStore, 
  type Category, type InsertCategory, type Product, type InsertProduct,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem, type WishlistItem, type InsertWishlistItem,
  type Admin, type InsertAdmin, type WebsiteVisit, type InsertWebsiteVisit,
  type Notification, type InsertNotification, type OrderTracking, type InsertOrderTracking,
  type ReturnPolicy, type InsertReturnPolicy, type Return, type InsertReturn,
  type Promotion, type InsertPromotion, type Advertisement, type InsertAdvertisement,
  type ProductReview, type InsertProductReview, type Settlement, type InsertSettlement,
  type StoreAnalytics, type InsertStoreAnalytics, type InventoryLog, type InsertInventoryLog,
  type DeliveryPartner, type InsertDeliveryPartner, type Delivery, type InsertDelivery, type DeliveryZone, type InsertDeliveryZone,
  type PaymentTransaction, type Coupon, type InsertCoupon, type Banner, type InsertBanner,
  type SupportTicket, type InsertSupportTicket, type SiteSetting,
  type VendorVerification, type InsertVendorVerification, type FraudAlert, type InsertFraudAlert,
  type Commission, type InsertCommission, type ProductAttribute, type InsertProductAttribute,
  type AdminLog, type InsertAdminLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, desc, count, sql, gte, lt, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Admin user operations
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  getAdminUsers(): Promise<AdminUser[]>;

  // User approval operations
  getPendingUsers(): Promise<User[]>;
  approveUser(userId: number, adminId: number): Promise<User | undefined>;
  rejectUser(userId: number, adminId: number): Promise<User | undefined>;
  getAllUsersWithStatus(): Promise<User[]>;

  // Store operations
  getStore(id: number): Promise<Store | undefined>;
  getStoresByOwnerId(ownerId: number): Promise<Store[]>;
  getAllStores(): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, updates: Partial<InsertStore>): Promise<Store | undefined>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByStoreId(storeId: number): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByCustomerId(customerId: number): Promise<Order[]>;
  getOrdersByStoreId(storeId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Order item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Cart operations
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;

  // Wishlist operations
  getWishlistItems(userId: number): Promise<WishlistItem[]>;
  addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(id: number): Promise<boolean>;
  isInWishlist(userId: number, productId: number): Promise<boolean>;

  // Admin operations
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Website visit tracking
  recordVisit(visit: InsertWebsiteVisit): Promise<WebsiteVisit>;
  getVisitStats(days?: number): Promise<any>;
  getPageViews(page?: string): Promise<WebsiteVisit[]>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  getNotificationsByType(type: string): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;

  // Order tracking
  createOrderTracking(tracking: InsertOrderTracking): Promise<OrderTracking>;
  getOrderTracking(orderId: number): Promise<OrderTracking[]>;
  updateOrderTracking(orderId: number, status: string, description?: string, location?: string): Promise<OrderTracking>;

  // Return policy
  createReturnPolicy(policy: InsertReturnPolicy): Promise<ReturnPolicy>;
  getReturnPolicy(storeId: number): Promise<ReturnPolicy | undefined>;
  updateReturnPolicy(storeId: number, updates: Partial<InsertReturnPolicy>): Promise<ReturnPolicy | undefined>;

  // Returns
  createReturn(returnItem: InsertReturn): Promise<Return>;
  getReturn(id: number): Promise<Return | undefined>;
  getReturnsByCustomer(customerId: number): Promise<Return[]>;
  getReturnsByStore(storeId: number): Promise<Return[]>;
  updateReturnStatus(id: number, status: string): Promise<Return | undefined>;

  // Distance calculation between stores and user location
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
  getStoresWithDistance(userLat: number, userLon: number, storeType?: string): Promise<(Store & { distance: number })[]>;

  // Seller hub analytics
  getSellerDashboardStats(storeId: number): Promise<{
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    averageRating: number;
    totalReviews: number;
  }>;
  getStoreAnalytics(storeId: number, days?: number): Promise<StoreAnalytics[]>;
  updateStoreAnalytics(data: InsertStoreAnalytics): Promise<StoreAnalytics>;

  // Promotions
  getStorePromotions(storeId: number): Promise<Promotion[]>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: number, updates: Partial<InsertPromotion>): Promise<Promotion | undefined>;
  deletePromotion(id: number): Promise<boolean>;

  // Advertisements
  getStoreAdvertisements(storeId: number): Promise<Advertisement[]>;
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  updateAdvertisement(id: number, updates: Partial<InsertAdvertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: number): Promise<boolean>;

  // Product reviews
  getProductReviews(productId: number): Promise<ProductReview[]>;
  getStoreReviews(storeId: number): Promise<ProductReview[]>;
  createProductReview(review: InsertProductReview): Promise<ProductReview>;
  updateProductReview(id: number, updates: Partial<InsertProductReview>): Promise<ProductReview | undefined>;
  deleteProductReview(id: number): Promise<boolean>;

  // Settlements
  getStoreSettlements(storeId: number): Promise<Settlement[]>;
  createSettlement(settlement: InsertSettlement): Promise<Settlement>;
  updateSettlement(id: number, updates: Partial<InsertSettlement>): Promise<Settlement | undefined>;

  // Inventory management
  getInventoryLogs(storeId: number, productId?: number): Promise<InventoryLog[]>;
  createInventoryLog(log: InsertInventoryLog): Promise<InventoryLog>;
  updateProductStock(productId: number, quantity: number, type: string, reason?: string): Promise<boolean>;

  // Enhanced admin management methods
  getAllOrders(): Promise<Order[]>;
  getAllTransactions(): Promise<PaymentTransaction[]>;
  getAllCoupons(): Promise<Coupon[]>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, updates: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: number): Promise<boolean>;
  getAllBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, updates: Partial<InsertBanner>): Promise<Banner | undefined>;
  deleteBanner(id: number): Promise<boolean>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, updates: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined>;
  getAllSiteSettings(): Promise<SiteSetting[]>;
  updateSiteSetting(key: string, value: string): Promise<SiteSetting | undefined>;

  // Enhanced admin features
  getDashboardStats(): Promise<any>;
  getAllVendorVerifications(): Promise<VendorVerification[]>;
  updateVendorVerification(id: number, updates: Partial<InsertVendorVerification>): Promise<VendorVerification | undefined>;
  approveVendorVerification(id: number, adminId: number): Promise<VendorVerification | undefined>;
  rejectVendorVerification(id: number, adminId: number, reason: string): Promise<VendorVerification | undefined>;
  getAllFraudAlerts(): Promise<FraudAlert[]>;
  createFraudAlert(alert: InsertFraudAlert): Promise<FraudAlert>;
  updateFraudAlert(id: number, updates: Partial<InsertFraudAlert>): Promise<FraudAlert | undefined>;
  updateFraudAlertStatus(id: number, status: string): Promise<FraudAlert | undefined>;
  getAllCommissions(): Promise<Commission[]>;
  createCommission(commission: InsertCommission): Promise<Commission>;
  updateCommission(id: number, updates: Partial<InsertCommission>): Promise<Commission | undefined>;
  getCommissions(status?: string): Promise<Commission[]>;
  updateCommissionStatus(id: number, status: string): Promise<Commission | undefined>;

  // Dashboard stats methods
  getTotalUsersCount(): Promise<number>;
  getTotalStoresCount(): Promise<number>;
  getTotalOrdersCount(): Promise<number>;
  getTotalRevenue(): Promise<number>;
  getPendingOrdersCount(): Promise<number>;
  getActiveUsersCount(): Promise<number>;
  getPendingVendorVerificationsCount(): Promise<number>;
  getOpenFraudAlertsCount(): Promise<number>;
  getProductAttributes(productId: number): Promise<ProductAttribute[]>;
  createProductAttribute(attribute: InsertProductAttribute): Promise<ProductAttribute>;
  deleteProductAttribute(id: number): Promise<boolean>;
  logAdminAction(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(adminId?: number): Promise<AdminLog[]>;
  bulkUpdateProductStatus(productIds: number[], status: boolean): Promise<boolean>;
  getOrdersWithDetails(): Promise<any[]>;
  getRevenueAnalytics(days?: number): Promise<any>;
  getUsersAnalytics(): Promise<any>;
  getInventoryAlerts(): Promise<any[]>;

  // Delivery partner operations
  getDeliveryPartner(id: number): Promise<DeliveryPartner | undefined>;
  getDeliveryPartnerByUserId(userId: number): Promise<DeliveryPartner | undefined>;
  getAllDeliveryPartners(): Promise<DeliveryPartner[]>;
  getPendingDeliveryPartners(): Promise<DeliveryPartner[]>;
  createDeliveryPartner(deliveryPartner: InsertDeliveryPartner): Promise<DeliveryPartner>;
  updateDeliveryPartner(id: number, updates: Partial<InsertDeliveryPartner>): Promise<DeliveryPartner | undefined>;
  approveDeliveryPartner(id: number, adminId: number): Promise<DeliveryPartner | undefined>;
  rejectDeliveryPartner(id: number, adminId: number, reason: string): Promise<DeliveryPartner | undefined>;

  // Delivery operations
  getDelivery(id: number): Promise<Delivery | undefined>;
  getDeliveriesByPartnerId(partnerId: number): Promise<Delivery[]>;
  getDeliveriesByOrderId(orderId: number): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDeliveryStatus(id: number, status: string, partnerId?: number): Promise<Delivery | undefined>;
  assignDeliveryToPartner(deliveryId: number, partnerId: number): Promise<Delivery | undefined>;
  getActiveDeliveriesForStore(storeId: number): Promise<any[]>;

  // Delivery tracking
  getDeliveryTrackingData(deliveryId: number): Promise<any>;
  updateDeliveryLocation(deliveryId: number, latitude: number, longitude: number): Promise<void>;
  updateDeliveryStatus(deliveryId: number, status: string, description?: string): Promise<void>;

  // Delivery Zone methods
  createDeliveryZone(data: InsertDeliveryZone): Promise<DeliveryZone>;
  getDeliveryZones(): Promise<DeliveryZone[]>;
  getAllDeliveryZones(): Promise<DeliveryZone[]>;
  updateDeliveryZone(id: number, data: Partial<InsertDeliveryZone>): Promise<DeliveryZone>;
  deleteDeliveryZone(id: number): Promise<void>;
  calculateDeliveryFee(distance: number): Promise<{ fee: number; zone: DeliveryZone | null }>;
}

export class DatabaseStorage implements IStorage {

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    // Simple token validation - in production this would be more sophisticated
    // For now, assume token is just the user ID for testing purposes
    try {
      const userId = parseInt(token);
      if (isNaN(userId)) return undefined;

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      return user;
    } catch {
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  // Admin user operations
  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return adminUser;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return adminUser;
  }

  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    const [newAdminUser] = await db.insert(adminUsers).values(adminUser).returning();
    return newAdminUser;
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers);
  }

  // User approval operations
  async getPendingUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.status, 'pending'));
  }

  async approveUser(userId: number, adminId: number): Promise<User | undefined> {
    try {
      console.log(`Attempting to approve user ${userId} by admin ${adminId}`);

      // For now, we'll set approvedBy to null to avoid foreign key constraint issues
      // until we properly migrate the database schema
      const [approvedUser] = await db
        .update(users)
        .set({
          status: 'active',
          approvalDate: new Date(),
          approvedBy: null, // Temporarily set to null to avoid FK constraint
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      console.log('User approval successful:', approvedUser);
      return approvedUser;
    } catch (error) {
      console.error('Error in approveUser:', error);
      throw error;
    }
  }

  async rejectUser(userId: number, adminId: number): Promise<User | undefined> {
    try {
      console.log(`Attempting to reject user ${userId} by admin ${adminId}`);

      const [rejectedUser] = await db
        .update(users)
        .set({
          status: 'rejected',
          approvalDate: new Date(),
          approvedBy: null, // Temporarily set to null to avoid FK constraint
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      console.log('User rejection successful:', rejectedUser);
      return rejectedUser;
    } catch (error) {
      console.error('Error in rejectUser:', error);
      throw error;
    }
  }

  async getAllUsersWithStatus(): Promise<User[]> {
    try {
      const result = await db.select().from(users).orderBy(desc(users.createdAt));
      return result;
    } catch (error) {
      console.error("Database error in getAllUsersWithStatus:", error);
      throw error;
    }
  }

  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async getStoresByOwnerId(ownerId: number): Promise<Store[]> {
    try {
      const result = await db.select().from(stores).where(eq(stores.ownerId, ownerId));
      return result;
    } catch (error) {
      console.error("Database error in getStoresByOwnerId:", error);
      throw error;
    }
  }

  async getAllStores(): Promise<Store[]> {
    return await db.select().from(stores);
  }

  async createStore(store: InsertStore): Promise<Store> {
    // Generate a unique slug from the store name
    const baseSlug = store.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and make it unique
    while (true) {
      const existingStore = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);
      if (existingStore.length === 0) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const storeWithSlug = {
      ...store,
      slug,
      isActive: true,
      featured: false,
      rating: "0.00",
      totalReviews: 0,
      state: store.state || 'Not specified'
    };

    const [newStore] = await db.insert(stores).values(storeWithSlug).returning();
    return newStore;
  }

  async updateStore(id: number, updates: Partial<InsertStore>): Promise<Store | undefined> {
    const [updatedStore] = await db.update(stores).set(updates).where(eq(stores.id, id)).returning();
    return updatedStore;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByStoreId(storeId: number): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.storeId, storeId))
      .orderBy(desc(products.createdAt));
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(products).where(
      or(
        ilike(products.name, `%${query}%`),
        ilike(products.description, `%${query}%`)
      )
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Generate slug if not provided
    let slug = product.slug;
    if (!slug) {
      const baseSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let counter = 1;
      slug = baseSlug;

      while (true) {
        const existingProduct = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
        if (existingProduct.length === 0) {
          break;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const productWithDefaults = {
      ...product,
      slug,
      isActive: product.isActive !== undefined ? product.isActive : true,
      rating: product.rating || "0.00",
      totalReviews: product.totalReviews || 0,
      stock: product.stock || 0,
      imageUrl: product.imageUrl || "",
      images: product.images || []
    };

    const [newProduct] = await db.insert(products).values(productWithDefaults).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByCustomerId(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByStoreId(storeId: number): Promise<Order[]> {
    // Use a simple approach - get all orders and filter on the backend for now
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

    // Filter orders that have items from this store
    const storeOrders = [];
    for (const order of allOrders) {
      const orderItemsForStore = await db.select().from(orderItems)
        .where(and(eq(orderItems.orderId, order.id), eq(orderItems.storeId, storeId)));

      if (orderItemsForStore.length > 0) {
        storeOrders.push(order);
      }
    }

    return storeOrders;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updatedOrder;
  }

  // Order item operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    try {
      return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
    } catch (error) {
      console.error("Error fetching cart items:", error);
      return [];
    }
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, cartItem.userId), eq(cartItems.productId, cartItem.productId)));

    if (existingItem.length > 0) {
      // Update quantity
      const [updatedItem] = await db.update(cartItems)
        .set({ quantity: existingItem[0].quantity + cartItem.quantity })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updatedItem] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async clearCart(userId: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return (result.rowCount || 0) >= 0;
  }

  // Wishlist operations
  async getWishlistItems(userId: number): Promise<WishlistItem[]> {
    try {
      return await db.select().from(wishlistItems).where(eq(wishlistItems.userId, userId));
    } catch (error) {
      console.error("Error fetching wishlist items:", error);
      return [];
    }
  }

  async addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    // Check if item already exists in wishlist
    const existingItem = await db.select().from(wishlistItems)
      .where(and(eq(wishlistItems.userId, wishlistItem.userId), eq(wishlistItems.productId, wishlistItem.productId)));

    if (existingItem.length > 0) {
      return existingItem[0];
    } else {
      const [newItem] = await db.insert(wishlistItems).values(wishlistItem).returning();
      return newItem;
    }
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    const result = await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    const result = await db.select().from(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
      .limit(1);
    return result.length > 0;
  }

  // Admin operations
  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }

  // Website visit tracking
  async recordVisit(visit: InsertWebsiteVisit): Promise<WebsiteVisit> {
    const [newVisit] = await db.insert(websiteVisits).values(visit).returning();
    return newVisit;
  }

  async getVisitStats(days: number = 30): Promise<any> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const totalVisits = await db.select({ count: count() })
      .from(websiteVisits)
      .where(gte(websiteVisits.visitedAt, dateThreshold));

    const uniqueVisitors = await db.select({ count: count(websiteVisits.ipAddress) })
      .from(websiteVisits)
      .where(gte(websiteVisits.visitedAt, dateThreshold));

    const pageViews = await db.select({
      page: websiteVisits.page,
      count: count()
    })
    .from(websiteVisits)
    .where(gte(websiteVisits.visitedAt, dateThreshold))
    .groupBy(websiteVisits.page)
    .orderBy(desc(count()));

    return {
      totalVisits: totalVisits[0]?.count || 0,
      uniqueVisitors: uniqueVisitors[0]?.count || 0,
      pageViews
    };
  }

  async getPageViews(page?: string): Promise<WebsiteVisit[]> {
    if (page) {
      return await db.select().from(websiteVisits).where(eq(websiteVisits.page, page)).orderBy(desc(websiteVisits.visitedAt));
    }
    return await db.select().from(websiteVisits).orderBy(desc(websiteVisits.visitedAt));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByType(type: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.type, type))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [updatedNotification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
    return (result.rowCount ?? 0) >= 0;
  }

  // Order tracking
  async createOrderTracking(tracking: InsertOrderTracking): Promise<OrderTracking> {
    const [newTracking] = await db.insert(orderTracking).values(tracking).returning();
    return newTracking;
  }

  async getOrderTracking(orderId: number): Promise<OrderTracking[]> {
    return await db.select().from(orderTracking)
      .where(eq(orderTracking.orderId, orderId))
      .orderBy(desc(orderTracking.updatedAt));
  }

  async updateOrderTracking(orderId: number, status: string, description?: string, location?: string): Promise<OrderTracking> {
    const trackingData: InsertOrderTracking = {
      orderId,
      status,
      description,
      location
    };
    const [newTracking] = await db.insert(orderTracking).values(trackingData).returning();
    return newTracking;
  }

  // Return policy
  async createReturnPolicy(policy: InsertReturnPolicy): Promise<ReturnPolicy> {
    const [newPolicy] = await db.insert(returnPolicies).values(policy).returning();
    return newPolicy;
  }

  async getReturnPolicy(storeId: number): Promise<ReturnPolicy | undefined> {
    const [policy] = await db.select().from(returnPolicies).where(eq(returnPolicies.storeId, storeId));
    return policy;
  }

  async updateReturnPolicy(storeId: number, updates: Partial<InsertReturnPolicy>): Promise<ReturnPolicy | undefined> {
    const [updatedPolicy] = await db.update(returnPolicies).set(updates).where(eq(returnPolicies.storeId, storeId)).returning();
    return updatedPolicy;
  }

  // Returns
  async createReturn(returnItem: InsertReturn): Promise<Return> {
    const [newReturn] = await db.insert(returns).values(returnItem).returning();
    return newReturn;
  }

  async getReturn(id: number): Promise<Return | undefined> {
    const [returnItem] = await db.select().from(returns).where(eq(returns.id, id));
    return returnItem;
  }

  async getReturnsByCustomer(customerId: number): Promise<Return[]> {
    return await db.select().from(returns)
      .where(eq(returns.customerId, customerId))
      .orderBy(desc(returns.createdAt));
  }

  async getReturnsByStore(storeId: number): Promise<Return[]> {
    return await db.select().from(returns)
      .innerJoin(orderItems, eq(returns.orderItemId, orderItems.id))
      .where(eq(orderItems.storeId, storeId))
      .orderBy(desc(returns.createdAt));
  }

  async updateReturnStatus(id: number, status: string): Promise<Return | undefined> {
    const [updatedReturn] = await db.update(returns).set({ status }).where(eq(returns.id, id)).returning();
    return updatedReturn;
  }

  // Distance calculation between stores and user location
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  async getStoresWithDistance(userLat: number, userLon: number, storeType?: string): Promise<(Store & { distance: number })[]> {
    try {
      const allStores = await this.getAllStores();

      // Filter stores by type if specified
      const filteredStores = storeType 
        ? allStores.filter(store => store.storeType === storeType)
        : allStores;

      return filteredStores
        .filter(store => store.latitude && store.longitude) // Only include stores with coordinates
        .map(store => {
          const storeLat = parseFloat(store.latitude!);
          const storeLon = parseFloat(store.longitude!);
          const distance = this.calculateDistance(userLat, userLon, storeLat, storeLon);
          return { ...store, distance };
        })
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error("Error in getStoresWithDistance:", error);
      throw error;
    }
  }

  // Seller hub analytics
  async getSellerDashboardStats(storeId: number) {
    // Run all queries in parallel for better performance
    const [
      [productCount],
      [orderStats],
      [pendingOrders],
      [ratingStats],
      [lowStockCount],
      [outOfStockCount],
      [todayOrders],
      [todayRevenue]
    ] = await Promise.all([
      db.select({ count: count() })
        .from(products)
        .where(eq(products.storeId, storeId)),

      db.select({ 
        totalOrders: count(),
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(eq(orderItems.storeId, storeId)),

      db.select({ count: count() })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(orderItems.storeId, storeId),
          eq(orders.status, "pending")
        )),

      db.select({
        avgRating: sql<number>`COALESCE(AVG(${products.rating}), 0)`,
        totalReviews: sql<number>`COALESCE(SUM(${products.totalReviews}), 0)`
      })
        .from(products)
        .where(eq(products.storeId, storeId)),

      db.select({ count: count() })
        .from(products)
        .where(and(
          eq(products.storeId, storeId),
          sql`${products.stock} < 10 AND ${products.stock} > 0`
        )),

      db.select({ count: count() })
        .from(products)
        .where(and(
          eq(products.storeId, storeId),
          sql`${products.stock} = 0`
        )),

      db.select({ count: count() })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(orderItems.storeId, storeId),
          sql`DATE(${orders.createdAt}) = CURRENT_DATE`
        )),

      db.select({ 
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(orderItems.storeId, storeId),
          sql`DATE(${orders.createdAt}) = CURRENT_DATE`
        ))
    ]);

    return {
      totalProducts: productCount?.count || 0,
      totalOrders: orderStats?.totalOrders || 0,
      totalRevenue: orderStats?.totalRevenue || 0,
      pendingOrders: pendingOrders?.count || 0,
      averageRating: ratingStats?.avgRating || 0,
      totalReviews: ratingStats?.totalReviews || 0,
      lowStockProducts: lowStockCount?.count || 0,
      outOfStockProducts: outOfStockCount?.count || 0,
      todayOrders: todayOrders?.count || 0,
      todayRevenue: todayRevenue?.revenue || 0,
    };
  }

  async getStoreAnalytics(storeId: number, days: number = 30): Promise<StoreAnalytics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const dateStr = startDate.toISOString().split('T')[0];

      return await db
        .select()
        .from(storeAnalytics)
        .where(and(
          eq(storeAnalytics.storeId, storeId),
          gte(storeAnalytics.date, dateStr)
        ))
        .orderBy(desc(storeAnalytics.date));
    } catch (error) {
      console.error('Error fetching store analytics:', error);
      // Return empty array with basic structure if table doesn't exist or has issues
      return [];
    }
  }

  async updateStoreAnalytics(data: InsertStoreAnalytics): Promise<StoreAnalytics> {
    const [analytics] = await db
      .insert(storeAnalytics)
      .values(data)
      .onConflictDoUpdate({
        target: [storeAnalytics.storeId, storeAnalytics.date],
        set: data
      })
      .returning();
    return analytics;
  }

  // Promotions
  async getStorePromotions(storeId: number): Promise<Promotion[]> {
    return await db
      .select()
      .from(promotions)
      .where(eq(promotions.storeId, storeId))
      .orderBy(desc(promotions.createdAt));
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const [newPromotion] = await db
      .insert(promotions)
      .values(promotion)
      .returning();
    return newPromotion;
  }

  async updatePromotion(id: number, updates: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    const [updated] = await db
      .update(promotions)
      .set(updates)
      .where(eq(promotions.id, id))
      .returning();
    return updated;
  }

  async deletePromotion(id: number): Promise<boolean> {
    const result = await db
      .delete(promotions)
      .where(eq(promotions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Advertisements
  async getStoreAdvertisements(storeId: number): Promise<Advertisement[]> {
    return await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.storeId, storeId))
      .orderBy(desc(advertisements.createdAt));
  }

  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const [newAd] = await db
      .insert(advertisements)
      .values(ad)
      .returning();
    return newAd;
  }

  async updateAdvertisement(id: number, updates: Partial<InsertAdvertisement>): Promise<Advertisement | undefined> {
    const [updated] = await db
      .update(advertisements)
      .set(updates)
      .where(eq(advertisements.id, id))
      .returning();
    return updated;
  }

  async deleteAdvertisement(id: number): Promise<boolean> {
    const result = await db
      .delete(advertisements)
      .where(eq(advertisements.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Product reviews
  async getProductReviews(productId: number): Promise<ProductReview[]> {
    return await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt));
  }

  async getStoreReviews(storeId: number): Promise<ProductReview[]> {
    return await db
      .select()
      .from(productReviews)
      .innerJoin(products, eq(products.id, productReviews.productId))
      .where(eq(products.storeId, storeId))
      .orderBy(desc(productReviews.createdAt));
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const [newReview] = await db
      .insert(productReviews)
      .values(review)
      .returning();
    return newReview;
  }

  async updateProductReview(id: number, updates: Partial<InsertProductReview>): Promise<ProductReview | undefined> {
    const [updated] = await db
      .update(productReviews)
      .set(updates)
      .where(eq(productReviews.id, id))
      .returning();
    return updated;
  }

  async deleteProductReview(id: number): Promise<boolean> {
    const result = await db
      .delete(productReviews)
      .where(eq(productReviews.id, id))
      .returning();
    return result.length > 0;
  }

  // Settlements
  async getStoreSettlements(storeId: number): Promise<Settlement[]> {
    return await db
      .select()
      .from(settlements)
      .where(eq(settlements.storeId, storeId))
      .orderBy(desc(settlements.createdAt));
  }

  async createSettlement(settlement: InsertSettlement): Promise<Settlement> {
    const [newSettlement] = await db
      .insert(settlements)
      .values(settlement)
      .returning();
    return newSettlement;
  }

  async updateSettlement(id: number, updates: Partial<InsertSettlement>): Promise<Settlement | undefined> {
    const [updated] = await db
      .update(settlements)
      .set(updates)
      .where(eq(settlements.id, id))
      .returning();
    return updated;
  }

  // Inventory management
  async getInventoryLogs(storeId: number, productId?: number): Promise<InventoryLog[]> {
    try {
      const conditions = [eq(inventoryLogs.storeId, storeId)];
      if (productId) {
        conditions.push(eq(inventoryLogs.productId, productId));
      }

      return await db
        .select()
        .from(inventoryLogs)
        .where(and(...conditions))
        .orderBy(desc(inventoryLogs.createdAt));
    } catch (error) {
      console.error('Error fetching inventory logs:', error);
      return [];
    }
  }

  async createInventoryLog(log: InsertInventoryLog): Promise<InventoryLog> {
    const [newLog] = await db
      .insert(inventoryLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async updateProductStock(productId: number, quantity: number, type: string, reason?: string): Promise<boolean> {
    const product = await this.getProduct(productId);
    if (!product) return false;

    const previousStock = product.stock || 0;
    let newStock = previousStock;

    switch (type) {
      case 'stock_in':
        newStock = previousStock + quantity;
        break;
      case 'stock_out':
        newStock = Math.max(0, previousStock - quantity);
        break;
      case 'adjustment':
        newStock = quantity;
        break;
      default:
        return false;
    }

    // Update product stock
    await this.updateProduct(productId, { stock: newStock });

    // Log the inventory change
    await this.createInventoryLog({
      productId,
      storeId: product.storeId,
      type,
      quantity: type === 'adjustment' ? newStock - previousStock : quantity,
      previousStock,
      newStock,
      reason
    });

    return true;
  }

  // Enhanced admin management methods
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getAllTransactions(): Promise<any[]> {
    try {
      return await db.select().from(paymentTransactions).orderBy(desc(paymentTransactions.createdAt));
    } catch {
      return [];
    }
  }

  async getAllCoupons(): Promise<any[]> {
    try {
      return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    } catch {
      return [];
    }
  }

  async createCoupon(coupon: any): Promise<any> {
    try {
      const [newCoupon] = await db.insert(coupons).values(coupon).returning();
      return newCoupon;
    } catch {
      throw new Error("Failed to create coupon");
    }
  }

  async updateCoupon(id: number, updates: any): Promise<any> {
    try {
      const [updatedCoupon] = await db
        .update(coupons)
        .set(updates)
        .where(eq(coupons.id, id))
        .returning();
      return updatedCoupon;
    } catch {
      return null;
    }
  }

  async deleteCoupon(id: number): Promise<boolean> {
    try {
      await db.delete(coupons).where(eq(coupons.id, id));
      return true;
    } catch {
      return false;
    }
  }

  async getAllBanners(): Promise<any[]> {
    try {
      return await db.select().from(banners).orderBy(desc(banners.createdAt));
    } catch {
      return [];
    }
  }

  async createBanner(banner: any): Promise<any> {
    try {
      const [newBanner] = await db.insert(banners).values(banner).returning();
      return newBanner;
    } catch {
      throw new Error("Failed to create banner");
    }
  }

  async updateBanner(id: number, updates: any): Promise<any> {
    try {
      const [updatedBanner] = await db
        .update(banners)
        .set(updates)
        .where(eq(banners.id, id))
        .returning();
      return updatedBanner;
    } catch {
      return null;
    }
  }

  async deleteBanner(id: number): Promise<boolean> {
    try {
      await db.delete(banners).where(eq(banners.id, id));
      return true;
    } catch {
      return false;
    }
  }

  async getAllSupportTickets(): Promise<any[]> {
    try {
      return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
    } catch {
      return [];
    }
  }

  async createSupportTicket(ticket: any): Promise<any> {
    try {
      const [newTicket] = await db.insert(supportTickets).values(ticket).returning();
      return newTicket;
    } catch {
      throw new Error("Failed to create support ticket");
    }
  }

  async updateSupportTicket(id: number, updates: any): Promise<any> {
    try {
      const [updatedTicket] = await db
        .update(supportTickets)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(supportTickets.id, id))
        .returning();
      return updatedTicket;
    } catch {
      return null;
    }
  }

  async getAllSiteSettings(): Promise<any[]> {
    try {
      return await db.select().from(siteSettings).orderBy(siteSettings.settingKey);
    } catch {
      return [];
    }
  }

  async updateSiteSetting(key: string, value: string): Promise<any> {
    try {
      const [setting] = await db
        .insert(siteSettings)
        .values({ settingKey: key, settingValue: value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: siteSettings.settingKey,
          set: { settingValue: value, updatedAt: new Date() }
        })
        .returning();
      return setting;
    } catch {
      throw new Error("Failed to update setting");
    }
  }

  // Enhanced admin features implementation
  async getDashboardStats(): Promise<any> {
    try {
      const [
        totalUsersResult,
        activeUsersResult,
        pendingUsersResult,
        totalStoresResult,
        activeStoresResult,
        totalProductsResult,
        totalOrdersResult,
        pendingOrdersResult,
        completedOrdersResult,
        revenueResult,
        totalCouponsResult,
        activeCouponsResult,
        totalSupportTicketsResult,
        openSupportTicketsResult
      ] = await Promise.all([
        db.select({ count: sql`count(*)` }).from(users),
        db.select({ count: sql`count(*)` }).from(users).where(eq(users.status, 'active')),
        db.select({ count: sql`count(*)` }).from(users).where(eq(users.status, 'pending')),
        db.select({ count: sql`count(*)` }).from(stores),
        db.select({ count: sql`count(*)` }).from(stores).where(eq(stores.isActive, true)),
        db.select({ count: sql`count(*)` }).from(products),
        db.select({ count: sql`count(*)` }).from(orders),
        db.select({ count: sql`count(*)` }).from(orders).where(eq(orders.status, 'pending')),
        db.select({ count: sql`count(*)` }).from(orders).where(eq(orders.status, 'delivered')),
        db.select({ total: sql`sum(${orders.totalAmount})` }).from(orders).where(eq(orders.status, 'delivered')),
        db.select({ count: sql`count(*)` }).from(coupons),
        db.select({ count: sql`count(*)` }).from(coupons).where(eq(coupons.isActive, true)),
        db.select({ count: sql`count(*)` }).from(supportTickets),
        db.select({ count: sql`count(*)` }).from(supportTickets).where(eq(supportTickets.status, 'open'))
      ]);

      // Calculate growth metrics (last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const [newUsersLast30, newUsersPrevious30, newOrdersLast30, newOrdersPrevious30] = await Promise.all([
        db.select({ count: sql`count(*)` }).from(users).where(sql`${users.createdAt} >= ${thirtyDaysAgo.toISOString()}`),
        db.select({ count: sql`count(*)` }).from(users).where(sql`${users.createdAt} >= ${sixtyDaysAgo.toISOString()} AND ${users.createdAt} < ${thirtyDaysAgo.toISOString()}`),
        db.select({ count: sql`count(*)` }).from(orders).where(sql`${orders.createdAt} >= ${thirtyDaysAgo.toISOString()}`),
        db.select({ count: sql`count(*)` }).from(orders).where(sql`${orders.createdAt} >= ${sixtyDaysAgo.toISOString()} AND ${orders.createdAt} < ${thirtyDaysAgo.toISOString()}`)
      ]);

      const userGrowthRate = this.calculateGrowthRate(Number(newUsersPrevious30[0]?.count) || 0, Number(newUsersLast30[0]?.count) || 0);
      const orderGrowthRate = this.calculateGrowthRate(Number(newOrdersPrevious30[0]?.count) || 0, Number(newOrdersLast30[0]?.count) || 0);

      return {
        totalUsers: Number(totalUsersResult[0]?.count) || 0,
        activeUsers: Number(activeUsersResult[0]?.count) || 0,
        pendingUsers: Number(pendingUsersResult[0]?.count) || 0,
        totalStores: Number(totalStoresResult[0]?.count) || 0,
        activeStores: Number(activeStoresResult[0]?.count) || 0,
        totalProducts: Number(totalProductsResult[0]?.count) || 0,
        totalOrders: Number(totalOrdersResult[0]?.count) || 0,
        pendingOrders: Number(pendingOrdersResult[0]?.count) || 0,
        completedOrders: Number(completedOrdersResult[0]?.count) || 0,
        totalRevenue: Number(revenueResult[0]?.total) || 0,
        totalCoupons: Number(totalCouponsResult[0]?.count) || 0,
        activeCoupons: Number(activeCouponsResult[0]?.count) || 0,
        totalSupportTickets: Number(totalSupportTicketsResult[0]?.count) || 0,
        openSupportTickets: Number(openSupportTicketsResult[0]?.count) || 0,
        userGrowthRate,
        orderGrowthRate,
        averageOrderValue: Number(totalOrdersResult[0]?.count) > 0 ? 
          (Number(revenueResult[0]?.total) || 0) / Number(totalOrdersResult[0]?.count) : 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        totalStores: 0,
        activeStores: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        totalCoupons: 0,
        activeCoupons: 0,
        totalSupportTickets: 0,
        openSupportTickets: 0,
        userGrowthRate: 0,
        orderGrowthRate: 0,
        averageOrderValue: 0
      };
    }
  }

  private calculateGrowthRate(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  async getAllVendorVerifications(): Promise<VendorVerification[]> {
    try {
      return await db.select().from(vendorVerifications).orderBy(vendorVerifications.createdAt);
    } catch {
      return [];
    }
  }

  async updateVendorVerification(id: number, updates: Partial<InsertVendorVerification>): Promise<VendorVerification | undefined> {
    try {
      const [updated] = await db.update(vendorVerifications)
        .set({
          ...updates,
          reviewedAt: updates.status ? new Date() : undefined
        })
        .where(eq(vendorVerifications.id, id))
        .returning();
      return updated;
    } catch {
      return undefined;
    }
  }

  async getAllFraudAlerts(): Promise<FraudAlert[]> {
    try {
      return await db.select().from(fraudAlerts).orderBy(fraudAlerts.createdAt);
    } catch {
      return [];
    }
  }

  async createFraudAlert(alert: InsertFraudAlert): Promise<FraudAlert> {
    const [newAlert] = await db.insert(fraudAlerts).values(alert).returning();
    return newAlert;
  }

  async updateFraudAlert(id: number, updates: Partial<InsertFraudAlert>): Promise<FraudAlert | undefined> {
    try {
      const [updated] = await db.update(fraudAlerts).set(updates).where(eq(fraudAlerts.id, id)).returning();
      return updated;
    } catch {
      return undefined;
    }
  }

  async updateFraudAlertStatus(id: number, status: string): Promise<FraudAlert | undefined> {
    try {
      const [updated] = await db.update(fraudAlerts)
        .set({ status })
        .where(eq(fraudAlerts.id, id))
        .returning();
      return updated;
    } catch {
      return undefined;
    }
  }

  async approveVendorVerification(id: number, adminId: number): Promise<VendorVerification | undefined> {
    try {
      const [updated] = await db.update(vendorVerifications)
        .set({ 
          status: 'approved',
          reviewedBy: adminId,
          reviewedAt: new Date()
        })
        .where(eq(vendorVerifications.id, id))
        .returning();
      return updated;
    } catch {
      return undefined;
    }
  }

  async rejectVendorVerification(id: number, adminId: number, reason: string): Promise<VendorVerification | undefined> {
    try {
      const [updated] = await db.update(vendorVerifications)
        .set({ 
          status: 'rejected',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: reason
        })
        .where(eq(vendorVerifications.id, id))
        .returning();
      return updated;
    } catch {
      return undefined;
    }
  }

  async getCommissions(status?: string): Promise<Commission[]> {
    try {
      let query = db.select().from(commissions);

      if (status) {
        query = query.where(eq(commissions.status, status));
      }

      return await query.orderBy(desc(commissions.createdAt));
    } catch {
      return [];
    }
  }

  async updateCommissionStatus(id: number, status: string): Promise<Commission | undefined> {
    try {
      const [updated] = await db.update(commissions)
        .set({ status })
        .where(eq(commissions.id, id))
        .returning();
      return updated;
    } catch {
      return undefined;
    }
  }

  // Dashboard statistics methods
  async getTotalUsersCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(users);
      return result[0]?.count || 0;
    } catch {
      return 0;
    }
  }

  async getTotalStoresCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(stores);
      return result[0]?.count || 0;
    } catch {
      return 0;
    }
  }

  async getTotalOrdersCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(orders);
      return result[0]?.count || 0;
    } catch {
      return 0;
    }
  }

  async getTotalRevenue(): Promise<number> {
    try {
      const result = await db.select({
        total: sql`sum(${orders.totalAmount})`
      }).from(orders).where(eq(orders.status, 'delivered'));

      return parseFloat(result[0]?.total || '0');
    } catch {
      return 0;
    }
  }

  async getPendingOrdersCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(orders)
        .where(eq(orders.status, 'pending'));
      return result[0]?.count || 0;
    } catch {
      return 0;
    }
  }

  async getActiveUsersCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(users)
        .where(eq(users.status, 'active'));
      return result[0]?.count || 0;
    } catch {
      return 0;
    }
  }

  async getPendingVendorVerificationsCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(vendorVerifications)
        .where(eq(vendorVerifications.status, 'pending'));
      return result[0]?.count || 0;
    } catch {
      return 0;
    }
  }

  async getOpenFraudAlertsCount(): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(fraudAlerts)
        .where(eq(fraudAlerts.status, 'open'));
      return result[0]?.count || 0;
    } catch {
      return 0;
    }
  }

  async getAllCommissions(): Promise<Commission[]> {
    try {
      return await db.select().from(commissions).orderBy(commissions.createdAt);
    } catch {
      return [];
    }
  }

  async createCommission(commission: InsertCommission): Promise<Commission> {
    const [newCommission] = await db.insert(commissions).values(commission).returning();
    return newCommission;
  }

  async updateCommission(id: number, updates: Partial<InsertCommission>): Promise<Commission | undefined> {
    try {
      const [updated] = await db.update(commissions).set(updates).where(eq(commissions.id, id)).returning();
      return updated;
    } catch {
      return undefined;
    }
  }

  async getProductAttributes(productId: number): Promise<ProductAttribute[]> {
    try {
      return await db.select().from(productAttributes).where(eq(productAttributes.productId, productId));
    } catch {
      return [];
    }
  }

  async createProductAttribute(attribute: InsertProductAttribute): Promise<ProductAttribute> {
    const [newAttribute] = await db.insert(productAttributes).values(attribute).returning();
    return newAttribute;
  }

  async deleteProductAttribute(id: number): Promise<boolean> {
    try {
      const result = await db.delete(productAttributes).where(eq(productAttributes.id, id));
      return result.rowCount > 0;
    } catch {
      return false;
    }
  }

  async logAdminAction(log: InsertAdminLog): Promise<AdminLog> {
    const [newLog] = await db.insert(adminLogs).values(log).returning();
    return newLog;
  }

  async getAdminLogs(adminId?: number): Promise<AdminLog[]> {
    try {
      if (adminId) {
        return await db.select().from(adminLogs).where(eq(adminLogs.adminId, adminId)).orderBy(adminLogs.createdAt);
      }
      return await db.select().from(adminLogs).orderBy(adminLogs.createdAt);
    } catch {
      return [];
    }
  }

  async bulkUpdateProductStatus(productIds: number[], status: boolean): Promise<boolean> {
    try {
      const result = await db.update(products)
        .set({ isActive: status })
        .where(inArray(products.id, productIds));
      return result.rowCount > 0;
    } catch {
      return false;
    }
  }

  async getOrdersWithDetails(): Promise<any[]> {
    try {
      return await db.select({
        orders,
        customer: {
          id: users.id,
          fullName: users.fullName,
          email: users.email
        }
      })
      .from(orders)
      .leftJoin(users, eq(orders.customerId, users.id))
      .orderBy(orders.createdAt);
    } catch {
      return [];
    }
  }

  async getRevenueAnalytics(days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await db.select({
        date: sql`DATE(${orders.createdAt})`,
        revenue: sql`sum(${orders.totalAmount})`,
        orderCount: sql`count(*)`
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, startDate.toISOString()),
        eq(orders.status, 'delivered')
      ))
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

      return result;
    } catch {
      return [];
    }
  }

  async getUsersAnalytics(): Promise<any> {
    try {
      const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
      const activeUsers = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.status, 'active'));
      const shopkeepers = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, 'shopkeeper'));

      return {
        total: totalUsers[0]?.count || 0,
        active: activeUsers[0]?.count || 0,
        shopkeepers: shopkeepers[0]?.count || 0,
      };
    } catch {
      return {
        total: 0,
        active: 0,
        shopkeepers: 0,
      };
    }
  }

  async getInventoryAlerts(): Promise<any[]> {
    try {
      const lowStockProducts = await db.select({
        product: products,
        store: {
          id: stores.id,
          name: stores.name
        }
      })
      .from(products)
      .leftJoin(stores, eq(products.storeId, stores.id))
      .where(and(
        lt(products.stock, 10),
        eq(products.isActive, true)
      ))
      .orderBy(products.stock);

      return lowStockProducts;
    } catch {
      return [];
    }
  }

  // Admin authentication methods
  async createDefaultAdmin(): Promise<void> {
    try {
      // Check if admin already exists
      const existingAdmin = await db.select().from(adminUsers).where(eq(adminUsers.email, 'admin@sirahbazaar.com')).limit(1);

      if (existingAdmin.length === 0) {
        // Create default admin account
        await db.insert(adminUsers).values({
          email: 'admin@sirahbazaar.com',
          password: 'admin123', // In production, this should be hashed
          fullName: 'System Administrator',
          role: 'super_admin',
          isActive: true
        });
        console.log('Default admin account created: admin@sirahbazaar.com / admin123');
      }

      // Create default categories if they don't exist
      const existingCategories = await db.select().from(categories);
      if (existingCategories.length === 0) {
        await db.insert(categories).values([
          { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets', icon: 'smartphone' },
          { name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion items', icon: 'shirt' },
          { name: 'Food & Beverages', slug: 'food-beverages', description: 'Food items and drinks', icon: 'utensils' },
          { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and gardening', icon: 'home' },
          { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Sports equipment and outdoor gear', icon: 'dumbbell' },
          { name: 'Books', slug: 'books', description: 'Books and educational materials', icon: 'book' },
          { name: 'Beauty & Health', slug: 'beauty-health', description: 'Health and beauty products', icon: 'heart' },
          { name: 'Toys & Games', slug: 'toys-games', description: 'Toys and gaming products', icon: 'gamepad2' }
        ]);
        console.log('Default categories created');
      }

      // Create test users for admin panel verification
      const existingUsers = await db.select().from(users);
      if (existingUsers.length === 0) {
        const insertedUsers = await db.insert(users).values([
          {
            username: 'johndoe',
            email: 'john.doe@example.com',
            password: 'hashed_password_123',
            fullName: 'John Doe',
            phone: '+1234567890',
            address: '123 Main St, City, State',
            role: 'customer',
            status: 'active'
          },
          {
            username: 'janesmith',
            email: 'jane.smith@example.com',
            password: 'hashed_password_456',
            fullName: 'Jane Smith',
            phone: '+1234567891',
            address: '456 Oak Ave, City, State',
            role: 'shopkeeper',
            status: 'pending'
          },
          {
            username: 'mikewilson',
            email: 'mike.wilson@example.com',
            password: 'hashed_password_789',
            fullName: 'Mike Wilson',
            phone: '+1234567892',
            address: '789 Pine St, City, State',
            role: 'customer',
            status: 'active'
          }
        ]).returning();
        console.log('Test users created');
      }

      // Get first user ID for store ownership
      const allUsers = await db.select().from(users);
      const firstUserId = allUsers[0]?.id;

      // Create test stores
      const existingStores = await db.select().from(stores);
      if (existingStores.length === 0 && firstUserId) {
        await db.insert(stores).values([
          {
            name: 'Tech World Electronics',
            slug: 'tech-world-electronics',
            description: 'Latest electronic devices and gadgets',
            ownerId: firstUserId,
            address: '123 Tech Street, Electronics District',
            city: 'Electronics District',
            state: 'State',
            postalCode: '12345',
            country: 'Nepal',
            phone: '+1234567893',
            website: 'https://techworld.example.com',
            storeType: 'retail',
            rating: '4.5',
            totalReviews: 125,
            featured: true,
            isActive: true
          },
          {
            name: 'Flavor Town Restaurant',
            slug: 'flavor-town-restaurant',
            description: 'Delicious local cuisine and fast food',
            ownerId: firstUserId,
            address: '456 Food Avenue, Restaurant Row',
            city: 'Restaurant Row',
            state: 'State',
            postalCode: '54321',
            country: 'Nepal',
            phone: '+1234567894',
            website: 'https://flavortown.example.com',
            storeType: 'restaurant',
            cuisineType: 'american',
            deliveryTime: '25-35 mins',
            minimumOrder: '15.00',
            deliveryFee: '2.99',
            isDeliveryAvailable: true,
            rating: '4.2',
            totalReviews: 89,
            isActive: true
          }
        ]);
        console.log('Test stores created');
      }

      // Create test products
      const existingProducts = await db.select().from(products);
      if (existingProducts.length === 0) {
        await db.insert(products).values([
          {
            name: 'iPhone 15 Pro',
            slug: 'iphone-15-pro',
            description: 'Latest iPhone with advanced features',
            price: '999.99',
            originalPrice: '1099.99',
            categoryId: 1,
            storeId: 1,
            stock: 25,
            imageUrl: 'iphone15pro.jpg',
            images: ['iphone15pro.jpg'],
            rating: '4.8',
            totalReviews: 156,
            isActive: true,
            isOnOffer: true,
            offerPercentage: 9
          },
          {
            name: 'Classic Burger',
            slug: 'classic-burger',
            description: 'Juicy beef burger with fresh ingredients',
            price: '12.99',
            categoryId: 3,
            storeId: 2,
            stock: 50,
            imageUrl: 'burger.jpg',
            images: ['burger.jpg'],
            rating: '4.6',
            totalReviews: 78,
            isActive: true,
            productType: 'food',
            preparationTime: '15-20 mins',
            ingredients: ['beef patty', 'lettuce', 'tomato', 'cheese', 'bun'],
            spiceLevel: 'mild',
            isVegetarian: false
          }
        ]);
        console.log('Test products created');
      }

      // Create test orders using existing users
      const existingOrders = await db.select().from(orders);
      if (existingOrders.length === 0 && allUsers.length > 0) {
        const firstUserId = allUsers[0].id;
        await db.insert(orders).values([
          {
            customerId: firstUserId,
            totalAmount: '999.99',
            status: 'delivered',
            shippingAddress: '123 Main St, City, State',
            paymentMethod: 'credit_card',
            phone: '+1234567890',
            customerName: 'John Doe'
          },
          {
            customerId: firstUserId,
            totalAmount: '15.98',
            status: 'processing',
            shippingAddress: '123 Main St, City, State',
            paymentMethod: 'paypal',
            phone: '+1234567890',
            customerName: 'John Doe'
          }
        ]);
        console.log('Test orders created');
      }
    } catch (error) {
      console.error('Error creating default data:', error);
    }
  }

  async authenticateAdmin(email: string, password: string): Promise<any> {
    try {
      const [admin] = await db.select()
        .from(adminUsers)
        .where(and(
          eq(adminUsers.email, email),
          eq(adminUsers.password, password), // In production, use bcrypt to compare hashed passwords
          eq(adminUsers.isActive, true)
        ))
        .limit(1);

      if (admin) {
        return {
          id: admin.id,
          email: admin.email,
          name: admin.fullName,
          role: admin.role
        };
      }

      return null;
    } catch (error) {
      console.error('Admin authentication error:', error);
      return null;
    }
  }

  async getAllAdmins(): Promise<any[]> {
    try {
      const admins = await db.select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.fullName,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt
      }).from(adminUsers);

      return admins;
    } catch {
      return [];
    }
  }

  // Delivery partner operations
  async getDeliveryPartner(id: number): Promise<DeliveryPartner | undefined> {
    try {
      const [partner] = await db.select().from(deliveryPartners).where(eq(deliveryPartners.id, id));
      return partner || undefined;
    } catch {
      return undefined;
    }
  }

  async getDeliveryPartnerByUserId(userId: number): Promise<DeliveryPartner | undefined> {
    try {
      console.log("Database query for userId:", userId);
      const partners = await db.select().from(deliveryPartners).where(eq(deliveryPartners.userId, userId));
      console.log("Found partners:", partners.length, partners);
      const [partner] = partners;
      return partner || undefined;
    } catch (error) {
      console.error("Database error in getDeliveryPartnerByUserId:", error);
      return undefined;
    }
  }

  async getAllDeliveryPartners(): Promise<DeliveryPartner[]> {
    try {
      return await db.select().from(deliveryPartners).orderBy(desc(deliveryPartners.createdAt));
    } catch {
      return [];
    }
  }

  async getPendingDeliveryPartners(): Promise<DeliveryPartner[]> {
    try {
      return await db.select().from(deliveryPartners).where(eq(deliveryPartners.status, 'pending')).orderBy(desc(deliveryPartners.createdAt));
    } catch {
      return [];
    }
  }

  async createDeliveryPartner(deliveryPartner: InsertDeliveryPartner): Promise<DeliveryPartner> {
    const [created] = await db.insert(deliveryPartners).values(deliveryPartner).returning();
    return created;
  }

  async updateDeliveryPartner(id: number, updates: Partial<InsertDeliveryPartner>): Promise<DeliveryPartner | undefined> {
    try {
      const [updated] = await db.update(deliveryPartners).set(updates).where(eq(deliveryPartners.id, id)).returning();
      return updated || undefined;
    } catch {
      return undefined;
    }
  }

  async approveDeliveryPartner(id: number, adminId: number): Promise<DeliveryPartner | undefined> {
    try {
      const [updated] = await db.update(deliveryPartners).set({
        status: 'approved',
        approvedBy: adminId,
        approvalDate: new Date()
      }).where(eq(deliveryPartners.id, id)).returning();

      // Also update the user status
      if (updated) {
        await db.update(users).set({ status: 'active' }).where(eq(users.id, updated.userId));
      }

      return updated || undefined;
    } catch {
      return undefined;
    }
  }

  async rejectDeliveryPartner(id: number, adminId: number, reason: string): Promise<DeliveryPartner | undefined> {
    try {
      const [updated] = await db.update(deliveryPartners).set({
        status: 'rejected',
        approvedBy: adminId,
        rejectionReason: reason,
        approvalDate: new Date()
      }).where(eq(deliveryPartners.id, id)).returning();

      // Also update the user status
      if (updated) {
        await db.update(users).set({ status: 'rejected' }).where(eq(users.id, updated.userId));
      }

      return updated || undefined;
    } catch {
      return undefined;
    }
  }

  // Delivery operations
  async getDelivery(id: number): Promise<Delivery | undefined> {
    try {
      const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
      return delivery || undefined;
    } catch {
      return undefined;
    }
  }

  async getAllDeliveries(): Promise<Delivery[]> {
    try {
      return await db.select().from(deliveries).orderBy(desc(deliveries.createdAt));
    } catch {
      return [];
    }
  }

  async getDeliveriesByPartnerId(partnerId: number): Promise<Delivery[]> {
    try {
      return await db.select().from(deliveries).where(eq(deliveries.deliveryPartnerId, partnerId)).orderBy(desc(deliveries.createdAt));
    } catch {
      return [];
    }
  }

  async getActiveDeliveries(partnerId: number): Promise<Delivery[]> {
    try {
      return await db.select().from(deliveries)
        .where(
          and(
            eq(deliveries.deliveryPartnerId, partnerId),
            inArray(deliveries.status, ['assigned', 'picked_up', 'in_transit'])
          )
        )
        .orderBy(desc(deliveries.createdAt));
    } catch {
      return [];
    }
  }

  async updateDeliveryLocation(deliveryId: number, location: string): Promise<Delivery | undefined> {
    try {
      const [updated] = await db.update(deliveries)
        .set({ 
          currentLocation: location,
          updatedAt: new Date()
        })
        .where(eq(deliveries.id, deliveryId))
        .returning();
      return updated || undefined;
    } catch {
      return undefined;
    }
  }

  async getDeliveriesByOrderId(orderId: number): Promise<Delivery[]> {
    try {
      return await db.select().from(deliveries).where(eq(deliveries.orderId, orderId)).orderBy(desc(deliveries.createdAt));
    } catch {
      return [];
    }
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const [created] = await db.insert(deliveries).values(delivery).returning();
    return created;
  }

  async updateDeliveryStatus(id: number, status: string, partnerId?: number): Promise<Delivery | undefined> {
    try {
      const updates: any = { status, updatedAt: new Date() };
      if (partnerId) {
        updates.partnerId = partnerId;
      }

      const [updated] = await db.update(deliveries).set(updates).where(eq(deliveries.id, id)).returning();
      return updated || undefined;
    } catch {
      return undefined;
    }
  }

  async assignDeliveryToPartner(deliveryId: number, partnerId: number): Promise<Delivery | undefined> {
    try {
      const [updated] = await db.update(deliveries).set({
        deliveryPartnerId: partnerId,
        status: 'assigned',
        assignedAt: new Date()
      }).where(eq(deliveries.id, deliveryId)).returning();
      return updated || undefined;
    } catch {
      return undefined;
    }
  }

  // Get active deliveries for a specific store
  async getActiveDeliveriesForStore(storeId: number) {
    try {
      const result = await db
        .select({
          id: deliveries.id,
          status: deliveries.status,
          customerName: deliveries.customerName,
          customerPhone: deliveries.customerPhone,
          deliveryAddress: deliveries.deliveryAddress,
          totalAmount: deliveries.totalAmount,
          deliveryPartnerId: deliveries.deliveryPartnerId,
          createdAt: deliveries.createdAt,
          // Join delivery partner info
          deliveryPartnerName: users.fullName,
          deliveryPartnerPhone: users.phone,
        })
        .from(deliveries)
        .leftJoin(users, eq(deliveries.deliveryPartnerId, users.id))
        .where(
          and(
            eq(deliveries.storeId, storeId),
            inArray(deliveries.status, ['assigned', 'en_route_pickup', 'picked_up', 'en_route_delivery'])
          )
        )
        .orderBy(desc(deliveries.createdAt));

      // Format the result to include delivery partner info
      return result.map(delivery => ({
        ...delivery,
        deliveryPartner: delivery.deliveryPartnerId ? {
          id: delivery.deliveryPartnerId,
          name: delivery.deliveryPartnerName,
          phone: delivery.deliveryPartnerPhone
        } : null
      }));
    } catch (error) {
      console.error('Error getting active deliveries for store:', error);
      throw error;
    }
  }

  // Delivery tracking methods
  async getDeliveryTrackingData(deliveryId: number) {
    try {
      const [deliveryResult] = await db
        .select()
        .from(deliveries)
        .where(eq(deliveries.id, deliveryId))
        .limit(1);

      if (!deliveryResult) {
        throw new Error('Delivery not found');
      }

      // Get current location
      const [locationResult] = await db
        .select()
        .from(orderTracking)
        .where(eq(orderTracking.orderId, deliveryResult.orderId))
        .orderBy(desc(orderTracking.createdAt))
        .limit(1);

      // Get status history (from order tracking)
      const statusHistory = await db
        .select()
        .from(orderTracking)
        .where(eq(orderTracking.orderId, deliveryResult.orderId))
        .orderBy(desc(orderTracking.createdAt));

      return {
        delivery: deliveryResult,
        currentLocation: locationResult ? {
          latitude: locationResult.location?.split(',')[0],
          longitude: locationResult.location?.split(',')[1],
          timestamp: locationResult.createdAt
        } : null,
        route: null, // Not implemented
        statusHistory
      };
    } catch (error) {
      console.error('Error getting delivery tracking data:', error);
      throw error;
    }
  }

  async updateDeliveryLocation(deliveryId: number, latitude: number, longitude: number): Promise<void> {
    // This is not used anymore in new architecture
  }

  async updateDeliveryStatus(deliveryId: number, status: string, description?: string): Promise<void> {
    // This is not used anymore in new architecture
  }

  // Delivery Zone methods
  async createDeliveryZone(data: InsertDeliveryZone): Promise<DeliveryZone> {
    const [zone] = await db.insert(deliveryZones).values(data).returning();
    return zone;
  }

  async getDeliveryZones(): Promise<DeliveryZone[]> {
    return await db.select().from(deliveryZones).where(eq(deliveryZones.isActive, true));
  }

  async getAllDeliveryZones(): Promise<DeliveryZone[]> {
    return await db.select().from(deliveryZones);
  }

  async updateDeliveryZone(id: number, data: Partial<InsertDeliveryZone>): Promise<DeliveryZone> {
    try {
      // Ensure numeric fields are properly converted
      const updateData = {
        ...data,
        baseFee: data.baseFee ? parseFloat(data.baseFee.toString()) : undefined,
        perKmRate: data.perKmRate ? parseFloat(data.perKmRate.toString()) : undefined,
        minDistance: data.minDistance ? parseFloat(data.minDistance.toString()) : undefined,
        maxDistance: data.maxDistance ? parseFloat(data.maxDistance.toString()) : undefined
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const [zone] = await db
        .update(deliveryZones)
        .set(updateData)
        .where(eq(deliveryZones.id, id))
        .returning();

      if (!zone) {
        throw new Error(`Delivery zone with id ${id} not found`);
      }

      return zone;
    } catch (error) {
      console.error('Error updating delivery zone:', error);
      throw new Error(`Failed to update delivery zone: ${error.message}`);
    }
  }

  async deleteDeliveryZone(id: number): Promise<void> {
    await db.update(deliveryZones)
      .set({ isActive: false })
      .where(eq(deliveryZones.id, id));
  }

  // Calculate delivery fee based on distance
  async calculateDeliveryFee(distance: number): Promise<{ fee: number; zone: DeliveryZone | null }> {
    const zones = await this.getDeliveryZones();

    // Find the appropriate zone for this distance
    const applicableZone = zones.find(zone => {
      const minDist = parseFloat(zone.minDistance);
      const maxDist = parseFloat(zone.maxDistance);
      return distance >= minDist && distance <= maxDist;
    });

    if (!applicableZone) {
      // Default fee if no zone found (fallback to furthest zone)
      const furthestZone = zones
        .sort((a, b) => parseFloat(b.maxDistance) - parseFloat(a.maxDistance))[0];

      if (furthestZone) {
        const baseFee = parseFloat(furthestZone.baseFee);
        const perKmRate = parseFloat(furthestZone.perKmRate);
        const fee = baseFee + (distance * perKmRate);
        return { fee: Math.round(fee * 100) / 100, zone: furthestZone };
      }

      return { fee: 100, zone: null }; // Default fallback fee
    }

    const baseFee = parseFloat(applicableZone.baseFee);
    const perKmRate = parseFloat(applicableZone.perKmRate);
    const fee = baseFee + (distance * perKmRate);

    return { fee: Math.round(fee * 100) / 100, zone: applicableZone };
  }
}

export const storage = new DatabaseStorage();