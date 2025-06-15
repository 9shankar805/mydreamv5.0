import { db } from '../../db';
import { sql, eq, and, inArray, desc, notInArray } from 'drizzle-orm';
import { products, stores } from '@shared/schema';
import { userHistory } from '@shared/recommendationSchema';

type DbClient = typeof db;

export interface RecommendedItem extends Record<string, unknown> {
  id: number;
  name: string;
  price: number;
  image: string;
  storeId: number;
  [key: string]: unknown; // Allow additional properties
}

export interface UserAction {
  userId: number;
  mode: 'shop' | 'food';
  itemId: number;
  storeId: number;
  action: 'view' | 'search' | 'order';
}

export const trackUserAction = async ({ userId, mode, itemId, storeId, action }: UserAction): Promise<boolean> => {
  try {
    // Record the user action
    await db.insert(userHistory).values({
      user_id: Number(userId),
      mode,
      item_id: itemId,
      store_id: storeId,
      action,
      created_at: new Date()
    });

    // Update popularity for shop products on view/order actions
    if (mode === 'shop' && (action === 'view' || action === 'order')) {
      // Use raw SQL to update popularity since the column might not be in the ORM schema
      await db.execute(sql`
        UPDATE products 
        SET popularity = COALESCE(popularity, 0) + 1 
        WHERE id = ${itemId}
      `);
    }

    return true;
  } catch (error) {
    console.error('Error tracking user action:', error);
    return false;
  }
};

export const getShopRecommendations = async (userId: string, limit = 10) => {
  try {
    // Get user's recent shop actions
    const recentActions = await db
      .select({
        item_id: userHistory.item_id,
        store_id: userHistory.store_id
      })
      .from(userHistory)
      .where(
        and(
          eq(userHistory.user_id, Number(userId)),
          eq(userHistory.mode, 'shop' as const)
        )
      )
      .orderBy(desc(userHistory.created_at))
      .limit(5);

    if (recentActions.length === 0) {
      // Fallback: Return popular products if no history
      const popular = await db.execute(sql`
        SELECT 
          p.id, 
          p.name, 
          p.price, 
          p.image_url as image,
          p.store_id as "storeId"
        FROM products p
        WHERE p.popularity IS NOT NULL
        ORDER BY p.popularity DESC
        LIMIT ${limit}
      `);
      
      // Explicitly cast to RecommendedItem[] to ensure type safety
      return popular.rows as unknown as RecommendedItem[];
    }

    // Get unique store and item IDs from recent actions
    const storeIds = Array.from(new Set(recentActions.map(a => a.store_id))).filter(Boolean) as number[];
    const itemIds = recentActions.map(a => a.item_id).filter(Boolean) as number[];

    // Get categories of recently viewed products
    const categories = await db
      .select({ category_id: products.categoryId })
      .from(products)
      .where(inArray(products.id, itemIds));

    const categoryIds = Array.from(new Set(categories.map(c => c.category_id))).filter(Boolean) as number[];

    // Get recommended products
    const recommended = await db.execute(sql`
      SELECT 
        p.id, 
        p.name, 
        p.price, 
        p.image_url as image,
        p.store_id as "storeId"
      FROM products p
      LEFT JOIN stores s ON s.id = p.store_id
      WHERE p.store_id = ANY(${storeIds})
        AND p.category_id = ANY(${categoryIds})
        AND p.id != ALL(${itemIds})
        AND p.popularity IS NOT NULL
      ORDER BY p.popularity DESC
      LIMIT ${limit}
    `);

    // Explicitly cast to RecommendedItem[] to ensure type safety
    return recommended.rows as unknown as RecommendedItem[];
  } catch (error) {
    console.error('Error getting shop recommendations:', error);
    return [];
  }
};

export const getFoodRecommendations = async (userId: string, limit: number = 10): Promise<RecommendedItem[]> => {
  try {
    // Get recent food-related actions
    const recentActions = await db.execute<{ item_id: number; store_id: number }>(sql`
      SELECT item_id, store_id 
      FROM user_history 
      WHERE user_id = ${userId} 
        AND mode = 'food'
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    if (recentActions.rows.length === 0) {
      // Fallback: Return popular food items if no history
      const popular = await db.execute(sql`
        SELECT 
          p.id, 
          p.name, 
          p.price, 
          p.image_url as image,
          p.store_id as "storeId"
        FROM products p
        WHERE p.product_type = 'food'
          AND p.popularity IS NOT NULL
        ORDER BY p.popularity DESC
        LIMIT ${limit}
      `);
      return popular.rows as unknown as RecommendedItem[];
    }

    // Get unique restaurant and food item IDs from recent actions
    const restaurantIds = Array.from(new Set(recentActions.rows.map(a => a.store_id))).filter(Boolean) as number[];
    const foodItemIds = recentActions.rows.map(a => a.item_id).filter(Boolean) as number[];

    // Get cuisines of recently ordered food
    const cuisines = await db.execute<{ cuisine: string }>(sql`
      SELECT DISTINCT p.cuisine 
      FROM products p
      WHERE p.id = ANY(${foodItemIds})
        AND p.cuisine IS NOT NULL
    `);
    
    const cuisineList = cuisines.rows.map(c => c.cuisine).filter(Boolean);

    // Get recommended food items
    let recommended: { rows: RecommendedItem[] } = { rows: [] };
    
    if (cuisineList.length > 0) {
      recommended = await db.execute(sql`
        SELECT 
          p.id, 
          p.name, 
          p.price, 
          p.image_url as image,
          p.store_id as "storeId"
        FROM products p
        WHERE p.store_id = ANY(${restaurantIds})
          AND p.cuisine = ANY(${cuisineList})
          AND p.id != ALL(${foodItemIds})
          AND p.product_type = 'food'
          AND p.popularity IS NOT NULL
        ORDER BY p.popularity DESC
        LIMIT ${limit}
      `);
    }

    // If not enough recommendations, add popular food items
    if (recommended.rows.length < limit) {
      const remaining = limit - recommended.rows.length;
      // Convert Set to Array explicitly to avoid TypeScript iteration error
      const excludeIds = Array.from(new Set([...foodItemIds, ...recommended.rows.map(r => r.id)]));
      
      const popular = await db.execute(sql`
        SELECT 
          p.id, 
          p.name, 
          p.price, 
          p.image_url as image,
          p.store_id as "storeId"
        FROM products p
        WHERE p.id != ALL(${excludeIds})
          AND p.store_id != ALL(${restaurantIds})
          AND p.product_type = 'food'
          AND p.popularity IS NOT NULL
        ORDER BY p.popularity DESC
        LIMIT ${remaining}
      `);
      
      return [...recommended.rows, ...popular.rows].slice(0, limit) as RecommendedItem[];
    }

    return recommended.rows as RecommendedItem[];
  } catch (error) {
    console.error('Error getting food recommendations:', error);
    return [];
  }
};

// Clear user's history
export const clearUserHistory = async (userId: string, mode?: 'shop' | 'food') => {
  try {
    if (mode) {
      await db
        .delete(userHistory)
        .where(
          and(
            eq(userHistory.user_id, Number(userId)),
            eq(userHistory.mode, mode as 'shop' | 'food')
          )
        );
    } else {
      await db
        .delete(userHistory)
        .where(eq(userHistory.user_id, Number(userId)));
    }
    return true;
  } catch (error) {
    console.error('Error clearing user history:', error);
    return false;
  }
};
