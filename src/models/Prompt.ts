import db from '../config/database';
import logger from '../config/logger';
import { Prompt as PromptType } from '../types/database';

export interface CreatePromptData {
  user_id?: number;
  title: string;
  content: string;
  is_default?: boolean;
}

export interface UpdatePromptData {
  title?: string;
  content?: string;
  is_default?: boolean;
}

class Prompt {
  static async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS prompts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_default BOOLEAN DEFAULT false
      )
    `;
    
    try {
      await db.query(query);
      logger.info('Prompts table created or already exists');
    } catch (error) {
      logger.error('Error creating prompts table:', error);
      throw error;
    }
  }

  static async findAll(): Promise<PromptType[]> {
    const query = 'SELECT * FROM prompts ORDER BY id DESC';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching all prompts:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<PromptType | null> {
    const query = 'SELECT * FROM prompts WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding prompt by ID:', error);
      throw error;
    }
  }

  static async findByUserId(userId: number): Promise<PromptType[]> {
    const query = 'SELECT * FROM prompts WHERE user_id = $1 ORDER BY id DESC';
    
    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding prompts by user ID:', error);
      throw error;
    }
  }

  static async findDefaultPrompts(): Promise<PromptType[]> {
    const query = 'SELECT * FROM prompts WHERE is_default = true ORDER BY id DESC';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error finding default prompts:', error);
      throw error;
    }
  }

  static async create(data: CreatePromptData): Promise<PromptType> {
    const { user_id, title, content, is_default = false } = data;
    const query = `
      INSERT INTO prompts (user_id, title, content, is_default)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [user_id, title, content, is_default]);
      logger.info('Prompt created successfully:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating prompt:', error);
      throw error;
    }
  }

  static async update(id: number, data: UpdatePromptData): Promise<PromptType | null> {
    const { title, content, is_default } = data;
    const query = `
      UPDATE prompts 
      SET title = COALESCE($2, title),
          content = COALESCE($3, content),
          is_default = COALESCE($4, is_default)
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [id, title, content, is_default]);
      if (result.rows.length > 0) {
        logger.info('Prompt updated successfully:', id);
      }
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating prompt:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<PromptType | null> {
    const query = 'DELETE FROM prompts WHERE id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [id]);
      if (result.rows.length > 0) {
        logger.info('Prompt deleted successfully:', id);
      }
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error deleting prompt:', error);
      throw error;
    }
  }

  static async deleteByUserId(userId: number): Promise<number> {
    const query = 'DELETE FROM prompts WHERE user_id = $1';
    
    try {
      const result = await db.query(query, [userId]);
      logger.info(`Deleted ${result.rowCount} prompts for user:`, userId);
      return result.rowCount || 0;
    } catch (error) {
      logger.error('Error deleting prompts by user ID:', error);
      throw error;
    }
  }
}

export default Prompt;