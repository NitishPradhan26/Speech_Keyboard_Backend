-- Add subscriptions table
-- Migration: Add Subscriptions Support
-- Created: 2024-12-19

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
-- Stores user subscription status and balance (monthly allowance + purchased credits)
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free' or 'premium'
    balance INTEGER DEFAULT 10, -- Monthly allowance + purchased credits
    expiry_date DATE, -- When monthly balance resets
    subscribe_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry ON subscriptions(expiry_date);

-- ============================================================================
-- CONSTRAINTS AND VALIDATION
-- ============================================================================
ALTER TABLE subscriptions ADD CONSTRAINT check_subscription_status 
CHECK (status IN ('free', 'premium'));

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE subscriptions IS 'User subscription tiers and balance tracking - handles both monthly allowances and purchased credits';
COMMENT ON COLUMN subscriptions.status IS 'Subscription tier: free (10 mins/month) or premium (1000 mins/month)';
COMMENT ON COLUMN subscriptions.balance IS 'Total available minutes: monthly allowance + purchased credits';
COMMENT ON COLUMN subscriptions.expiry_date IS 'Date when monthly allowance resets';
COMMENT ON COLUMN subscriptions.subscribe_date IS 'When user first subscribed to this tier';

-- Migration completed successfully
SELECT 'Subscriptions table created successfully!' as result;