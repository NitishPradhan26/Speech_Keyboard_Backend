import { Request, Response } from 'express';
import multer from 'multer';
import logger from '../config/logger';
import { transcriptionProvider, textProcessor } from '../config/serviceProvider';
import Transcript, { CreateTranscriptData, UpdateTranscriptData } from '../models/Transcript';

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for processing
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper API limit)
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'audio/mp4',
      'audio/webm',
      'audio/ogg',
      'audio/flac',
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${allowedMimeTypes.join(', ')}`));
    }
  },
});


class TranscriptController {
  // Middleware for file upload
  uploadAudio = upload.single('audio');

  /**
   * Main endpoint: Transcribe audio and correct grammar in one flow
   * POST /api/transcripts/transcribeAndCorrect
   */
  async transcribeAndCorrect(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No audio file provided',
        });
      }

      const { buffer, originalname, mimetype } = req.file;
      const { prompt, user_id } = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }
      
      logger.info(`Processing transcription and correction for file: ${originalname} for user: ${user_id}`);

      // Step 1: Transcribe audio using Whisper
      const transcriptionResult = await transcriptionProvider.transcribe({
        audioBuffer: buffer,
        filename: originalname,
        mimeType: mimetype,
      });

      if (!transcriptionResult.success) {
        return res.status(422).json({
          success: false,
          message: 'Transcription failed',
          error: transcriptionResult.error,
        });
      }

      // Step 2: Correct the transcribed text using ChatGPT
      const correctionResult = await textProcessor.processText({
        rawText: transcriptionResult.transcript!,
        prompt,
      });

      // Step 3: Save transcript to database (regardless of correction success/failure)
      const transcriptData: CreateTranscriptData = {
        user_id: parseInt(user_id),
        audio_url: undefined, // Could be set if you store audio files
        duration_secs: transcriptionResult.duration,
        text_raw: transcriptionResult.transcript,
        text_final: correctionResult.success ? correctionResult.processedText : transcriptionResult.transcript,
        prompt_used: correctionResult.success ? correctionResult.promptUsed : prompt || 'default'
      };

      let savedTranscript;
      try {
        savedTranscript = await Transcript.create(transcriptData);
        logger.info(`Saved transcript to database with ID: ${savedTranscript.id}`);
      } catch (dbError: any) {
        logger.error('Failed to save transcript to database:', dbError);
        // Continue with response even if DB save fails - don't block the user
      }

      if (!correctionResult.success) {
        // Even if correction fails, return the raw transcript
        return res.status(200).json({
          success: true,
          data: {
            transcriptId: savedTranscript?.id,
            rawTranscript: transcriptionResult.transcript,
            finalText: transcriptionResult.transcript, // Fallback to raw
            duration: transcriptionResult.duration,
            correctionFailed: true,
            correctionError: correctionResult.error,
          },
        });
      }

      // Return successful result
      return res.status(200).json({
        success: true,
        data: {
          transcriptId: savedTranscript?.id,
          rawTranscript: transcriptionResult.transcript,
          finalText: correctionResult.processedText,
          duration: transcriptionResult.duration,
          promptUsed: correctionResult.promptUsed,
        },
      });
    } catch (error: any) {
      logger.error('Transcript controller error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error during processing',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      });
    }
  }

  // CRUD Operations

  /**
   * Get transcript by ID
   * GET /api/transcripts/:id
   */
  async getTranscriptById(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transcript ID provided'
        });
      }

      const transcript = await Transcript.findById(parseInt(id));
      
      if (!transcript) {
        return res.status(404).json({
          success: false,
          message: 'Transcript not found'
        });
      }

      logger.info(`Retrieved transcript with ID: ${id}`);
      
      return res.status(200).json({
        success: true,
        data: transcript
      });
    } catch (error: any) {
      logger.error('Error in getTranscriptById controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve transcript',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get transcripts by user ID
   * GET /api/transcripts/user/:userId
   */
  async getTranscriptsByUserId(req: Request, res: Response): Promise<Response | void> {
    try {
      const { userId } = req.params;
      
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID provided'
        });
      }

      const transcripts = await Transcript.findByUserId(parseInt(userId));
      
      logger.info(`Retrieved ${transcripts.length} transcripts for user: ${userId}`);
      
      return res.status(200).json({
        success: true,
        count: transcripts.length,
        data: transcripts
      });
    } catch (error: any) {
      logger.error('Error in getTranscriptsByUserId controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user transcripts',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create a new transcript
   * POST /api/transcripts
   */
  async createTranscript(req: Request, res: Response): Promise<Response | void> {
    try {
      const { user_id, audio_url, duration_secs, text_raw, text_final, prompt_used } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const transcriptData: CreateTranscriptData = {
        user_id,
        audio_url,
        duration_secs,
        text_raw,
        text_final,
        prompt_used
      };

      const newTranscript = await Transcript.create(transcriptData);
      
      logger.info(`Created new transcript with ID: ${newTranscript.id}`);
      
      return res.status(201).json({
        success: true,
        message: 'Transcript created successfully',
        data: newTranscript
      });
    } catch (error: any) {
      logger.error('Error in createTranscript controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create transcript',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update transcript by ID
   * PUT /api/transcripts/:id
   */
  async updateTranscript(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { audio_url, duration_secs, text_raw, text_final, prompt_used } = req.body;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transcript ID provided'
        });
      }

      const updateData: UpdateTranscriptData = {
        audio_url,
        duration_secs,
        text_raw,
        text_final,
        prompt_used
      };

      const updatedTranscript = await Transcript.update(parseInt(id), updateData);
      
      if (!updatedTranscript) {
        return res.status(404).json({
          success: false,
          message: 'Transcript not found'
        });
      }

      logger.info(`Updated transcript with ID: ${id}`);
      
      return res.status(200).json({
        success: true,
        message: 'Transcript updated successfully',
        data: updatedTranscript
      });
    } catch (error: any) {
      logger.error('Error in updateTranscript controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to update transcript',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete transcript by ID
   * DELETE /api/transcripts/:id
   */
  async deleteTranscript(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transcript ID provided'
        });
      }

      const deletedTranscript = await Transcript.delete(parseInt(id));
      
      if (!deletedTranscript) {
        return res.status(404).json({
          success: false,
          message: 'Transcript not found'
        });
      }

      logger.info(`Deleted transcript with ID: ${id}`);
      
      return res.status(200).json({
        success: true,
        message: 'Transcript deleted successfully',
        data: deletedTranscript
      });
    } catch (error: any) {
      logger.error('Error in deleteTranscript controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to delete transcript',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

export default new TranscriptController();