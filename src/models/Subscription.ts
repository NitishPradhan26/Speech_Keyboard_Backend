import db from '../config/database';
import logger from '../config/logger';
import { Subscription as SubscriptionType } from '../types/database';

export interface CreateSubscriptionData {
  user_id: number;
  status: 'free' | 'premium';
  balance: number;
  expiry_date?: Date;
}

export interface UpdateSubscriptionData {
  status?: 'free' | 'premium';
  balance?: number;
  expiry_date?: Date;
}

class Subscription {
  static async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'free',
        balance INTEGER DEFAULT 10,
        expiry_date DATE,
        subscribe_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await db.query(query);
      logger.info('Subscriptions table created or already exists');
    } catch (error) {
      logger.error('Error creating subscriptions table:', error);
      throw error;
    }
  }

  static async findByUserId(userId: number): Promise<SubscriptionType | null> {
    const query = 'SELECT * FROM subscriptions WHERE user_id = $1';
    
    try {
      const result = await db.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding subscription by user ID:', error);
      throw error;
    }
  }

  static async findExpired(): Promise<SubscriptionType[]> {
    const query = 'SELECT * FROM subscriptions WHERE expiry_date <= CURRENT_DATE';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error finding expired subscriptions:', error);
      throw error;
    }
  }

  static async create(data: CreateSubscriptionData): Promise<SubscriptionType> {
    const { user_id, status, balance, expiry_date } = data;
    const query = `
      INSERT INTO subscriptions (user_id, status, balance, expiry_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [user_id, status, balance, expiry_date]);
      logger.info('Subscription created successfully for user:', user_id);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async update(userId: number, data: UpdateSubscriptionData): Promise<SubscriptionType | null> {
    const { status, balance, expiry_date } = data;
    const query = `
      UPDATE subscriptions 
      SET status = COALESCE($2, status),
          balance = COALESCE($3, balance),
          expiry_date = COALESCE($4, expiry_date)
      WHERE user_id = $1
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [userId, status, balance, expiry_date]);
      if (result.rows.length > 0) {
        logger.info('Subscription updated successfully for user:', userId);
      }
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  static async delete(userId: number): Promise<SubscriptionType | null> {
    const query = 'DELETE FROM subscriptions WHERE user_id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [userId]);
      if (result.rows.length > 0) {
        logger.info('Subscription deleted successfully for user:', userId);
      }
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error deleting subscription:', error);
      throw error;
    }
  }

  static async deductBalance(userId: number, minutes: number): Promise<SubscriptionType | null> {
    const query = `
      UPDATE subscriptions 
      SET balance = balance - $2
      WHERE user_id = $1
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [userId, minutes]);
      if (result.rows.length > 0) {
        logger.info(`Deducted ${minutes} minutes from user ${userId}, remaining: ${result.rows[0].balance}`);
      }
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error deducting balance:', error);
      throw error;
    }
  }

  static async addBalance(userId: number, minutes: number): Promise<SubscriptionType | null> {
    const query = `
      UPDATE subscriptions 
      SET balance = balance + $2
      WHERE user_id = $1
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [userId, minutes]);
      if (result.rows.length > 0) {
        logger.info(`Added ${minutes} minutes to user ${userId}, new balance: ${result.rows[0].balance}`);
      }
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error adding balance:', error);
      throw error;
    }
  }

  static async resetBalance(userId: number, newBalance: number, newExpiryDate: Date): Promise<SubscriptionType | null> {
    const query = `
      UPDATE subscriptions 
      SET balance = $2, expiry_date = $3
      WHERE user_id = $1
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [userId, newBalance, newExpiryDate]);
      if (result.rows.length > 0) {
        logger.info(`Reset balance for user ${userId} to ${newBalance} minutes`);
      }
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error resetting balance:', error);
      throw error;
    }
  }
}

export default Subscription;