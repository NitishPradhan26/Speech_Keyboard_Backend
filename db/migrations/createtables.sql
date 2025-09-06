-- Speech Keyboard Backend Database Schema
-- Migration: Create Tables
-- Created: 2024-09-04

-- Enable UUID extension (useful for generating UUIDs if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user information with Apple/Firebase authentication integration
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    apple_uid VARCHAR(255) UNIQUE, -- Firebase UID derived from Apple Sign-In
    email VARCHAR(320), -- Optional, may be Apple's private relay email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Subscription and billing fields
    subscription_status VARCHAR(50) DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
    credits_balance INTEGER DEFAULT 0 -- For pay-per-use model
);

-- ============================================================================
-- PROMPTS TABLE  
-- ============================================================================
-- Stores prompt templates for text post-processing (both default and user-custom)
CREATE TABLE IF NOT EXISTS prompts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- NULL for default prompts
    title VARCHAR(255) NOT NULL, -- Friendly name (e.g., "Grammar Corrector", "Summarizer")
    content TEXT NOT NULL, -- The actual prompt text to send to GPT
    is_default BOOLEAN DEFAULT false, -- true for system defaults, false for user-created
    -- Constraints
    CONSTRAINT check_default_prompts_no_user CHECK (
        (is_default = true AND user_id IS NULL) OR 
        (is_default = false AND user_id IS NOT NULL)
    )
);

-- ============================================================================
-- TRANSCRIPTS TABLE
-- ============================================================================
-- Stores transcription records with audio files and processed text
CREATE TABLE IF NOT EXISTS transcripts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Audio file information
    audio_url VARCHAR(2048), -- URL to audio file in cloud storage (S3, Firebase Storage, etc.)
    duration_secs DECIMAL(10,2), -- Audio duration in seconds
    
    -- Transcription content
    text_raw TEXT, -- Raw output from Whisper ASR
    text_final TEXT, -- Cleaned/processed text from GPT
    
    -- Processing information
    prompt_used TEXT, -- Copy of the prompt content used (for historical accuracy)
    -- Processing status and metadata
   
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users table indexes
-- Primary key (id) automatically gets an index, no need to create one

-- Prompts table indexes
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);

-- Transcripts table indexes
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id);


-- Insert default prompt templates that all users can access
INSERT INTO prompts (user_id, title, content, is_default) VALUES
(NULL, 'Grammar Corrector', 
'You are a writing assistant. When given a raw transcript, correct any grammatical errors, punctuation, and make the phrasing clear and professional without altering the original meaning. Maintain the speaker''s tone and intent.', 
true);


-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with Apple Sign-In/Firebase authentication and subscription management';
COMMENT ON TABLE prompts IS 'Prompt templates for AI text processing - includes both system defaults and user-created prompts';
COMMENT ON TABLE transcripts IS 'Speech transcription records with audio files, raw ASR output, and AI-processed final text';

COMMENT ON COLUMN users.apple_uid IS 'Firebase UID derived from Apple Sign-In - primary identifier';
COMMENT ON COLUMN users.email IS 'User email - may be Apple private relay, not guaranteed unique';
COMMENT ON COLUMN users.credits_balance IS 'Remaining credits for pay-per-use billing';

COMMENT ON COLUMN prompts.content IS 'The actual prompt text sent to GPT for processing transcripts';
COMMENT ON COLUMN prompts.is_default IS 'System-provided prompts (true) vs user-created (false)';

COMMENT ON COLUMN transcripts.text_raw IS 'Unprocessed output from Whisper speech-to-text';
COMMENT ON COLUMN transcripts.text_final IS 'AI-processed and cleaned final text';
COMMENT ON COLUMN transcripts.prompt_used IS 'Copy of prompt content used - preserves history if template changes';

-- Migration completed successfully
SELECT 'Database schema created successfully!' as result;