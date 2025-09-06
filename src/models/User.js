const db = require('../config/database')
const logger = require('../config/logger')

class User {
  static async createTable() {
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

  static async findAll() {
    const query = 'SELECT * FROM users ORDER BY created_at DESC'
    
    try {
      const result = await db.query(query)
      return result.rows
    } catch (error) {
      logger.error('Error fetching all users:', error)
      throw error
    }
  }

  static async findByFirebaseUid(firebaseUid) {
    const query = 'SELECT * FROM users WHERE firebase_uid = $1'
    
    try {
      const result = await db.query(query, [firebaseUid])
      return result.rows[0]
    } catch (error) {
      logger.error('Error finding user by Firebase UID:', error)
      throw error
    }
  }

  static async create(userData) {
    const { firebase_uid, email, display_name } = userData
    const query = `
      INSERT INTO users (firebase_uid, email, display_name)
      VALUES ($1, $2, $3)
      RETURNING *
    `
    
    try {
      const result = await db.query(query, [firebase_uid, email, display_name])
      logger.info('User created successfully:', result.rows[0].id)
      return result.rows[0]
    } catch (error) {
      logger.error('Error creating user:', error)
      throw error
    }
  }

  static async update(id, userData) {
    const { email, display_name, subscription_status } = userData
    const query = `
      UPDATE users 
      SET email = COALESCE($2, email),
          display_name = COALESCE($3, display_name),
          subscription_status = COALESCE($4, subscription_status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `
    
    try {
      const result = await db.query(query, [id, email, display_name, subscription_status])
      return result.rows[0]
    } catch (error) {
      logger.error('Error updating user:', error)
      throw error
    }
  }

  static async delete(id) {
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

module.exports = User