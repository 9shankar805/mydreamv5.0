-- Create user history table to track user actions
CREATE TABLE IF NOT EXISTS user_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(10) NOT NULL CHECK (mode IN ('shop', 'food')),
  item_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'search', 'order')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_created_at ON user_history(created_at);

-- Add popularity column to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS popularity INTEGER NOT NULL DEFAULT 0;

-- Since we don't have a separate food_items table, we'll use the products table with product_type = 'food'
