export interface User {
  id: number;
  apple_uid?: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
  subscription_status: 'free' | 'premium' | 'trial';
  credits_balance: number;
}

export interface Prompt {
  id: number;
  user_id?: number;
  title: string;
  content: string;
  is_default: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Transcript {
  id: number;
  user_id: number;
  audio_url?: string;
  duration_secs?: number;
  text_raw?: string;
  text_final?: string;
  prompt_used?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | object;
}