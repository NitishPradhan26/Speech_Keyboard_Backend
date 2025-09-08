import db from '../config/database';
import logger from '../config/logger';
import { User as UserType } from '../types/database';

class User {
  static async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        display_name VARCHAR(255),
        subscription_status VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    try {
      await db.query(query)
      logger.info('Users table created or already exists')
    } catch (error) {
      logger.error('Error creating users table:', error)
      throw error
    }
  }

  static async findAll(): Promise<UserType[]> {
    const query = 'SELECT * FROM users ORDER BY created_at DESC'
    
    try {
      const result = await db.query(query)
      return result.rows
    } catch (error) {
      logger.error('Error fetching all users:', error)
      throw error
    }
  }

  static async findById(id: number): Promise<UserType | null> {
    const query = 'SELECT * FROM users WHERE id = $1'
    
    try {
      const result = await db.query(query, [id])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Error finding user by ID:', error)
      throw error
    }
  }

  static async findByFirebaseUid(firebaseUid: string): Promise<UserType | null> {
    const query = 'SELECT * FROM users WHERE apple_uid = $1'
    
    try {
      const result = await db.query(query, [firebaseUid])
      return result.rows[0] || null
    } catch (error) {
      logger.error('Error finding user by Firebase UID:', error)
      throw error
    }
  }

  static async create(userData: { firebase_uid: string; email?: string; display_name?: string }): Promise<UserType> {
    const { firebase_uid, email } = userData
    const query = `
      INSERT INTO users (apple_uid, email)
      VALUES ($1, $2)
      RETURNING *
    `
    
    try {
      const result = await db.query(query, [firebase_uid, email])
      logger.info('User created successfully:', result.rows[0].id)
      return result.rows[0]
    } catch (error) {
      logger.error('Error creating user:', error)
      throw error
    }
  }

  static async update(id: number, userData: { email?: string; subscription_status?: string }): Promise<UserType | null> {
    const { email, subscription_status } = userData
    const query = `
      UPDATE users 
      SET email = COALESCE($2, email),
          subscription_status = COALESCE($3, subscription_status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `
    
    try {
      const result = await db.query(query, [id, email, subscription_status])
      return result.rows[0]
    } catch (error) {
      logger.error('Error updating user:', error)
      throw error
    }
  }

  static async delete(id: number): Promise<UserType | null> {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *'
    
    try {
      const result = await db.query(query, [id])
      return result.rows[0]
    } catch (error) {
      logger.error('Error deleting user:', error)
      throw error
    }
  }
}

export default User;