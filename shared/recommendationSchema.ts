import { pgTable, serial, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './schema';

export const userHistoryActionEnum = pgEnum('user_history_action', ['view', 'search', 'order']);
export const userHistoryModeEnum = pgEnum('user_history_mode', ['shop', 'food']);

export const userHistory = pgTable('user_history', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mode: userHistoryModeEnum('mode').notNull(),
  item_id: integer('item_id').notNull(),
  store_id: integer('store_id').notNull(),
  action: userHistoryActionEnum('action').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export type UserHistory = typeof userHistory.$inferSelect;
export type NewUserHistory = typeof userHistory.$inferInsert;

// Add popularity column to products
import { products as productsTable } from './schema';

declare module './schema' {
  interface ProductsTable {
    popularity: number;
  }
}

export const products = {
  ...productsTable,
  popularity: 0 // This is a placeholder, actual column is added via migration
} as const;
