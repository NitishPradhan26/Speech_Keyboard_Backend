import db from '../config/database';
import logger from '../config/logger';
import { Transcript as TranscriptType } from '../types/database';

export interface CreateTranscriptData {
  user_id: number;
  audio_url?: string;
  duration_secs?: number;
  text_raw?: string;
  text_final?: string;
  prompt_used?: string;
}

export interface UpdateTranscriptData {
  audio_url?: string;
  duration_secs?: number;
  text_raw?: string;
  text_final?: string;
  prompt_used?: string;
}

class Transcript {
  static async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS transcripts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        audio_url VARCHAR(2048),
        duration_secs DECIMAL(10,2),
        text_raw TEXT,
        text_final TEXT,
        prompt_used TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await db.query(query);
      logger.info('Transcripts table created or already exists');
    } catch (error) {
      logger.error('Error creating transcripts table:', error);
      throw error;
    }
  }

  static async findAll(): Promise<TranscriptType[]> {
    const query = 'SELECT * FROM transcripts ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching all transcripts:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<TranscriptType | null> {
    const query = 'SELECT * FROM transcripts WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding transcript by ID:', error);
      throw error;
    }
  }

  static async findByUserId(userId: number): Promise<TranscriptType[]> {
    const query = 'SELECT * FROM transcripts WHERE user_id = $1 ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding transcripts by user ID:', error);
      throw error;
    }
  }

  static async create(data: CreateTranscriptData): Promise<TranscriptType> {
    const { user_id, audio_url, duration_secs, text_raw, text_final, prompt_used } = data;
    const query = `
      INSERT INTO transcripts (user_id, audio_url, duration_secs, text_raw, text_final, prompt_used)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [user_id, audio_url, duration_secs, text_raw, text_final, prompt_used]);
      logger.info('Transcript created successfully:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating transcript:', error);
      throw error;
    }
  }

  static async update(id: number, data: UpdateTranscriptData): Promise<TranscriptType | null> {
    const { audio_url, duration_secs, text_raw, text_final, prompt_used } = data;
    const query = `
      UPDATE transcripts 
      SET audio_url = COALESCE($2, audio_url),
          duration_secs = COALESCE($3, duration_secs),
          text_raw = COALESCE($4, text_raw),
          text_final = COALESCE($5, text_final),
          prompt_used = COALESCE($6, prompt_used),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [id, audio_url, duration_secs, text_raw, text_final, prompt_used]);
      if (result.rows.length > 0) {
        logger.info('Transcript updated successfully:', id);
      }
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating transcript:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<TranscriptType | null> {
    const query = 'DELETE FROM transcripts WHERE id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [id]);
      if (result.rows.length > 0) {
        logger.info('Transcript deleted successfully:', id);
      }
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error deleting transcript:', error);
      throw error;
    }
  }

  static async deleteByUserId(userId: number): Promise<number> {
    const query = 'DELETE FROM transcripts WHERE user_id = $1';
    
    try {
      const result = await db.query(query, [userId]);
      logger.info(`Deleted ${result.rowCount} transcripts for user:`, userId);
      return result.rowCount || 0;
    } catch (error) {
      logger.error('Error deleting transcripts by user ID:', error);
      throw error;
    }
  }

  static async findRecent(limit: number = 10): Promise<TranscriptType[]> {
    const query = 'SELECT * FROM transcripts ORDER BY created_at DESC LIMIT $1';
    
    try {
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching recent transcripts:', error);
      throw error;
    }
  }

  static async findByDateRange(userId: number, startDate: Date, endDate: Date): Promise<TranscriptType[]> {
    const query = `
      SELECT * FROM transcripts 
      WHERE user_id = $1 
        AND created_at >= $2 
        AND created_at <= $3
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [userId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding transcripts by date range:', error);
      throw error;
    }
  }

  static async getStats(userId: number): Promise<{
    totalTranscripts: number;
    totalDuration: number;
    averageDuration: number;
    todayCount: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_transcripts,
        COALESCE(SUM(duration_secs), 0) as total_duration,
        COALESCE(AVG(duration_secs), 0) as average_duration,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_count
      FROM transcripts 
      WHERE user_id = $1
    `;
    
    try {
      const result = await db.query(query, [userId]);
      const row = result.rows[0];
      return {
        totalTranscripts: parseInt(row.total_transcripts),
        totalDuration: parseFloat(row.total_duration),
        averageDuration: parseFloat(row.average_duration),
        todayCount: parseInt(row.today_count)
      };
    } catch (error) {
      logger.error('Error getting transcript stats:', error);
      throw error;
    }
  }
}

export default Transcript;